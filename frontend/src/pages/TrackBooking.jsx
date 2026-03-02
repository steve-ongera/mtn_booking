// frontend/src/pages/TrackBooking.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";

const TRACK_IMAGE = "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80&fit=crop";

const STATUS_CONFIG = {
  confirmed: { color: "var(--success)", bg: "var(--success-light)", icon: "bi-check-circle-fill", label: "Confirmed" },
  pending:   { color: "var(--warning)", bg: "var(--warning-light)", icon: "bi-hourglass-split",   label: "Pending Payment" },
  cancelled: { color: "var(--danger)",  bg: "var(--danger-light)",  icon: "bi-x-circle-fill",     label: "Cancelled" },
  refunded:  { color: "var(--info)",    bg: "var(--info-light)",    icon: "bi-arrow-counterclockwise", label: "Refunded" },
};

export default function TrackBooking() {
  const { reference } = useParams();
  const navigate = useNavigate();
  const [ref, setRef] = useState(reference !== "enter" ? reference : "");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (reference && reference !== "enter") handleTrack(reference);
  }, [reference]);

  const handleTrack = async (r) => {
    const target = r || ref;
    if (!target) return;
    setLoading(true);
    setError("");
    setBooking(null);
    try {
      const data = await api.trackBooking(target);
      setBooking(data);
    } catch {
      setError("Booking not found. Check your reference number.");
    } finally {
      setLoading(false);
    }
  };

  const seats = booking?.booked_seats?.map(bs => bs.seat_number).join(", ");
  const trip = booking?.trip_info || booking?.stage_run_info;
  const statusCfg = STATUS_CONFIG[booking?.status] || STATUS_CONFIG.pending;

  const details = booking ? [
    { icon: "bi-person-fill", label: "Passenger", value: booking.passenger_name },
    { icon: "bi-telephone-fill", label: "Phone", value: booking.passenger_phone },
    { icon: "bi-envelope-fill", label: "Email", value: booking.passenger_email || "—" },
    { icon: "bi-arrow-right", label: "Route", value: trip ? `${trip.origin} → ${trip.destination}` : "—" },
    { icon: "bi-calendar3", label: "Date", value: trip?.departure_date || trip?.run_date || "—" },
    { icon: "bi-clock", label: "Time", value: trip?.departure_time?.slice(0, 5) || "—" },
    { icon: "bi-grid-3x3", label: "Seats", value: seats || "—" },
    { icon: "bi-cash-coin", label: "Amount", value: `KES ${booking.total_amount}` },
  ] : [];

  return (
    <div className="track-booking-page">

      {/* Hero Section */}
      <section className="track-hero">
        <div className="track-hero-overlay" />
        <img src={TRACK_IMAGE} alt="Track your MTN Sacco booking" className="track-hero-bg" />
        <div className="track-hero-content">
          <div className="track-hero-icon">
            <i className="bi bi-qr-code-scan" />
          </div>
          <h1 className="track-hero-title">Track Your Booking</h1>
          <p className="track-hero-description">
            Enter your booking reference to check status, view your seat, and get trip details.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="track-container">

        {/* Search Card */}
        <div className="ad-card track-search-card">
          <div className="ad-card-body">
            <div className="form-group">
              <label className="form-label">
                <i className="bi bi-ticket-perforated me-2" />
                Booking Reference
              </label>
              <div className="track-search-group">
                <div className="track-search-input-wrapper">
                  <i className="bi bi-search track-search-icon" />
                  <input
                    value={ref}
                    onChange={e => setRef(e.target.value.toUpperCase())}
                    placeholder="e.g. MTN1A2B3C4D"
                    className="form-control track-input"
                    style={{ 
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "2px",
                      paddingLeft: "40px"
                    }}
                    onKeyDown={e => e.key === "Enter" && handleTrack()}
                  />
                </div>
                <button
                  onClick={() => handleTrack()}
                  disabled={loading || !ref}
                  className="btn btn-primary track-search-btn"
                >
                  {loading ? (
                    <>
                      <span className="spinner spinner-sm" />
                      Checking
                    </>
                  ) : (
                    <>
                      <i className="bi bi-search" />
                      Find
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="track-hint">
              <i className="bi bi-info-circle me-1" />
              Your reference looks like <code>MTN1A2B3C4D</code> — found in your email or SMS confirmation.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger track-alert">
            <i className="bi bi-exclamation-circle-fill" />
            <div>
              <div className="fw-600">Not Found</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Booking Result */}
        {booking && (
          <div className="ad-card track-result-card">
            {/* Status Banner */}
            <div className="track-status-banner" style={{ background: statusCfg.bg }}>
              <div className="track-status-info">
                <i className={`bi ${statusCfg.icon}`} style={{ color: statusCfg.color }} />
                <div>
                  <div className="track-status-label" style={{ color: statusCfg.color }}>
                    {statusCfg.label}
                  </div>
                  <div className="track-status-ref">
                    Booking {booking.reference}
                  </div>
                </div>
              </div>
              <div className="track-reference">
                {booking.reference}
              </div>
            </div>

            {/* Route summary */}
            {trip && (
              <div className="track-route-summary">
                <div className="track-route-point">
                  <div className="track-route-city">{trip.origin}</div>
                  <div className="track-route-label">Origin</div>
                </div>
                <div className="track-route-arrow">
                  <i className="bi bi-arrow-right" />
                </div>
                <div className="track-route-point">
                  <div className="track-route-city">{trip.destination}</div>
                  <div className="track-route-label">Destination</div>
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="track-details-grid">
              {details.map(({ icon, label, value }, i) => (
                <div key={label} className="track-detail-item">
                  <div className="track-detail-label">
                    <i className={`bi ${icon}`} />
                    {label}
                  </div>
                  <div className="track-detail-value">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Seat visual indicator */}
            {seats && (
              <div className="track-seat-indicator">
                <i className="bi bi-grid-3x3" />
                <div>
                  <div className="track-seat-label">
                    YOUR SEAT{seats.includes(",") ? "S" : ""}
                  </div>
                  <div className="track-seat-numbers">
                    {seats}
                  </div>
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="track-footer-actions">
              <button
                onClick={() => { setBooking(null); setRef(""); setError(""); }}
                className="btn btn-outline-primary"
              >
                <i className="bi bi-arrow-left me-1" />
                Search Again
              </button>
              <button
                onClick={() => navigate("/")}
                className="btn btn-primary"
              >
                <i className="bi bi-plus me-1" />
                Book Another Seat
              </button>
            </div>
          </div>
        )}

        {/* Quick help */}
        {!booking && !error && !loading && (
          <div className="alert alert-info track-help-alert">
            <i className="bi bi-info-circle-fill" />
            <div>
              <div className="fw-600">Where's my reference?</div>
              <div>Check your email or SMS for a code starting with <code>MTN</code> — sent after booking.</div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .track-booking-page {
       
          min-height: 100vh;
          background: var(--gray-50);
        }

        /* Hero Section */
        .track-hero {
          position: relative;
          background: var(--gray-900);
          padding: 60px 24px;
          overflow: hidden;
        }

        .track-hero-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.12;
        }

        .track-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%);
          z-index: 1;
        }

        .track-hero-content {
          position: relative;
          z-index: 2;
          max-width: 560px;
          margin: 0 auto;
          text-align: center;
        }

        .track-hero-icon {
          width: 64px;
          height: 64px;
          background: rgba(255,255,255,0.1);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          border: 1px solid rgba(255,255,255,0.15);
        }

        .track-hero-icon i {
          font-size: 2rem;
          color: #fff;
        }

        .track-hero-title {
          color: #fff;
          font-weight: 800;
          font-size: clamp(28px, 5vw, 36px);
          margin: 0 0 12px;
        }

        .track-hero-description {
          color: rgba(255,255,255,0.6);
          font-size: 1rem;
          margin: 0;
        }

        /* Container */
        .track-container {
          max-width: 560px;
          margin: 0 auto;
          padding: 40px 20px 80px;
        }

        /* Search Card */
        .track-search-card {
          margin-bottom: 24px;
        }

        .track-search-group {
          display: flex;
          gap: 12px;
        }

        .track-search-input-wrapper {
          position: relative;
          flex: 1;
        }

        .track-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray-400);
          z-index: 1;
        }

        .track-input {
          height: 48px;
          width: 100%;
        }

        .track-search-btn {
          height: 48px;
          min-width: 100px;
        }

        .track-hint {
          margin: 16px 0 0;
          font-size: 0.85rem;
          color: var(--gray-500);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .track-hint code {
          background: var(--gray-100);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--primary);
        }

        /* Alerts */
        .track-alert {
          margin-bottom: 20px;
        }

        .track-help-alert {
          margin-top: 20px;
        }

        /* Result Card */
        .track-result-card {
          animation: slideUp 0.3s ease;
        }

        .track-status-banner {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--gray-200);
        }

        .track-status-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .track-status-info i {
          font-size: 1.5rem;
        }

        .track-status-label {
          font-weight: 700;
          font-size: 1rem;
          margin-bottom: 2px;
        }

        .track-status-ref {
          font-size: 0.8rem;
          color: var(--gray-500);
        }

        .track-reference {
          font-family: var(--font-mono);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--gray-800);
          letter-spacing: 0.05em;
        }

        .track-route-summary {
          padding: 20px 24px;
          background: var(--gray-50);
          border-bottom: 1px solid var(--gray-200);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
        }

        .track-route-point {
          text-align: center;
        }

        .track-route-city {
          font-weight: 800;
          font-size: 1.2rem;
          color: var(--gray-900);
          margin-bottom: 4px;
        }

        .track-route-label {
          font-size: 0.75rem;
          color: var(--gray-500);
        }

        .track-route-arrow i {
          color: var(--primary);
          font-size: 1.3rem;
        }

        .track-details-grid {
          padding: 8px 24px;
        }

        .track-detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--gray-100);
        }

        .track-detail-item:last-child {
          border-bottom: none;
        }

        .track-detail-label {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--gray-500);
          font-size: 0.9rem;
        }

        .track-detail-label i {
          width: 18px;
          color: var(--gray-400);
        }

        .track-detail-value {
          font-weight: 600;
          color: var(--gray-800);
          font-size: 0.95rem;
          text-align: right;
        }

        .track-seat-indicator {
          margin: 0 24px 24px;
          padding: 16px 20px;
          background: var(--primary-soft);
          border-radius: var(--radius);
          border: 1px solid var(--primary-light);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .track-seat-indicator i {
          color: var(--primary);
          font-size: 1.2rem;
        }

        .track-seat-label {
          font-size: 0.8rem;
          color: var(--primary);
          font-weight: 600;
          margin-bottom: 4px;
        }

        .track-seat-numbers {
          font-family: var(--font-mono);
          font-weight: 700;
          color: var(--primary-dark);
          font-size: 1.1rem;
        }

        .track-footer-actions {
          padding: 20px 24px;
          border-top: 1px solid var(--gray-200);
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive */
        @media (max-width: 480px) {
          .track-search-group {
            flex-direction: column;
          }
          
          .track-search-btn {
            width: 100%;
          }
          
          .track-status-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .track-footer-actions {
            flex-direction: column;
          }
          
          .track-footer-actions .btn {
            width: 100%;
          }
          
          .track-route-summary {
            gap: 12px;
          }
          
          .track-route-city {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}