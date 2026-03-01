"""
serializers.py – Public & shared serializers for MTN Matatu Booking
"""
from rest_framework import serializers
from django.contrib.auth.models import User

from .models import (
    Sacco, MatutuOwner, Driver, Town, Stage, Route, RouteStop,
    MatutuType, Matatu, SeatLayout, Trip, StageRun,
    Booking, BookedSeat, Payment, DailyEarnings
)


# ── Basic / Lookup ────────────────────────────────────────────────────────────

class TownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Town
        fields = ['id', 'name', 'slug', 'is_active']
        read_only_fields = ['slug']


class StageSerializer(serializers.ModelSerializer):
    town_name = serializers.CharField(source='town.name', read_only=True)

    class Meta:
        model = Stage
        fields = ['id', 'town', 'town_name', 'name', 'slug', 'address', 'is_active']
        read_only_fields = ['slug']


class RouteStopSerializer(serializers.ModelSerializer):
    stage_name = serializers.CharField(source='stage.name', read_only=True)
    town_name = serializers.CharField(source='stage.town.name', read_only=True)

    class Meta:
        model = RouteStop
        fields = ['id', 'order', 'stage', 'stage_name', 'town_name', 'distance_from_origin_km']


class RouteSerializer(serializers.ModelSerializer):
    origin_name = serializers.CharField(source='origin.name', read_only=True)
    destination_name = serializers.CharField(source='destination.name', read_only=True)
    stops = RouteStopSerializer(many=True, read_only=True)

    class Meta:
        model = Route
        fields = ['id', 'name', 'slug', 'origin', 'origin_name',
                  'destination', 'destination_name', 'distance_km', 'stops', 'is_active']
        read_only_fields = ['slug']


class MatutuTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatutuType
        fields = ['id', 'name', 'slug', 'description', 'default_capacity']
        read_only_fields = ['slug']


# ── Seat Layout ───────────────────────────────────────────────────────────────

class SeatLayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeatLayout
        fields = [
            'id', 'seat_number', 'seat_class',
            'row_number', 'column_number', 'row_span', 'col_span',
            'is_aisle_gap', 'is_driver_seat', 'is_conductor_seat', 'is_active',
            'bg_color', 'text_color', 'custom_label', 'extra_padding'
        ]


# ── Matatu ────────────────────────────────────────────────────────────────────

class MatutuListSerializer(serializers.ModelSerializer):
    matatu_type_name = serializers.CharField(source='matatu_type.name', read_only=True)
    route_name = serializers.CharField(source='route.name', read_only=True)
    driver_name = serializers.SerializerMethodField()

    class Meta:
        model = Matatu
        fields = ['id', 'name', 'slug', 'plate_number', 'matatu_type_name',
                  'route_name', 'service_type', 'total_seats', 'amenities',
                  'driver_name', 'is_active']

    def get_driver_name(self, obj):
        if obj.assigned_driver:
            return obj.assigned_driver.user.get_full_name()
        return None


class MatutuDetailSerializer(serializers.ModelSerializer):
    matatu_type = MatutuTypeSerializer(read_only=True)
    route = RouteSerializer(read_only=True)
    seats = SeatLayoutSerializer(many=True, read_only=True)
    driver_name = serializers.SerializerMethodField()

    class Meta:
        model = Matatu
        fields = [
            'id', 'name', 'slug', 'plate_number', 'matatu_type', 'route',
            'service_type', 'total_seats', 'amenities', 'seats',
            'driver_name', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['slug', 'created_at', 'updated_at']

    def get_driver_name(self, obj):
        if obj.assigned_driver:
            return obj.assigned_driver.user.get_full_name()
        return None


# ── Trip ──────────────────────────────────────────────────────────────────────

class TripListSerializer(serializers.ModelSerializer):
    origin = serializers.CharField(source='route.origin.name', read_only=True)
    destination = serializers.CharField(source='route.destination.name', read_only=True)
    matatu_name = serializers.CharField(source='matatu.name', read_only=True)
    plate_number = serializers.CharField(source='matatu.plate_number', read_only=True)
    matatu_type = serializers.CharField(source='matatu.matatu_type.name', read_only=True)
    amenities = serializers.JSONField(source='matatu.amenities', read_only=True)
    service_type = serializers.CharField(source='matatu.service_type', read_only=True)
    available_seats = serializers.SerializerMethodField()
    origin_stage_name = serializers.CharField(source='origin_stage.name', read_only=True)
    destination_stage_name = serializers.CharField(source='destination_stage.name', read_only=True)

    class Meta:
        model = Trip
        fields = [
            'id', 'slug', 'origin', 'destination',
            'origin_stage_name', 'destination_stage_name',
            'departure_date', 'departure_time', 'arrival_time', 'duration_minutes',
            'matatu_name', 'plate_number', 'matatu_type', 'amenities',
            'service_type', 'fare', 'available_seats', 'status'
        ]

    def get_available_seats(self, obj):
        total = obj.matatu.seats.filter(
            is_active=True, is_aisle_gap=False,
            is_driver_seat=False, is_conductor_seat=False
        ).count()
        booked = BookedSeat.objects.filter(
            booking__trip=obj,
            booking__status__in=['pending', 'confirmed']
        ).count()
        return total - booked


class TripDetailSerializer(TripListSerializer):
    seat_layout = serializers.SerializerMethodField()
    booked_seat_numbers = serializers.SerializerMethodField()
    route_stops = RouteStopSerializer(source='route.stops', many=True, read_only=True)

    class Meta(TripListSerializer.Meta):
        fields = TripListSerializer.Meta.fields + [
            'seat_layout', 'booked_seat_numbers', 'route_stops'
        ]

    def get_seat_layout(self, obj):
        return SeatLayoutSerializer(obj.matatu.seats.all(), many=True).data

    def get_booked_seat_numbers(self, obj):
        session_key = self.context.get('session_key', '')
        from .models import SeatLock
        booked = list(BookedSeat.objects.filter(
            booking__trip=obj,
            booking__status__in=['pending', 'confirmed']
        ).values_list('seat__seat_number', flat=True))
        locked_others = list(SeatLock.objects.filter(
            trip=obj
        ).exclude(session_key=session_key).values_list('seat__seat_number', flat=True))
        return {'booked': booked, 'locked': locked_others}


# ── Stage Run ─────────────────────────────────────────────────────────────────

class StageRunListSerializer(serializers.ModelSerializer):
    origin = serializers.CharField(source='route.origin.name', read_only=True)
    destination = serializers.CharField(source='route.destination.name', read_only=True)
    matatu_name = serializers.CharField(source='matatu.name', read_only=True)
    plate_number = serializers.CharField(source='matatu.plate_number', read_only=True)
    available_seats = serializers.SerializerMethodField()
    origin_stage_name = serializers.CharField(source='origin_stage.name', read_only=True)
    destination_stage_name = serializers.CharField(source='destination_stage.name', read_only=True)

    class Meta:
        model = StageRun
        fields = [
            'id', 'slug', 'origin', 'destination',
            'origin_stage_name', 'destination_stage_name',
            'run_date', 'run_number', 'fare',
            'matatu_name', 'plate_number',
            'available_seats', 'status'
        ]

    def get_available_seats(self, obj):
        total = obj.matatu.seats.filter(
            is_active=True, is_aisle_gap=False,
            is_driver_seat=False, is_conductor_seat=False
        ).count()
        booked = BookedSeat.objects.filter(
            booking__stage_run=obj,
            booking__status__in=['pending', 'confirmed']
        ).count()
        return total - booked


class StageRunDetailSerializer(StageRunListSerializer):
    seat_layout = serializers.SerializerMethodField()
    booked_seat_numbers = serializers.SerializerMethodField()

    class Meta(StageRunListSerializer.Meta):
        fields = StageRunListSerializer.Meta.fields + [
            'seat_layout', 'booked_seat_numbers'
        ]

    def get_seat_layout(self, obj):
        return SeatLayoutSerializer(obj.matatu.seats.all(), many=True).data

    def get_booked_seat_numbers(self, obj):
        return list(BookedSeat.objects.filter(
            booking__stage_run=obj,
            booking__status__in=['pending', 'confirmed']
        ).values_list('seat__seat_number', flat=True))


# ── Booking ───────────────────────────────────────────────────────────────────

class BookedSeatSerializer(serializers.ModelSerializer):
    seat_number = serializers.CharField(source='seat.seat_number', read_only=True)
    seat_class = serializers.CharField(source='seat.seat_class', read_only=True)

    class Meta:
        model = BookedSeat
        fields = ['id', 'seat_number', 'seat_class', 'price']


"""
FIX: In booking_app/serializers.py

Replace the BookingCreateSerializer class with this version.

Problem: Frontend sends boarding_stage_slug=1 and alighting_stage_slug=5
         (integer PKs), but SlugRelatedField tries to look up by slug string
         → "Object with slug=1 does not exist."

Fix: Replace boarding_stage_slug / alighting_stage_slug SlugRelatedFields
     with PrimaryKeyRelatedField so they accept integer IDs.
     Also rename the incoming field keys to boarding_stage_id / alighting_stage_id
     to be honest about what they actually are, while keeping source= pointing
     to the correct model field.

     If you prefer to keep the old field names on the frontend, just change
     the field class from SlugRelatedField → PrimaryKeyRelatedField and keep
     the same key names — that works too (see Option B comment below).
"""

from rest_framework import serializers
from .models import Stage, Trip, StageRun, SeatLayout, Booking, BookedSeat


class BookingCreateSerializer(serializers.ModelSerializer):
    """
    Create a booking for either a Trip (express) or StageRun (stage).
    Provide either trip_slug OR stage_run_slug, not both.

    Boarding / alighting stages are identified by integer PK.
    """

    seat_numbers = serializers.ListField(
        child=serializers.CharField(), write_only=True
    )

    # ── trip / stage-run lookup (still by slug — these are correct) ────────
    trip_slug = serializers.SlugRelatedField(
        slug_field='slug',
        queryset=Trip.objects.all(),
        source='trip',
        write_only=True,
        required=False,
        allow_null=True,
    )
    stage_run_slug = serializers.SlugRelatedField(
        slug_field='slug',
        queryset=StageRun.objects.all(),
        source='stage_run',
        write_only=True,
        required=False,
        allow_null=True,
    )

    # ── FIXED: accept integer PKs for boarding / alighting stages ──────────
    #
    # Option A (recommended): rename keys to *_id to be explicit.
    #   Frontend sends: boarding_stage_id=1, alighting_stage_id=5
    #
    boarding_stage_id = serializers.PrimaryKeyRelatedField(
        queryset=Stage.objects.all(),
        source='boarding_stage',
        write_only=True,
        required=False,
        allow_null=True,
    )
    alighting_stage_id = serializers.PrimaryKeyRelatedField(
        queryset=Stage.objects.all(),
        source='alighting_stage',
        write_only=True,
        required=False,
        allow_null=True,
    )

    #
    # Option B: keep old key names (*_slug) but accept IDs.
    #   Frontend keeps sending: boarding_stage_slug=1, alighting_stage_slug=5
    #   Just uncomment these and remove the Option A fields above.
    #
    # boarding_stage_slug = serializers.PrimaryKeyRelatedField(
    #     queryset=Stage.objects.all(),
    #     source='boarding_stage',
    #     write_only=True,
    #     required=False,
    #     allow_null=True,
    # )
    # alighting_stage_slug = serializers.PrimaryKeyRelatedField(
    #     queryset=Stage.objects.all(),
    #     source='alighting_stage',
    #     write_only=True,
    #     required=False,
    #     allow_null=True,
    # )

    class Meta:
        model = Booking
        fields = [
            'trip_slug', 'stage_run_slug', 'seat_numbers',
            'boarding_stage_id', 'alighting_stage_id',   # ← Option A
            # 'boarding_stage_slug', 'alighting_stage_slug',  # ← Option B
            'passenger_name', 'passenger_phone',
            'passenger_email', 'passenger_id_number',
        ]

    def validate(self, attrs):
        trip = attrs.get('trip')
        stage_run = attrs.get('stage_run')

        if not trip and not stage_run:
            raise serializers.ValidationError(
                "Provide either trip_slug or stage_run_slug."
            )
        if trip and stage_run:
            raise serializers.ValidationError(
                "Provide only one of trip_slug or stage_run_slug."
            )

        seat_numbers = attrs.get('seat_numbers', [])
        if not seat_numbers:
            raise serializers.ValidationError("Select at least one seat.")

        matatu = trip.matatu if trip else stage_run.matatu

        seats = SeatLayout.objects.filter(
            matatu=matatu,
            seat_number__in=seat_numbers,
            is_active=True,
            is_aisle_gap=False,
            is_driver_seat=False,
            is_conductor_seat=False,
        )
        if seats.count() != len(seat_numbers):
            raise serializers.ValidationError(
                "One or more seat numbers are invalid."
            )

        # Check already booked
        filter_kwargs = (
            {'booking__trip': trip} if trip else {'booking__stage_run': stage_run}
        )
        already_booked = BookedSeat.objects.filter(
            seat__in=seats,
            booking__status__in=['pending', 'confirmed'],
            **filter_kwargs,
        )
        if already_booked.exists():
            nums = list(
                already_booked.values_list('seat__seat_number', flat=True)
            )
            raise serializers.ValidationError(
                f"Seats already taken: {', '.join(nums)}"
            )

        attrs['seats'] = seats
        return attrs

    def create(self, validated_data):
        validated_data.pop('seat_numbers', None)
        seats = validated_data.pop('seats')
        trip = validated_data.get('trip')
        stage_run = validated_data.get('stage_run')

        fare = trip.fare if trip else stage_run.fare
        total = fare * len(seats)
        validated_data['total_amount'] = total

        booking = Booking.objects.create(**validated_data)
        for seat in seats:
            BookedSeat.objects.create(booking=booking, seat=seat, price=fare)

        return booking
    
class BookingDetailSerializer(serializers.ModelSerializer):
    booked_seats = BookedSeatSerializer(many=True, read_only=True)
    boarding_stage = StageSerializer(read_only=True)
    alighting_stage = StageSerializer(read_only=True)
    trip_info = TripListSerializer(source='trip', read_only=True)
    stage_run_info = StageRunListSerializer(source='stage_run', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'reference', 'slug', 'trip_info', 'stage_run_info',
            'booked_seats', 'boarding_stage', 'alighting_stage',
            'passenger_name', 'passenger_phone', 'passenger_email',
            'passenger_id_number', 'total_amount', 'status', 'ticket_sent',
            'created_by_driver', 'created_at'
        ]


# ── Payment ───────────────────────────────────────────────────────────────────

class PaymentInitSerializer(serializers.Serializer):
    booking_reference = serializers.CharField()
    phone_number = serializers.CharField()


class PaymentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['status', 'mpesa_receipt_number', 'result_desc', 'updated_at']


# ── Search (combined trips + stage runs) ──────────────────────────────────────

class SearchResultSerializer(serializers.Serializer):
    """Combined result of trips and stage runs"""
    type = serializers.CharField()        # "trip" or "stage_run"
    data = serializers.DictField()


# ─────────────────────────────────────────────────────────────────────────────
# admin_serializers.py  –  Admin/Owner/Driver dashboard serializers
# ─────────────────────────────────────────────────────────────────────────────

from django.contrib.auth.models import User
from django.db.models import Count, Sum
from django.utils import timezone
from datetime import timedelta


class AdminLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'is_staff', 'is_superuser', 'is_active', 'date_joined', 'last_login']
        read_only_fields = ['date_joined', 'last_login']


class AdminUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name',
                  'is_staff', 'is_superuser', 'password', 'confirm_password']

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('confirm_password'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ── Driver Profile Serializers ────────────────────────────────────────────────

class DriverSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    assigned_matatu = serializers.SerializerMethodField()

    class Meta:
        model = Driver
        fields = ['id', 'full_name', 'username', 'email', 'phone',
                  'license_number', 'id_number', 'status', 'assigned_matatu', 'created_at']
        read_only_fields = ['created_at']

    def get_assigned_matatu(self, obj):
        matatu = obj.matatus.filter(is_active=True).first()
        if matatu:
            return {'id': matatu.id, 'name': matatu.name, 'plate': matatu.plate_number,
                    'slug': matatu.slug}
        return None


class DriverCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    phone = serializers.CharField()
    license_number = serializers.CharField()
    id_number = serializers.CharField()

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
        )
        from .models import Sacco
        sacco = Sacco.objects.first()
        driver = Driver.objects.create(
            user=user, sacco=sacco,
            phone=validated_data['phone'],
            license_number=validated_data['license_number'],
            id_number=validated_data['id_number'],
        )
        return driver


# ── Owner Serializers ─────────────────────────────────────────────────────────

class OwnerSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    matatu_count = serializers.SerializerMethodField()

    class Meta:
        model = MatutuOwner
        fields = ['id', 'full_name', 'username', 'phone', 'id_number',
                  'matatu_count', 'is_active', 'created_at']
        read_only_fields = ['created_at']

    def get_matatu_count(self, obj):
        return obj.matatus.count()


# ── Matatu Admin Serializers ──────────────────────────────────────────────────

"""
FIX: booking_app/serializers.py
Replace the AdminMatutuSerializer class with this version.

The bug: AdminMatutuSerializer had no `sacco` / `sacco_id` field, so when
AdminMatutuViewSet.create() called serializer.save() the Matatu was built
without a sacco → NOT NULL constraint on booking_app_matatu.sacco_id.

Fix: add a write-only `sacco_id` field (optional – defaults to the single
Sacco in the system), and inject it in create() if absent.
"""

from rest_framework import serializers
from .models import (
    Sacco, MatutuOwner, Driver, Town, Stage, Route,
    MatutuType, Matatu, SeatLayout, BookedSeat, Payment, DailyEarnings,
)
from .serializers import SeatLayoutSerializer, RouteStopSerializer


class AdminMatutuSerializer(serializers.ModelSerializer):
    matatu_type_name = serializers.CharField(source='matatu_type.name', read_only=True)
    matatu_type_id = serializers.PrimaryKeyRelatedField(
        queryset=MatutuType.objects.all(), source='matatu_type',
        write_only=True, required=False
    )
    route_name = serializers.CharField(source='route.name', read_only=True)
    route_id = serializers.PrimaryKeyRelatedField(
        queryset=Route.objects.all(), source='route',
        write_only=True, required=False
    )
    owner_name = serializers.SerializerMethodField()
    owner_id = serializers.PrimaryKeyRelatedField(
        queryset=MatutuOwner.objects.all(), source='owner',
        write_only=True, required=False
    )
    driver_name = serializers.SerializerMethodField()
    driver_id = serializers.PrimaryKeyRelatedField(
        queryset=Driver.objects.all(), source='assigned_driver',
        write_only=True, required=False
    )

    # ── NEW: expose sacco so the row can be saved ──────────────────────────
    sacco_id = serializers.PrimaryKeyRelatedField(
        queryset=Sacco.objects.all(), source='sacco',
        write_only=True, required=False,       # optional: auto-filled below
        help_text="Defaults to the first/only Sacco if omitted."
    )

    seats = SeatLayoutSerializer(many=True, read_only=True)
    trip_count = serializers.SerializerMethodField()
    seat_count = serializers.SerializerMethodField()

    class Meta:
        model = Matatu
        fields = [
            'id', 'name', 'slug', 'plate_number', 'service_type',
            'matatu_type', 'matatu_type_name', 'matatu_type_id',
            'route', 'route_name', 'route_id',
            'owner', 'owner_name', 'owner_id',
            'assigned_driver', 'driver_name', 'driver_id',
            # ── sacco ──
            'sacco', 'sacco_id',
            # ─────────
            'total_seats', 'is_active', 'amenities', 'seats',
            'trip_count', 'seat_count', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'slug', 'matatu_type', 'route', 'owner',
            'assigned_driver', 'sacco',          # read-only display copies
            'created_at', 'updated_at',
        ]

    # ── helpers ───────────────────────────────────────────────────────────

    def get_owner_name(self, obj):
        return obj.owner.user.get_full_name() if obj.owner else None

    def get_driver_name(self, obj):
        return obj.assigned_driver.user.get_full_name() if obj.assigned_driver else None

    def get_trip_count(self, obj):
        return obj.trips.count()

    def get_seat_count(self, obj):
        return obj.seats.filter(
            is_aisle_gap=False,
            is_driver_seat=False,
            is_conductor_seat=False,
        ).count()

    # ── auto-inject sacco on create ───────────────────────────────────────

    def _resolve_sacco(self, validated_data):
        """
        If the caller didn't pass sacco_id, fall back to the single Sacco
        that MTN Sacco always has.  Raises ValidationError if none exists.
        """
        if 'sacco' not in validated_data or validated_data.get('sacco') is None:
            sacco = Sacco.objects.filter(is_active=True).first()
            if sacco is None:
                raise serializers.ValidationError(
                    {'sacco_id': 'No active Sacco found. Create one first.'}
                )
            validated_data['sacco'] = sacco
        return validated_data

    def create(self, validated_data):
        validated_data = self._resolve_sacco(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # sacco is normally immutable after creation, but allow it to be
        # corrected via update if somehow missing.
        validated_data = self._resolve_sacco(validated_data)
        return super().update(instance, validated_data)


# ── Trip Admin Serializers ────────────────────────────────────────────────────

class AdminTripSerializer(serializers.ModelSerializer):
    matatu_name = serializers.CharField(source='matatu.name', read_only=True)
    plate_number = serializers.CharField(source='matatu.plate_number', read_only=True)
    origin = serializers.CharField(source='route.origin.name', read_only=True)
    destination = serializers.CharField(source='route.destination.name', read_only=True)
    booking_count = serializers.SerializerMethodField()
    available_seats = serializers.SerializerMethodField()
    revenue = serializers.SerializerMethodField()
    matatu_id = serializers.PrimaryKeyRelatedField(
        queryset=Matatu.objects.all(), source='matatu', write_only=True
    )
    route_id = serializers.PrimaryKeyRelatedField(
        queryset=Route.objects.all(), source='route', write_only=True
    )
    origin_stage_id = serializers.PrimaryKeyRelatedField(
        queryset=Stage.objects.all(), source='origin_stage', write_only=True, required=False
    )
    destination_stage_id = serializers.PrimaryKeyRelatedField(
        queryset=Stage.objects.all(), source='destination_stage', write_only=True, required=False
    )

    class Meta:
        model = Trip
        fields = [
            'id', 'slug', 'matatu', 'matatu_id', 'matatu_name', 'plate_number',
            'route', 'route_id', 'origin', 'destination',
            'origin_stage', 'origin_stage_id', 'destination_stage', 'destination_stage_id',
            'departure_date', 'departure_time', 'arrival_time', 'duration_minutes',
            'fare', 'status', 'is_active',
            'booking_count', 'available_seats', 'revenue',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['slug', 'matatu', 'route', 'origin_stage',
                            'destination_stage', 'created_at', 'updated_at']

    def get_booking_count(self, obj):
        return obj.bookings.filter(status__in=['pending', 'confirmed']).count()

    def get_available_seats(self, obj):
        total = obj.matatu.seats.filter(
            is_active=True, is_aisle_gap=False,
            is_driver_seat=False, is_conductor_seat=False
        ).count()
        booked = BookedSeat.objects.filter(
            booking__trip=obj, booking__status__in=['pending', 'confirmed']
        ).count()
        return total - booked

    def get_revenue(self, obj):
        from django.db.models import Sum
        result = obj.bookings.filter(status='confirmed').aggregate(t=Sum('total_amount'))
        return result['t'] or 0


# ── Stage Run Admin Serializers ───────────────────────────────────────────────

class AdminStageRunSerializer(serializers.ModelSerializer):
    matatu_name = serializers.CharField(source='matatu.name', read_only=True)
    plate_number = serializers.CharField(source='matatu.plate_number', read_only=True)
    origin = serializers.CharField(source='route.origin.name', read_only=True)
    destination = serializers.CharField(source='route.destination.name', read_only=True)
    passenger_count = serializers.SerializerMethodField()
    revenue = serializers.SerializerMethodField()
    matatu_id = serializers.PrimaryKeyRelatedField(
        queryset=Matatu.objects.all(), source='matatu', write_only=True
    )
    route_id = serializers.PrimaryKeyRelatedField(
        queryset=Route.objects.all(), source='route', write_only=True
    )

    class Meta:
        model = StageRun
        fields = [
            'id', 'slug', 'matatu', 'matatu_id', 'matatu_name', 'plate_number',
            'route', 'route_id', 'origin', 'destination',
            'run_date', 'run_number', 'fare', 'status',
            'origin_stage', 'destination_stage',
            'departed_at', 'arrived_at',
            'passenger_count', 'revenue', 'created_at'
        ]
        read_only_fields = ['slug', 'matatu', 'route', 'created_at']

    def get_passenger_count(self, obj):
        return obj.bookings.filter(status__in=['confirmed', 'pending']).count()

    def get_revenue(self, obj):
        from django.db.models import Sum
        result = obj.bookings.filter(status='confirmed').aggregate(t=Sum('total_amount'))
        return result['t'] or 0


# ── Admin Booking ─────────────────────────────────────────────────────────────

class AdminBookingSerializer(serializers.ModelSerializer):
    seat_numbers = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    payment_receipt = serializers.SerializerMethodField()
    matatu_plate = serializers.SerializerMethodField()
    route_display = serializers.SerializerMethodField()
    departure_date = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'reference', 'slug', 'passenger_name', 'passenger_phone',
            'passenger_email', 'passenger_id_number',
            'route_display', 'matatu_plate', 'departure_date',
            'seat_numbers', 'total_amount', 'status',
            'payment_status', 'payment_receipt',
            'created_by_driver', 'ticket_sent', 'created_at'
        ]

    def get_seat_numbers(self, obj):
        return list(obj.booked_seats.values_list('seat__seat_number', flat=True))

    def get_payment_status(self, obj):
        try:
            return obj.payment.status
        except Payment.DoesNotExist:
            return 'not_initiated'

    def get_payment_receipt(self, obj):
        try:
            return obj.payment.mpesa_receipt_number
        except Payment.DoesNotExist:
            return None

    def get_matatu_plate(self, obj):
        m = obj.matatu
        return m.plate_number if m else None

    def get_route_display(self, obj):
        r = obj.route
        return str(r) if r else None

    def get_departure_date(self, obj):
        if obj.trip:
            return obj.trip.departure_date
        if obj.stage_run:
            return obj.stage_run.run_date
        return None


# ── Dashboard Stats ───────────────────────────────────────────────────────────

class DashboardStatsSerializer(serializers.Serializer):
    total_bookings = serializers.IntegerField()
    confirmed_bookings = serializers.IntegerField()
    pending_bookings = serializers.IntegerField()
    cancelled_bookings = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    revenue_today = serializers.DecimalField(max_digits=12, decimal_places=2)
    revenue_this_week = serializers.DecimalField(max_digits=12, decimal_places=2)
    revenue_this_month = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_matatus = serializers.IntegerField()
    active_matatus = serializers.IntegerField()
    total_drivers = serializers.IntegerField()
    total_passengers = serializers.IntegerField()


# ── Owner Dashboard ───────────────────────────────────────────────────────────

class DailyEarningsSerializer(serializers.ModelSerializer):
    matatu_plate = serializers.CharField(source='matatu.plate_number', read_only=True)
    matatu_name = serializers.CharField(source='matatu.name', read_only=True)
    driver_name = serializers.SerializerMethodField()

    class Meta:
        model = DailyEarnings
        fields = ['id', 'matatu_plate', 'matatu_name', 'driver_name',
                  'date', 'total_passengers', 'total_trips', 'gross_revenue']

    def get_driver_name(self, obj):
        return obj.driver.user.get_full_name() if obj.driver else None


class OwnerMatutuSummarySerializer(serializers.ModelSerializer):
    """Used in owner dashboard to see each matatu's performance"""
    total_earnings_all_time = serializers.SerializerMethodField()
    earnings_this_month = serializers.SerializerMethodField()
    driver_name = serializers.SerializerMethodField()
    route_name = serializers.CharField(source='route.name', read_only=True)

    class Meta:
        model = Matatu
        fields = ['id', 'name', 'slug', 'plate_number', 'service_type',
                  'route_name', 'driver_name', 'is_active',
                  'total_earnings_all_time', 'earnings_this_month']

    def get_total_earnings_all_time(self, obj):
        from django.db.models import Sum
        result = obj.daily_earnings.aggregate(t=Sum('gross_revenue'))
        return result['t'] or 0

    def get_earnings_this_month(self, obj):
        from django.db.models import Sum
        from django.utils import timezone
        today = timezone.now().date()
        month_start = today.replace(day=1)
        result = obj.daily_earnings.filter(date__gte=month_start).aggregate(t=Sum('gross_revenue'))
        return result['t'] or 0

    def get_driver_name(self, obj):
        return obj.assigned_driver.user.get_full_name() if obj.assigned_driver else None


# ── Driver Dashboard ──────────────────────────────────────────────────────────

class DriverBookingManifestSerializer(serializers.ModelSerializer):
    """What a driver sees on his manifest"""
    seat_numbers = serializers.SerializerMethodField()
    boarding_stage_name = serializers.CharField(source='boarding_stage.name', read_only=True)
    alighting_stage_name = serializers.CharField(source='alighting_stage.name', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'reference', 'passenger_name', 'passenger_phone',
            'seat_numbers', 'boarding_stage_name', 'alighting_stage_name',
            'total_amount', 'status', 'created_by_driver', 'created_at'
        ]

    def get_seat_numbers(self, obj):
        return list(obj.booked_seats.values_list('seat__seat_number', flat=True))


# ── Seat Layout Bulk Update ───────────────────────────────────────────────────

class SeatLayoutBulkUpdateSerializer(serializers.Serializer):
    seats = serializers.ListField(child=serializers.DictField())


# ── Admin Route/Town/Stage Serializers ────────────────────────────────────────

class AdminTownSerializer(serializers.ModelSerializer):
    stage_count = serializers.SerializerMethodField()

    class Meta:
        model = Town
        fields = ['id', 'name', 'slug', 'is_active', 'stage_count']
        read_only_fields = ['slug']

    def get_stage_count(self, obj):
        return obj.stages.count()


class AdminStageSerializer(serializers.ModelSerializer):
    town_name = serializers.CharField(source='town.name', read_only=True)
    town_id = serializers.PrimaryKeyRelatedField(
        queryset=Town.objects.all(), source='town', write_only=True
    )

    class Meta:
        model = Stage
        fields = ['id', 'slug', 'town', 'town_name', 'town_id',
                  'name', 'address', 'is_active']
        read_only_fields = ['slug', 'town']


class AdminRouteSerializer(serializers.ModelSerializer):
    origin_name = serializers.CharField(source='origin.name', read_only=True)
    destination_name = serializers.CharField(source='destination.name', read_only=True)
    origin_id = serializers.PrimaryKeyRelatedField(
        queryset=Town.objects.all(), source='origin', write_only=True
    )
    destination_id = serializers.PrimaryKeyRelatedField(
        queryset=Town.objects.all(), source='destination', write_only=True
    )
    stops = RouteStopSerializer(many=True, read_only=True)
    matatu_count = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = ['id', 'name', 'slug', 'origin', 'origin_name', 'origin_id',
                  'destination', 'destination_name', 'destination_id',
                  'distance_km', 'is_active', 'stops', 'matatu_count']
        read_only_fields = ['slug', 'origin', 'destination']

    def get_matatu_count(self, obj):
        return obj.matatus.count()