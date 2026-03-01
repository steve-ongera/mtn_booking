"""
views.py – Public + Admin ViewSets and APIViews for MTN Matatu Booking
"""
import base64
import logging
import requests

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta, date

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Sacco, MatutuOwner, Driver, Town, Stage, Route, RouteStop,
    MatutuType, Matatu, SeatLayout, Trip, StageRun,
    Booking, BookedSeat, Payment, SeatLock, DailyEarnings
)
from .serializers import (
    # Public
    TownSerializer, StageSerializer, RouteSerializer, MatutuTypeSerializer,
    MatutuListSerializer, MatutuDetailSerializer, SeatLayoutSerializer,
    TripListSerializer, TripDetailSerializer,
    StageRunListSerializer, StageRunDetailSerializer,
    BookingCreateSerializer, BookingDetailSerializer,
    PaymentInitSerializer,
    # Admin
    AdminLoginSerializer, AdminUserSerializer, AdminUserCreateSerializer,
    DriverSerializer, DriverCreateSerializer, OwnerSerializer,
    AdminMatutuSerializer, AdminTripSerializer, AdminStageRunSerializer,
    AdminBookingSerializer, DashboardStatsSerializer,
    DailyEarningsSerializer, OwnerMatutuSummarySerializer,
    DriverBookingManifestSerializer, SeatLayoutBulkUpdateSerializer,
    AdminTownSerializer, AdminStageSerializer, AdminRouteSerializer,
)

logger = logging.getLogger(__name__)


def _get_session_key(request):
    if not request.session.session_key:
        request.session.create()
    return request.session.session_key


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC VIEWSETS
# ─────────────────────────────────────────────────────────────────────────────

class TownViewSet(viewsets.ModelViewSet):
    queryset = Town.objects.filter(is_active=True)
    serializer_class = TownSerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]


class StageViewSet(viewsets.ModelViewSet):
    queryset = Stage.objects.filter(is_active=True).select_related('town')
    serializer_class = StageSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['town__slug']
    search_fields = ['name', 'town__name']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.filter(is_active=True).select_related(
        'origin', 'destination'
    ).prefetch_related('stops__stage__town')
    serializer_class = RouteSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]


class MatutuTypeViewSet(viewsets.ModelViewSet):
    queryset = MatutuType.objects.all()
    serializer_class = MatutuTypeSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]


class MatutuViewSet(viewsets.ModelViewSet):
    queryset = Matatu.objects.filter(is_active=True).select_related(
        'matatu_type', 'route', 'assigned_driver__user'
    ).prefetch_related('seats')
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['service_type', 'route__slug']
    search_fields = ['name', 'plate_number']

    def get_serializer_class(self):
        if self.action == 'list':
            return MatutuListSerializer
        return MatutuDetailSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]


class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.filter(is_active=True).select_related(
        'matatu__matatu_type', 'route__origin', 'route__destination',
        'origin_stage', 'destination_stage'
    )
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'departure_date', 'matatu__slug']
    ordering_fields = ['departure_date', 'departure_time']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TripDetailSerializer
        return TripListSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'search']:
            return [AllowAny()]
        return [IsAdminUser()]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['session_key'] = _get_session_key(self.request)
        return ctx

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def search(self, request):
        """
        GET /api/v1/trips/search/?origin=muranga&destination=nairobi&date=2026-03-01
        Returns both express trips and available stage runs.
        """
        origin_slug = request.query_params.get('origin')
        destination_slug = request.query_params.get('destination')
        date_str = request.query_params.get('date')

        if not all([origin_slug, destination_slug, date_str]):
            return Response(
                {'error': 'origin, destination, and date are required'},
                status=400
            )

        # Express trips
        trips = self.queryset.filter(
            route__origin__slug__iexact=origin_slug,
            route__destination__slug__iexact=destination_slug,
            departure_date=date_str,
            status__in=['scheduled', 'boarding']
        ).order_by('departure_time')

        # Stage runs on that date
        stage_runs = StageRun.objects.filter(
            route__origin__slug__iexact=origin_slug,
            route__destination__slug__iexact=destination_slug,
            run_date=date_str,
            status='loading'
        ).select_related(
            'matatu', 'route__origin', 'route__destination',
            'origin_stage', 'destination_stage'
        ).order_by('run_number')

        trips_data = TripListSerializer(trips, many=True).data
        runs_data = StageRunListSerializer(stage_runs, many=True).data

        return Response({
            'trips': trips_data,
            'stage_runs': runs_data,
            'total': len(trips_data) + len(runs_data),
        })


class StageRunViewSet(viewsets.ModelViewSet):
    queryset = StageRun.objects.select_related(
        'matatu', 'route__origin', 'route__destination',
        'origin_stage', 'destination_stage'
    )
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'run_date', 'matatu__slug']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StageRunDetailSerializer
        return StageRunListSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    lookup_field = 'slug'
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'create':
            return BookingCreateSerializer
        return BookingDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = BookingCreateSerializer(data=request.data)
        if serializer.is_valid():
            booking = serializer.save()
            return Response(BookingDetailSerializer(booking).data,
                            status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=400)

    @action(detail=False, methods=['get'], url_path='track/(?P<reference>[^/.]+)')
    def track(self, request, reference=None):
        try:
            booking = Booking.objects.get(reference__iexact=reference)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)
        return Response(BookingDetailSerializer(booking).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, slug=None):
        booking = self.get_object()
        if booking.status == 'confirmed':
            booking.status = 'cancelled'
            booking.save()
            return Response({'message': 'Booking cancelled.'})
        return Response({'error': 'Cannot cancel this booking.'}, status=400)


# ─────────────────────────────────────────────────────────────────────────────
# PAYMENT VIEWS
# ─────────────────────────────────────────────────────────────────────────────

class PaymentInitiateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PaymentInitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        booking_ref = serializer.validated_data['booking_reference']
        phone = serializer.validated_data['phone_number']

        try:
            booking = Booking.objects.get(reference__iexact=booking_ref)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)

        if booking.status == 'confirmed':
            return Response({'error': 'Booking already paid'}, status=400)

        phone = self._normalize_phone(phone)
        access_token = self._get_mpesa_token()
        if not access_token:
            return Response({'error': 'Could not connect to M-Pesa.'}, status=503)

        response = self._stk_push(booking, phone, access_token)

        if response.get('ResponseCode') == '0':
            Payment.objects.update_or_create(
                booking=booking,
                defaults={
                    'amount': booking.total_amount,
                    'phone_number': phone,
                    'checkout_request_id': response.get('CheckoutRequestID', ''),
                    'merchant_request_id': response.get('MerchantRequestID', ''),
                    'status': 'pending',
                }
            )
            return Response({
                'success': True,
                'message': 'STK Push sent. Enter M-Pesa PIN.',
                'checkout_request_id': response.get('CheckoutRequestID'),
                'booking_reference': booking_ref,
            })
        else:
            err = response.get('errorMessage') or response.get('ResultDesc') or 'M-Pesa error.'
            return Response({'error': err}, status=400)

    def _normalize_phone(self, phone):
        phone = phone.strip().replace('+', '').replace(' ', '')
        if phone.startswith('0'):
            return '254' + phone[1:]
        if not phone.startswith('254'):
            return '254' + phone
        return phone

    def _get_mpesa_token(self):
        env = getattr(settings, 'MPESA_ENVIRONMENT', 'sandbox')
        base = 'https://sandbox.safaricom.co.ke' if env == 'sandbox' else 'https://api.safaricom.co.ke'
        creds = base64.b64encode(
            f"{settings.MPESA_CONSUMER_KEY}:{settings.MPESA_CONSUMER_SECRET}".encode()
        ).decode()
        try:
            r = requests.get(
                f'{base}/oauth/v1/generate?grant_type=client_credentials',
                headers={'Authorization': f'Basic {creds}'}, timeout=15
            )
            if r.status_code != 200:
                return None
            return r.json().get('access_token')
        except Exception as e:
            logger.error(f"M-Pesa token error: {e}")
            return None

    def _stk_push(self, booking, phone, token):
        env = getattr(settings, 'MPESA_ENVIRONMENT', 'sandbox')
        base = 'https://sandbox.safaricom.co.ke' if env == 'sandbox' else 'https://api.safaricom.co.ke'
        ts = timezone.now().strftime('%Y%m%d%H%M%S')
        sc = settings.MPESA_SHORTCODE
        pw = base64.b64encode(f"{sc}{settings.MPESA_PASSKEY}{ts}".encode()).decode()
        try:
            r = requests.post(
                f'{base}/mpesa/stkpush/v1/processrequest',
                json={
                    "BusinessShortCode": sc, "Password": pw, "Timestamp": ts,
                    "TransactionType": "CustomerPayBillOnline",
                    "Amount": max(1, int(booking.total_amount)),
                    "PartyA": phone, "PartyB": sc, "PhoneNumber": phone,
                    "CallBackURL": settings.MPESA_CALLBACK_URL,
                    "AccountReference": booking.reference,
                    "TransactionDesc": f"MTN Matatu {booking.reference}",
                },
                headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
                timeout=30
            )
            return r.json() if r.text.strip() else {'errorMessage': 'Empty response'}
        except Exception as e:
            return {'errorMessage': str(e)}


class PaymentCallbackView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        try:
            stk = request.data.get('Body', {}).get('stkCallback', {})
            result_code = stk.get('ResultCode')
            checkout_id = stk.get('CheckoutRequestID')
            try:
                payment = Payment.objects.get(checkout_request_id=checkout_id)
            except Payment.DoesNotExist:
                return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})

            if result_code == 0:
                items = {
                    i['Name']: i.get('Value')
                    for i in stk.get('CallbackMetadata', {}).get('Item', [])
                }
                payment.mpesa_receipt_number = str(items.get('MpesaReceiptNumber', ''))
                payment.transaction_date = timezone.now()
                payment.status = 'completed'
                payment.result_code = str(result_code)
                payment.result_desc = stk.get('ResultDesc', '')
                payment.save()

                booking = payment.booking
                booking.status = 'confirmed'
                booking.save()
                self._send_ticket(booking)
            else:
                payment.status = 'failed'
                payment.result_code = str(result_code)
                payment.result_desc = stk.get('ResultDesc', '')
                payment.save()
        except Exception as e:
            logger.error(f"Callback error: {e}", exc_info=True)
        return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})

    def _send_ticket(self, booking):
        try:
            seats = ', '.join(
                bs.seat.seat_number for bs in booking.booked_seats.select_related('seat').all()
            )
            matatu = booking.matatu
            route = booking.route
            dep_date = booking.trip.departure_date if booking.trip else booking.stage_run.run_date
            dep_time = booking.trip.departure_time if booking.trip else "—"

            html = f"""
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
              <div style="background:#007A3D;color:white;padding:20px;text-align:center;">
                <h1>MTN Sacco – Ticket Confirmed</h1>
              </div>
              <div style="padding:20px;">
                <p><strong>Reference:</strong> {booking.reference}</p>
                <p><strong>Passenger:</strong> {booking.passenger_name}</p>
                <p><strong>Phone:</strong> {booking.passenger_phone}</p>
                <p><strong>Route:</strong> {route}</p>
                <p><strong>Matatu:</strong> {matatu.plate_number if matatu else '—'}</p>
                <p><strong>Date:</strong> {dep_date}</p>
                <p><strong>Departure:</strong> {dep_time}</p>
                <p><strong>Seat(s):</strong> {seats}</p>
                <p><strong>Paid:</strong> KES {booking.total_amount}</p>
                <hr/>
                <p>Track at: <a href="https://mtn.co.ke/track/{booking.reference}">
                  mtn.co.ke/track/{booking.reference}</a></p>
              </div>
            </div>
            """
            if booking.passenger_email:
                send_mail(
                    subject=f"MTN Ticket – {booking.reference}",
                    message=f"Your booking {booking.reference} is confirmed.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[booking.passenger_email],
                    html_message=html,
                    fail_silently=False,
                )
            booking.ticket_sent = True
            booking.save(update_fields=['ticket_sent'])
        except Exception as e:
            logger.error(f"Ticket email failed for {booking.reference}: {e}")


class PaymentStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, booking_ref):
        try:
            booking = Booking.objects.get(reference__iexact=booking_ref)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)
        try:
            payment = booking.payment
            return Response({
                'booking_status': booking.status,
                'payment_status': payment.status,
                'receipt': payment.mpesa_receipt_number,
                'message': payment.result_desc,
            })
        except Payment.DoesNotExist:
            return Response({
                'booking_status': booking.status,
                'payment_status': 'not_initiated',
            })


# ─────────────────────────────────────────────────────────────────────────────
# SEAT LOCKING VIEWS
# ─────────────────────────────────────────────────────────────────────────────

class SeatLockView(APIView):
    """
    POST /api/v1/trips/<slug>/lock-seats/     — for express trips
    POST /api/v1/stage-runs/<slug>/lock-seats/ — for stage runs
    Body: { "seat_numbers": ["1","2"], "action": "lock"|"release" }
    """
    permission_classes = [AllowAny]

    def _get_obj(self, trip_slug=None, stage_run_slug=None):
        if trip_slug:
            try:
                return Trip.objects.get(slug=trip_slug), 'trip'
            except Trip.DoesNotExist:
                return None, None
        if stage_run_slug:
            try:
                return StageRun.objects.get(slug=stage_run_slug), 'stage_run'
            except StageRun.DoesNotExist:
                return None, None
        return None, None

    def post(self, request, trip_slug=None, stage_run_slug=None):
        SeatLock.cleanup_expired()

        obj, obj_type = self._get_obj(trip_slug, stage_run_slug)
        if not obj:
            return Response({'error': 'Not found'}, status=404)

        action = request.data.get('action', 'lock')
        seat_numbers = request.data.get('seat_numbers', [])
        session_key = _get_session_key(request)

        matatu = obj.matatu if obj_type == 'stage_run' else obj.matatu
        lock_filter = {'trip': obj} if obj_type == 'trip' else {'stage_run': obj}

        if action == 'release':
            SeatLock.objects.filter(
                **lock_filter,
                session_key=session_key,
                seat__seat_number__in=seat_numbers
            ).delete()
            return Response({'released': seat_numbers})

        seats = SeatLayout.objects.filter(
            matatu=matatu,
            seat_number__in=seat_numbers,
            is_active=True, is_aisle_gap=False,
            is_driver_seat=False, is_conductor_seat=False,
        )
        if seats.count() != len(seat_numbers):
            return Response({'error': 'Invalid seats'}, status=400)

        booked_filter = {'booking__trip': obj} if obj_type == 'trip' else {'booking__stage_run': obj}
        already_booked = BookedSeat.objects.filter(
            seat__in=seats,
            booking__status__in=['pending', 'confirmed'],
            **booked_filter
        ).values_list('seat__seat_number', flat=True)
        if already_booked:
            return Response({'error': 'Seats already booked', 'booked': list(already_booked)}, status=409)

        locked_by_others = SeatLock.objects.filter(
            **lock_filter, seat__in=seats
        ).exclude(session_key=session_key).values_list('seat__seat_number', flat=True)
        if locked_by_others:
            return Response({'error': 'Seats locked by another user',
                             'locked': list(locked_by_others)}, status=409)

        expires_at = timezone.now() + SeatLock.lock_duration()
        locked, failed = [], []

        for seat in seats:
            try:
                SeatLock.objects.update_or_create(
                    **lock_filter, seat=seat,
                    defaults={
                        'session_key': session_key,
                        'expires_at': expires_at,
                        'locked_at': timezone.now(),
                    }
                )
                locked.append(seat.seat_number)
            except IntegrityError:
                failed.append(seat.seat_number)

        if failed:
            SeatLock.objects.filter(
                **lock_filter,
                seat__seat_number__in=locked,
                session_key=session_key
            ).delete()
            return Response({'error': 'Race condition', 'failed': failed}, status=409)

        return Response({
            'locked': locked,
            'expires_at': expires_at.isoformat(),
            'session_key': session_key,
            'expires_in_seconds': int(SeatLock.lock_duration().total_seconds()),
        })


class SeatStatusView(APIView):
    """
    GET /api/v1/trips/<slug>/seat-status/
    GET /api/v1/stage-runs/<slug>/seat-status/
    """
    permission_classes = [AllowAny]

    def _get_obj(self, trip_slug=None, stage_run_slug=None):
        if trip_slug:
            try:
                return Trip.objects.get(slug=trip_slug), 'trip'
            except Trip.DoesNotExist:
                return None, None
        if stage_run_slug:
            try:
                return StageRun.objects.get(slug=stage_run_slug), 'stage_run'
            except StageRun.DoesNotExist:
                return None, None
        return None, None

    def get(self, request, trip_slug=None, stage_run_slug=None):
        SeatLock.cleanup_expired()
        obj, obj_type = self._get_obj(trip_slug, stage_run_slug)
        if not obj:
            return Response({'error': 'Not found'}, status=404)

        session_key = _get_session_key(request)
        book_filter = {'booking__trip': obj} if obj_type == 'trip' else {'booking__stage_run': obj}
        lock_filter = {'trip': obj} if obj_type == 'trip' else {'stage_run': obj}

        booked = list(BookedSeat.objects.filter(
            booking__status__in=['pending', 'confirmed'], **book_filter
        ).values_list('seat__seat_number', flat=True))

        locked_by_others = list(SeatLock.objects.filter(
            **lock_filter
        ).exclude(session_key=session_key).values_list('seat__seat_number', flat=True))

        my_locks = SeatLock.objects.filter(**lock_filter, session_key=session_key
                                           ).values('seat__seat_number', 'expires_at')
        my_locked_seats = {
            lock['seat__seat_number']: max(0, int((lock['expires_at'] - timezone.now()).total_seconds()))
            for lock in my_locks
        }

        return Response({
            'booked': booked,
            'locked_by_others': locked_by_others,
            'my_locks': my_locked_seats,
        })


class SeatLockCleanupView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        SeatLock.cleanup_expired()
        active = SeatLock.objects.filter(expires_at__gt=timezone.now()).count()
        return Response({'status': 'ok', 'active_locks_remaining': active})


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN AUTH MIXIN
# ─────────────────────────────────────────────────────────────────────────────

class AdminAuthMixin:
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [IsAdminUser]


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN AUTH VIEWS
# ─────────────────────────────────────────────────────────────────────────────

class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password']
        )
        if not user:
            return Response({'error': 'Invalid credentials'}, status=401)
        if not user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': AdminUserSerializer(user).data
        })


class AdminMeView(AdminAuthMixin, APIView):
    def get(self, request):
        return Response(AdminUserSerializer(request.user).data)


class AdminUserViewSet(AdminAuthMixin, viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']

    def get_serializer_class(self):
        if self.action == 'create':
            return AdminUserCreateSerializer
        return AdminUserSerializer


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN DASHBOARD
# ─────────────────────────────────────────────────────────────────────────────

class DashboardView(AdminAuthMixin, APIView):
    def get(self, request):
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        bookings = Booking.objects.all()
        confirmed = bookings.filter(status='confirmed')

        return Response({
            'total_bookings': bookings.count(),
            'confirmed_bookings': confirmed.count(),
            'pending_bookings': bookings.filter(status='pending').count(),
            'cancelled_bookings': bookings.filter(status='cancelled').count(),
            'total_revenue': confirmed.aggregate(t=Sum('total_amount'))['t'] or 0,
            'revenue_today': confirmed.filter(
                created_at__date=today).aggregate(t=Sum('total_amount'))['t'] or 0,
            'revenue_this_week': confirmed.filter(
                created_at__date__gte=week_ago).aggregate(t=Sum('total_amount'))['t'] or 0,
            'revenue_this_month': confirmed.filter(
                created_at__date__gte=month_ago).aggregate(t=Sum('total_amount'))['t'] or 0,
            'total_matatus': Matatu.objects.count(),
            'active_matatus': Matatu.objects.filter(is_active=True).count(),
            'total_drivers': Driver.objects.count(),
            'total_passengers': BookedSeat.objects.filter(
                booking__status='confirmed').count(),
        })


class RevenueChartView(AdminAuthMixin, APIView):
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        since = timezone.now().date() - timedelta(days=days)
        data = (
            Booking.objects.filter(status='confirmed', created_at__date__gte=since)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(revenue=Sum('total_amount'), bookings=Count('id'))
            .order_by('date')
        )
        return Response(list(data))


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN RESOURCE VIEWSETS
# ─────────────────────────────────────────────────────────────────────────────

class AdminTownViewSet(AdminAuthMixin, viewsets.ModelViewSet):
    queryset = Town.objects.all().order_by('name')
    serializer_class = AdminTownSerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class AdminStageViewSet(AdminAuthMixin, viewsets.ModelViewSet):
    queryset = Stage.objects.all().select_related('town').order_by('town__name', 'name')
    serializer_class = AdminStageSerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'town__name']
    filterset_fields = ['town__slug', 'is_active']


class AdminRouteViewSet(AdminAuthMixin, viewsets.ModelViewSet):
    queryset = Route.objects.all().select_related('origin', 'destination').prefetch_related(
        'stops__stage'
    ).order_by('origin__name')
    serializer_class = AdminRouteSerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'origin__name', 'destination__name']


class AdminMatutuViewSet(AdminAuthMixin, viewsets.ModelViewSet):
    queryset = Matatu.objects.all().select_related(
        'matatu_type', 'route', 'owner__user', 'assigned_driver__user'
    ).prefetch_related('seats').order_by('name')
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'plate_number']
    filterset_fields = ['is_active', 'service_type']

    def get_serializer_class(self):
        return AdminMatutuSerializer

    @action(detail=True, methods=['post'], url_path='save-layout')
    def save_layout(self, request, slug=None):
        """Replace entire seat layout from drag-and-drop editor"""
        matatu = self.get_object()
        seats_data = request.data.get('seats', [])

        with transaction.atomic():
            matatu.seats.all().delete()
            created = []
            seen = {}

            for s in seats_data:
                num = s.get('seat_number', '').strip()
                if not num or num in seen:
                    row, col = s.get('row_number', 0), s.get('column_number', 0)
                    if s.get('is_driver_seat'):
                        num = f"DRV-{row}-{col}"
                    elif s.get('is_conductor_seat'):
                        num = f"COND-{row}-{col}"
                    elif s.get('is_aisle_gap'):
                        num = f"AISLE-{row}-{col}"
                    else:
                        num = f"S-{row}-{col}"
                seen[num] = True

                SeatLayout.objects.create(
                    matatu=matatu,
                    seat_number=num,
                    seat_class=s.get('seat_class', 'window'),
                    row_number=s.get('row_number', 1),
                    column_number=s.get('column_number', 1),
                    row_span=s.get('row_span', 1),
                    col_span=s.get('col_span', 1),
                    is_aisle_gap=s.get('is_aisle_gap', False),
                    is_driver_seat=s.get('is_driver_seat', False),
                    is_conductor_seat=s.get('is_conductor_seat', False),
                    bg_color=s.get('bg_color', ''),
                    text_color=s.get('text_color', ''),
                    custom_label=s.get('custom_label', ''),
                    extra_padding=s.get('extra_padding', 0),
                    is_active=s.get('is_active', True),
                )
                created.append(num)

            matatu.total_seats = len([
                s for s in seats_data
                if not s.get('is_aisle_gap')
                and not s.get('is_driver_seat')
                and not s.get('is_conductor_seat')
            ])
            matatu.save(update_fields=['total_seats'])

        return Response({'saved': len(created), 'seats': created})

    @action(detail=True, methods=['post'], url_path='assign-driver')
    def assign_driver(self, request, slug=None):
        matatu = self.get_object()
        driver_id = request.data.get('driver_id')
        try:
            driver = Driver.objects.get(id=driver_id, status='active')
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found or inactive'}, status=404)
        matatu.assigned_driver = driver
        matatu.save(update_fields=['assigned_driver'])
        return Response({'message': f'Driver {driver.user.get_full_name()} assigned.',
                         'driver': DriverSerializer(driver).data})


class AdminTripViewSet(AdminAuthMixin, viewsets.ModelViewSet):
    queryset = Trip.objects.all().select_related(
        'matatu', 'route__origin', 'route__destination',
        'origin_stage', 'destination_stage'
    ).order_by('-departure_date', 'departure_time')
    serializer_class = AdminTripSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'is_active', 'departure_date', 'matatu__slug']
    search_fields = ['matatu__plate_number', 'route__origin__name', 'route__destination__name']
    ordering_fields = ['departure_date', 'departure_time']

    @action(detail=True, methods=['get'], url_path='manifest')
    def manifest(self, request, slug=None):
        trip = self.get_object()
        bookings = trip.bookings.filter(
            status__in=['confirmed', 'pending']
        ).prefetch_related('booked_seats__seat').order_by('created_at')
        return Response({
            'trip': AdminTripSerializer(trip).data,
            'passengers': DriverBookingManifestSerializer(bookings, many=True).data,
            'total_passengers': bookings.count(),
        })

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, slug=None):
        trip = self.get_object()
        new_status = request.data.get('status')
        valid = [c[0] for c in Trip.STATUS_CHOICES]
        if new_status not in valid:
            return Response({'error': f'Valid statuses: {valid}'}, status=400)
        trip.status = new_status
        trip.save(update_fields=['status'])
        return Response({'status': trip.status})


class AdminStageRunViewSet(AdminAuthMixin, viewsets.ModelViewSet):
    queryset = StageRun.objects.all().select_related(
        'matatu', 'route__origin', 'route__destination'
    ).order_by('-run_date', '-run_number')
    serializer_class = AdminStageRunSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'run_date', 'matatu__slug']
    search_fields = ['matatu__plate_number']

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, slug=None):
        run = self.get_object()
        new_status = request.data.get('status')
        valid = [c[0] for c in StageRun.STATUS_CHOICES]
        if new_status not in valid:
            return Response({'error': f'Valid statuses: {valid}'}, status=400)
        run.status = new_status
        if new_status == 'departed':
            run.departed_at = timezone.now()
        elif new_status == 'arrived':
            run.arrived_at = timezone.now()
        run.save()
        return Response({'status': run.status})

    @action(detail=True, methods=['get'], url_path='manifest')
    def manifest(self, request, slug=None):
        run = self.get_object()
        bookings = run.bookings.filter(
            status__in=['confirmed', 'pending']
        ).prefetch_related('booked_seats__seat').order_by('created_at')
        return Response({
            'stage_run': AdminStageRunSerializer(run).data,
            'passengers': DriverBookingManifestSerializer(bookings, many=True).data,
            'total_passengers': bookings.count(),
        })


class AdminBookingViewSet(AdminAuthMixin, viewsets.ModelViewSet):
    queryset = Booking.objects.all().select_related(
        'trip__matatu', 'stage_run__matatu'
    ).prefetch_related('booked_seats__seat').order_by('-created_at')
    serializer_class = AdminBookingSerializer
    lookup_field = 'reference'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status']
    search_fields = ['reference', 'passenger_name', 'passenger_phone', 'passenger_email']

    @action(detail=True, methods=['post'])
    def confirm(self, request, reference=None):
        b = self.get_object()
        b.status = 'confirmed'
        b.save()
        return Response({'status': 'confirmed'})

    @action(detail=True, methods=['post'])
    def cancel(self, request, reference=None):
        b = self.get_object()
        b.status = 'cancelled'
        b.save()
        return Response({'status': 'cancelled'})


class AdminDriverViewSet(AdminAuthMixin, viewsets.ModelViewSet):
    queryset = Driver.objects.all().select_related('user', 'sacco').order_by('user__last_name')
    lookup_field = 'id'
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['user__first_name', 'user__last_name', 'license_number', 'phone']
    filterset_fields = ['status']

    def get_serializer_class(self):
        if self.action == 'create':
            return DriverCreateSerializer
        return DriverSerializer

    @action(detail=True, methods=['post'], url_path='toggle-status')
    def toggle_status(self, request, id=None):
        driver = self.get_object()
        driver.status = 'suspended' if driver.status == 'active' else 'active'
        driver.save()
        return Response({'status': driver.status})


# ─────────────────────────────────────────────────────────────────────────────
# DRIVER PORTAL VIEWS (driver sees only their matatu's data)
# ─────────────────────────────────────────────────────────────────────────────

class DriverAuthMixin:
    authentication_classes = [JWTAuthentication, SessionAuthentication]

    def get_driver(self, request):
        try:
            return request.user.driver_profile
        except Exception:
            return None


class DriverDashboardView(DriverAuthMixin, APIView):
    """GET /api/v1/driver/dashboard/"""

    def get(self, request):
        driver = self.get_driver(request)
        if not driver:
            return Response({'error': 'Driver profile not found'}, status=403)

        matatu = driver.matatus.filter(is_active=True).first()
        if not matatu:
            return Response({'error': 'No matatu assigned'}, status=404)

        today = timezone.now().date()

        # Today's trips
        trips = Trip.objects.filter(matatu=matatu, departure_date=today)
        # Today's stage runs
        stage_runs = StageRun.objects.filter(matatu=matatu, run_date=today)

        # Today's bookings
        bookings_q = Booking.objects.filter(
            status__in=['confirmed', 'pending']
        ).filter(
            models_Q(trip__matatu=matatu) | models_Q(stage_run__matatu=matatu)
        )
        # revenue today
        confirmed_today = Booking.objects.filter(
            status='confirmed', created_at__date=today
        ).filter(
            trip__matatu=matatu
        )
        revenue = confirmed_today.aggregate(t=Sum('total_amount'))['t'] or 0

        return Response({
            'driver': DriverSerializer(driver).data,
            'matatu': {
                'id': matatu.id, 'name': matatu.name,
                'plate': matatu.plate_number, 'slug': matatu.slug,
                'service_type': matatu.service_type,
                'total_seats': matatu.total_seats,
            },
            'today_trips': AdminTripSerializer(trips, many=True).data,
            'today_stage_runs': AdminStageRunSerializer(stage_runs, many=True).data,
            'revenue_today': revenue,
        })


class DriverTripManifestView(DriverAuthMixin, APIView):
    """GET /api/v1/driver/trips/<trip_slug>/manifest/"""

    def get(self, request, trip_slug):
        driver = self.get_driver(request)
        if not driver:
            return Response({'error': 'Unauthorized'}, status=403)

        try:
            trip = Trip.objects.get(slug=trip_slug, matatu__assigned_driver=driver)
        except Trip.DoesNotExist:
            return Response({'error': 'Trip not found or not your trip'}, status=404)

        bookings = trip.bookings.filter(
            status__in=['confirmed', 'pending']
        ).prefetch_related('booked_seats__seat')

        return Response({
            'trip': TripListSerializer(trip).data,
            'passengers': DriverBookingManifestSerializer(bookings, many=True).data,
            'total': bookings.count(),
        })


class DriverStageRunManifestView(DriverAuthMixin, APIView):
    """GET /api/v1/driver/stage-runs/<slug>/manifest/"""

    def get(self, request, stage_run_slug):
        driver = self.get_driver(request)
        if not driver:
            return Response({'error': 'Unauthorized'}, status=403)

        try:
            run = StageRun.objects.get(slug=stage_run_slug, matatu__assigned_driver=driver)
        except StageRun.DoesNotExist:
            return Response({'error': 'Run not found or not your matatu'}, status=404)

        bookings = run.bookings.filter(
            status__in=['confirmed', 'pending']
        ).prefetch_related('booked_seats__seat')

        return Response({
            'stage_run': StageRunListSerializer(run).data,
            'passengers': DriverBookingManifestSerializer(bookings, many=True).data,
            'total': bookings.count(),
        })


class DriverCreateBookingView(DriverAuthMixin, APIView):
    """
    POST /api/v1/driver/bookings/
    Driver creates a booking on behalf of a passenger boarding at the stage.
    """

    def post(self, request):
        driver = self.get_driver(request)
        if not driver:
            return Response({'error': 'Unauthorized'}, status=403)

        data = request.data.copy()
        serializer = BookingCreateSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        booking = serializer.save(created_by_driver=True)
        # Driver-created bookings are immediately confirmed
        booking.status = 'confirmed'
        booking.save(update_fields=['status'])

        return Response(BookingDetailSerializer(booking).data, status=201)


class DriverStageRunCreateView(DriverAuthMixin, APIView):
    """
    POST /api/v1/driver/stage-runs/
    Driver creates a new stage run when they set off.
    """

    def post(self, request):
        driver = self.get_driver(request)
        if not driver:
            return Response({'error': 'Unauthorized'}, status=403)

        matatu = driver.matatus.filter(is_active=True).first()
        if not matatu:
            return Response({'error': 'No matatu assigned'}, status=404)

        if matatu.service_type != 'stage':
            return Response({'error': 'This matatu is not a stage matatu'}, status=400)

        route_id = request.data.get('route_id')
        fare = request.data.get('fare', 0)
        origin_stage_id = request.data.get('origin_stage_id')
        destination_stage_id = request.data.get('destination_stage_id')

        today = timezone.now().date()
        run_number = StageRun.objects.filter(matatu=matatu, run_date=today).count() + 1

        try:
            route = Route.objects.get(id=route_id)
        except Route.DoesNotExist:
            return Response({'error': 'Route not found'}, status=404)

        run = StageRun.objects.create(
            matatu=matatu, route=route,
            run_date=today, run_number=run_number,
            fare=fare,
            origin_stage_id=origin_stage_id,
            destination_stage_id=destination_stage_id,
            status='loading',
        )
        return Response(AdminStageRunSerializer(run).data, status=201)


# ─────────────────────────────────────────────────────────────────────────────
# OWNER PORTAL VIEWS
# ─────────────────────────────────────────────────────────────────────────────

class OwnerAuthMixin:
    authentication_classes = [JWTAuthentication, SessionAuthentication]

    def get_owner(self, request):
        try:
            return request.user.owner_profile
        except Exception:
            return None


class OwnerDashboardView(OwnerAuthMixin, APIView):
    """GET /api/v1/owner/dashboard/"""

    def get(self, request):
        owner = self.get_owner(request)
        if not owner:
            return Response({'error': 'Owner profile not found'}, status=403)

        matatus = owner.matatus.filter(is_active=True)
        total_revenue = DailyEarnings.objects.filter(
            matatu__in=matatus
        ).aggregate(t=Sum('gross_revenue'))['t'] or 0

        today = timezone.now().date()
        month_start = today.replace(day=1)
        month_revenue = DailyEarnings.objects.filter(
            matatu__in=matatus, date__gte=month_start
        ).aggregate(t=Sum('gross_revenue'))['t'] or 0

        return Response({
            'owner': OwnerSerializer(owner).data,
            'matatus': OwnerMatutuSummarySerializer(matatus, many=True).data,
            'total_revenue_all_time': total_revenue,
            'revenue_this_month': month_revenue,
            'total_matatus': matatus.count(),
        })


class OwnerMatutuEarningsView(OwnerAuthMixin, APIView):
    """GET /api/v1/owner/matatus/<slug>/earnings/?days=30"""

    def get(self, request, slug):
        owner = self.get_owner(request)
        if not owner:
            return Response({'error': 'Unauthorized'}, status=403)

        try:
            matatu = owner.matatus.get(slug=slug)
        except Matatu.DoesNotExist:
            return Response({'error': 'Matatu not found or not yours'}, status=404)

        days = int(request.query_params.get('days', 30))
        since = timezone.now().date() - timedelta(days=days)
        earnings = matatu.daily_earnings.filter(date__gte=since).order_by('-date')

        return Response({
            'matatu': {'name': matatu.name, 'plate': matatu.plate_number},
            'earnings': DailyEarningsSerializer(earnings, many=True).data,
            'total': earnings.aggregate(t=Sum('gross_revenue'))['t'] or 0,
        })


# needed for Q import in DriverDashboardView
from django.db.models import Q as models_Q