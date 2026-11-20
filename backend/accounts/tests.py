from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import Client, TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from .contact import normalize_contact
from .models import VerificationChallenge

PASSWORD = "Agro-Qualite2026!Secure"
EMAIL_SETTINGS = {
    "AGRO_EMAIL_VERIFICATION_ENABLED": True,
    "EMAIL_HOST": "smtp.example.test",
    "EMAIL_HOST_USER": "smtp-user",
    "EMAIL_HOST_PASSWORD": "only-a-test-password",
    "EMAIL_USE_TLS": True,
    "DEFAULT_FROM_EMAIL": "verification@example.test",
    "EMAIL_BACKEND": "django.core.mail.backends.smtp.EmailBackend",
}
PHONE_SETTINGS = {
    "AGRO_SMS_VERIFICATION_ENABLED": True,
    "AGRO_SMS_PROVIDER": "twilio",
    "TWILIO_ACCOUNT_SID": "ACtest",
    "TWILIO_AUTH_TOKEN": "test-token",
    "TWILIO_FROM_NUMBER": "+15005550006",
}


@override_settings(**EMAIL_SETTINGS)
class RegistrationTests(TestCase):
    def setUp(self):
        self.payload = {
            "channel": "email",
            "contact": "  AGRI@example.com ",
            "full_name": "Aminata Test",
            "password": PASSWORD,
        }

    @patch("accounts.views.deliver_code")
    def test_email_registration_requires_verification_then_allows_login(self, mocked_delivery):
        register = self.client.post(reverse("auth-register"), self.payload)
        self.assertEqual(register.status_code, 202)
        user = get_user_model().objects.get(email="agri@example.com")
        self.assertFalse(user.is_active)
        self.assertTrue(user.username.startswith("agro_"))
        self.assertNotEqual(user.password, PASSWORD)
        self.assertIsNone(user.email_verified_at)
        challenge = VerificationChallenge.objects.get(user=user)
        self.assertNotIn("012345", challenge.code_hash)
        self.assertEqual(challenge.attempts, 0)

        denied = self.client.post(reverse("auth-login"), {
            "identifier": "agri@example.com",
            "password": PASSWORD,
        })
        self.assertEqual(denied.status_code, 401)

        code = mocked_delivery.call_args.args[2]
        wrong = self.client.post(reverse("auth-verify"), {
            "channel": "email", "contact": "agri@example.com", "code": "999999" if code != "999999" else "888888",
        })
        self.assertEqual(wrong.status_code, 400)
        verified = self.client.post(reverse("auth-verify"), {
            "channel": "email", "contact": "agri@example.com", "code": code,
        })
        self.assertEqual(verified.status_code, 200)
        self.assertEqual(verified.json()["status"], "verified")

        user.refresh_from_db()
        self.assertTrue(user.is_active)
        self.assertIsNotNone(user.email_verified_at)
        self.assertIsNotNone(challenge.user.email_verified_at)
        challenge.refresh_from_db()
        self.assertIsNotNone(challenge.consumed_at)
        repeated = self.client.post(reverse("auth-verify"), {
            "channel": "email", "contact": "agri@example.com", "code": code,
        })
        self.assertEqual(repeated.status_code, 400)

        login = self.client.post(reverse("auth-login"), {
            "identifier": "AGRI@example.com", "password": PASSWORD,
        })
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.json()["status"], "authenticated")
        self.assertEqual(login.json()["user"]["email"], "agri@example.com")

        me = self.client.get(reverse("auth-me"))
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.json()["user"]["id"], str(user.id))
        logout = self.client.post(reverse("auth-logout"))
        self.assertEqual(logout.status_code, 200)
        self.assertEqual(self.client.get(reverse("auth-me")).status_code, 403)

    @patch("accounts.views.deliver_code")
    def test_duplicate_is_generic_and_not_resending_immediately(self, mocked_delivery):
        first = self.client.post(reverse("auth-register"), self.payload)
        second = self.client.post(reverse("auth-register"), {
            **self.payload, "contact": "agri@EXAMPLE.com"
        })
        self.assertEqual(first.status_code, 202)
        self.assertEqual(second.status_code, 202)
        self.assertEqual(first.json(), second.json())
        self.assertEqual(mocked_delivery.call_count, 1)
        self.assertEqual(get_user_model().objects.count(), 1)

    @patch("accounts.views.deliver_code")
    def test_invalid_otp_locks_after_five_attempts(self, mocked_delivery):
        self.client.post(reverse("auth-register"), self.payload)
        code = mocked_delivery.call_args.args[2]
        wrong = "111111" if code != "111111" else "222222"
        for _ in range(5):
            response = self.client.post(reverse("auth-verify"), {
                "channel": "email", "contact": "agri@example.com", "code": wrong,
            })
            self.assertEqual(response.status_code, 400)
        last = self.client.post(reverse("auth-verify"), {
            "channel": "email", "contact": "agri@example.com", "code": code,
        })
        self.assertEqual(last.status_code, 400)
        self.assertEqual(VerificationChallenge.objects.get().attempts, 5)

    @patch("accounts.views.deliver_code")
    def test_expired_code_is_rejected(self, mocked_delivery):
        self.client.post(reverse("auth-register"), self.payload)
        code = mocked_delivery.call_args.args[2]
        challenge = VerificationChallenge.objects.get()
        challenge.expires_at = timezone.now() - timedelta(seconds=1)
        challenge.save(update_fields=["expires_at"])
        response = self.client.post(reverse("auth-verify"), {
            "channel": "email", "contact": "agri@example.com", "code": code,
        })
        self.assertEqual(response.status_code, 400)

    @patch("accounts.views.deliver_code")
    def test_provider_failure_does_not_create_a_ghost_user(self, mocked_delivery):
        from .delivery import DeliveryError
        mocked_delivery.side_effect = DeliveryError("fournisseur hors service")
        response = self.client.post(reverse("auth-register"), self.payload)
        self.assertEqual(response.status_code, 503)
        self.assertEqual(get_user_model().objects.count(), 0)
        self.assertEqual(VerificationChallenge.objects.count(), 0)

    def test_weak_password_is_rejected(self):
        response = self.client.post(reverse("auth-register"), {
            **self.payload, "password": "1234567890",
        })
        self.assertEqual(response.status_code, 400)

    def test_unverified_users_have_no_private_data_access(self):
        self.assertEqual(self.client.get(reverse("auth-me")).status_code, 403)

    def test_csrf_required_for_registration(self):
        strict_client = Client(enforce_csrf_checks=True)
        response = strict_client.post(reverse("auth-register"), self.payload)
        self.assertEqual(response.status_code, 403)
        csrf = strict_client.get(reverse("auth-csrf"))
        self.assertEqual(csrf.status_code, 200)
        self.assertIn("csrftoken", csrf.cookies)


class AvailabilityAndPhoneTests(TestCase):
    def test_channels_off_until_real_delivery_is_configured(self):
        response = self.client.get(reverse("auth-channels"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"email": False, "phone": False})

    @override_settings(**PHONE_SETTINGS)
    @patch("accounts.views.deliver_code")
    def test_phone_registration_normalizes_mali_contact(self, mocked_delivery):
        response = self.client.post(reverse("auth-register"), {
            "channel": "phone",
            "contact": "76 12 34 56",
            "full_name": "Fanta Exemple",
            "password": PASSWORD,
        })
        self.assertEqual(response.status_code, 202)
        user = get_user_model().objects.get()
        self.assertEqual(user.phone_e164, "+22376123456")
        code = mocked_delivery.call_args.args[2]
        verified = self.client.post(reverse("auth-verify"), {
            "channel": "phone", "contact": "+223 76 12 34 56", "code": code,
        })
        self.assertEqual(verified.status_code, 200)
        user.refresh_from_db()
        self.assertIsNotNone(user.phone_verified_at)

    def test_telephone_invalide_refuse(self):
        with self.assertRaises(ValueError):
            normalize_contact("phone", "123")

    def test_email_normalisation(self):
        self.assertEqual(normalize_contact("email", " INFO@EXAMPLE.COM "), "info@example.com")
