from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

from .models import Sesion

# Create your views here.

class IndexView(TemplateView):
    def get(self, request, **kwargs):
        return render(request, 'index.html', context=None)

class HomePageView(LoginRequiredMixin, TemplateView):
    def get(self, request, **kwargs):
        return render(request, 'index.html', context=None)

class SearchGameView(LoginRequiredMixin, TemplateView):
    def get(self, request, **kwargs):
        sessions = Sesion.objects.filter(is_active=True)
        return render(request, 'games.html', { 'sessions': sessions })

class GameLobby(LoginRequiredMixin, TemplateView):
    def get(self, request, **kwargs):
        sesion_code = kwargs['code']
        return render(request, 'game.html', {'sesion': Sesion.objects.get(code=sesion_code)})