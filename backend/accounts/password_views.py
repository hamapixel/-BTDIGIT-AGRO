"""Gestion du compte sans OTP : mot de passe actuel requis pour les changements.

Aucune récupération publique sans preuve de possession : cette opération sera
ajoutée séparément lorsqu'un lien email sécurisé sera disponible.
"""
from django.contrib.auth import update_session_auth_hash
from django.db import IntegrityError, transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import User
from .serializers import AddContactSerializer, ChangePasswordSerializer


@method_decorator(csrf_protect, name="dispatch")
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_change_password"

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"user": request.user}
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if not request.user.check_password(data["current_password"]):
            return Response({"detail": "Mot de passe actuel incorrect."}, status=400)
        request.user.set_password(data["new_password"])
        request.user.save(update_fields=["password"])
        # La session courante reste valide, les anciennes sessions sont révoquées.
        update_session_auth_hash(request, request.user)
        return Response({"status": "password_changed"})


@method_decorator(csrf_protect, name="dispatch")
class AddContactView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_add_contact"

    def post(self, request):
        serializer = AddContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        field = "email" if data["channel"] == "email" else "phone_e164"
        verified_field = "email_verified_at" if data["channel"] == "email" else "phone_verified_at"
        with transaction.atomic():
            user = User.objects.select_for_update().get(pk=request.user.pk)
            if not user.check_password(data["current_password"]):
                return Response({"detail": "Mot de passe incorrect."}, status=400)
            if getattr(user, field):
                return Response({"detail": "Ce type de contact existe déjà."}, status=409)
            if User.objects.filter(**{field: data["contact"]}).exclude(pk=user.pk).exists():
                return Response({"detail": "Ce contact est déjà utilisé."}, status=409)
            setattr(user, field, data["contact"])
            # Ne pas usurper un statut de vérification.
            setattr(user, verified_field, None)
            try:
                with transaction.atomic():
                    user.save(update_fields=[field, verified_field])
            except IntegrityError:
                return Response({"detail": "Ce contact est déjà utilisé."}, status=409)
        return Response({"status": "contact_added", "verified": False})
