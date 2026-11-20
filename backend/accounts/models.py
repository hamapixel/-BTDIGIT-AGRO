"""Modèle utilisateur créé avant la première migration.

Le champ username est un identifiant *technique* interne ; il ne sera pas demandé
dans l'inscription publique. La phase 2 introduira la vérification téléphone
ou email, les gestionnaires et les parcours de connexion.
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
