from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone

from .models import Membership, Organization
from .tests import PASSWORD


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
        # Aucune invitation sur la base d'une adresse email non vérifiée.
        self.client.force_login(self.owner)
        invalid = self.client.post(reverse("org-members", args=[org_id]), {
            "identifier": self.other.email,
        })
        self.assertEqual(invalid.status_code, 400)
        self.assertEqual(another_client.get(reverse("org-members", args=[org_id])).status_code, 404)
        self.assertEqual(another_client.patch(
            reverse("org-detail", args=[org_id]), {"name": "Prise de contrôle"},
            content_type="application/json",
        ).status_code, 404)

    def test_member_permissions_and_cross_tenant_membership(self):
        org = Organization.objects.create(
            name="Agriculteurs Koulikoro", kind="producer", created_by=self.owner,
        )
        Membership.objects.create(organization=org, user=self.owner, role="owner", accepted_at=timezone.now())
        other_org = Organization.objects.create(
            name="Acheteurs Bamako", kind="buyer", created_by=self.other,
        )
        Membership.objects.create(organization=other_org, user=self.other, role="owner", accepted_at=timezone.now())

        self.client.force_login(self.owner)
        invite = self.client.post(reverse("org-members", args=[org.id]), {
            "user_id": str(self.member_user.id), "role": "member",
        })
        self.assertEqual(invite.status_code, 201)
        member_id = invite.json()["member"]["id"]
        self.assertEqual(self.client.post(reverse("org-members", args=[org.id]), {
            "user_id": str(self.member_user.id), "role": "member",
        }).status_code, 400)
        self.assertEqual(self.client.get(reverse("org-members", args=[other_org.id])).status_code, 404)

        member_client = Client()
        member_client.force_login(self.member_user)
        self.assertEqual(member_client.get(reverse("org-detail", args=[org.id])).status_code, 404)
        invitations = member_client.get(reverse("org-invitations"))
        self.assertEqual(invitations.status_code, 200)
        self.assertEqual(invitations.json()["invitations"][0]["id"], member_id)
        accept = member_client.post(reverse("org-invitation-action", args=[member_id]))
        self.assertEqual(accept.status_code, 200)
        self.assertEqual(member_client.get(reverse("org-detail", args=[org.id])).status_code, 200)
        self.assertEqual(member_client.get(reverse("org-members", args=[org.id])).status_code, 403)
        self.assertEqual(member_client.patch(
            reverse("org-detail", args=[org.id]), {"name": "Modifié"},
            content_type="application/json",
        ).status_code, 403)
        self.assertEqual(member_client.post(reverse("org-members", args=[org.id]), {
            "user_id": str(self.other.id),
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
