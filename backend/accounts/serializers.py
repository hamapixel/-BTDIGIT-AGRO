from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .contact import normalize_contact


class RegisterSerializer(serializers.Serializer):
    channel = serializers.ChoiceField(choices=["email", "phone"])
    contact = serializers.CharField(max_length=254)
    full_name = serializers.CharField(max_length=150, trim_whitespace=True)
    password = serializers.CharField(min_length=10, max_length=128, write_only=True, trim_whitespace=False)

    def validate(self, data):
        try:
            data["contact"] = normalize_contact(data["channel"], data["contact"])
        except ValueError as exc:
            raise serializers.ValidationError({"contact": str(exc)}) from exc
        try:
            validate_password(data["password"])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return data


class VerifySerializer(serializers.Serializer):
    channel = serializers.ChoiceField(choices=["email", "phone"])
    contact = serializers.CharField(max_length=254)
    code = serializers.RegexField(regex=r"^\d{6}$", min_length=6, max_length=6)

    def validate(self, data):
        try:
            data["contact"] = normalize_contact(data["channel"], data["contact"])
        except ValueError as exc:
            raise serializers.ValidationError({"contact": str(exc)}) from exc
        return data


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=254)
    password = serializers.CharField(max_length=128, write_only=True, trim_whitespace=False)

    def validate_identifier(self, identifier):
        channel = "email" if "@" in identifier else "phone"
        try:
            return normalize_contact(channel, identifier)
        except ValueError as exc:
            raise serializers.ValidationError("Identifiant invalide.") from exc
