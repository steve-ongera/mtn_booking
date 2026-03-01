// frontend/src/pages/TripDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import SeatMap from "../components/SeatMap";

export default function TripDetail({ isStageRun = false }) {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [form, setForm] = useState({
    passenger_name: "",
    passenger_phone: "",
    passenger_email: "",
    passenger_id_number: "",
    boarding_stage_slug: "",
    alighting_stage_slug: "",
  });
  const [step, setStep] = useState(1); // 1=select seats, 2=passenger info, 3=payment
  const [booking, setBooking] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fn = isStageRun ? api.getStageRunDetail : api.getTripDetail;
    fn(slug)
      .then(data => setTrip(data))
      .catch(() => setError("Could not load trip details"))
      .finally(() => setLoading(false));
  }, [slug, isStageRun]);

  const handleProceedToInfo = () => {
    if (selectedSeats.length === 0) {
      setError("Please select at least one seat.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setError("");
    setPaymentLoading(true);

    const payload = {
      ...form,
      seat_numbers: selectedSeats,
      ...(isStageRun
        ? { stage_run_slug: slug }
        : { trip_slug: slug }),
    };

    try {
      const b = await api.createBooking(payload);
      setBooking(b);
      setStep(3);
    } catch (err) {
      setError(err.seat_numbers?.[0] || err.error || "Booking failed. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleInitiatePayment = async () => {
    if (!form.passenger_phone) {
      setError("Phone number required for payment.");
      return;
    }
    setError("");
    setPaymentLoading(true);
    try {
      const res = await api.initiatePayment(booking.reference, form.passenger_phone);
      if (res.success) {
        // Poll payment status
        const interval = setInterval(async () => {
          const status = await api.getPaymentStatus(booking.reference);
          setPaymentStatus(status);
          if (status.booking_status === "confirmed") {
            clearInterval(interval);
            setTimeout(() => navigate(`/booking/${booking.reference}`), 1500);
          }
          if (status.payment_status === "failed") {
            clearInterval(interval);
          }
        }, 3000);
      }
    } catch (err) {
      setError(err.error || "Payment initiation failed.");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>
      <div style={{ fontSize: 40 }}>🚌</div>
      <div style={{ marginTop: 12 }}>Loading...</div>
    </div>
  );

  if (!trip) return (
    <div style={{ textAlign: "center", padding: 80, color: "#dc2626" }}>
      Trip not found.
    </div>
  );

  const fare = parseFloat(trip.fare || 0);
  const totalFare = fare * selectedSeats.length;
  const seats = trip.seat_layout || trip.bus_layout || [];
  const stops = trip.route_stops || [];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      {/* Back */}
      <button
        onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
        style={{ background: "none", border: "none", color: "#007A3D", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 16 }}
      >
        ← {step > 1 ? "Back" : "Back to Results"}
      </button>

      {/* Trip summary bar */}
      <div style={{
        background: "#007A3D",
        color: "#fff",
        borderRadius: 14,
        padding: "16px 24px",
        marginBottom: 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            {trip.origin} → {trip.destination}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
            {trip.matatu_name} · {trip.plate_number} · {trip.departure_time?.slice(0,5) || trip.run_number && `Run #${trip.run_number}`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 900 }}>KES {fare}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>per seat</div>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 28, gap: 0 }}>
        {[["1", "Select Seat"], ["2", "Your Details"], ["3", "Payment"]].map(([num, label], idx) => (
          <div key={num} style={{ display: "flex", alignItems: "center", flex: idx < 2 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: step >= parseInt(num) ? "#007A3D" : "#e5e7eb",
                color: step >= parseInt(num) ? "#fff" : "#9ca3af",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 14,
              }}>{num}</div>
              <div style={{ fontSize: 11, color: step >= parseInt(num) ? "#007A3D" : "#9ca3af", marginTop: 4, fontWeight: 600 }}>
                {label}
              </div>
            </div>
            {idx < 2 && (
              <div style={{ flex: 1, height: 2, background: step > idx + 1 ? "#007A3D" : "#e5e7eb", margin: "0 8px", marginBottom: 20 }} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", borderRadius: 10, color: "#dc2626", marginBottom: 16, border: "1px solid #fecaca" }}>
          {error}
        </div>
      )}

      {/* Step 1: Seat Selection */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#111827" }}>
            Choose Your Seat{selectedSeats.length > 0 ? ` (${selectedSeats.length} selected)` : ""}
          </h2>
          <div style={{ overflowX: "auto", paddingBottom: 16 }}>
            <SeatMap
              seats={seats}
              slug={slug}
              isStageRun={isStageRun}
              onSelectionChange={setSelectedSeats}
            />
          </div>
          {stops.length > 0 && (
            <div style={{ marginTop: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 10 }}>Route Stops</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {stops.map(s => (
                  <span key={s.id} style={{
                    padding: "4px 12px", background: "#f3f4f6",
                    borderRadius: 20, fontSize: 13, color: "#374151",
                    border: "1px solid #e5e7eb",
                  }}>
                    {s.order}. {s.stage_name}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div style={{
            background: "#f9fafb", borderRadius: 12, padding: "16px 20px",
            marginBottom: 20, border: "1px solid #e5e7eb",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#374151" }}>
              <span>Seats selected:</span>
              <span style={{ fontWeight: 700 }}>
                {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}
              </span>
            </div>
            {selectedSeats.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "#007A3D", marginTop: 8 }}>
                <span>Total:</span>
                <span>KES {totalFare}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleProceedToInfo}
            disabled={selectedSeats.length === 0}
            style={{
              width: "100%", padding: 14, background: selectedSeats.length > 0 ? "#007A3D" : "#9ca3af",
              color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700,
              cursor: selectedSeats.length > 0 ? "pointer" : "not-allowed",
            }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* Step 2: Passenger Info */}
      {step === 2 && (
        <form onSubmit={handleCreateBooking}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#111827" }}>
            Your Details
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {[
              ["passenger_name", "Full Name", "text", true],
              ["passenger_phone", "Phone (M-Pesa)", "tel", true],
              ["passenger_email", "Email (optional)", "email", false],
              ["passenger_id_number", "ID Number (optional)", "text", false],
            ].map(([field, label, type, required]) => (
              <div key={field}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                  {label} {required && <span style={{ color: "#dc2626" }}>*</span>}
                </label>
                <input
                  type={type}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  required={required}
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 10,
                    border: "2px solid #e5e7eb", fontSize: 15, outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Boarding/Alighting stages */}
          {stops.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                  Boarding Stage
                </label>
                <select
                  value={form.boarding_stage_slug}
                  onChange={e => setForm(f => ({ ...f, boarding_stage_slug: e.target.value }))}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 15 }}
                >
                  <option value="">Select stage</option>
                  {stops.map(s => (
                    <option key={s.id} value={s.stage}>{s.stage_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                  Alighting Stage
                </label>
                <select
                  value={form.alighting_stage_slug}
                  onChange={e => setForm(f => ({ ...f, alighting_stage_slug: e.target.value }))}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 15 }}
                >
                  <option value="">Select stage</option>
                  {stops.map(s => (
                    <option key={s.id} value={s.stage}>{s.stage_name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Summary */}
          <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "16px 20px", marginBottom: 20, border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: 14, color: "#166534", fontWeight: 700, marginBottom: 8 }}>Booking Summary</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#374151" }}>
              <span>Seats: {selectedSeats.join(", ")}</span>
              <span style={{ fontWeight: 800, color: "#007A3D", fontSize: 18 }}>KES {totalFare}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={paymentLoading}
            style={{
              width: "100%", padding: 14, background: "#007A3D",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 16, fontWeight: 700, cursor: "pointer",
            }}
          >
            {paymentLoading ? "Creating Booking..." : "Confirm & Proceed to Payment →"}
          </button>
        </form>
      )}

      {/* Step 3: Payment */}
      {step === 3 && booking && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 8 }}>
            Pay via M-Pesa
          </h2>
          <div style={{ background: "#f3f4f6", borderRadius: 12, padding: "16px 24px", marginBottom: 24, display: "inline-block" }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Booking Reference</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#007A3D" }}>{booking.reference}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginTop: 8 }}>
              KES {booking.total_amount}
            </div>
          </div>

          {!paymentStatus && (
            <div>
              <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
                We'll send an STK Push to <strong>{form.passenger_phone}</strong>. Enter your M-Pesa PIN to pay.
              </p>
              <button
                onClick={handleInitiatePayment}
                disabled={paymentLoading}
                style={{
                  padding: "14px 40px", background: "#007A3D",
                  color: "#fff", border: "none", borderRadius: 12,
                  fontSize: 16, fontWeight: 700, cursor: "pointer",
                }}
              >
                {paymentLoading ? "Sending STK Push..." : "Send M-Pesa Request →"}
              </button>
            </div>
          )}

          {paymentStatus && (
            <div style={{ marginTop: 16 }}>
              {paymentStatus.booking_status === "confirmed" ? (
                <div style={{ color: "#059669", fontSize: 18, fontWeight: 700 }}>
                  ✅ Payment Confirmed! Redirecting...
                </div>
              ) : paymentStatus.payment_status === "failed" ? (
                <div style={{ color: "#dc2626" }}>
                  ❌ Payment failed. {paymentStatus.message}
                  <br />
                  <button
                    onClick={() => setPaymentStatus(null)}
                    style={{ marginTop: 12, padding: "10px 24px", background: "#007A3D", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div style={{ color: "#f59e0b", fontSize: 16 }}>
                  ⏳ Waiting for payment... Enter your M-Pesa PIN.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}