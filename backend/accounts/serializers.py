from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .contact import normalize_contact


class RegisterSerializer(serializers.Serializer):
    channel = serializers.ChoiceField(choices=["email", "phone"])
    contact = serializers.CharField(max_length=254)
    full_name = serializers.CharField(min_length=2, max_length=150, trim_whitespace=True)
    password = serializers.CharField(
        min_length=10, max_length=128, write_only=True, trim_whitespace=False
    )

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


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=254)
    password = serializers.CharField(
        max_length=128, write_only=True, trim_whitespace=False
    )

    def validate_identifier(self, identifier):
        channel = "email" if "@" in identifier else "phone"
        try:
            return normalize_contact(channel, identifier)
        except ValueError as exc:
            raise serializers.ValidationError("Identifiant invalide.") from exc


class OrganizationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=180, min_length=2, trim_whitespace=True)
    kind = serializers.ChoiceField(
        choices=["producer", "cooperative", "buyer", "carrier"]
    )


class AddMemberSerializer(serializers.Serializer):
    # UUID communiqué par la personne invitée, pas un contact auto-déclaré.
    user_id = serializers.UUIDField()
    role = serializers.ChoiceField(choices=["member", "admin"], default="member")


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        max_length=128, trim_whitespace=False, write_only=True
    )
    new_password = serializers.CharField(
        min_length=10, max_length=128, trim_whitespace=False, write_only=True
    )

    def validate_new_password(self, password):
        try:
            validate_password(password, self.context.get("user"))
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return password


class AddContactSerializer(serializers.Serializer):
    channel = serializers.ChoiceField(choices=["email", "phone"])
    contact = serializers.CharField(max_length=254)
    current_password = serializers.CharField(max_length=128, trim_whitespace=False, write_only=True)

    def validate(self, data):
        try:
            data["contact"] = normalize_contact(data["channel"], data["contact"])
        except ValueError as exc:
            raise serializers.ValidationError({"contact": str(exc)}) from exc
        return data
