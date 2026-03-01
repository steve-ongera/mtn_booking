# MTN Sacco – Matatu Booking System

A full-stack matatu booking platform for **MTN Sacco, Murang'a County**.  
Passengers can search, select a specific seat, and pay via M-Pesa STK Push.  
Drivers can view their manifests and create bookings at the stage.  
Owners can monitor how much each matatu has earned.

---

## Architecture

```
mtn_matatu/
│
├── booking/                        ← Django app (all logic here)
│   ├── models.py                   ← All models (see below)
│   ├── serializers.py              ← Public + admin serializers
│   ├── views.py                    ← All ViewSets + APIViews
│   ├── urls.py                     ← App-level URL routing
│   ├── admin.py                    ← Django admin registrations
│   └── migrations/
│
├── mtn_matatu/                     ← Django project config
│   ├── settings.py
│   ├── urls.py                     ← Root URL: /api/v1/ → booking.urls
│   └── wsgi.py
│
├── frontend/                       ← React (Vite) frontend
│   ├── public/
│   ├── src/
│   │   ├── App.jsx                 ← Router + layout
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── services/
│   │   │   └── api.js              ← All API calls (public, admin, driver, owner)
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── SeatMap.jsx         ← Interactive seat grid with real-time locking
│   │   └── pages/
│   │       ├── Home.jsx            ← Search form
│   │       ├── SearchResults.jsx   ← Shows trips + stage runs
│   │       ├── TripDetail.jsx      ← Seat selection → booking → payment (3 steps)
│   │       ├── BookingConfirmation.jsx
│   │       └── TrackBooking.jsx
│   ├── package.json
│   └── vite.config.js
│
├── requirements.txt
├── .env                            ← NOT committed, see settings.py comments
└── README.md
```

---

## Data Models

### Core Concepts

| Model | Purpose |
|-------|---------|
| `Sacco` | MTN Sacco organization |
| `MatutuOwner` | Owner of one or more matatus |
| `Driver` | Registered driver under the sacco |
| `Town` | Towns/cities served (Murang'a, Nairobi, Thika…) |
| `Stage` | A specific terminus/stop within a town |
| `Route` | Named route e.g. Murang'a → Nairobi |
| `RouteStop` | Ordered stops along a route |
| `MatutuType` | Vehicle type: 14-seater Nissan, 33-seater Rosa, Isuzu NQR |
| `Matatu` | Individual vehicle with owner, driver, service_type |
| `SeatLayout` | Individual seat (grid position, class, conductor/driver flags) |
| `Trip` | Scheduled trip for **express** matatus |
| `StageRun` | A single run for **stage** matatus (driver creates each departure) |
| `Booking` | Passenger booking (links to either Trip or StageRun) |
| `BookedSeat` | Seat(s) held within a booking |
| `SeatLock` | 5-minute temporary lock (race condition prevention) |
| `Payment` | M-Pesa STK Push payment record |
| `DailyEarnings` | Aggregated daily revenue per matatu (for owner dashboard) |

### Two Service Types
- **Express (scheduled)**: Like bus booking. Driver sets departure dates/times in advance. Passengers book specific seats. Works like the original bus system.
- **Stage (fill & go)**: Driver creates a `StageRun` when they arrive at stage and are loading. Passengers booking at stage can reserve seats. Driver can also create bookings at the stage counter.

### Seat Layout – Matatu-Specific
Matatu seats differ from buses:
- Typically 2+2 columns (or 2+1 for some 14-seaters)
- `is_driver_seat = True` for the driver position
- `is_conductor_seat = True` for conductor/turn-boy
- Small grids: 4–6 rows, 4 columns
- "Back bench" row can span 3–5 seats with `col_span`

The **drag-and-drop admin editor** (`POST /admin-api/matatus/<slug>/save-layout/`) lets admins build any configuration.

---

## API Overview

### Base URL: `/api/v1/`

#### Public Endpoints
```
GET  /towns/                              List towns
GET  /stages/?town__slug=muranga         Stages for a town
GET  /trips/search/?origin=X&destination=Y&date=2026-03-01
GET  /trips/<slug>/                       Trip detail with seat layout
GET  /trips/<slug>/seat-status/           Real-time seat availability (poll 3–4s)
POST /trips/<slug>/lock-seats/            { seat_numbers, action: lock|release }
GET  /stage-runs/<slug>/                  Stage run detail
GET  /stage-runs/<slug>/seat-status/
POST /stage-runs/<slug>/lock-seats/
POST /bookings/                           Create booking
GET  /bookings/track/<reference>/         Track by reference
POST /payments/initiate/                  { booking_reference, phone_number }
POST /payments/callback/                  Safaricom callback
GET  /payments/status/<ref>/
```

#### Admin Endpoints (`/admin-api/`)
```
POST /auth/login/
GET  /dashboard/stats/
GET  /dashboard/revenue-chart/?days=30
CRUD /matatus/
POST /matatus/<slug>/save-layout/         Bulk seat layout save
POST /matatus/<slug>/assign-driver/
CRUD /trips/
GET  /trips/<slug>/manifest/              Full passenger list
CRUD /stage-runs/
GET  /stage-runs/<slug>/manifest/
CRUD /bookings/
CRUD /drivers/
CRUD /towns/ /stages/ /routes/
```

#### Driver Portal (`/driver/`)
```
GET  /driver/dashboard/                   Today's trips, revenue
GET  /driver/trips/<slug>/manifest/       Only driver's own trips
GET  /driver/stage-runs/<slug>/manifest/
POST /driver/bookings/                    Create booking for walk-in passenger
POST /driver/stage-runs/                  Start a new stage run
```

#### Owner Portal (`/owner/`)
```
GET  /owner/dashboard/                    All matatus + earnings summary
GET  /owner/matatus/<slug>/earnings/?days=30
```

---

## Setup

### Backend

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install django djangorestframework djangorestframework-simplejwt \
  django-cors-headers django-filter psycopg2-binary python-dotenv requests

# 3. Copy settings and set env vars
cp .env.example .env
# Edit .env with your DB, M-Pesa, and email credentials

# 4. Run migrations
python manage.py migrate

# 5. Create superuser
python manage.py createsuperuser

# 6. Load initial data (towns, routes)
python manage.py shell
# >>> from booking.models import Sacco
# >>> Sacco.objects.create(name="MTN Sacco", registration_number="SACCO/001")

# 7. Start dev server
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8000/api/v1
npm run dev
```

### requirements.txt
```
django>=4.2
djangorestframework>=3.14
djangorestframework-simplejwt>=5.3
django-cors-headers>=4.3
django-filter>=23.5
psycopg2-binary>=2.9
requests>=2.31
python-dotenv>=1.0
```

---

## M-Pesa Integration

1. Register at [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create a Daraja app → get Consumer Key & Secret
3. Set `MPESA_ENVIRONMENT=sandbox` for testing
4. Use [ngrok](https://ngrok.com/) to expose localhost for the callback:
   ```bash
   ngrok http 8000
   # Set MPESA_CALLBACK_URL=https://xyz.ngrok.io/api/v1/payments/callback/
   ```
5. Sandbox test number: `254708374149` (Safaricom test user)

---

## Daily Earnings Aggregation

Run this management command at end of day (or via cron/celery):

```bash
python manage.py shell -c "
from booking.models import Matatu, Booking, BookedSeat, DailyEarnings, StageRun, Trip
from django.db.models import Sum, Count
from django.utils import timezone

today = timezone.now().date()
for matatu in Matatu.objects.all():
    confirmed = Booking.objects.filter(status='confirmed', created_at__date=today).filter(
        trip__matatu=matatu
    )
    revenue = confirmed.aggregate(t=Sum('total_amount'))['t'] or 0
    trips = Trip.objects.filter(matatu=matatu, departure_date=today).count()
    runs = StageRun.objects.filter(matatu=matatu, run_date=today).count()
    passengers = BookedSeat.objects.filter(booking__in=confirmed).count()
    DailyEarnings.objects.update_or_create(
        matatu=matatu, date=today,
        defaults={
            'gross_revenue': revenue,
            'total_trips': trips + runs,
            'total_passengers': passengers,
            'driver': matatu.assigned_driver,
        }
    )
print('Done')
"
```

---

## Seat Layout Editor

The admin frontend uses a drag-and-drop editor to build seat maps.  
Call `POST /admin-api/matatus/<slug>/save-layout/` with a `seats` array:

```json
{
  "seats": [
    {"seat_number": "D", "row_number": 1, "column_number": 1, "is_driver_seat": true},
    {"seat_number": "F1", "row_number": 1, "column_number": 3, "seat_class": "front"},
    {"seat_number": "1", "row_number": 2, "column_number": 1, "seat_class": "window"},
    {"seat_number": "", "row_number": 2, "column_number": 2, "is_aisle_gap": true},
    {"seat_number": "2", "row_number": 2, "column_number": 3},
    {"seat_number": "3", "row_number": 2, "column_number": 4},
    ...
    {"seat_number": "C", "row_number": 5, "column_number": 1, "is_conductor_seat": true}
  ]
}
```

Typical 14-seater layout (4 cols: col 1-2 left, aisle, col 3-4 right):
```
Row 1: [Driver] [ ] [aisle] [F-passenger] [ ]
Row 2: [  1  ] [2] [aisle] [    3      ] [4]
Row 3: [  5  ] [6] [aisle] [    7      ] [8]
Row 4: [  9  ] [10][aisle] [   11      ] [12]
Row 5: [  13 ] [14][aisle] [  (empty)  ] [Cond]
```

---

## License
MTN Sacco internal system. All rights reserved.