from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from .models import AdditionalContactChallenge
from .tests import EMAIL_SETTINGS, PASSWORD


@override_settings(**EMAIL_SETTINGS)
class AdditionalContactTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = get_user_model().objects.create_user(
            username="phone_only", phone_e164="+22376123456",
            phone_verified_at=timezone.now(), password=PASSWORD,
        )
        self.client.force_login(self.user)

    @patch("accounts.contact_views.deliver_code")
    def test_add_verified_email_to_phone_account_and_login_with_it(self, sender):
        request = self.client.post(reverse("auth-contact-request"), {
            "channel": "email", "contact": "New@Example.com", "delivery": "email",
        })
        self.assertEqual(request.status_code, 202)
        self.user.refresh_from_db()
        self.assertFalse(self.user.email)
        otp = sender.call_args.args[2]
        self.assertNotEqual(AdditionalContactChallenge.objects.get().code_hash, otp)
        bad = self.client.post(reverse("auth-contact-confirm"), {
            "channel": "email", "contact": "new@example.com",
            "code": "000000" if otp != "000000" else "111111",
        })
        self.assertEqual(bad.status_code, 400)
        verified = self.client.post(reverse("auth-contact-confirm"), {
            "channel": "email", "contact": "new@example.com", "code": otp,
        })
        self.assertEqual(verified.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "new@example.com")
        self.assertIsNotNone(self.user.email_verified_at)
        replay = self.client.post(reverse("auth-contact-confirm"), {
            "channel": "email", "contact": self.user.email, "code": otp,
        })
        self.assertIn(replay.status_code, (400, 409))
        self.client.logout()
        login = self.client.post(reverse("auth-login"), {
            "identifier": "new@example.com", "password": PASSWORD,
        })
        self.assertEqual(login.status_code, 200)

    @patch("accounts.contact_views.deliver_code")
    def test_cannot_take_another_users_email(self, sender):
        get_user_model().objects.create_user(
            username="someone_else", email="already@example.com",
            email_verified_at=timezone.now(), password=PASSWORD,
        )
        response = self.client.post(reverse("auth-contact-request"), {
            "channel": "email", "contact": "already@example.com",
        })
        self.assertEqual(response.status_code, 409)
        sender.assert_not_called()

    def test_unauthenticated_cannot_add_contact(self):
        self.client.logout()
        response = self.client.post(reverse("auth-contact-request"), {
            "channel": "email", "contact": "new@example.com",
        })
        self.assertIn(response.status_code, (401, 403))
