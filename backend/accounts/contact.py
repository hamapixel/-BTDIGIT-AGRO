"""Validation centralisée des identifiants, indépendante des noms des personnes."""
import phonenumbers
from django.core.exceptions import ValidationError
from django.core.validators import validate_email


def normalize_contact(channel: str, value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("Contact invalide.")
    value = value.strip()
    if channel == "email":
        try:
            validate_email(value)
        except ValidationError as exc:
            raise ValueError("Adresse email invalide.") from exc
        return value.casefold()
    if channel == "phone":
        try:
            # Mali par défaut, l'indicatif d'autres pays est permis avec "+".
            parsed = phonenumbers.parse(value, "ML")
        except phonenumbers.NumberParseException as exc:
            raise ValueError("Numéro de téléphone invalide.") from exc
        if not phonenumbers.is_valid_number(parsed):
            raise ValueError("Numéro de téléphone invalide.")
        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    raise ValueError("Choisissez téléphone ou email.")
