# Generated by Django 3.0.8 on 2020-07-18 21:27

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Chat',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sesion_id', models.PositiveIntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('chat_id', models.PositiveIntegerField()),
                ('user_id', models.PositiveIntegerField()),
                ('text', models.CharField(max_length=200)),
                ('created_date', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='Sesion',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sesion_code', models.CharField(max_length=10)),
                ('active_time', models.DurationField()),
                ('created_date', models.DateTimeField(auto_now_add=True)),
                ('modified_date', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='UsersInSesion',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user_id', models.PositiveIntegerField()),
                ('sesion_id', models.PositiveIntegerField()),
                ('is_active', models.BooleanField(default=True)),
                ('conection_time', models.DurationField()),
                ('created_date', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
