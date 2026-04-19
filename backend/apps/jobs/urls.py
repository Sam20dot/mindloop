from django.urls import path
from . import views

urlpatterns = [
    path('',                                   views.list_jobs,               name='jobs-list'),
    path('match',                              views.match_jobs,              name='jobs-match'),
    path('apply/<uuid:job_id>',                views.apply_to_job,            name='jobs-apply'),
    path('my-applications',                    views.my_applications,         name='jobs-my-applications'),
    path('admin/create',                       views.create_job,              name='jobs-create'),
    path('admin/stats',                        views.admin_stats,             name='jobs-admin-stats'),
    path('admin/<uuid:job_id>',                views.manage_job,              name='jobs-manage'),
    path('admin/<uuid:job_id>/applications',   views.job_applications,        name='jobs-applications'),
    path('admin/applications/<uuid:application_id>/status', views.update_application_status, name='jobs-app-status'),
]
