from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import Client, TestCase
from django.urls import reverse
from .contact import normalize_contact
from .models import VerificationChallenge

PASSWORD = "Agro-Qualite2026!Secure"
EMAIL_SETTINGS = {
    "AGRO_EMAIL_VERIFICATION_ENABLED": False,
}


class RegistrationWithoutOTPTests(TestCase):
    def setUp(self):
        cache.clear()
        self.data = {
            "channel": "email", "contact": " AGRI@Example.com ",
            "full_name": "Aminata Test", "password": PASSWORD,
        }

    def test_register_email_creates_active_user_and_session_without_code(self):
        response = self.client.post(reverse("auth-register"), self.data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["status"], "authenticated")
        user = get_user_model().objects.get(email="agri@example.com")
        self.assertTrue(user.is_active)
        self.assertNotEqual(user.password, PASSWORD)
        self.assertTrue(user.check_password(PASSWORD))
        self.assertIsNone(user.email_verified_at)
        self.assertIsNone(user.phone_verified_at)
        self.assertEqual(VerificationChallenge.objects.count(), 0)
        self.assertEqual(
            self.client.get(reverse("auth-me")).json()["user"]["id"], str(user.id)
        )
        self.assertFalse(response.json()["user"]["email_verified"])
        self.assertEqual(self.client.post(reverse("auth-logout")).status_code, 200)
        self.assertIn(self.client.get(reverse("auth-me")).status_code, (401, 403))
        self.assertEqual(self.client.post(reverse("auth-login"), {
            "identifier": "AGRI@example.com", "password": PASSWORD
        }).status_code, 200)

    def test_register_mali_phone_without_sms(self):
        r = self.client.post(reverse("auth-register"), {
            **self.data, "channel": "phone", "contact": "76 12 34 56"
        })
        self.assertEqual(r.status_code, 201)
        user = get_user_model().objects.get(phone_e164="+22376123456")
        self.assertIsNone(user.phone_verified_at)
        self.client.logout()
        self.assertEqual(self.client.post(reverse("auth-login"), {
            "identifier": "+223 76 12 34 56", "password": PASSWORD
        }).status_code, 200)

    def test_duplicate_contact_does_not_reassign_account(self):
        self.assertEqual(self.client.post(reverse("auth-register"), self.data).status_code, 201)
        self.client.logout()
        r = self.client.post(reverse("auth-register"), {
            **self.data, "contact": "agri@example.com", "password": "Different2026!Secure",
        })
        self.assertEqual(r.status_code, 409)
        user = get_user_model().objects.get()
        self.assertTrue(user.check_password(PASSWORD))
        self.assertFalse(user.check_password("Different2026!Secure"))
        self.assertEqual(get_user_model().objects.count(), 1)

    def test_weak_password_rejected(self):
        r = self.client.post(reverse("auth-register"), {
            **self.data, "password": "1234567890"
        })
        self.assertEqual(r.status_code, 400)
        self.assertEqual(get_user_model().objects.count(), 0)

    def test_validation_error_identifies_password_field(self):
        result = self.client.post(reverse("auth-register"), {
            **self.data, "password": "1234567890",
        })
        self.assertEqual(result.status_code, 400)
        self.assertIn("password", result.json())
        self.assertTrue(result.json()["password"])

    def test_phone_input_with_mali_74_prefix(self):
        # Numéro fictif ; le numéro réel de l'utilisateur n'est jamais stocké dans les tests.
        result = self.client.post(reverse("auth-register"), {
            **self.data, "channel": "phone",
            "contact": "+223 74 11 22 33",
        })
        self.assertEqual(result.status_code, 201, result.json())

    def test_old_pending_otp_account_can_login_with_its_existing_password(self):
        from datetime import timedelta
        from django.utils import timezone
        User = get_user_model()
        legacy = User.objects.create_user(
            username="agro_legacy_pending", phone_e164="+22376123456",
            password=PASSWORD, is_active=False,
        )
        VerificationChallenge.objects.create(
            user=legacy, channel="phone", code_hash="legacy_only",
            expires_at=timezone.now() + timedelta(minutes=5),
        )
        wrong = self.client.post(reverse("auth-login"), {
            "identifier": "+22376123456", "password": "WrongPassword123",
        })
        self.assertEqual(wrong.status_code, 401)
        legacy.refresh_from_db()
        self.assertFalse(legacy.is_active)
        ok = self.client.post(reverse("auth-login"), {
            "identifier": "+22376123456", "password": PASSWORD,
        })
        self.assertEqual(ok.status_code, 200)
        legacy.refresh_from_db()
        self.assertTrue(legacy.is_active)
        self.assertIsNone(legacy.phone_verified_at)

    def test_account_disabled_without_prior_challenge_stays_disabled(self):
        user = get_user_model().objects.create_user(
            username="agro_disabled", email="disabled@example.com",
            password=PASSWORD, is_active=False,
        )
        response = self.client.post(reverse("auth-login"), {
            "identifier": "disabled@example.com", "password": PASSWORD,
        })
        self.assertEqual(response.status_code, 401)
        user.refresh_from_db()
        self.assertFalse(user.is_active)

    def test_bad_contact_rejected(self):
        r = self.client.post(reverse("auth-register"), {
            **self.data, "channel": "phone", "contact": "123",
        })
        self.assertEqual(r.status_code, 400)

    def test_wrong_password_denied(self):
        self.client.post(reverse("auth-register"), self.data)
        self.client.logout()
        r = self.client.post(reverse("auth-login"), {
            "identifier": "agri@example.com", "password": "NotThePassword",
        })
        self.assertEqual(r.status_code, 401)

    def test_registration_does_not_require_messaging_provider(self):
        r = self.client.get(reverse("auth-channels"))
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), {
            "email": True, "phone": True, "verification_required": False
        })

    def test_all_old_otp_endpoints_are_unroutable(self):
        for endpoint in (
            "/api/v1/auth/verify/",
            "/api/v1/auth/resend/",
            "/api/v1/auth/recover/",
            "/api/v1/auth/recover/confirm/",
            "/api/v1/auth/contacts/request/",
            "/api/v1/auth/contacts/confirm/",
        ):
            self.assertEqual(self.client.post(endpoint).status_code, 404)

    def test_registration_requires_csrf_for_browser(self):
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(client.post(reverse("auth-register"), self.data).status_code, 403)
        r = client.get(reverse("auth-csrf"))
        self.assertEqual(r.status_code, 200)
        self.assertIn("csrftoken", r.cookies)

    def test_normalize_contact_helpers(self):
        self.assertEqual(normalize_contact("email", " INFO@Example.COM "), "info@example.com")
        self.assertEqual(normalize_contact("phone", "+223 76 12 34 56"), "+22376123456")
