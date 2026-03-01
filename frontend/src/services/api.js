// frontend/src/services/api.js
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function request(path, options = {}) {
  const token = localStorage.getItem('access_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'include' });

  if (res.status === 401) {
    localStorage.removeItem('access_token');
    window.location.href = '/admin/login';
    return;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

// Public
export const api = {
  getTowns: () => request('/towns/'),
  getStages: (slug) => request(`/stages/?town__slug=${slug}`),
  searchTrips: (o, d, date) => request(`/trips/search/?origin=${o}&destination=${d}&date=${date}`),
  getTripDetail: (slug) => request(`/trips/${slug}/`),
  getStageRunDetail: (slug) => request(`/stage-runs/${slug}/`),
  getTripSeatStatus: (slug) => request(`/trips/${slug}/seat-status/`),
  getStageRunSeatStatus: (slug) => request(`/stage-runs/${slug}/seat-status/`),
  lockTripSeats: (slug, seats, action = 'lock') =>
    request(`/trips/${slug}/lock-seats/`, { method: 'POST', body: JSON.stringify({ seat_numbers: seats, action }) }),
  lockStageRunSeats: (slug, seats, action = 'lock') =>
    request(`/stage-runs/${slug}/lock-seats/`, { method: 'POST', body: JSON.stringify({ seat_numbers: seats, action }) }),
  createBooking: (data) => request('/bookings/', { method: 'POST', body: JSON.stringify(data) }),
  trackBooking: (ref) => request(`/bookings/track/${ref}/`),
  cancelBooking: (slug) => request(`/bookings/${slug}/cancel/`, { method: 'POST' }),
  initiatePayment: (ref, phone) =>
    request('/payments/initiate/', { method: 'POST', body: JSON.stringify({ booking_reference: ref, phone_number: phone }) }),
  getPaymentStatus: (ref) => request(`/payments/status/${ref}/`),
  cleanupLocks: () => request('/seat-locks/cleanup/', { method: 'POST' }),
};

// Admin Auth
export const adminAuth = {
  login: (username, password) =>
    request('/admin-api/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/admin-api/auth/me/'),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login';
  },
};

export const adminDash = {
  stats: () => request('/admin-api/dashboard/stats/'),
  revenueChart: (days = 30) => request(`/admin-api/dashboard/revenue-chart/?days=${days}`),
};

export const adminTowns = {
  list: (p = '') => request(`/admin-api/towns/${p}`),
  create: (d) => request('/admin-api/towns/', { method: 'POST', body: JSON.stringify(d) }),
  update: (slug, d) => request(`/admin-api/towns/${slug}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  delete: (slug) => request(`/admin-api/towns/${slug}/`, { method: 'DELETE' }),
};

export const adminStages = {
  list: (p = '') => request(`/admin-api/stages/${p}`),
  create: (d) => request('/admin-api/stages/', { method: 'POST', body: JSON.stringify(d) }),
  update: (slug, d) => request(`/admin-api/stages/${slug}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  delete: (slug) => request(`/admin-api/stages/${slug}/`, { method: 'DELETE' }),
};

export const adminRoutes = {
  list: (p = '') => request(`/admin-api/routes/${p}`),
  create: (d) => request('/admin-api/routes/', { method: 'POST', body: JSON.stringify(d) }),
  update: (slug, d) => request(`/admin-api/routes/${slug}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  delete: (slug) => request(`/admin-api/routes/${slug}/`, { method: 'DELETE' }),
};

export const adminMatatuTypes = {
  list: () => request('/matatu-types/'),
};

export const adminMatatus = {
  list: (p = '') => request(`/admin-api/matatus/${p}`),
  get: (slug) => request(`/admin-api/matatus/${slug}/`),
  create: (d) => request('/admin-api/matatus/', { method: 'POST', body: JSON.stringify(d) }),
  update: (slug, d) => request(`/admin-api/matatus/${slug}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  delete: (slug) => request(`/admin-api/matatus/${slug}/`, { method: 'DELETE' }),
  saveLayout: (slug, seats) =>
    request(`/admin-api/matatus/${slug}/save-layout/`, { method: 'POST', body: JSON.stringify({ seats }) }),
  assignDriver: (slug, driverId) =>
    request(`/admin-api/matatus/${slug}/assign-driver/`, { method: 'POST', body: JSON.stringify({ driver_id: driverId }) }),
};

export const adminTrips = {
  list: (p = '') => request(`/admin-api/trips/${p}`),
  get: (slug) => request(`/admin-api/trips/${slug}/`),
  create: (d) => request('/admin-api/trips/', { method: 'POST', body: JSON.stringify(d) }),
  update: (slug, d) => request(`/admin-api/trips/${slug}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  delete: (slug) => request(`/admin-api/trips/${slug}/`, { method: 'DELETE' }),
  manifest: (slug) => request(`/admin-api/trips/${slug}/manifest/`),
  updateStatus: (slug, s) =>
    request(`/admin-api/trips/${slug}/update-status/`, { method: 'PATCH', body: JSON.stringify({ status: s }) }),
};

export const adminStageRuns = {
  list: (p = '') => request(`/admin-api/stage-runs/${p}`),
  get: (slug) => request(`/admin-api/stage-runs/${slug}/`),
  create: (d) => request('/admin-api/stage-runs/', { method: 'POST', body: JSON.stringify(d) }),
  update: (slug, d) => request(`/admin-api/stage-runs/${slug}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  delete: (slug) => request(`/admin-api/stage-runs/${slug}/`, { method: 'DELETE' }),
  manifest: (slug) => request(`/admin-api/stage-runs/${slug}/manifest/`),
  updateStatus: (slug, s) =>
    request(`/admin-api/stage-runs/${slug}/update-status/`, { method: 'PATCH', body: JSON.stringify({ status: s }) }),
};

export const adminBookings = {
  list: (p = '') => request(`/admin-api/bookings/${p}`),
  get: (ref) => request(`/admin-api/bookings/${ref}/`),
  confirm: (ref) => request(`/admin-api/bookings/${ref}/confirm/`, { method: 'POST' }),
  cancel: (ref) => request(`/admin-api/bookings/${ref}/cancel/`, { method: 'POST' }),
};

export const adminDrivers = {
  list: (p = '') => request(`/admin-api/drivers/${p}`),
  get: (id) => request(`/admin-api/drivers/${id}/`),
  create: (d) => request('/admin-api/drivers/', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d) => request(`/admin-api/drivers/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  delete: (id) => request(`/admin-api/drivers/${id}/`, { method: 'DELETE' }),
  toggleStatus: (id) => request(`/admin-api/drivers/${id}/toggle-status/`, { method: 'POST' }),
};