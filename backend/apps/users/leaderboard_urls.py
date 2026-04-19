from django.urls import path
from . import views

urlpatterns = [
    path('points', views.leaderboard_points, name='leaderboard-points'),
    path('skills', views.leaderboard_skills, name='leaderboard-skills'),
    path('weekly', views.leaderboard_weekly, name='leaderboard-weekly'),
    path('me', views.leaderboard_me, name='leaderboard-me'),
]
