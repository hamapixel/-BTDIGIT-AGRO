"""Routes API versionnées de BTDIGIT AGRO."""
from django.contrib import admin
from django.urls import path
from core.views import HealthView
from accounts.views import ChannelsView, CSRFView, RegisterView, VerifyView, LoginView, LogoutView, MeView
from accounts.advanced_views import (
    ResendVerificationView, PasswordResetRequestView, PasswordResetConfirmView,
    OrganizationListCreateView, OrganizationDetailView, OrganizationMembersView,
    OrganizationMemberDetailView, SuperadminOrganizationsView,
)

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
    path("api/v1/auth/resend/", ResendVerificationView.as_view(), name="auth-resend"),
    path("api/v1/auth/recover/", PasswordResetRequestView.as_view(), name="auth-recover"),
    path("api/v1/auth/recover/confirm/", PasswordResetConfirmView.as_view(), name="auth-recover-confirm"),
    path("api/v1/organizations/", OrganizationListCreateView.as_view(), name="org-list"),
    path("api/v1/organizations/<uuid:pk>/", OrganizationDetailView.as_view(), name="org-detail"),
    path("api/v1/organizations/<uuid:pk>/members/", OrganizationMembersView.as_view(), name="org-members"),
    path("api/v1/organizations/<uuid:pk>/members/<uuid:member_id>/", OrganizationMemberDetailView.as_view(), name="org-member-detail"),
    path("api/v1/superadmin/organizations/", SuperadminOrganizationsView.as_view(), name="superadmin-orgs"),
]
