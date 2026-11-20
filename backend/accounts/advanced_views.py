"""Étapes 2.2 et 2.3 : récupération sécurisée et isolation des organisations."""
import secrets
from datetime import timedelta

from django.contrib.auth.hashers import check_password, make_password
from django.db import IntegrityError, transaction
from django.db.models import Count
from django.http import Http404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .delivery import DeliveryError, channel_available, deliver_code
from .models import Membership, Organization, PasswordResetChallenge, User, VerificationChallenge
from .serializers import (
    AddMemberSerializer, ContactDeliverySerializer, OrganizationSerializer,
    PasswordResetConfirmSerializer,
)

GENERIC_MESSAGE = "Si ce contact est éligible, un code de vérification sera envoyé."
CODE_ERROR = "Code invalide, expiré ou trop de tentatives."


def _lookup(channel, contact):
    return {"email": contact} if channel == "email" else {"phone_e164": contact}


def _delivery_allowed(data):
    return channel_available(data.get("delivery") or data["channel"])


def _send(data, code):
    deliver_code(data["channel"], data["contact"], code, via=data.get("delivery"))


@method_decorator(csrf_protect, name="dispatch")
class ResendVerificationView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_resend"

    def post(self, request):
        serializer = ContactDeliverySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if not _delivery_allowed(data):
            return Response({"detail": "Méthode d'envoi indisponible."}, status=503)
        try:
            with transaction.atomic():
                user = User.objects.select_for_update().filter(**_lookup(data["channel"], data["contact"])).first()
                if user is None or user.is_active:
                    return Response({"detail": GENERIC_MESSAGE}, status=202)
                latest = VerificationChallenge.objects.filter(
                    user=user, channel=data["channel"]
                ).order_by("-created_at").first()
                now = timezone.now()
                if latest and latest.created_at > now - timedelta(seconds=60):
                    return Response({"detail": GENERIC_MESSAGE}, status=202)
                code = f"{secrets.randbelow(1_000_000):06d}"
                VerificationChallenge.objects.filter(
                    user=user, channel=data["channel"], consumed_at__isnull=True
                ).update(consumed_at=now)
                VerificationChallenge.objects.create(
                    user=user, channel=data["channel"],
                    code_hash=make_password(code),
                    expires_at=now + timedelta(minutes=5),
                )
                _send(data, code)
        except DeliveryError:
            return Response({"detail": "Le service de vérification est indisponible."}, status=503)
        return Response({"detail": GENERIC_MESSAGE}, status=202)


@method_decorator(csrf_protect, name="dispatch")
class PasswordResetRequestView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_recover"

    def post(self, request):
        serializer = ContactDeliverySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if not _delivery_allowed(data):
            return Response({"detail": "Méthode d'envoi indisponible."}, status=503)
        try:
            with transaction.atomic():
                user = User.objects.select_for_update().filter(
                    **_lookup(data["channel"], data["contact"])
                ).first()
                valid = bool(user and user.is_active and (
                    (data["channel"] == "email" and user.email_verified_at)
                    or (data["channel"] == "phone" and user.phone_verified_at)
                ))
                if not valid:
                    return Response({"detail": GENERIC_MESSAGE}, status=202)
                now = timezone.now()
                recent = PasswordResetChallenge.objects.filter(
                    user=user, channel=data["channel"]
                ).order_by("-created_at").first()
                if recent and recent.created_at > now - timedelta(seconds=60):
                    return Response({"detail": GENERIC_MESSAGE}, status=202)
                code = f"{secrets.randbelow(1_000_000):06d}"
                PasswordResetChallenge.objects.filter(
                    user=user, channel=data["channel"], consumed_at__isnull=True,
                ).update(consumed_at=now)
                PasswordResetChallenge.objects.create(
                    user=user, channel=data["channel"],
                    code_hash=make_password(code), expires_at=now + timedelta(minutes=5),
                )
                _send(data, code)
        except DeliveryError:
            return Response({"detail": "Le service de récupération est indisponible."}, status=503)
        return Response({"detail": GENERIC_MESSAGE}, status=202)


@method_decorator(csrf_protect, name="dispatch")
class PasswordResetConfirmView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_recover_confirm"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        with transaction.atomic():
            user = User.objects.select_for_update().filter(
                **_lookup(data["channel"], data["contact"])
            ).first()
            if not user or not user.is_active:
                return Response({"detail": CODE_ERROR}, status=400)
            latest = PasswordResetChallenge.objects.select_for_update().filter(
                user=user, channel=data["channel"], consumed_at__isnull=True
            ).order_by("-created_at").first()
            now = timezone.now()
            if not latest or latest.expires_at <= now or latest.attempts >= 5:
                return Response({"detail": CODE_ERROR}, status=400)
            if not check_password(data["code"], latest.code_hash):
                latest.attempts += 1
                latest.save(update_fields=["attempts"])
                return Response({"detail": CODE_ERROR}, status=400)
            user.set_password(data["password"])
            user.save(update_fields=["password"])
            PasswordResetChallenge.objects.filter(
                user=user, consumed_at__isnull=True
            ).update(consumed_at=now)
        return Response({"status": "password_changed"})


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
            user=request.user
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
            member = Membership.objects.create(organization=org, user=request.user, role="owner")
        return Response({"organization": _org_payload(org, member)}, status=201)


def _membership_or_404(user, org_id):
    member = Membership.objects.select_related("organization").filter(
        organization_id=org_id, user=user
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
        identifier = serializer.validated_data["identifier"]
        user = User.objects.filter(
            **({"email": identifier} if "@" in identifier else {"phone_e164": identifier})
        ).first()
        if user is None or not user.is_active or not (user.email_verified_at or user.phone_verified_at):
            return Response({"detail": "Ce compte vérifié n'est pas disponible."}, status=400)
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
        return Response({"member": {"id": str(member.id), "role": member.role}}, status=201)


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
