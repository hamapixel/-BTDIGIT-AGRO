"""Connexion simple de BTDIGIT AGRO : sans SMS, WhatsApp ni code OTP.

L'email/le téléphone sont fournis par l'utilisateur, mais ne sont PAS vérifiés.
Les opérations sensibles doivent respecter cette distinction.
"""
import uuid

from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError, transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import User, VerificationChallenge
from .serializers import LoginSerializer, RegisterSerializer


def _contact_filter(channel: str, contact: str) -> dict:
    return {"email": contact} if channel == "email" else {"phone_e164": contact}


def _public_user(user: User) -> dict:
    return {
        "id": str(user.pk),
        "full_name": user.get_full_name().strip(),
        "email": user.email,
        "phone": user.phone_e164,
        "email_verified": bool(user.email_verified_at),
        "phone_verified": bool(user.phone_verified_at),
        "is_superadmin": bool(user.is_superuser and user.is_staff),
    }


class ChannelsView(APIView):
    """Compatibilité phase 2, sans exigence de fournisseur OTP."""
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"email": True, "phone": True, "verification_required": False})


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
        parts = data["full_name"].strip().split(maxsplit=1)
        # Un contact ne prouve pas à lui seul que son auteur le possède.
        # Aucun champ *_verified_at n'est renseigné par l'inscription.
        user = User(
            username="agro_" + uuid.uuid4().hex,
            is_active=True,
            first_name=parts[0],
            last_name=parts[1] if len(parts) == 2 else "",
            **_contact_filter(data["channel"], data["contact"]),
        )
        user.set_password(data["password"])
        try:
            with transaction.atomic():
                user.save(force_insert=True)
        except IntegrityError:
            return Response(
                {"detail": "Ce contact est déjà associé à un compte. Connectez-vous avec votre mot de passe."},
                status=409,
            )
        # Session Django HttpOnly / CSRF. Pas de token de connexion dans le navigateur.
        login(request, user)
        return Response({"status": "authenticated", "user": _public_user(user)}, status=201)


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
        lookup = {"email": identifier} if "@" in identifier else {"phone_e164": identifier}
        user = User.objects.filter(**lookup).first()
        # Compatibilité avec les inscriptions inachevées de l'ancienne phase
        # OTP : seule la personne connaissant déjà le mot de passe peut
        # terminer l'ouverture du compte. Ne jamais réactiver un compte
        # désactivé administrativement sans challenge historique.
        if (
            user and not user.is_active and not user.is_staff and not user.is_superuser
            and not user.email_verified_at and not user.phone_verified_at
            and user.check_password(serializer.validated_data["password"])
            and VerificationChallenge.objects.filter(user=user).exists()
        ):
            user.is_active = True
            user.save(update_fields=["is_active"])

        authenticated = (
            authenticate(request, username=user.username, password=serializer.validated_data["password"])
            if user and user.is_active else None
        )
        if authenticated is None:
            return Response({"detail": "Identifiant ou mot de passe incorrect."}, status=401)
        login(request, authenticated)
        return Response({"status": "authenticated", "user": _public_user(authenticated)})


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
