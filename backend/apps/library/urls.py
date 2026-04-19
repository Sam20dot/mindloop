from django.urls import path
from . import views

urlpatterns = [
    path('',           views.list_materials,  name='library-list'),
    path('upload',     views.upload_material, name='library-upload'),
    path('<uuid:material_id>', views.get_material,    name='library-get'),
    path('<uuid:material_id>/delete', views.delete_material, name='library-delete'),
]
