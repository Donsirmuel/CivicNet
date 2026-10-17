"""
URL configuration for civic_connect project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from connectapp.views import LoginView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('healthz/', lambda request: JsonResponse({'status': 'ok'}), name='healthz'),
    path('api/', include([
        path('api-token-auth/', LoginView.as_view(), name='api_token_auth'),
        path('', include('connectapp.urls')),
    ])),
    path('api-auth/', include('rest_framework.urls')),
]
