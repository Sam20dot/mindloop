from django.urls import path
from . import views

urlpatterns = [
    path('submit', views.submit_answer, name='answer-submit'),
    path('<uuid:session_id>', views.answers_for_session, name='answers-for-session'),
]
