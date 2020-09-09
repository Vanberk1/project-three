from django.urls import path, include
from webApp import views

urlpatterns = [
    path(r'', views.IndexView.as_view(), name='index'),
    path('home/', views.HomePageView.as_view(), name='home'),
    path('game/', views.SearchGameView.as_view(), name='game'),
    path('games/', views.SearchGameView.as_view(), name='games'),
    path('accounts/', include('django.contrib.auth.urls')),
    path('accounts/', include('accounts.urls'))
]
