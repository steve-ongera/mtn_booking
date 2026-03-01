// frontend/src/pages/TrackBooking.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function TrackBooking() {
  const { reference } = useParams();
  const navigate = useNavigate();
  const [ref, setRef] = useState(reference !== "enter" ? reference : "");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (reference && reference !== "enter") {
      handleTrack(reference);
    }
  }, [reference]);

  const handleTrack = async (r) => {
    setLoading(true);
    setError("");
    try {
      const data = await api.trackBooking(r || ref);
      setBooking(data);
    } catch {
      setError("Booking not found. Check your reference number.");
    } finally {
      setLoading(false);
    }
  };

  const seats = booking?.booked_seats?.map(bs => bs.seat_number).join(", ");
  const trip = booking?.trip_info || booking?.stage_run_info;
  const statusColor = { confirmed: "#059669", pending: "#f59e0b", cancelled: "#dc2626" };

  return (
    <div style={{ maxWidth: 540, margin: "48px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Track Booking</h1>
      <p style={{ color: "#6b7280", marginBottom: 28 }}>Enter your booking reference to check status.</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
        <input
          value={ref}
          onChange={e => setRef(e.target.value.toUpperCase())}
          placeholder="e.g. MTN1A2B3C4D"
          style={{
            flex: 1, padding: "12px 16px", borderRadius: 10,
            border: "2px solid #e5e7eb", fontSize: 16,
            fontFamily: "monospace", letterSpacing: 2,
          }}
          onKeyDown={e => e.key === "Enter" && handleTrack()}
        />
        <button
          onClick={() => handleTrack()}
          disabled={loading || !ref}
          style={{
            padding: "12px 20px", background: "#007A3D",
            color: "#fff", border: "none", borderRadius: 10,
            fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}
        >
          {loading ? "..." : "Find"}
        </button>
      </div>

      {error && (
        <div style={{ padding: 16, background: "#fef2f2", borderRadius: 10, color: "#dc2626", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {booking && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#111827" }}>{booking.reference}</div>
            <span style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800,
              background: statusColor[booking.status] + "20",
              color: statusColor[booking.status] || "#6b7280",
            }}>
              {booking.status.toUpperCase()}
            </span>
          </div>

          {[
            ["Passenger", booking.passenger_name],
            ["Phone", booking.passenger_phone],
            ["Route", trip ? `${trip.origin} → ${trip.destination}` : "—"],
            ["Date", trip?.departure_date || trip?.run_date],
            ["Seats", seats],
            ["Amount", `KES ${booking.total_amount}`],
          ].map(([label, value]) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between",
              padding: "9px 0", borderBottom: "1px solid #f3f4f6", fontSize: 14,
            }}>
              <span style={{ color: "#6b7280" }}>{label}</span>
              <span style={{ fontWeight: 700 }}>{value}</span>
            </div>
          ))}

          <button
            onClick={() => navigate("/")}
            style={{ width: "100%", marginTop: 20, padding: 12, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}
          >
            Book Another Seat
          </button>
        </div>
      )}
    </div>
  );
}