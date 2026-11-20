from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import Client, TestCase
from django.urls import reverse
from .tests import PASSWORD


class AccountSettingsTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = get_user_model().objects.create_user(
            username="settings_user", phone_e164="+22376123456",
            password=PASSWORD, is_active=True,
        )
        self.client.force_login(self.user)

    def test_add_unverified_email_with_account_password(self):
        res = self.client.post(reverse("auth-add-contact"), {
            "channel": "email",
            "contact": "NEW@example.com",
            "current_password": PASSWORD,
        })
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.json()["verified"])
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "new@example.com")
        self.assertIsNone(self.user.email_verified_at)

    def test_wrong_password_cannot_add_email(self):
        res = self.client.post(reverse("auth-add-contact"), {
            "channel": "email",
            "contact": "new@example.com",
            "current_password": "invalid-test-input",
        })
        self.assertEqual(res.status_code, 400)

    def test_can_change_password_while_logged_in(self):
        res = self.client.post(reverse("auth-change-password"), {
            "current_password": PASSWORD,
            "new_password": "OtherSecurePass2026!",
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(self.client.get(reverse("auth-me")).status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("OtherSecurePass2026!"))

    def test_anonymous_user_cannot_change_credentials(self):
        self.client.logout()
        self.assertIn(self.client.post(reverse("auth-change-password"), {
            "current_password": PASSWORD,
            "new_password": "OtherSecurePass2026!",
        }).status_code, (401, 403))

    def test_csrf_required(self):
        strict = Client(enforce_csrf_checks=True)
        strict.force_login(self.user)
        self.assertEqual(strict.post(reverse("auth-change-password"), {
            "current_password": PASSWORD,
            "new_password": "OtherSecurePass2026!",
        }).status_code, 403)
