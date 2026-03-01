// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/global_style.css';

// Public pages
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import TripDetail from './pages/TripDetail';
import BookingConfirmation from './pages/BookingConfirmation';
import TrackBooking from './pages/TrackBooking';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMatatus from './pages/admin/AdminMatatus';
import AdminSeatLayout from './pages/admin/AdminSeatLayout';
import AdminTrips from './pages/admin/AdminTrips';
import AdminStageRuns from './pages/admin/AdminStageRuns';
import AdminBookings from './pages/admin/AdminBookings';
import AdminDrivers from './pages/admin/AdminDrivers';
import AdminRoutes from './pages/admin/AdminRoutes';
import AdminTowns from './pages/admin/AdminTowns';

function RequireAdmin({ children }) {
  const token = localStorage.getItem('access_token');
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

function PublicLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <Navbar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/search" element={<PublicLayout><SearchResults /></PublicLayout>} />
        <Route path="/trips/:slug" element={<PublicLayout><TripDetail /></PublicLayout>} />
        <Route path="/stage-runs/:slug" element={<PublicLayout><TripDetail isStageRun /></PublicLayout>} />
        <Route path="/booking/:reference" element={<PublicLayout><BookingConfirmation /></PublicLayout>} />
        <Route path="/track/:reference" element={<PublicLayout><TrackBooking /></PublicLayout>} />

        {/* Admin auth */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin panel */}
        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"            element={<AdminDashboard />} />
          <Route path="matatus"              element={<AdminMatatus />} />
          <Route path="matatus/:slug/layout" element={<AdminSeatLayout />} />
          <Route path="trips"                element={<AdminTrips />} />
          <Route path="stage-runs"           element={<AdminStageRuns />} />
          <Route path="bookings"             element={<AdminBookings />} />
          <Route path="drivers"              element={<AdminDrivers />} />
          <Route path="routes"               element={<AdminRoutes />} />
          <Route path="towns"                element={<AdminTowns />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}