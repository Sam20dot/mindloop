from django.urls import path
from . import views

urlpatterns = [
    path('generate', views.generate_roadmap, name='roadmap-generate'),
    path('step/status', views.update_step_status, name='roadmap-step-status'),
    path('step/quiz', views.generate_step_quiz, name='roadmap-step-quiz'),
    path('step/verify', views.verify_step, name='roadmap-step-verify'),
    path('<uuid:roadmap_id>/steps', views.update_roadmap_step, name='roadmap-step-update'),
    path('<uuid:user_id>', views.get_roadmaps, name='roadmap-get'),
]
