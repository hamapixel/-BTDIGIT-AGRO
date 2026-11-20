"""API authentification BTDIGIT AGRO, première étape de la phase 2."""
import secrets
import uuid
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import check_password, make_password
from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .delivery import DeliveryError, channel_available, deliver_code, delivery_options
from .models import User, VerificationChallenge
from .serializers import LoginSerializer, RegisterSerializer, VerifySerializer

GENERIC_REGISTER_MESSAGE = "Si ce contact peut être inscrit, un code lui sera envoyé."
GENERIC_VERIFY_ERROR = "Code invalide, expiré ou trop de tentatives."


def _contact_filter(channel: str, contact: str) -> dict:
    return {"email": contact} if channel == "email" else {"phone_e164": contact}


class ChannelsView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(delivery_options())


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CSRFView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok"})


@method_decorator(csrf_protect, name="dispatch")
class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_register"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        channel = data["channel"]
        contact = data["contact"]
        if not channel_available(data.get("delivery") or channel):
            return Response(
                {"detail": "Ce moyen de vérification n'est pas encore configuré."},
                status=503,
            )

        try:
            with transaction.atomic():
                user = User.objects.select_for_update().filter(
                    **_contact_filter(channel, contact)
                ).first()
                now = timezone.now()
                if user is not None:
                    # Aucune information sur l'existence d'un compte actif.
                    if user.is_active:
                        return Response({"detail": GENERIC_REGISTER_MESSAGE}, status=202)
                    recent = (
                        VerificationChallenge.objects.filter(user=user, channel=channel)
                        .order_by("-created_at").first()
                    )
                    if recent and recent.created_at > now - timedelta(seconds=60):
                        return Response({"detail": GENERIC_REGISTER_MESSAGE}, status=202)
                else:
                    name_parts = data["full_name"].strip().split(maxsplit=1)
                    user = User(
                        username="agro_" + uuid.uuid4().hex,
                        is_active=False,
                        first_name=name_parts[0],
                        last_name=name_parts[1] if len(name_parts) == 2 else "",
                        **_contact_filter(channel, contact),
                    )
                    user.set_password(data["password"])
                    user.save()

                code = f"{secrets.randbelow(1_000_000):06d}"
                VerificationChallenge.objects.create(
                    user=user,
                    channel=channel,
                    code_hash=make_password(code),
                    expires_at=now + timedelta(minutes=5),
                )
                # En cas d'échec du prestataire, la transaction est annulée.
                deliver_code(channel, contact, code, via=data.get("delivery"))
        except DeliveryError:
            return Response(
                {"detail": "L'envoi du code est momentanément indisponible."},
                status=503,
            )
        except IntegrityError:
            # Évite de divulguer la présence d'un contact en cas de concurrence.
            return Response({"detail": GENERIC_REGISTER_MESSAGE}, status=202)

        return Response({"detail": GENERIC_REGISTER_MESSAGE}, status=202)


@method_decorator(csrf_protect, name="dispatch")
class VerifyView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_verify"

    def post(self, request):
        serializer = VerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        with transaction.atomic():
            user = User.objects.select_for_update().filter(
                **_contact_filter(data["channel"], data["contact"])
            ).first()
            if user is None or user.is_active:
                return Response({"detail": GENERIC_VERIFY_ERROR}, status=400)

            challenge = (
                VerificationChallenge.objects.select_for_update()
                .filter(user=user, channel=data["channel"], consumed_at__isnull=True)
                .order_by("-created_at").first()
            )
            now = timezone.now()
            if (
                challenge is None or challenge.expires_at <= now
                or challenge.attempts >= 5
            ):
                return Response({"detail": GENERIC_VERIFY_ERROR}, status=400)

            if not check_password(data["code"], challenge.code_hash):
                challenge.attempts += 1
                challenge.save(update_fields=["attempts"])
                return Response({"detail": GENERIC_VERIFY_ERROR}, status=400)

            if data["channel"] == "email":
                user.email_verified_at = now
            else:
                user.phone_verified_at = now
            user.is_active = True
            user.save(update_fields=[
                "is_active",
                "email_verified_at" if data["channel"] == "email" else "phone_verified_at",
            ])
            VerificationChallenge.objects.filter(
                user=user, channel=data["channel"], consumed_at__isnull=True
            ).update(consumed_at=now)

        return Response({"status": "verified", "detail": "Compte vérifié. Connectez-vous."})


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data["identifier"]
        query = {"email": identifier} if "@" in identifier else {"phone_e164": identifier}
        user = User.objects.filter(**query).first()
        authenticated = (
            authenticate(request, username=user.username, password=serializer.validated_data["password"])
            if user and user.is_active and (user.email_verified_at or user.phone_verified_at)
            else None
        )
        if authenticated is None:
            return Response({"detail": "Identifiant ou mot de passe incorrect."}, status=401)
        login(request, authenticated)
        return Response({"status": "authenticated", "user": _public_user(authenticated)})


def _public_user(user: User) -> dict:
    return {
        "id": str(user.pk),
        "full_name": user.get_full_name().strip(),
        "email": user.email,
        "phone": user.phone_e164,
        "email_verified": bool(user.email_verified_at),
        "phone_verified": bool(user.phone_verified_at),
    }


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"user": _public_user(request.user)})


@method_decorator(csrf_protect, name="dispatch")
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"status": "signed_out"})
