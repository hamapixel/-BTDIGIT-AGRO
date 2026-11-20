"""Fournisseurs OTP : aucun simulateur SMS ou SMTP dans l'application réelle.

Les secrets viennent uniquement des variables d'environnement. Ne jamais logger
le code OTP, le mot de passe SMTP ou le jeton d'accès du fournisseur SMS.
"""
import base64
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings
from django.core.mail import send_mail


class DeliveryError(Exception):
    pass


def channel_available(channel: str) -> bool:
    if channel == "email":
        return bool(
            settings.AGRO_EMAIL_VERIFICATION_ENABLED
            and settings.EMAIL_HOST
            and settings.EMAIL_HOST_USER
            and settings.EMAIL_HOST_PASSWORD
            and settings.DEFAULT_FROM_EMAIL
            and (settings.EMAIL_USE_TLS or settings.EMAIL_USE_SSL)
            and settings.EMAIL_BACKEND == "django.core.mail.backends.smtp.EmailBackend"
        )
    if channel == "phone":
        return bool(
            settings.AGRO_SMS_VERIFICATION_ENABLED
            and settings.AGRO_SMS_PROVIDER == "twilio"
            and settings.TWILIO_ACCOUNT_SID
            and settings.TWILIO_AUTH_TOKEN
            and settings.TWILIO_FROM_NUMBER
        )
    return False


def deliver_code(channel: str, recipient: str, code: str) -> None:
    if not channel_available(channel):
        raise DeliveryError("Canal de vérification non configuré.")

    if channel == "email":
        try:
            count = send_mail(
                "BTDIGIT AGRO — Vérification de votre compte",
                f"Votre code de vérification BTDIGIT AGRO est : {code}. "
                "Il expire dans 5 minutes. Ne le communiquez à personne.",
                settings.DEFAULT_FROM_EMAIL,
                [recipient],
                fail_silently=False,
            )
        except Exception as exc:
            raise DeliveryError("Impossible d'envoyer l'email de vérification.") from exc
        if count != 1:
            raise DeliveryError("Email de vérification non envoyé.")
        return

    # Intégration réelle Twilio. Son activation exige un compte et un
    # numéro expéditeur capables d'envoyer vers le pays de destination.
    sid = settings.TWILIO_ACCOUNT_SID
    endpoint = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
    token = base64.b64encode(f"{sid}:{settings.TWILIO_AUTH_TOKEN}".encode()).decode()
    payload = urllib.parse.urlencode({
        "To": recipient,
        "From": settings.TWILIO_FROM_NUMBER,
        "Body": f"BTDIGIT AGRO : code {code}, valable 5 minutes. Ne partagez jamais ce code.",
    }).encode()
    request = urllib.request.Request(
        endpoint,
        data=payload,
        headers={
            "Authorization": "Basic " + token,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            if response.status not in (200, 201):
                raise DeliveryError("Le prestataire SMS a refusé l'envoi.")
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
        raise DeliveryError("Le prestataire SMS est indisponible.") from exc
