// frontend/src/pages/BookingConfirmation.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function BookingConfirmation() {
  const { reference } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.trackBooking(reference)
      .then(setBooking)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reference]);

  if (loading) return <div style={{ textAlign: "center", padding: 80 }}>Loading...</div>;
  if (!booking) return (
    <div style={{ textAlign: "center", padding: 80 }}>
      <div style={{ fontSize: 48 }}>😕</div>
      <div>Booking not found.</div>
      <button onClick={() => navigate("/")} style={{ marginTop: 16, padding: "10px 24px", background: "#007A3D", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
        Go Home
      </button>
    </div>
  );

  const seats = booking.booked_seats?.map(bs => bs.seat_number).join(", ");
  const trip = booking.trip_info || booking.stage_run_info;
  const isConfirmed = booking.status === "confirmed";

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: "0 16px" }}>
      <div style={{
        background: "#fff", borderRadius: 20, overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
      }}>
        {/* Header */}
        <div style={{
          background: isConfirmed ? "#007A3D" : "#f59e0b",
          padding: "32px 24px",
          textAlign: "center",
          color: "#fff",
        }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>
            {isConfirmed ? "✅" : "⏳"}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {isConfirmed ? "Booking Confirmed!" : "Pending Payment"}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "28px 24px" }}>
          <div style={{
            background: "#f3f4f6", borderRadius: 12, padding: "16px 20px",
            textAlign: "center", marginBottom: 24,
          }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>REFERENCE</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#007A3D", letterSpacing: 2 }}>
              {booking.reference}
            </div>
          </div>

          {[
            ["Passenger", booking.passenger_name],
            ["Phone", booking.passenger_phone],
            ["Seats", seats],
            ["Route", trip ? `${trip.origin} → ${trip.destination}` : "—"],
            ["Date", trip?.departure_date || trip?.run_date],
            ["Departure", trip?.departure_time?.slice(0, 5) || `Run #${trip?.run_number}`],
            ["Total Paid", `KES ${booking.total_amount}`],
            ["Status", booking.status.toUpperCase()],
          ].map(([label, value]) => value && (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between",
              padding: "10px 0", borderBottom: "1px solid #f3f4f6",
              fontSize: 14,
            }}>
              <span style={{ color: "#6b7280", fontWeight: 600 }}>{label}</span>
              <span style={{ fontWeight: 700, color: "#111827" }}>{value}</span>
            </div>
          ))}

          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <button
              onClick={() => navigate("/")}
              style={{ flex: 1, padding: 12, background: "#007A3D", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}
            >
              Book Another
            </button>
            {!isConfirmed && (
              <button
                onClick={() => navigate(`/track/${reference}`)}
                style={{ flex: 1, padding: 12, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}
              >
                Track Payment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}