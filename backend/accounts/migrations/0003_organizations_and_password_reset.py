import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_verificationchallenge"),
    ]

    operations = [
        migrations.CreateModel(
            name="Organization",
            fields=[
                ("id", models.UUIDField(primary_key=True, serialize=False, default=uuid.uuid4, editable=False)),
                ("name", models.CharField(max_length=180)),
                ("kind", models.CharField(max_length=16, choices=[
                    ("producer", "Producteur"), ("cooperative", "Coopérative"),
                    ("buyer", "Acheteur professionnel"), ("carrier", "Transporteur"),
                ])),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="created_organizations", to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
        migrations.CreateModel(
            name="PasswordResetChallenge",
            fields=[
                ("id", models.UUIDField(primary_key=True, serialize=False, default=uuid.uuid4, editable=False)),
                ("channel", models.CharField(max_length=8, choices=[("email", "Email"), ("phone", "Téléphone")])),
                ("code_hash", models.CharField(max_length=128)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
                ("attempts", models.PositiveSmallIntegerField(default=0)),
                ("consumed_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="reset_challenges", to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
        migrations.CreateModel(
            name="Membership",
            fields=[
                ("id", models.UUIDField(primary_key=True, serialize=False, default=uuid.uuid4, editable=False)),
                ("role", models.CharField(max_length=8, choices=[
                    ("owner", "Propriétaire"), ("admin", "Administrateur"),
                    ("member", "Collaborateur"),
                ], default="member")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("organization", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="memberships", to="accounts.organization",
                )),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="memberships", to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                "constraints": [
                    models.UniqueConstraint(fields=("organization", "user"), name="agro_unique_org_membership"),
                ],
            },
        ),
    ]
