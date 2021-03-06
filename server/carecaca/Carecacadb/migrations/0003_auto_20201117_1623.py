# Generated by Django 3.1.2 on 2020-11-17 19:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Carecacadb', '0002_card'),
    ]

    operations = [
        migrations.CreateModel(
            name='Cards_group',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cards_count', models.IntegerField()),
                ('is_empty', models.BooleanField()),
            ],
        ),
        migrations.CreateModel(
            name='Cards_in_group',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('Cards_group_id', models.IntegerField()),
                ('Cards_id', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Desk',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('Hide_cards_id', models.IntegerField()),
                ('Pile_cards_id', models.IntegerField()),
                ('Discarded_cards_id', models.IntegerField()),
                ('Play_pile_id', models.IntegerField()),
                ('is_active', models.BooleanField()),
                ('is_host', models.CharField(max_length=80)),
                ('connection_begin', models.IntegerField()),
                ('connection_duration', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Game',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('Session_id', models.IntegerField()),
                ('Desk_id', models.IntegerField()),
                ('actual_turn', models.CharField(max_length=80)),
                ('turns_count', models.IntegerField()),
                ('players_count', models.IntegerField()),
                ('in_progress', models.BooleanField()),
                ('created_at', models.CharField(max_length=80)),
                ('duration', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Guest',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('username', models.CharField(max_length=80)),
            ],
        ),
        migrations.CreateModel(
            name='Guest_in_session',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('Guest_id', models.IntegerField()),
                ('Session_id', models.IntegerField()),
                ('is_active', models.BooleanField()),
                ('is_host', models.CharField(max_length=80)),
                ('connection_begin', models.IntegerField()),
                ('connection_time', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Player',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('game_id', models.IntegerField()),
                ('Player_state_id', models.IntegerField()),
                ('User_id', models.IntegerField()),
                ('Guest_id', models.IntegerField()),
                ('turn', models.IntegerField()),
                ('is_playing', models.BooleanField()),
            ],
        ),
        migrations.CreateModel(
            name='Player_state',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('Hand_cards_id', models.IntegerField()),
                ('Look_up_cards_id', models.IntegerField()),
                ('Look_down_cards_id', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Session',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_active', models.BooleanField()),
                ('created_at', models.CharField(max_length=80)),
                ('duration', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('username', models.CharField(max_length=80)),
                ('email', models.CharField(max_length=80)),
                ('password', models.CharField(max_length=80)),
            ],
        ),
        migrations.CreateModel(
            name='User_in_session',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('User_id', models.IntegerField()),
                ('Session_id', models.IntegerField()),
                ('is_active', models.BooleanField()),
                ('is_host', models.CharField(max_length=80)),
                ('connection_begin', models.IntegerField()),
                ('connection_duration', models.IntegerField()),
            ],
        ),
        migrations.DeleteModel(
            name='Teacher',
        ),
        migrations.AlterField(
            model_name='card',
            name='value',
            field=models.IntegerField(),
        ),
    ]
