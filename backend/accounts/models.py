"""Identités à UUID : noms et dates ne servent jamais de clé de compte.

Username reste un identifiant interne généré automatiquement par l'API. Le public
s'inscrit par téléphone ou par email, sans avoir à choisir un username.
"""
import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Contact email facultatif pour les comptes créés via téléphone uniquement.
    email = models.EmailField(unique=True, blank=True, null=True)
    # E.164 : +223XXXXXXXX, la validation précise arrivera avec la phase 2.
    phone_e164 = models.CharField(max_length=16, unique=True, blank=True, null=True)
    email_verified_at = models.DateTimeField(blank=True, null=True)
    phone_verified_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return self.email or self.phone_e164 or str(self.pk)


class VerificationChallenge(models.Model):
    """OTP limité dans le temps. Seul le hash du code est conservé."""
    CHANNELS = [("email", "Email"), ("phone", "Téléphone")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="verification_challenges")
    channel = models.CharField(max_length=8, choices=CHANNELS)
    code_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    consumed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "channel", "-created_at"], name="agro_challenge_recent_idx"),
        ]


class PasswordResetChallenge(models.Model):
    """Un OTP de récupération n'active jamais un compte non vérifié."""
    CHANNELS = [("email", "Email"), ("phone", "Téléphone")]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reset_challenges")
    channel = models.CharField(max_length=8, choices=CHANNELS)
    code_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    consumed_at = models.DateTimeField(null=True, blank=True)


class Organization(models.Model):
    """Identité légale métier, différente de l'identité du propriétaire."""
    KINDS = [
        ("producer", "Producteur"),
        ("cooperative", "Coopérative"),
        ("buyer", "Acheteur professionnel"),
        ("carrier", "Transporteur"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=180)
    kind = models.CharField(max_length=16, choices=KINDS)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="created_organizations")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Membership(models.Model):
    """Chaque compte peut appartenir à plusieurs organisations indépendantes."""
    ROLES = [("owner", "Propriétaire"), ("admin", "Administrateur"), ("member", "Collaborateur")]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=8, choices=ROLES, default="member")
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["organization", "user"], name="agro_unique_org_membership"),
        ]


class AdditionalContactChallenge(models.Model):
    """L'ajout d'un second moyen de connexion requiert sa propre vérification."""
    CHANNELS = [("email", "Email"), ("phone", "Téléphone")]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="contact_challenges")
    channel = models.CharField(max_length=8, choices=CHANNELS)
    contact = models.CharField(max_length=254)
    code_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    consumed_at = models.DateTimeField(null=True, blank=True)
