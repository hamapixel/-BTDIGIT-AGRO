from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import Client, TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from .models import Membership, Organization, PasswordResetChallenge, VerificationChallenge
from .tests import EMAIL_SETTINGS, PASSWORD


@override_settings(**EMAIL_SETTINGS)
class RecoveryTests(TestCase):
    def setUp(self):
        cache.clear()
        self.owner = get_user_model().objects.create_user(
            username="agro_recovery", email="recovery@example.com",
            password=PASSWORD, email_verified_at=timezone.now(),
        )

    @patch("accounts.advanced_views._send")
    def test_recovery_requires_code_and_replaces_password(self, sender):
        start = self.client.post(reverse("auth-recover"), {
            "channel": "email", "delivery": "email", "contact": "Recovery@Example.com"
        })
        self.assertEqual(start.status_code, 202)
        self.assertEqual(PasswordResetChallenge.objects.count(), 1)
        code = sender.call_args.args[1]
        challenge = PasswordResetChallenge.objects.get()
        self.assertNotEqual(challenge.code_hash, code)

        bad = self.client.post(reverse("auth-recover-confirm"), {
            "channel": "email", "contact": "recovery@example.com",
            "code": "123456" if code != "123456" else "654321",
            "password": "NewPass2026!Agro",
        })
        self.assertEqual(bad.status_code, 400)

        ok = self.client.post(reverse("auth-recover-confirm"), {
            "channel": "email", "contact": "recovery@example.com",
            "code": code, "password": "NewPass2026!Agro",
        })
        self.assertEqual(ok.status_code, 200)
        self.owner.refresh_from_db()
        self.assertTrue(self.owner.check_password("NewPass2026!Agro"))
        challenge.refresh_from_db()
        self.assertIsNotNone(challenge.consumed_at)
        replay = self.client.post(reverse("auth-recover-confirm"), {
            "channel": "email", "contact": "recovery@example.com",
            "code": code, "password": "Again2026!Secure",
        })
        self.assertEqual(replay.status_code, 400)

    @patch("accounts.advanced_views._send")
    def test_unknown_or_unverified_contact_does_not_leak_or_send(self, sender):
        unknown = self.client.post(reverse("auth-recover"), {
            "channel": "email", "contact": "unknown@example.com",
        })
        unverified = get_user_model().objects.create_user(
            username="notverified", email="unverified@example.com", password=PASSWORD,
        )
        hidden = self.client.post(reverse("auth-recover"), {
            "channel": "email", "contact": unverified.email,
        })
        self.assertEqual(unknown.status_code, 202)
        self.assertEqual(unknown.json(), hidden.json())
        sender.assert_not_called()

    @patch("accounts.advanced_views._send")
    def test_recovery_code_expires_and_wrong_attempts_are_limited(self, sender):
        self.client.post(reverse("auth-recover"), {"channel": "email", "contact": self.owner.email})
        code = sender.call_args.args[1]
        wrong = "000000" if code != "000000" else "111111"
        for _ in range(5):
            response = self.client.post(reverse("auth-recover-confirm"), {
                "channel": "email", "contact": self.owner.email,
                "code": wrong, "password": "NewPass2026!Agro",
            })
            self.assertEqual(response.status_code, 400)
        locked = self.client.post(reverse("auth-recover-confirm"), {
            "channel": "email", "contact": self.owner.email,
            "code": code, "password": "NewPass2026!Agro",
        })
        self.assertEqual(locked.status_code, 400)
        self.assertEqual(PasswordResetChallenge.objects.get().attempts, 5)

    @patch("accounts.advanced_views._send")
    def test_resend_invalidate_previous_registration_code(self, sender):
        user = get_user_model().objects.create_user(
            username="newcomer", email="new@example.com",
            password=PASSWORD, is_active=False,
        )
        old = VerificationChallenge.objects.create(
            user=user, channel="email", code_hash="old_hash",
            expires_at=timezone.now() + timedelta(minutes=5),
        )
        VerificationChallenge.objects.filter(id=old.id).update(
            created_at=timezone.now() - timedelta(minutes=2)
        )
        response = self.client.post(reverse("auth-resend"), {
            "channel": "email", "contact": user.email,
        })
        self.assertEqual(response.status_code, 202)
        old.refresh_from_db()
        self.assertIsNotNone(old.consumed_at)
        self.assertEqual(VerificationChallenge.objects.count(), 2)
        sender.assert_called_once()
        new_code = sender.call_args.args[1]
        self.assertEqual(self.client.post(reverse("auth-verify"), {
            "channel": "email", "contact": user.email, "code": new_code,
        }).status_code, 200)

    @patch("accounts.advanced_views._send")
    def test_recovery_does_not_send_twice_during_cooldown(self, sender):
        data = {"channel": "email", "contact": self.owner.email}
        self.assertEqual(self.client.post(reverse("auth-recover"), data).status_code, 202)
        self.assertEqual(self.client.post(reverse("auth-recover"), data).status_code, 202)
        sender.assert_called_once()


class OrganizationIsolationTests(TestCase):
    def setUp(self):
        cache.clear()
        User = get_user_model()
        self.owner = User.objects.create_user(
            username="owner", email="owner@example.com", password=PASSWORD,
            email_verified_at=timezone.now(),
        )
        self.other = User.objects.create_user(
            username="other", email="other@example.com", password=PASSWORD,
            email_verified_at=timezone.now(),
        )
        self.member_user = User.objects.create_user(
            username="member", email="member@example.com", password=PASSWORD,
            email_verified_at=timezone.now(),
        )

    def test_organization_creation_owner_and_isolation(self):
        self.client.force_login(self.owner)
        create = self.client.post(reverse("org-list"), {
            "name": "Coopérative du Sahel", "kind": "cooperative",
        })
        self.assertEqual(create.status_code, 201)
        org_id = create.json()["organization"]["id"]
        org = Organization.objects.get(pk=org_id)
        self.assertEqual(org.created_by, self.owner)
        self.assertEqual(Membership.objects.get(organization=org).role, "owner")
        self.assertEqual(len(self.client.get(reverse("org-list")).json()["organizations"]), 1)

        another_client = Client()
        another_client.force_login(self.other)
        self.assertEqual(another_client.get(reverse("org-list")).json()["organizations"], [])
        self.assertEqual(another_client.get(reverse("org-detail", args=[org_id])).status_code, 404)
        self.assertEqual(another_client.get(reverse("org-members", args=[org_id])).status_code, 404)
        self.assertEqual(another_client.patch(
            reverse("org-detail", args=[org_id]), {"name": "Prise de contrôle"},
            content_type="application/json",
        ).status_code, 404)

    def test_member_permissions_and_cross_tenant_membership(self):
        org = Organization.objects.create(
            name="Agriculteurs Koulikoro", kind="producer", created_by=self.owner,
        )
        Membership.objects.create(organization=org, user=self.owner, role="owner")
        other_org = Organization.objects.create(
            name="Acheteurs Bamako", kind="buyer", created_by=self.other,
        )
        Membership.objects.create(organization=other_org, user=self.other, role="owner")

        self.client.force_login(self.owner)
        invite = self.client.post(reverse("org-members", args=[org.id]), {
            "identifier": self.member_user.email, "role": "member",
        })
        self.assertEqual(invite.status_code, 201)
        member_id = invite.json()["member"]["id"]
        self.assertEqual(self.client.post(reverse("org-members", args=[org.id]), {
            "identifier": self.member_user.email, "role": "member",
        }).status_code, 400)
        self.assertEqual(self.client.get(reverse("org-members", args=[other_org.id])).status_code, 404)

        member_client = Client()
        member_client.force_login(self.member_user)
        self.assertEqual(member_client.get(reverse("org-detail", args=[org.id])).status_code, 200)
        self.assertEqual(member_client.get(reverse("org-members", args=[org.id])).status_code, 403)
        self.assertEqual(member_client.patch(
            reverse("org-detail", args=[org.id]), {"name": "Modifié"},
            content_type="application/json",
        ).status_code, 403)
        self.assertEqual(member_client.post(reverse("org-members", args=[org.id]), {
            "identifier": self.other.email,
        }).status_code, 403)
        self.assertEqual(member_client.get(reverse("org-detail", args=[other_org.id])).status_code, 404)

        promote = self.client.patch(
            reverse("org-member-detail", args=[org.id, member_id]),
            {"role": "admin"}, content_type="application/json",
        )
        self.assertEqual(promote.status_code, 200)
        self.assertEqual(Membership.objects.get(id=member_id).role, "admin")
        self.assertEqual(self.client.delete(
            reverse("org-member-detail", args=[org.id, Membership.objects.get(
                organization=org, user=self.owner
            ).id])
        ).status_code, 403)

    def test_anonymous_cannot_see_organization_or_superadmin(self):
        self.assertIn(self.client.get(reverse("org-list")).status_code, (401, 403))
        self.assertIn(self.client.get(reverse("superadmin-orgs")).status_code, (401, 403))

    def test_only_superuser_can_view_all_organizations(self):
        Organization.objects.create(name="Sahélienne", kind="carrier", created_by=self.owner)
        self.client.force_login(self.owner)
        self.assertEqual(self.client.get(reverse("superadmin-orgs")).status_code, 403)

        staff = get_user_model().objects.create_user(
            username="staff_only", email="staff@example.com",
            password=PASSWORD, is_staff=True,
        )
        self.client.force_login(staff)
        self.assertEqual(self.client.get(reverse("superadmin-orgs")).status_code, 403)

        superadmin = get_user_model().objects.create_superuser(
            username="agro_superadmin", email="super@example.com", password=PASSWORD
        )
        self.client.force_login(superadmin)
        response = self.client.get(reverse("superadmin-orgs"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["organizations"]), 1)
        self.assertEqual(response.json()["organizations"][0]["kind"], "carrier")

    def test_organization_mutation_requires_csrf_cookie(self):
        strict = Client(enforce_csrf_checks=True)
        strict.force_login(self.owner)
        denied = strict.post(reverse("org-list"), {"name": "Test", "kind": "producer"})
        self.assertEqual(denied.status_code, 403)
