from django.test import TestCase

from models import Curso

class CursoTestCase(TestCase):
    """clase que define la testsuite"""

    def setUp(self):
        """defino variables"""
        self.sigla = "Icf121"
        self.nombre = "intro a la ing"
        self.creditos = 6
        self.curso = Curso(sigla=self.sigla,nombre=self.nombre,creditos=self.creditos)



# Create your tests here.
