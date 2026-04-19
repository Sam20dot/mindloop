from django.urls import path
from . import views

urlpatterns = [
    path('generate', views.generate_cv, name='cv-generate'),
    path('me', views.get_my_cv, name='cv-me'),
    path('<uuid:user_id>', views.get_cv, name='cv-get'),
]
