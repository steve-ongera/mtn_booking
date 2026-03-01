"""
Management command: seed_data.py
Place at: booking_app/management/commands/seed_data.py

Usage:
    python manage.py seed_data
    python manage.py seed_data --flush   # wipe booking_app tables first
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import date, time, timedelta
from decimal import Decimal
import random
import uuid

from booking_app.models import (
    Sacco, MatutuOwner, Driver, Town, Stage, Route, RouteStop,
    MatutuType, Matatu, SeatLayout, Trip, StageRun, Booking,
    BookedSeat, Payment, DailyEarnings,
)


# ─── Helper ──────────────────────────────────────────────────────────────────

def make_user(username, first, last, email, password="Pass1234!"):
    user, created = User.objects.get_or_create(
        username=username,
        defaults=dict(first_name=first, last_name=last, email=email)
    )
    if created:
        user.set_password(password)
        user.save()
    return user


# ─── Command ─────────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = "Seed the database with realistic Kenyan MTN Sacco data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush", action="store_true",
            help="Delete all existing booking_app data before seeding"
        )

    def handle(self, *args, **options):
        if options["flush"]:
            self.stdout.write(self.style.WARNING("Flushing booking_app data..."))
            DailyEarnings.objects.all().delete()
            Payment.objects.all().delete()
            BookedSeat.objects.all().delete()
            Booking.objects.all().delete()
            StageRun.objects.all().delete()
            Trip.objects.all().delete()
            SeatLayout.objects.all().delete()
            Matatu.objects.all().delete()
            MatutuType.objects.all().delete()
            RouteStop.objects.all().delete()
            Route.objects.all().delete()
            Stage.objects.all().delete()
            Town.objects.all().delete()
            Driver.objects.all().delete()
            MatutuOwner.objects.all().delete()
            Sacco.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("Flush complete."))

        self.seed_sacco()
        self.seed_towns_and_stages()
        self.seed_routes()
        self.seed_owners_and_drivers()
        self.seed_matatu_types()
        self.seed_matatus()
        self.seed_seat_layouts()
        self.seed_trips()
        self.seed_stage_runs()
        self.seed_bookings()
        self.seed_daily_earnings()
        self.stdout.write(self.style.SUCCESS("\n✅  Seeding complete!"))

    # ── 1. Sacco ─────────────────────────────────────────────────────────────

    def seed_sacco(self):
        self.sacco, _ = Sacco.objects.get_or_create(
            registration_number="SACCO/2005/0042",
            defaults=dict(
                name="MTN Sacco",
                contact_phone="0722400400",
                contact_email="info@mtnsacco.co.ke",
                is_active=True,
            )
        )
        self.stdout.write("  ✔ Sacco")

    # ── 2. Towns & Stages ────────────────────────────────────────────────────

    def seed_towns_and_stages(self):
        towns_data = [
            ("Murang'a", [("Murang'a Main Stage", "Along Murang'a-Nairobi Road, opp. Total Petrol Station"),
                          ("Murang'a Hospital Stage", "Near Murang'a Level 5 Hospital")]),
            ("Kenol",    [("Kenol Stage", "Kenol Junction, Thika-Muranga Road")]),
            ("Maragua",  [("Maragua Stage", "Maragua Market Centre")]),
            ("Thika",    [("Thika Kenyatta Avenue", "Kenyatta Avenue, Thika CBD"),
                          ("Thika Garissa Lodge", "Garissa Lodge Bus Park, Thika")]),
            ("Nairobi",  [("Nairobi Railway Bus Terminus", "Tom Mboya Street, Nairobi CBD"),
                          ("Nairobi OTC", "Cross Road, Accra Road, Nairobi"),
                          ("Nairobi Machakos Country Bus", "Landhies Road, Nairobi")]),
            ("Kahawa",   [("Kahawa West Stage", "Kahawa West Roundabout")]),
            ("Ruiru",    [("Ruiru Stage", "Ruiru Town, Thika Superhighway")]),
            ("Sagana",   [("Sagana Stage", "Sagana Junction, Murang'a-Nyeri Road")]),
            ("Karatina", [("Karatina Stage", "Karatina Market, Nyeri Road")]),
            ("Nyeri",    [("Nyeri Supermarket Stage", "Kimathi Way, Nyeri Town")]),
        ]
        self.towns = {}
        self.stages = {}
        for town_name, stage_list in towns_data:
            town, _ = Town.objects.get_or_create(name=town_name, defaults={"is_active": True})
            self.towns[town_name] = town
            for stage_name, address in stage_list:
                stage, _ = Stage.objects.get_or_create(
                    town=town, name=stage_name,
                    defaults={"address": address, "is_active": True}
                )
                self.stages[stage_name] = stage
        self.stdout.write("  ✔ Towns & Stages")

    # ── 3. Routes ────────────────────────────────────────────────────────────

    def seed_routes(self):
        routes_data = [
            # (origin, destination, distance_km, [(stage_name, order, dist_from_origin)])
            (
                "Murang'a", "Nairobi", 87,
                [
                    ("Murang'a Main Stage", 1, 0),
                    ("Kenol Stage", 2, 22),
                    ("Maragua Stage", 3, 34),
                    ("Thika Kenyatta Avenue", 4, 62),
                    ("Ruiru Stage", 5, 74),
                    ("Nairobi Railway Bus Terminus", 6, 87),
                ]
            ),
            (
                "Murang'a", "Thika", 62,
                [
                    ("Murang'a Main Stage", 1, 0),
                    ("Kenol Stage", 2, 22),
                    ("Maragua Stage", 3, 34),
                    ("Thika Kenyatta Avenue", 4, 62),
                ]
            ),
            (
                "Murang'a", "Nyeri", 74,
                [
                    ("Murang'a Main Stage", 1, 0),
                    ("Sagana Stage", 2, 38),
                    ("Karatina Stage", 3, 58),
                    ("Nyeri Supermarket Stage", 4, 74),
                ]
            ),
            (
                "Thika", "Nairobi", 42,
                [
                    ("Thika Kenyatta Avenue", 1, 0),
                    ("Ruiru Stage", 2, 12),
                    ("Kahawa West Stage", 3, 28),
                    ("Nairobi OTC", 4, 42),
                ]
            ),
        ]
        self.routes = {}
        for origin_name, dest_name, dist, stops in routes_data:
            origin = self.towns[origin_name]
            dest = self.towns[dest_name]
            route, _ = Route.objects.get_or_create(
                origin=origin, destination=dest,
                defaults={"distance_km": dist, "is_active": True}
            )
            self.routes[(origin_name, dest_name)] = route
            for stage_name, order, dist_from_origin in stops:
                stage = self.stages[stage_name]
                RouteStop.objects.get_or_create(
                    route=route, stage=stage,
                    defaults={"order": order, "distance_from_origin_km": dist_from_origin}
                )
        self.stdout.write("  ✔ Routes & Stops")

    # ── 4. Owners & Drivers ───────────────────────────────────────────────────

    def seed_owners_and_drivers(self):
        owners_raw = [
            ("john.kamau",   "John",    "Kamau",   "jkamau@gmail.com",   "23456789", "0722123456"),
            ("grace.wanjiku", "Grace",  "Wanjiku", "gwanjiku@gmail.com", "34567890", "0733234567"),
            ("peter.mwangi", "Peter",   "Mwangi",  "pmwangi@gmail.com",  "45678901", "0710345678"),
        ]
        self.owners = []
        for uname, fn, ln, email, id_no, phone in owners_raw:
            user = make_user(uname, fn, ln, email)
            owner, _ = MatutuOwner.objects.get_or_create(
                id_number=id_no,
                defaults=dict(user=user, sacco=self.sacco, phone=phone, is_active=True)
            )
            self.owners.append(owner)

        drivers_raw = [
            ("samuel.njoroge",  "Samuel",  "Njoroge",  "snjoroge@gmail.com",  "DL/001/2018", "0722001001", "55667788"),
            ("mary.waithera",   "Mary",    "Waithera", "mwaithera@gmail.com", "DL/002/2019", "0733002002", "66778899"),
            ("james.kariuki",   "James",   "Kariuki",  "jkariuki@gmail.com",  "DL/003/2020", "0711003003", "77889900"),
            ("alice.njeri",     "Alice",   "Njeri",    "anjeri@gmail.com",    "DL/004/2017", "0722004004", "88990011"),
            ("david.otieno",    "David",   "Otieno",   "dotieno@gmail.com",   "DL/005/2021", "0733005005", "99001122"),
        ]
        self.drivers = []
        for uname, fn, ln, email, lic, phone, id_no in drivers_raw:
            user = make_user(uname, fn, ln, email)
            driver, _ = Driver.objects.get_or_create(
                license_number=lic,
                defaults=dict(
                    user=user, sacco=self.sacco, phone=phone,
                    id_number=id_no, status="active"
                )
            )
            self.drivers.append(driver)
        self.stdout.write("  ✔ Owners & Drivers")

    # ── 5. Matatu Types ──────────────────────────────────────────────────────

    def seed_matatu_types(self):
        types_data = [
            ("14-Seater Nissan Matatu", 14, "Common Nissan route van, 2+2 configuration"),
            ("33-Seater Rosa Bus",      33, "Rosa mini-bus used on busy routes"),
            ("25-Seater Isuzu NQR",    25, "Mid-capacity Isuzu NQR bus"),
        ]
        self.matatu_types = {}
        for name, cap, desc in types_data:
            mt, _ = MatutuType.objects.get_or_create(
                name=name,
                defaults={"default_capacity": cap, "description": desc}
            )
            self.matatu_types[name] = mt
        self.stdout.write("  ✔ Matatu Types")

    # ── 6. Matatus ───────────────────────────────────────────────────────────

    def seed_matatus(self):
        nissan = self.matatu_types["14-Seater Nissan Matatu"]
        rosa   = self.matatu_types["33-Seater Rosa Bus"]
        isuzu  = self.matatu_types["25-Seater Isuzu NQR"]

        route_mtn  = self.routes[("Murang'a", "Nairobi")]
        route_thk  = self.routes[("Murang'a", "Thika")]
        route_nyr  = self.routes[("Murang'a", "Nyeri")]
        route_tnbi = self.routes[("Thika", "Nairobi")]

        matatus_data = [
            # (plate, name, type, owner_idx, driver_idx, route, service_type, seats, amenities)
            ("KBZ 123A", "Simba Express",   rosa,   0, 0, route_mtn,  "express", 33, ["WiFi","AC","USB"]),
            ("KCG 456B", "Nyota wa Asubuhi",nissan, 0, 1, route_mtn,  "stage",   14, ["Music"]),
            ("KDA 789C", "Chui Speed",      isuzu,  1, 2, route_thk,  "express", 25, ["AC","USB"]),
            ("KDB 321D", "Fahari ya Kenya", nissan, 1, 3, route_nyr,  "stage",   14, ["Music","WiFi"]),
            ("KDE 654E", "Malaika Tours",   rosa,   2, 4, route_tnbi, "express", 33, ["WiFi","AC","Music","USB"]),
            ("KCF 987F", "Nguruwe Mwenda",  nissan, 2, 0, route_mtn,  "stage",   14, []),
        ]
        self.matatus = []
        for plate, name, mtype, oi, di, route, stype, seats, amenities in matatus_data:
            mat, _ = Matatu.objects.get_or_create(
                plate_number=plate,
                defaults=dict(
                    name=name,
                    matatu_type=mtype,
                    sacco=self.sacco,
                    owner=self.owners[oi],
                    assigned_driver=self.drivers[di],
                    route=route,
                    service_type=stype,
                    total_seats=seats,
                    is_active=True,
                    amenities=amenities,
                )
            )
            self.matatus.append(mat)
        self.stdout.write("  ✔ Matatus")

    # ── 7. Seat Layouts ───────────────────────────────────────────────────────

    def seed_seat_layouts(self):
        """
        Create realistic seat layouts.
        14-seater: 2 cols left + aisle + 2 cols right, 3 passenger rows + conductor + driver
        33-seater: simplified 3+2 layout with 7 rows
        """
        for mat in self.matatus:
            if mat.seats.exists():
                continue
            if mat.total_seats == 14:
                self._layout_14(mat)
            elif mat.total_seats == 25:
                self._layout_25(mat)
            else:
                self._layout_33(mat)
        self.stdout.write("  ✔ Seat Layouts")

    def _create_seat(self, mat, seat_number, seat_class, row, col, **kwargs):
        SeatLayout.objects.get_or_create(
            matatu=mat, seat_number=seat_number,
            defaults=dict(
                seat_class=seat_class, row_number=row, column_number=col,
                is_active=True, **kwargs
            )
        )

    def _layout_14(self, mat):
        # Row 1: Driver (col1), aisle(col2), Front Passenger (col3)
        self._create_seat(mat, "D",  "front", 1, 1, is_driver_seat=True,  bg_color="#94a3b8", custom_label="DRV")
        self._create_seat(mat, "F1", "front", 1, 3, bg_color="#fbbf24", custom_label="F1")
        # Row 2: Conductor + 3 passengers
        self._create_seat(mat, "C",  "conductor", 2, 1, is_conductor_seat=True, bg_color="#a78bfa", custom_label="COND")
        self._create_seat(mat, "1",  "window", 2, 2)
        self._create_seat(mat, "2",  "aisle",  2, 3)
        self._create_seat(mat, "3",  "window", 2, 4)
        # Rows 3-5: 4 seats per row
        seat_num = 4
        for row in range(3, 6):
            for col, cls in [(1, "window"), (2, "aisle"), (3, "aisle"), (4, "window")]:
                self._create_seat(mat, str(seat_num), cls, row, col)
                seat_num += 1

    def _layout_25(self, mat):
        # Row 1: Driver + Front x2
        self._create_seat(mat, "D",  "front", 1, 1, is_driver_seat=True, bg_color="#94a3b8", custom_label="DRV")
        self._create_seat(mat, "F1", "front", 1, 3, bg_color="#fbbf24")
        self._create_seat(mat, "F2", "front", 1, 4, bg_color="#fbbf24")
        # Row 2: Conductor + 3
        self._create_seat(mat, "C", "conductor", 2, 1, is_conductor_seat=True, bg_color="#a78bfa", custom_label="COND")
        for i, col in enumerate([2, 3, 4], start=1):
            self._create_seat(mat, str(i), "aisle", 2, col)
        seat_num = 4
        for row in range(3, 8):
            for col, cls in [(1, "window"), (2, "aisle"), (3, "aisle"), (4, "window")]:
                self._create_seat(mat, str(seat_num), cls, row, col)
                seat_num += 1

    def _layout_33(self, mat):
        self._create_seat(mat, "D",  "front", 1, 1, is_driver_seat=True, bg_color="#94a3b8", custom_label="DRV")
        self._create_seat(mat, "F1", "front", 1, 3, bg_color="#fbbf24")
        self._create_seat(mat, "F2", "front", 1, 4, bg_color="#fbbf24")
        self._create_seat(mat, "C",  "conductor", 2, 1, is_conductor_seat=True, bg_color="#a78bfa", custom_label="COND")
        for i, col in enumerate([2, 3, 4, 5], start=1):
            self._create_seat(mat, str(i), "window" if col in [2,5] else "aisle", 2, col)
        seat_num = 5
        for row in range(3, 10):
            for col, cls in [(1,"window"),(2,"aisle"),(3,"aisle"),(4,"aisle"),(5,"window")]:
                self._create_seat(mat, str(seat_num), cls, row, col)
                seat_num += 1

    # ── 8. Trips (Express) ───────────────────────────────────────────────────

    def seed_trips(self):
        express_matatus = [m for m in self.matatus if m.service_type == "express"]
        today = date.today()
        trip_times = [
            (time(6, 0),  time(9, 30),  210, Decimal("350")),
            (time(9, 0),  time(12, 30), 210, Decimal("350")),
            (time(13, 0), time(16, 30), 210, Decimal("300")),
            (time(16, 0), time(19, 30), 210, Decimal("350")),
        ]
        self.trips = []
        for mat in express_matatus:
            origin_stage_name = list(self.stages.keys())[0]
            # pick correct origin stage
            origin_stage = Stage.objects.filter(town=mat.route.origin).first()
            dest_stage   = Stage.objects.filter(town=mat.route.destination).first()
            for dep_date in [today - timedelta(days=1), today, today + timedelta(days=1)]:
                for dep_time, arr_time, dur, fare in trip_times:
                    trip, _ = Trip.objects.get_or_create(
                        matatu=mat,
                        departure_date=dep_date,
                        departure_time=dep_time,
                        defaults=dict(
                            route=mat.route,
                            arrival_time=arr_time,
                            duration_minutes=dur,
                            origin_stage=origin_stage,
                            destination_stage=dest_stage,
                            status="scheduled" if dep_date >= today else "arrived",
                            fare=fare,
                            is_active=True,
                        )
                    )
                    self.trips.append(trip)
        self.stdout.write("  ✔ Trips")

    # ── 9. Stage Runs ────────────────────────────────────────────────────────

    def seed_stage_runs(self):
        stage_matatus = [m for m in self.matatus if m.service_type == "stage"]
        today = date.today()
        self.stage_runs = []
        for mat in stage_matatus:
            origin_stage = Stage.objects.filter(town=mat.route.origin).first()
            dest_stage   = Stage.objects.filter(town=mat.route.destination).first()
            for days_ago in range(3):
                run_date = today - timedelta(days=days_ago)
                for run_num in range(1, 4):
                    status = "arrived" if days_ago > 0 else ("departed" if run_num < 3 else "loading")
                    departed_at = timezone.make_aware(
                        timezone.datetime.combine(run_date, time(6 + run_num * 2, 30))
                    ) if status in ["departed", "arrived"] else None
                    arrived_at = timezone.make_aware(
                        timezone.datetime.combine(run_date, time(9 + run_num * 2, 0))
                    ) if status == "arrived" else None

                    sr, _ = StageRun.objects.get_or_create(
                        matatu=mat,
                        run_date=run_date,
                        run_number=run_num,
                        defaults=dict(
                            route=mat.route,
                            origin_stage=origin_stage,
                            destination_stage=dest_stage,
                            fare=Decimal("250"),
                            status=status,
                            departed_at=departed_at,
                            arrived_at=arrived_at,
                        )
                    )
                    self.stage_runs.append(sr)
        self.stdout.write("  ✔ Stage Runs")

    # ── 10. Bookings ─────────────────────────────────────────────────────────

    def seed_bookings(self):
        passengers = [
            ("Wanjiru Kamau",    "0722100100", "wanjiru@gmail.com",  "10011001"),
            ("Mwenda Githinji",  "0733200200", "mwenda@gmail.com",   "20022002"),
            ("Aisha Mohamed",    "0711300300", "aisha@gmail.com",    "30033003"),
            ("Brian Otieno",     "0720400400", "brian@gmail.com",    "40044004"),
            ("Charity Njeri",    "0740500500", "charity@gmail.com",  "50055005"),
            ("Dennis Mutua",     "0722600600", "dennis@gmail.com",   "60066006"),
            ("Esther Wangari",   "0733700700", "esther@gmail.com",   "70077007"),
            ("Francis Karanja",  "0711800800", "francis@gmail.com",  "80088008"),
            ("Gloria Maina",     "0720900900", "gloria@gmail.com",   "90099009"),
            ("Hassan Abdi",      "0740010010", "hassan@gmail.com",   "10100101"),
        ]

        self.bookings = []

        # Bookings for Express trips (past trips)
        past_trips = [t for t in self.trips if t.departure_date < date.today()]
        for trip in past_trips[:6]:
            seats = list(trip.matatu.seats.filter(
                is_driver_seat=False, is_conductor_seat=False, is_aisle_gap=False
            ))
            random.shuffle(seats)
            for i, passenger in enumerate(random.sample(passengers, min(4, len(passengers)))):
                if i >= len(seats):
                    break
                seat = seats[i]
                name, phone, email, id_no = passenger
                # avoid duplicate bookings on same seat+trip
                if BookedSeat.objects.filter(seat=seat, booking__trip=trip).exists():
                    continue
                booking = Booking.objects.create(
                    trip=trip,
                    boarding_stage=trip.origin_stage,
                    alighting_stage=trip.destination_stage,
                    passenger_name=name,
                    passenger_phone=phone,
                    passenger_email=email,
                    passenger_id_number=id_no,
                    total_amount=trip.fare,
                    status="confirmed",
                    ticket_sent=True,
                )
                BookedSeat.objects.create(booking=booking, seat=seat, price=trip.fare)
                Payment.objects.create(
                    booking=booking,
                    amount=trip.fare,
                    phone_number=phone,
                    checkout_request_id=f"ws_CO_{uuid.uuid4().hex[:16].upper()}",
                    merchant_request_id=f"MR_{uuid.uuid4().hex[:10].upper()}",
                    mpesa_receipt_number=f"QGH{random.randint(1000000,9999999)}",
                    transaction_date=timezone.now() - timedelta(days=random.randint(1, 5)),
                    status="completed",
                    result_code="0",
                    result_desc="The service request is processed successfully.",
                )
                self.bookings.append(booking)

        # Bookings for Stage Runs (driver-created)
        completed_runs = [sr for sr in self.stage_runs if sr.status == "arrived"]
        for run in completed_runs[:4]:
            seats = list(run.matatu.seats.filter(
                is_driver_seat=False, is_conductor_seat=False
            ))
            for i, passenger in enumerate(random.sample(passengers, min(6, len(passengers)))):
                if i >= len(seats):
                    break
                name, phone, _, _ = passenger
                booking = Booking.objects.create(
                    stage_run=run,
                    boarding_stage=run.origin_stage,
                    alighting_stage=run.destination_stage,
                    passenger_name=name,
                    passenger_phone=phone,
                    total_amount=run.fare,
                    status="confirmed",
                    created_by_driver=True,
                )
                BookedSeat.objects.create(booking=booking, seat=seats[i], price=run.fare)
                self.bookings.append(booking)

        self.stdout.write(f"  ✔ Bookings ({len(self.bookings)} created)")

    # ── 11. Daily Earnings ────────────────────────────────────────────────────

    def seed_daily_earnings(self):
        today = date.today()
        for mat in self.matatus:
            for days_ago in range(1, 8):
                earn_date = today - timedelta(days=days_ago)
                trips_count   = random.randint(3, 6)
                passengers    = random.randint(trips_count * 8, trips_count * mat.total_seats)
                gross         = Decimal(passengers) * Decimal("280")
                DailyEarnings.objects.get_or_create(
                    matatu=mat,
                    date=earn_date,
                    defaults=dict(
                        total_passengers=passengers,
                        total_trips=trips_count,
                        gross_revenue=gross,
                        driver=mat.assigned_driver,
                    )
                )
        self.stdout.write("  ✔ Daily Earnings")