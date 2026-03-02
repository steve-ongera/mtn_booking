# booking/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    # Public
    TownViewSet, StageViewSet, RouteViewSet, MatutuTypeViewSet,
    MatutuViewSet, TripViewSet, StageRunViewSet, BookingViewSet,
    # Payments
    PaymentInitiateView, PaymentCallbackView, PaymentStatusView,
    # Seat locking
    TripSeatLockView, TripSeatStatusView,
    StageRunSeatLockView, StageRunSeatStatusView,
    SeatLockCleanupView,
    # Admin auth
    AdminLoginView, AdminMeView, AdminUserViewSet,
    # Admin dashboard
    DashboardView, RevenueChartView,
    # Admin resource viewsets
    AdminTownViewSet, AdminStageViewSet, AdminRouteViewSet,
    AdminMatutuViewSet, AdminTripViewSet, AdminStageRunViewSet,
    AdminBookingViewSet, AdminDriverViewSet,
    # Driver portal
    DriverDashboardView, DriverTripManifestView,
    DriverStageRunManifestView, DriverCreateBookingView,
    DriverStageRunCreateView,
    # Owner portal
    OwnerDashboardView, OwnerMatutuEarningsView,
)

# ── Public router ─────────────────────────────────────────────────────────────
public_router = DefaultRouter()
public_router.register(r'towns',        TownViewSet,       basename='town')
public_router.register(r'stages',       StageViewSet,      basename='stage')
public_router.register(r'routes',       RouteViewSet,      basename='route')
public_router.register(r'matatu-types', MatutuTypeViewSet, basename='matatu-type')
public_router.register(r'matatus',      MatutuViewSet,     basename='matatu')
public_router.register(r'trips',        TripViewSet,       basename='trip')
public_router.register(r'stage-runs',   StageRunViewSet,   basename='stage-run')
public_router.register(r'bookings',     BookingViewSet,    basename='booking')

# ── Admin router ──────────────────────────────────────────────────────────────
admin_router = DefaultRouter()
admin_router.register(r'users',       AdminUserViewSet,     basename='admin-users')
admin_router.register(r'towns',       AdminTownViewSet,     basename='admin-towns')
admin_router.register(r'stages',      AdminStageViewSet,    basename='admin-stages')
admin_router.register(r'routes',      AdminRouteViewSet,    basename='admin-routes')
admin_router.register(r'matatus',     AdminMatutuViewSet,   basename='admin-matatus')
admin_router.register(r'trips',       AdminTripViewSet,     basename='admin-trips')
admin_router.register(r'stage-runs',  AdminStageRunViewSet, basename='admin-stage-runs')
admin_router.register(r'bookings',    AdminBookingViewSet,  basename='admin-bookings')
admin_router.register(r'drivers',     AdminDriverViewSet,   basename='admin-drivers')

# ── Admin URL patterns ────────────────────────────────────────────────────────
admin_urlpatterns = [
    path('auth/login/',              AdminLoginView.as_view(),   name='admin-login'),
    path('auth/refresh/',            TokenRefreshView.as_view(), name='admin-token-refresh'),
    path('auth/me/',                 AdminMeView.as_view(),      name='admin-me'),
    path('dashboard/stats/',         DashboardView.as_view(),    name='admin-dashboard'),
    path('dashboard/revenue-chart/', RevenueChartView.as_view(), name='admin-revenue-chart'),
    path('', include(admin_router.urls)),
]

# ── Driver portal URL patterns ────────────────────────────────────────────────
driver_urlpatterns = [
    path('dashboard/',
         DriverDashboardView.as_view(), name='driver-dashboard'),
    path('trips/<slug:trip_slug>/manifest/',
         DriverTripManifestView.as_view(), name='driver-trip-manifest'),
    path('stage-runs/<slug:stage_run_slug>/manifest/',
         DriverStageRunManifestView.as_view(), name='driver-stagerun-manifest'),
    path('bookings/',
         DriverCreateBookingView.as_view(), name='driver-create-booking'),
    path('stage-runs/',
         DriverStageRunCreateView.as_view(), name='driver-create-stagerun'),
]

# ── Owner portal URL patterns ─────────────────────────────────────────────────
owner_urlpatterns = [
    path('dashboard/',
         OwnerDashboardView.as_view(), name='owner-dashboard'),
    path('matatus/<slug:slug>/earnings/',
         OwnerMatutuEarningsView.as_view(), name='owner-matatu-earnings'),
]

# ── Root urlpatterns ──────────────────────────────────────────────────────────
urlpatterns = [
    # Admin API  →  /api/v1/admin-api/...
    path('admin-api/', include(admin_urlpatterns)),

    # Driver portal  →  /api/v1/driver/...
    path('driver/', include(driver_urlpatterns)),

    # Owner portal  →  /api/v1/owner/...
    path('owner/', include(owner_urlpatterns)),

    # Payments
    path('payments/initiate/',
         PaymentInitiateView.as_view(),  name='payment-initiate'),
    path('payments/callback/',
         PaymentCallbackView.as_view(),  name='payment-callback'),
    path('payments/status/<str:booking_ref>/',
         PaymentStatusView.as_view(),    name='payment-status'),

    # Seat locking — trips (dedicated views, no kwargs hack)
    path('trips/<slug:trip_slug>/lock-seats/',
         TripSeatLockView.as_view(),   name='trip-seat-lock'),
    path('trips/<slug:trip_slug>/seat-status/',
         TripSeatStatusView.as_view(), name='trip-seat-status'),

    # Seat locking — stage runs (dedicated views)
    path('stage-runs/<slug:stage_run_slug>/lock-seats/',
         StageRunSeatLockView.as_view(),   name='stagerun-seat-lock'),
    path('stage-runs/<slug:stage_run_slug>/seat-status/',
         StageRunSeatStatusView.as_view(), name='stagerun-seat-status'),

    # Global seat lock cleanup
    path('seat-locks/cleanup/',
         SeatLockCleanupView.as_view(), name='seat-lock-cleanup'),

    # Public router  →  /api/v1/...
    path('', include(public_router.urls)),
]