from django.db import models

class Curso(models.Model):
    sigla=models.CharField(max_length=6)
    nombre=models.CharField(max_length=60)
    creditos=models.IntegerField()

    def __str__(self):
        return "{}".format(self.nombre)

# Create your models here.
