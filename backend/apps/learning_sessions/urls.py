from django.urls import path
from . import views

urlpatterns = [
    path('start', views.start_session, name='session-start'),
    path('history', views.session_history, name='session-history'),
    path('extract-text', views.extract_text, name='session-extract-text'),
    path('<uuid:session_id>', views.session_detail, name='session-detail'),
    path('<uuid:session_id>/complete', views.complete_session, name='session-complete'),
]
