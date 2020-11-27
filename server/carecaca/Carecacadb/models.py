from django.db import models

# Create your models here.

class Card(models.Model):
    value = models.IntegerField()
    type = models.CharField(max_length=80)

class Cards_group(models.Model):
    cards_count = models.IntegerField()
    is_empty = models.BooleanField()

class Cards_in_group(models.Model):
    Cards_group_id = models.ForeignKey(Cards_group, on_delete=models.CASCADE)
    Cards_id = models.IntegerField()

class Player_state(models.Model):
    Hand_cards_id = models.IntegerField()
    Look_up_cards_id = models.IntegerField()
    Look_down_cards_id = models.IntegerField()

class Player(models.Model):
    game_id = models.IntegerField()
    Player_state_id = models.IntegerField()
    User_id = models.IntegerField()
    Guest_id = models.IntegerField()
    turn = models.IntegerField()
    is_playing = models.BooleanField()

class Guest(models.Model):
    username = models.CharField(max_length=80)

class Guest_in_session(models.Model):
    Guest_id = models.IntegerField()
    Session_id = models.IntegerField()
    is_active = models.BooleanField()
    is_host = models.CharField(max_length=80)
    connection_begin = models.IntegerField()
    connection_time = models.IntegerField()

class User(models.Model):
    username = models.CharField(max_length=80)
    email = models.CharField(max_length=80)
    password = models.CharField(max_length=80)

class User_in_session(models.Model):
    User_id = models.IntegerField()
    Session_id = models.IntegerField()
    is_active = models.BooleanField()
    is_host = models.CharField(max_length=80)
    connection_begin = models.IntegerField()
    connection_duration = models.IntegerField()

class Session(models.Model):
    is_active = models.BooleanField()
    created_at = models.CharField(max_length=80)
    duration = models.IntegerField()

class Game(models.Model):
    Session_id = models.IntegerField()
    Desk_id = models.IntegerField()
    actual_turn = models.CharField(max_length=80)
    turns_count = models.IntegerField()
    players_count = models.IntegerField()
    in_progress = models.BooleanField()
    created_at = models.CharField(max_length=80)
    duration = models.IntegerField()

class Desk(models.Model):
    Hide_cards_id = models.IntegerField()
    Pile_cards_id = models.IntegerField()
    Discarded_cards_id = models.IntegerField()
    Play_pile_id =models.IntegerField()
    is_active = models.BooleanField()
    is_host = models.CharField(max_length=80)
    connection_begin = models.IntegerField()
    connection_duration = models.IntegerField()