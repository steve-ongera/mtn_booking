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
    <div style={{ paddingTop: "var(--header-height)", minHeight: "100vh", background: "var(--gray-50)" }}>

      {/* ── Hero ── */}
      <div style={{
        background: "var(--gray-900)",
        padding: "40px 24px",
        position: "relative",
        overflow: "hidden",
      }}>
        <img
          src={TRACK_IMAGE}
          alt="Track your MTN Sacco booking"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", opacity: .12,
          }}
        />
        <div style={{ position: "relative", maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            width: 56, height: 56,
            background: "rgba(255,255,255,.1)",
            borderRadius: "var(--radius-lg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            border: "1px solid rgba(255,255,255,.15)",
          }}>
            <i className="bi bi-qr-code-scan" style={{ fontSize: "1.6rem", color: "#fff" }} />
          </div>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(24px, 4vw, 32px)", margin: "0 0 8px" }}>
            Track Your Booking
          </h1>
          <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".9rem", margin: 0 }}>
            Enter your booking reference to check status, view your seat, and get trip details.
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px 60px" }}>

        {/* Search Card */}
        <div className="ad-card" style={{ marginBottom: 24 }}>
          <div className="ad-card-pad">
            <div className="ad-form-group" style={{ marginBottom: 12 }}>
              <label className="ad-label">
                <i className="bi bi-ticket-perforated" style={{ marginRight: 5 }} />
                Booking Reference
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <div className="ad-search-wrap" style={{ flex: 1 }}>
                  <i className="bi bi-search" />
                  <input
                    value={ref}
                    onChange={e => setRef(e.target.value.toUpperCase())}
                    placeholder="e.g. MTN1A2B3C4D"
                    className="ad-search-input"
                    style={{
                      width: "100%",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "2px",
                      fontSize: ".9rem",
                      minWidth: "unset",
                    }}
                    onKeyDown={e => e.key === "Enter" && handleTrack()}
                  />
                </div>
                <button
                  onClick={() => handleTrack()}
                  disabled={loading || !ref}
                  className="btn-ad btn-ad-primary"
                  style={{ flexShrink: 0 }}
                >
                  {loading
                    ? <><span className="ad-spinner ad-spinner-sm ad-spinner-white" /> Checking</>
                    : <><i className="bi bi-search" /> Find</>
                  }
                </button>
              </div>
            </div>

            <p className="text-sm text-muted" style={{ margin: 0 }}>
              <i className="bi bi-info-circle" style={{ marginRight: 4 }} />
              Your reference looks like <code>MTN1A2B3C4D</code> — found in your email or SMS confirmation.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="ad-alert ad-alert-error">
            <i className="bi bi-exclamation-circle-fill" />
            <div>
              <div style={{ fontWeight: 600 }}>Not Found</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Booking Result */}
        {booking && (
          <div className="ad-card" style={{ animation: "slideUp .2s ease" }}>

            {/* Status Banner */}
            <div style={{
              background: statusCfg.bg,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              borderBottom: "1px solid var(--gray-100)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <i className={`bi ${statusCfg.icon}`} style={{ color: statusCfg.color, fontSize: "1.3rem" }} />
                <div>
                  <div style={{ fontWeight: 800, color: statusCfg.color, fontSize: ".95rem" }}>
                    {statusCfg.label}
                  </div>
                  <div style={{ fontSize: ".75rem", color: "var(--gray-500)" }}>
                    Booking {booking.reference}
                  </div>
                </div>
              </div>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "var(--gray-800)",
                letterSpacing: ".05em",
              }}>
                {booking.reference}
              </div>
            </div>

            {/* Route summary */}
            {trip && (
              <div style={{
                padding: "16px 20px",
                background: "var(--blue-50)",
                borderBottom: "1px solid var(--gray-100)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "var(--gray-900)" }}>{trip.origin}</div>
                  <div className="text-xs text-muted">Origin</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <i className="bi bi-arrow-right" style={{ color: "var(--primary)", fontSize: "1.2rem" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "var(--gray-900)" }}>{trip.destination}</div>
                  <div className="text-xs text-muted">Destination</div>
                </div>
              </div>
            )}

            {/* Details */}
            <div style={{ padding: "0 20px" }}>
              {details.map(({ icon, label, value }, i) => (
                <div key={label} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "11px 0",
                  borderBottom: i < details.length - 1 ? "1px solid var(--gray-100)" : "none",
                  gap: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--gray-500)", fontSize: ".85rem" }}>
                    <i className={`bi ${icon}`} style={{ width: 16, textAlign: "center", color: "var(--gray-400)" }} />
                    {label}
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--gray-800)", fontSize: ".88rem", textAlign: "right" }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Seat visual indicator */}
            {seats && (
              <div style={{
                margin: "0 20px 20px",
                padding: "12px 16px",
                background: "var(--blue-50)",
                borderRadius: "var(--radius)",
                border: "1px solid var(--primary-border)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <i className="bi bi-grid-3x3" style={{ color: "var(--primary)", fontSize: "1.1rem" }} />
                <div>
                  <div style={{ fontSize: ".75rem", color: "var(--primary)", fontWeight: 600, marginBottom: 2 }}>
                    YOUR SEAT{seats.includes(",") ? "S" : ""}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--blue-800)", fontSize: "1rem" }}>
                    {seats}
                  </div>
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="ad-modal-footer" style={{ borderTop: "1px solid var(--gray-100)", justifyContent: "space-between" }}>
              <button
                onClick={() => { setBooking(null); setRef(""); setError(""); }}
                className="btn-ad btn-ad-ghost btn-ad-sm"
              >
                <i className="bi bi-arrow-left" /> Search Again
              </button>
              <button
                onClick={() => navigate("/")}
                className="btn-ad btn-ad-primary btn-ad-sm"
              >
                <i className="bi bi-plus" /> Book Another Seat
              </button>
            </div>
          </div>
        )}

        {/* Quick help */}
        {!booking && !error && !loading && (
          <div className="ad-alert ad-alert-info" style={{ marginTop: 16 }}>
            <i className="bi bi-info-circle-fill" />
            <div>
              <div style={{ fontWeight: 600 }}>Where's my reference?</div>
              <div>Check your email or SMS for a code starting with <code>MTN</code> — sent after booking.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}