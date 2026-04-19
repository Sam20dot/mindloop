from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/sessions/', include('apps.learning_sessions.urls')),
    path('api/v1/questions/', include('apps.questions.urls')),
    path('api/v1/answers/', include('apps.answers.urls')),
    path('api/v1/skills/', include('apps.skills.urls')),
    path('api/v1/cv/', include('apps.cv.urls')),
    path('api/v1/roadmap/', include('apps.roadmap.urls')),
    path('api/v1/opportunities/', include('apps.opportunities.urls')),
    path('api/v1/community/', include('apps.community.urls')),
    path('api/v1/challenges/', include('apps.challenges.urls')),
    path('api/v1/leaderboard/', include('apps.users.leaderboard_urls')),
    path('api/v1/library/', include('apps.library.urls')),
    path('api/v1/jobs/', include('apps.jobs.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
