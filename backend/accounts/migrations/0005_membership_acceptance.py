from django.db import migrations, models


def accept_existing_memberships(apps, schema_editor):
    # Avant cette évolution, les adhésions existantes étaient déjà effectives.
    Member = apps.get_model("accounts", "Membership")
    for membership in Member.objects.filter(accepted_at__isnull=True).iterator():
        membership.accepted_at = membership.created_at
        membership.save(update_fields=["accepted_at"])


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0004_additional_contact_challenge"),
    ]

    operations = [
        migrations.AddField(
            model_name="membership",
            name="accepted_at",
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.RunPython(accept_existing_memberships, migrations.RunPython.noop),
    ]
