// frontend/src/services/api.js
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

async function request(path, options = {}) {
  const token = localStorage.getItem("access_token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Public API ───────────────────────────────────────────────────────────────
export const api = {
  // Locations
  getTowns: () => request("/towns/"),
  getStages: (townSlug) => request(`/stages/?town__slug=${townSlug}`),

  // Search
  searchTrips: (origin, destination, date) =>
    request(`/trips/search/?origin=${origin}&destination=${destination}&date=${date}`),

  // Trip detail
  getTripDetail: (slug) => request(`/trips/${slug}/`),
  getStageRunDetail: (slug) => request(`/stage-runs/${slug}/`),

  // Seat status (poll every 3s)
  getTripSeatStatus: (slug) => request(`/trips/${slug}/seat-status/`),
  getStageRunSeatStatus: (slug) => request(`/stage-runs/${slug}/seat-status/`),

  // Lock seats
  lockTripSeats: (slug, seatNumbers, action = "lock") =>
    request(`/trips/${slug}/lock-seats/`, {
      method: "POST",
      body: JSON.stringify({ seat_numbers: seatNumbers, action }),
    }),
  lockStageRunSeats: (slug, seatNumbers, action = "lock") =>
    request(`/stage-runs/${slug}/lock-seats/`, {
      method: "POST",
      body: JSON.stringify({ seat_numbers: seatNumbers, action }),
    }),

  // Booking
  createBooking: (data) =>
    request("/bookings/", { method: "POST", body: JSON.stringify(data) }),
  trackBooking: (ref) => request(`/bookings/track/${ref}/`),
  cancelBooking: (slug) =>
    request(`/bookings/${slug}/cancel/`, { method: "POST" }),

  // Payment
  initiatePayment: (bookingRef, phone) =>
    request("/payments/initiate/", {
      method: "POST",
      body: JSON.stringify({ booking_reference: bookingRef, phone_number: phone }),
    }),
  getPaymentStatus: (ref) => request(`/payments/status/${ref}/`),

  // Cleanup
  cleanupLocks: () => request("/seat-locks/cleanup/", { method: "POST" }),
};

// ── Admin API ────────────────────────────────────────────────────────────────
export const adminApi = {
  login: (username, password) =>
    request("/admin-api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => request("/admin-api/auth/me/"),
  dashboard: () => request("/admin-api/dashboard/stats/"),
  revenueChart: (days = 30) => request(`/admin-api/dashboard/revenue-chart/?days=${days}`),

  // Matatus
  getMatatus: (params = "") => request(`/admin-api/matatus/${params}`),
  getMatatu: (slug) => request(`/admin-api/matatus/${slug}/`),
  createMatatu: (data) =>
    request("/admin-api/matatus/", { method: "POST", body: JSON.stringify(data) }),
  updateMatatu: (slug, data) =>
    request(`/admin-api/matatus/${slug}/`, { method: "PATCH", body: JSON.stringify(data) }),
  saveSeatLayout: (slug, seats) =>
    request(`/admin-api/matatus/${slug}/save-layout/`, {
      method: "POST",
      body: JSON.stringify({ seats }),
    }),
  assignDriver: (slug, driverId) =>
    request(`/admin-api/matatus/${slug}/assign-driver/`, {
      method: "POST",
      body: JSON.stringify({ driver_id: driverId }),
    }),

  // Trips
  getTrips: (params = "") => request(`/admin-api/trips/${params}`),
  createTrip: (data) =>
    request("/admin-api/trips/", { method: "POST", body: JSON.stringify(data) }),
  getTripManifest: (slug) => request(`/admin-api/trips/${slug}/manifest/`),
  updateTripStatus: (slug, s) =>
    request(`/admin-api/trips/${slug}/update-status/`, {
      method: "PATCH", body: JSON.stringify({ status: s }),
    }),

  // Stage runs
  getStageRuns: (params = "") => request(`/admin-api/stage-runs/${params}`),
  getStageRunManifest: (slug) => request(`/admin-api/stage-runs/${slug}/manifest/`),
  updateStageRunStatus: (slug, s) =>
    request(`/admin-api/stage-runs/${slug}/update-status/`, {
      method: "PATCH", body: JSON.stringify({ status: s }),
    }),

  // Bookings
  getBookings: (params = "") => request(`/admin-api/bookings/${params}`),
  confirmBooking: (ref) =>
    request(`/admin-api/bookings/${ref}/confirm/`, { method: "POST" }),

  // Drivers
  getDrivers: () => request("/admin-api/drivers/"),
  createDriver: (data) =>
    request("/admin-api/drivers/", { method: "POST", body: JSON.stringify(data) }),
};

// ── Driver API ────────────────────────────────────────────────────────────────
export const driverApi = {
  dashboard: () => request("/driver/dashboard/"),
  tripManifest: (slug) => request(`/driver/trips/${slug}/manifest/`),
  stageRunManifest: (slug) => request(`/driver/stage-runs/${slug}/manifest/`),
  createBooking: (data) =>
    request("/driver/bookings/", { method: "POST", body: JSON.stringify(data) }),
  createStageRun: (data) =>
    request("/driver/stage-runs/", { method: "POST", body: JSON.stringify(data) }),
};

// ── Owner API ────────────────────────────────────────────────────────────────
export const ownerApi = {
  dashboard: () => request("/owner/dashboard/"),
  matautuEarnings: (slug, days = 30) => request(`/owner/matatus/${slug}/earnings/?days=${days}`),
};