"""Organisations isolées par membre, invitations explicites et superadministration."""
from django.db import IntegrityError, transaction
from django.db.models import Count
from django.http import Http404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Membership, Organization, User
from .serializers import AddMemberSerializer, OrganizationSerializer


def _org_payload(org, member):
    return {
        "id": str(org.pk),
        "name": org.name,
        "kind": org.kind,
        "membership_role": member.role,
        "created_at": org.created_at.isoformat(),
    }


class OrganizationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Membership.objects.select_related("organization").filter(
            user=request.user, accepted_at__isnull=False
        ).order_by("organization__name")
        return Response({"organizations": [_org_payload(m.organization, m) for m in qs]})

    @method_decorator(csrf_protect)
    def post(self, request):
        serializer = OrganizationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            org = Organization.objects.create(
                name=serializer.validated_data["name"],
                kind=serializer.validated_data["kind"],
                created_by=request.user,
            )
            member = Membership.objects.create(organization=org, user=request.user, role="owner", accepted_at=timezone.now())
        return Response({"organization": _org_payload(org, member)}, status=201)


def _membership_or_404(user, org_id):
    member = Membership.objects.select_related("organization").filter(
        organization_id=org_id, user=user, accepted_at__isnull=False
    ).first()
    if member is None:
        raise Http404
    return member


class OrganizationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        member = _membership_or_404(request.user, pk)
        return Response({"organization": _org_payload(member.organization, member)})

    @method_decorator(csrf_protect)
    def patch(self, request, pk):
        member = _membership_or_404(request.user, pk)
        if member.role not in ("owner", "admin"):
            return Response({"detail": "Droit insuffisant."}, status=403)
        name = request.data.get("name")
        if not isinstance(name, str) or not (2 <= len(name.strip()) <= 180):
            return Response({"name": ["Nom d'organisation invalide."]}, status=400)
        member.organization.name = name.strip()
        member.organization.save(update_fields=["name"])
        return Response({"organization": _org_payload(member.organization, member)})


class OrganizationMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        current = _membership_or_404(request.user, pk)
        if current.role not in ("owner", "admin"):
            return Response({"detail": "Droit insuffisant."}, status=403)
        members = Membership.objects.select_related("user").filter(
            organization_id=pk
        ).order_by("created_at")
        return Response({"members": [{
            "id": str(m.id), "user_id": str(m.user_id),
            "name": m.user.get_full_name(), "role": m.role,
            "accepted": bool(m.accepted_at),
        } for m in members]})

    @method_decorator(csrf_protect)
    def post(self, request, pk):
        current = _membership_or_404(request.user, pk)
        if current.role not in ("owner", "admin"):
            return Response({"detail": "Droit insuffisant."}, status=403)
        serializer = AddMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if current.role == "admin" and serializer.validated_data["role"] != "member":
            return Response({"detail": "Seul le propriétaire peut nommer un administrateur."}, status=403)
        # Un email ou numéro sans vérification OTP ne prouve pas son propriétaire.
        # Les invitations utilisent l'UUID partagé volontairement par le destinataire.
        user = User.objects.filter(pk=serializer.validated_data["user_id"], is_active=True).first()
        if user is None:
            return Response({"detail": "Compte destinataire introuvable."}, status=400)
        if Membership.objects.filter(user=user, organization_id=pk).exists():
            return Response({"detail": "Ce compte est déjà membre."}, status=400)
        try:
            with transaction.atomic():
                member = Membership.objects.create(
                    user=user, organization_id=pk, role=serializer.validated_data["role"]
                )
        except IntegrityError:
            # savepoint rollback ; la transaction externe et les futures requêtes restent valides.
            return Response({"detail": "Ce compte est déjà membre."}, status=400)
        return Response({"member": {"id": str(member.id), "role": member.role, "status": "invited"}}, status=201)


class OrganizationMemberDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @method_decorator(csrf_protect)
    def patch(self, request, pk, member_id):
        with transaction.atomic():
            current = _membership_or_404(request.user, pk)
            if current.role != "owner":
                return Response({"detail": "Droit réservé au propriétaire."}, status=403)
            target = Membership.objects.select_for_update().filter(
                organization_id=pk, id=member_id
            ).first()
            if target is None:
                raise Http404
            if target.role == "owner":
                return Response({"detail": "Le propriétaire ne peut pas être rétrogradé."}, status=403)
            role = request.data.get("role")
            if role not in ("admin", "member"):
                return Response({"role": ["Rôle non autorisé."]}, status=400)
            target.role = role
            target.save(update_fields=["role"])
        return Response({"member": {"id": str(target.id), "role": target.role}})

    @method_decorator(csrf_protect)
    def delete(self, request, pk, member_id):
        with transaction.atomic():
            current = _membership_or_404(request.user, pk)
            target = Membership.objects.select_for_update().filter(
                organization_id=pk, id=member_id
            ).first()
            if target is None:
                raise Http404
            if target.role == "owner":
                return Response({"detail": "Le propriétaire ne peut pas être supprimé."}, status=403)
            if target.user_id != request.user.id and (
                current.role not in ("owner", "admin")
                or (current.role == "admin" and target.role == "admin")
            ):
                return Response({"detail": "Droit insuffisant."}, status=403)
            target.delete()
        return Response(status=204)


class SuperadminOrganizationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_superuser:
            return Response({"detail": "Accès superadministrateur requis."}, status=403)
        qs = Organization.objects.select_related("created_by").annotate(
            members_count=Count("memberships")
        ).order_by("-created_at")[:100]
        return Response({"organizations": [{
            "id": str(org.id), "name": org.name, "kind": org.kind,
            "creator_id": str(org.created_by_id),
            "members_count": org.members_count,
            "created_at": org.created_at.isoformat(),
        } for org in qs]})


class OrganizationInvitationsView(APIView):
    """Un utilisateur accepte explicitement une adhésion avant tout accès."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pending = Membership.objects.select_related("organization").filter(
            user=request.user, accepted_at__isnull=True,
        ).order_by("-created_at")
        return Response({"invitations": [{
            "id": str(m.id),
            "organization_id": str(m.organization_id),
            "organization_name": m.organization.name,
            "kind": m.organization.kind,
            "role": m.role,
        } for m in pending]})


class OrganizationInvitationActionView(APIView):
    permission_classes = [IsAuthenticated]

    @method_decorator(csrf_protect)
    def post(self, request, invitation_id):
        with transaction.atomic():
            invite = Membership.objects.select_for_update().filter(
                id=invitation_id, user=request.user, accepted_at__isnull=True,
            ).first()
            if invite is None:
                raise Http404
            invite.accepted_at = timezone.now()
            invite.save(update_fields=["accepted_at"])
        return Response({"status": "accepted", "organization_id": str(invite.organization_id)})

    @method_decorator(csrf_protect)
    def delete(self, request, invitation_id):
        with transaction.atomic():
            invite = Membership.objects.select_for_update().filter(
                id=invitation_id, user=request.user, accepted_at__isnull=True,
            ).first()
            if invite is None:
                raise Http404
            invite.delete()
        return Response(status=204)
