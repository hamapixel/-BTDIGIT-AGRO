import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("accounts", "0003_organizations_and_password_reset")]

    operations = [
        migrations.CreateModel(
            name="AdditionalContactChallenge",
            fields=[
                ("id", models.UUIDField(primary_key=True, serialize=False, editable=False, default=uuid.uuid4)),
                ("channel", models.CharField(max_length=8, choices=[("email", "Email"), ("phone", "Téléphone")])),
                ("contact", models.CharField(max_length=254)),
                ("code_hash", models.CharField(max_length=128)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
                ("attempts", models.PositiveSmallIntegerField(default=0)),
                ("consumed_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="contact_challenges", to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
    ]
