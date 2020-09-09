# Generated by Django 3.1.1 on 2020-09-09 03:57

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Curso',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sigla', models.CharField(max_length=6)),
                ('nombre', models.CharField(max_length=60)),
                ('creditos', models.IntegerField()),
            ],
        ),
    ]
