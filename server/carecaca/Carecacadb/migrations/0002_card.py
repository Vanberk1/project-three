# Generated by Django 3.1.2 on 2020-11-17 01:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Carecacadb', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Card',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('value', models.CharField(max_length=80)),
                ('type', models.CharField(max_length=80)),
            ],
        ),
    ]
