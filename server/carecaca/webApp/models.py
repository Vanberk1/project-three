from django.db import models
import datetime

# Create your models here.

class Sesion(models.Model):
    sesion_code = models.CharField(max_length=10)
    active_time = models.DurationField()
    is_active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True, editable=False)
    modified_date = models.DateTimeField(auto_now=True)

    def set_sesion_code(self, code):
        self.sesion_code = code

    def close_sesion(self):
        self.active_time = datetime.datetime.now()
        self.is_active = False

class UsersInSesion(models.Model):
    user_id = models.PositiveIntegerField()
    sesion_id = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)
    conection_time = models.DurationField()
    created_date = models.DateTimeField(auto_now_add=True, editable=False)

class Chat(models.Model):
    sesion_id = models.PositiveIntegerField()

class Message(models.Model):
    chat_id = models.PositiveIntegerField()
    user_id = models.PositiveIntegerField()
    text = models.CharField(max_length=200)
    created_date = models.DateTimeField(auto_now_add=True, editable=False)



