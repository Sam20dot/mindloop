from django.urls import path
from . import views

urlpatterns = [
    path('generate', views.generate_questions, name='questions-generate'),
    path('<uuid:session_id>', views.questions_for_session, name='questions-for-session'),
]
