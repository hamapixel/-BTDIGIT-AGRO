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
