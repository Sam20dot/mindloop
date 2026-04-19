from django.urls import path
from . import views

urlpatterns = [
    path('me', views.my_skills, name='skills-me'),
    path('add', views.add_skill, name='skills-add'),
]
