from django.urls import path
from . import views

urlpatterns = [
    path('feed', views.community_feed, name='community-feed'),
    path('posts', views.create_post, name='community-create-post'),
    path('posts/<uuid:post_id>/like', views.like_post, name='community-like-post'),
]
