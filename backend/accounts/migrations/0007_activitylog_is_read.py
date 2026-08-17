from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_activitylog'),
    ]

    operations = [
        migrations.AddField(
            model_name='activitylog',
            name='is_read',
            field=models.BooleanField(default=False),
        ),
    ]
