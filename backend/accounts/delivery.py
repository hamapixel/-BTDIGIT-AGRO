"""Envoi OTP par prestataire réel uniquement. Jamais de code ou de token en logs.

Le résultat HTTP du fournisseur signifie seulement que l'envoi est accepté :
la livraison finale sur le téléphone doit être testée indépendamment.
"""
import base64
import json
import re
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
    if channel == "sms":
        return bool(
            settings.AGRO_SMS_VERIFICATION_ENABLED
            and settings.AGRO_SMS_PROVIDER == "twilio"
            and settings.TWILIO_ACCOUNT_SID
            and settings.TWILIO_AUTH_TOKEN
            and settings.TWILIO_FROM_NUMBER
        )
    if channel == "whatsapp":
        return bool(
            settings.AGRO_WHATSAPP_VERIFICATION_ENABLED
            and settings.META_WHATSAPP_ACCESS_TOKEN
            and re.fullmatch(r"\d{7,24}", settings.META_WHATSAPP_PHONE_NUMBER_ID)
            and re.fullmatch(r"[a-z][a-z0-9_]{1,200}", settings.META_WHATSAPP_OTP_TEMPLATE)
            and re.fullmatch(r"[a-z]{2,3}(?:_[A-Z]{2})?", settings.META_WHATSAPP_TEMPLATE_LANGUAGE)
            and re.fullmatch(r"v\d{1,2}\.0", settings.META_GRAPH_API_VERSION)
        )
    if channel == "phone":
        return channel_available("whatsapp") or channel_available("sms")
    return False


def delivery_options() -> dict:
    return {
        "email": channel_available("email"),
        "phone": channel_available("phone"),
        "whatsapp": channel_available("whatsapp"),
        "sms": channel_available("sms"),
    }


def _send_sms(recipient: str, code: str) -> None:
    sid = settings.TWILIO_ACCOUNT_SID
    endpoint = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
    token = base64.b64encode(f"{sid}:{settings.TWILIO_AUTH_TOKEN}".encode()).decode()
    payload = urllib.parse.urlencode({
        "To": recipient,
        "From": settings.TWILIO_FROM_NUMBER,
        "Body": f"BTDIGIT AGRO : code {code}, valable 5 minutes. Ne partagez jamais ce code.",
    }).encode()
    request = urllib.request.Request(
        endpoint, data=payload,
        headers={"Authorization": "Basic " + token,
                 "Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            if response.status not in (200, 201):
                raise DeliveryError("SMS non accepté par le prestataire.")
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
        raise DeliveryError("Envoi SMS momentanément indisponible.") from exc


def _send_whatsapp(recipient: str, code: str) -> None:
    """Envoie un modèle Meta AUTHENTICATION approuvé avec bouton COPY_CODE.

    L'utilisateur doit avoir consenti à recevoir son code sur WhatsApp.
    Le code figure dans le corps et le bouton (sub_type=url).
    """
    endpoint = (
        f"https://graph.facebook.com/{settings.META_GRAPH_API_VERSION}/"
        f"{settings.META_WHATSAPP_PHONE_NUMBER_ID}/messages"
    )
    payload = json.dumps({
        "messaging_product": "whatsapp",
        "to": recipient.lstrip("+"),
        "type": "template",
        "template": {
            "name": settings.META_WHATSAPP_OTP_TEMPLATE,
            "language": {"code": settings.META_WHATSAPP_TEMPLATE_LANGUAGE},
            "components": [
                {"type": "body", "parameters": [{"type": "text", "text": code}]},
                {"type": "button", "sub_type": "url", "index": "0",
                 "parameters": [{"type": "text", "text": code}]},
            ],
        },
    }).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=payload,
        headers={
            "Authorization": "Bearer " + settings.META_WHATSAPP_ACCESS_TOKEN,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            if response.status not in (200, 201):
                raise DeliveryError("WhatsApp n'a pas accepté la demande.")
            # La réponse Meta inclut un ID message; ne pas la journaliser.
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
        raise DeliveryError("Envoi WhatsApp momentanément indisponible.") from exc


def deliver_code(channel: str, recipient: str, code: str, *, via: str | None = None) -> None:
    method = via or ("whatsapp" if channel == "phone" and channel_available("whatsapp")
                     else "sms" if channel == "phone" else "email")
    if (channel == "email" and method != "email") or (
        channel == "phone" and method not in ("sms", "whatsapp")
    ):
        raise DeliveryError("Canal de livraison incompatible avec le contact.")
    if not channel_available(method):
        raise DeliveryError("Canal de vérification non configuré.")

    if method == "email":
        try:
            count = send_mail(
                "BTDIGIT AGRO — Vérification de votre compte",
                f"Votre code BTDIGIT AGRO est : {code}. "
                "Il expire dans 5 minutes. Ne le communiquez à personne.",
                settings.DEFAULT_FROM_EMAIL,
                [recipient],
                fail_silently=False,
            )
        except Exception as exc:
            raise DeliveryError("Email de vérification indisponible.") from exc
        if count != 1:
            raise DeliveryError("Email de vérification non envoyé.")
    elif method == "whatsapp":
        _send_whatsapp(recipient, code)
    else:
        _send_sms(recipient, code)
