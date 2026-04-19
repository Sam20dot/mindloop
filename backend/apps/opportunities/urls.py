from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_opportunities, name='opportunities-list'),
    path('match', views.match_opportunities, name='opportunities-match'),
    path('match/refresh', views.refresh_matches, name='opportunities-refresh'),
    path('saved', views.saved_opportunities, name='opportunities-saved'),
    path('stats', views.opportunity_stats, name='opportunities-stats'),
    path('skill-gaps', views.skill_gap_analysis, name='opportunities-skill-gaps'),
    path('<uuid:opportunity_id>/view', views.log_opportunity_view, name='opportunity-view'),
    path('<uuid:opportunity_id>/save', views.save_opportunity, name='opportunity-save'),
]
