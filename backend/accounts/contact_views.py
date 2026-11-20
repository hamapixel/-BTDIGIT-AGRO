"""Ajout d'un second contact à un compte déjà connecté, après OTP réel."""
import secrets
from datetime import timedelta

from django.contrib.auth.hashers import check_password, make_password
from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .delivery import DeliveryError, channel_available, deliver_code
from .models import AdditionalContactChallenge, User
from .serializers import ContactDeliverySerializer, VerifySerializer


def _field(channel):
    return "email" if channel == "email" else "phone_e164"


def _verified_field(channel):
    return "email_verified_at" if channel == "email" else "phone_verified_at"


@method_decorator(csrf_protect, name="dispatch")
class ContactAddRequestView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_add_contact"

    def post(self, request):
        serializer = ContactDeliverySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        method = data.get("delivery") or data["channel"]
        if not channel_available(method):
            return Response({"detail": "Le fournisseur de vérification est indisponible."}, status=503)

        try:
            with transaction.atomic():
                user = User.objects.select_for_update().get(pk=request.user.pk)
                field = _field(data["channel"])
                if getattr(user, field):
                    return Response({"detail": "Ce type de contact est déjà associé au compte."}, status=409)
                if User.objects.filter(**{field: data["contact"]}).exclude(pk=user.pk).exists():
                    return Response({"detail": "Ce contact ne peut pas être associé."}, status=409)
                recent = AdditionalContactChallenge.objects.filter(
                    user=user, channel=data["channel"], contact=data["contact"],
                ).order_by("-created_at").first()
                now = timezone.now()
                if recent and recent.created_at > now - timedelta(seconds=60):
                    return Response({"detail": "Attendez avant de demander un autre code."}, status=429)
                code = f"{secrets.randbelow(1_000_000):06d}"
                AdditionalContactChallenge.objects.filter(
                    user=user, channel=data["channel"], consumed_at__isnull=True
                ).update(consumed_at=now)
                AdditionalContactChallenge.objects.create(
                    user=user, channel=data["channel"], contact=data["contact"],
                    code_hash=make_password(code), expires_at=now + timedelta(minutes=5),
                )
                deliver_code(data["channel"], data["contact"], code, via=data.get("delivery"))
        except DeliveryError:
            return Response({"detail": "L'envoi du code est indisponible."}, status=503)
        return Response({"detail": "Si ce contact est éligible, un code a été demandé."}, status=202)


@method_decorator(csrf_protect, name="dispatch")
class ContactAddConfirmView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_add_contact_confirm"

    def post(self, request):
        serializer = VerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        with transaction.atomic():
            user = User.objects.select_for_update().get(pk=request.user.pk)
            field = _field(data["channel"])
            if getattr(user, field):
                return Response({"detail": "Un contact de ce type existe déjà."}, status=409)
            challenge = AdditionalContactChallenge.objects.select_for_update().filter(
                user=user, channel=data["channel"], contact=data["contact"],
                consumed_at__isnull=True
            ).order_by("-created_at").first()
            now = timezone.now()
            if not challenge or challenge.expires_at <= now or challenge.attempts >= 5:
                return Response({"detail": "Code invalide ou expiré."}, status=400)
            if not check_password(data["code"], challenge.code_hash):
                challenge.attempts += 1
                challenge.save(update_fields=["attempts"])
                return Response({"detail": "Code invalide ou expiré."}, status=400)
            setattr(user, field, data["contact"])
            setattr(user, _verified_field(data["channel"]), now)
            try:
                with transaction.atomic():
                    user.save(update_fields=[field, _verified_field(data["channel"])])
            except IntegrityError:
                return Response({"detail": "Ce contact est déjà associé à un autre compte."}, status=409)
            AdditionalContactChallenge.objects.filter(
                user=user, channel=data["channel"], consumed_at__isnull=True
            ).update(consumed_at=now)
        return Response({"status": "contact_verified"})
