from django.urls import path
from .views import HealthCheckView, LoginView, LogoutView, MeView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', MeView.as_view(), name='me'),
]
