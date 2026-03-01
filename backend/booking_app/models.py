from django.db import models
from django.utils.text import slugify
from django.utils import timezone
from django.contrib.auth.models import User
import uuid


# ── Sacco & Ownership ─────────────────────────────────────────────────────────

class Sacco(models.Model):
    """MTN Sacco - the overarching organization"""
    name = models.CharField(max_length=200, default="MTN Sacco")
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    registration_number = models.CharField(max_length=50, unique=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    contact_email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class MatutuOwner(models.Model):
    """Matatu owner (can own one or more matatus)"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='owner_profile')
    sacco = models.ForeignKey(Sacco, on_delete=models.CASCADE, related_name='owners')
    id_number = models.CharField(max_length=20, unique=True)
    phone = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.get_full_name()} (Owner)"


class Driver(models.Model):
    """Matatu driver registered under MTN Sacco"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('inactive', 'Inactive'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='driver_profile')
    sacco = models.ForeignKey(Sacco, on_delete=models.CASCADE, related_name='drivers')
    license_number = models.CharField(max_length=30, unique=True)
    phone = models.CharField(max_length=20)
    id_number = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.license_number}"


# ── Locations ─────────────────────────────────────────────────────────────────

class Town(models.Model):
    """Towns/stops in Murang'a County and beyond"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Stage(models.Model):
    """
    Matatu stage/terminus in a town.
    e.g. "Murang'a Town Stage", "Kenol Stage", "Thika Kenyatta Ave"
    """
    town = models.ForeignKey(Town, on_delete=models.CASCADE, related_name='stages')
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.town.name}-{self.name}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.town.name} – {self.name}"

    class Meta:
        unique_together = ('town', 'name')


# ── Route ─────────────────────────────────────────────────────────────────────

class Route(models.Model):
    """
    Named route e.g. Murang'a → Nairobi (Route 9)
    A route can have many stops/stages.
    """
    name = models.CharField(max_length=200, blank=True)  # e.g. "Route 9"
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    origin = models.ForeignKey(Town, on_delete=models.CASCADE, related_name='origin_routes')
    destination = models.ForeignKey(Town, on_delete=models.CASCADE, related_name='destination_routes')
    distance_km = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.origin.name}-to-{self.destination.name}")
        if not self.name:
            self.name = f"{self.origin.name} → {self.destination.name}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        unique_together = ('origin', 'destination')


class RouteStop(models.Model):
    """Ordered stops along a route"""
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')
    stage = models.ForeignKey(Stage, on_delete=models.CASCADE)
    order = models.PositiveIntegerField()  # 1=origin, last=destination
    distance_from_origin_km = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('route', 'stage')
        ordering = ['order']

    def __str__(self):
        return f"{self.route.name} – Stop {self.order}: {self.stage.name}"


# ── Matatu & Seat Layout ──────────────────────────────────────────────────────

class MatutuType(models.Model):
    """
    Matatu body/type, e.g. "14-seater Nissan", "33-seater Rosa", "Isuzu NQR"
    """
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    default_capacity = models.PositiveIntegerField(default=14)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Matatu(models.Model):
    """
    Individual matatu vehicle.
    SERVICE_TYPE determines booking mode:
      - 'stage'  : fills up at stage, no advance seat booking (driver can mark booked)
      - 'express': scheduled trips, passengers book specific seats in advance
    """
    SERVICE_TYPE_CHOICES = [
        ('stage', 'Stage (Fill & Go)'),
        ('express', 'Express (Scheduled Trips)'),
    ]

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=150, unique=True, blank=True)
    matatu_type = models.ForeignKey(MatutuType, on_delete=models.SET_NULL, null=True, related_name='matatus')
    plate_number = models.CharField(max_length=20, unique=True)
    sacco = models.ForeignKey(Sacco, on_delete=models.CASCADE, related_name='matatus')
    owner = models.ForeignKey(MatutuOwner, on_delete=models.SET_NULL, null=True, blank=True, related_name='matatus')
    assigned_driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True, related_name='matatus')
    route = models.ForeignKey(Route, on_delete=models.SET_NULL, null=True, blank=True, related_name='matatus')

    service_type = models.CharField(max_length=20, choices=SERVICE_TYPE_CHOICES, default='stage')
    total_seats = models.PositiveIntegerField(default=14)
    is_active = models.BooleanField(default=True)
    amenities = models.JSONField(default=list, blank=True)  # ["WiFi","AC","Music","USB"]

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.plate_number}-{self.name}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.plate_number})"


class SeatLayout(models.Model):
    """
    Individual seat in a matatu.
    Matatu seat arrangements differ from buses:
    - Smaller grids (typically 2+2, 3+2 or 2+1 configurations)
    - Often has a "conductor" flip seat near door
    - Driver seat always present
    - Some have "VIP" front passenger seat
    """
    SEAT_CLASS_CHOICES = [
        ('window', 'Window'),
        ('aisle', 'Aisle'),
        ('front', 'Front Passenger'),
        ('conductor', 'Conductor'),
    ]

    matatu = models.ForeignKey(Matatu, on_delete=models.CASCADE, related_name='seats')
    seat_number = models.CharField(max_length=10)   # e.g. "1","2","F1","C1"
    seat_class = models.CharField(max_length=20, choices=SEAT_CLASS_CHOICES, default='window')

    # Grid position for visual rendering
    row_number = models.PositiveIntegerField()
    column_number = models.PositiveIntegerField()
    row_span = models.PositiveIntegerField(default=1)
    col_span = models.PositiveIntegerField(default=1)

    is_aisle_gap = models.BooleanField(default=False)   # visual aisle space
    is_driver_seat = models.BooleanField(default=False)
    is_conductor_seat = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    # Styling
    bg_color = models.CharField(max_length=20, blank=True, default='')
    text_color = models.CharField(max_length=20, blank=True, default='')
    custom_label = models.CharField(max_length=20, blank=True, default='')
    extra_padding = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('matatu', 'seat_number')
        ordering = ['row_number', 'column_number']

    def __str__(self):
        return f"{self.matatu.name} – Seat {self.seat_number}"


# ── Trip (Express Only) ───────────────────────────────────────────────────────

class Trip(models.Model):
    """
    Scheduled trip for Express matatus.
    Stage matatus don't have pre-scheduled trips;
    instead a TodayRun is created per operating day.
    """
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('boarding', 'Boarding'),
        ('departed', 'Departed'),
        ('arrived', 'Arrived'),
        ('cancelled', 'Cancelled'),
    ]

    matatu = models.ForeignKey(Matatu, on_delete=models.CASCADE, related_name='trips')
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='trips')
    slug = models.SlugField(max_length=250, unique=True, blank=True)

    departure_date = models.DateField()
    departure_time = models.TimeField()
    arrival_time = models.TimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)

    origin_stage = models.ForeignKey(Stage, on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name='departing_trips')
    destination_stage = models.ForeignKey(Stage, on_delete=models.SET_NULL, null=True, blank=True,
                                           related_name='arriving_trips')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    fare = models.DecimalField(max_digits=8, decimal_places=2, default=0)  # base fare
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            uid = uuid.uuid4().hex[:8]
            self.slug = slugify(
                f"{self.matatu.plate_number}-{self.route.origin.name}-"
                f"{self.route.destination.name}-{self.departure_date}-{uid}"
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.matatu} | {self.route} | {self.departure_date} {self.departure_time}"

    class Meta:
        ordering = ['departure_date', 'departure_time']


# ── Stage Run (Stage Matatus) ─────────────────────────────────────────────────

class StageRun(models.Model):
    """
    Represents a single operating day/run for a stage matatu.
    When the matatu fills up and departs, a new run begins.
    Driver or system creates this each time the matatu sets off.
    """
    STATUS_CHOICES = [
        ('loading', 'Loading'),    # matatu at stage, filling up
        ('departed', 'Departed'),
        ('arrived', 'Arrived'),
        ('cancelled', 'Cancelled'),
    ]

    matatu = models.ForeignKey(Matatu, on_delete=models.CASCADE, related_name='stage_runs')
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stage_runs')
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    run_date = models.DateField(default=timezone.localdate)
    run_number = models.PositiveIntegerField(default=1)  # 1st run, 2nd run of the day

    origin_stage = models.ForeignKey(Stage, on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name='stage_runs')
    destination_stage = models.ForeignKey(Stage, on_delete=models.SET_NULL, null=True, blank=True,
                                           related_name='arriving_stage_runs')

    fare = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='loading')
    departed_at = models.DateTimeField(null=True, blank=True)
    arrived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            uid = uuid.uuid4().hex[:8]
            self.slug = slugify(
                f"run-{self.matatu.plate_number}-{self.run_date}-{uid}"
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.matatu} Run #{self.run_number} on {self.run_date}"

    class Meta:
        ordering = ['-run_date', '-run_number']


# ── Booking ───────────────────────────────────────────────────────────────────

class Booking(models.Model):
    """
    A passenger booking.
    Can be for either an Express Trip or a Stage Run.
    Exactly one of (trip, stage_run) must be set.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Payment'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]

    reference = models.CharField(max_length=20, unique=True, editable=False)
    slug = models.SlugField(max_length=50, unique=True, blank=True, editable=False)

    # One of these two must be set
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='bookings',
                              null=True, blank=True)
    stage_run = models.ForeignKey(StageRun, on_delete=models.CASCADE, related_name='bookings',
                                   null=True, blank=True)

    boarding_stage = models.ForeignKey(Stage, on_delete=models.SET_NULL, null=True,
                                        related_name='boarding_bookings')
    alighting_stage = models.ForeignKey(Stage, on_delete=models.SET_NULL, null=True,
                                         related_name='alighting_bookings')

    # Passenger details
    passenger_name = models.CharField(max_length=200)
    passenger_phone = models.CharField(max_length=20)
    passenger_email = models.EmailField(blank=True)
    passenger_id_number = models.CharField(max_length=50, blank=True)

    total_amount = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    ticket_sent = models.BooleanField(default=False)

    # Driver-created booking flag
    created_by_driver = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"MTN{uuid.uuid4().hex[:8].upper()}"
        if not self.slug:
            self.slug = self.reference.lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Booking {self.reference} – {self.passenger_name}"

    class Meta:
        ordering = ['-created_at']

    @property
    def matatu(self):
        if self.trip:
            return self.trip.matatu
        if self.stage_run:
            return self.stage_run.matatu
        return None

    @property
    def route(self):
        if self.trip:
            return self.trip.route
        if self.stage_run:
            return self.stage_run.route
        return None


class BookedSeat(models.Model):
    """Seat(s) held by a booking"""
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='booked_seats')
    seat = models.ForeignKey(SeatLayout, on_delete=models.CASCADE, related_name='bookings')
    price = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        unique_together = ('booking', 'seat')

    def __str__(self):
        return f"{self.booking.reference} – Seat {self.seat.seat_number}"


# ── Seat Lock (race-condition prevention) ─────────────────────────────────────

class SeatLock(models.Model):
    """
    Temporary 5-minute seat reservation while passenger books.
    Works for both Trip and StageRun bookings.
    """
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='seat_locks',
                              null=True, blank=True)
    stage_run = models.ForeignKey(StageRun, on_delete=models.CASCADE, related_name='seat_locks',
                                   null=True, blank=True)
    seat = models.ForeignKey(SeatLayout, on_delete=models.CASCADE, related_name='locks')
    session_key = models.CharField(max_length=64)
    locked_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        indexes = [models.Index(fields=['expires_at'])]

    def __str__(self):
        return f"Lock: {self.seat.seat_number} by {self.session_key}"

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    @classmethod
    def cleanup_expired(cls):
        cls.objects.filter(expires_at__lte=timezone.now()).delete()

    @classmethod
    def lock_duration(cls):
        from datetime import timedelta
        return timedelta(minutes=5)


# ── Payment ───────────────────────────────────────────────────────────────────

class Payment(models.Model):
    """M-Pesa STK Push payment"""
    STATUS_CHOICES = [
        ('initiated', 'Initiated'),
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('timeout', 'Timeout'),
    ]

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    phone_number = models.CharField(max_length=20)

    checkout_request_id = models.CharField(max_length=200, blank=True)
    merchant_request_id = models.CharField(max_length=200, blank=True)
    mpesa_receipt_number = models.CharField(max_length=100, blank=True)
    transaction_date = models.DateTimeField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='initiated')
    result_code = models.CharField(max_length=10, blank=True)
    result_desc = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.booking.reference} – {self.status}"


# ── Revenue Snapshot (Owner Dashboard) ───────────────────────────────────────

class DailyEarnings(models.Model):
    """
    Aggregated daily earnings per matatu.
    Auto-populated at end of day (via management command or celery).
    Owners can view this in their dashboard.
    """
    matatu = models.ForeignKey(Matatu, on_delete=models.CASCADE, related_name='daily_earnings')
    date = models.DateField()
    total_passengers = models.PositiveIntegerField(default=0)
    total_trips = models.PositiveIntegerField(default=0)
    gross_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        unique_together = ('matatu', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.matatu.plate_number} – {self.date}: KES {self.gross_revenue}"