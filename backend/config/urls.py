"""Routes API versionnées de BTDIGIT AGRO."""
from django.contrib import admin
from django.urls import path
from core.views import HealthView
from accounts.views import ChannelsView, CSRFView, RegisterView, VerifyView, LoginView, LogoutView, MeView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", HealthView.as_view(), name="api-health"),
    path("api/v1/auth/channels/", ChannelsView.as_view(), name="auth-channels"),
    path("api/v1/auth/csrf/", CSRFView.as_view(), name="auth-csrf"),
    path("api/v1/auth/register/", RegisterView.as_view(), name="auth-register"),
    path("api/v1/auth/verify/", VerifyView.as_view(), name="auth-verify"),
    path("api/v1/auth/login/", LoginView.as_view(), name="auth-login"),
    path("api/v1/auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("api/v1/auth/me/", MeView.as_view(), name="auth-me"),
]
