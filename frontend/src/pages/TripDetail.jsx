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
  const [step, setStep] = useState(1);
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

  if (loading) {
    return (
      <div className="trip-loading">
        <div className="spinner lg" />
        <p>Loading trip details...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="trip-not-found">
        <i className="bi bi-exclamation-circle" />
        <h3>Trip Not Found</h3>
        <p>The trip you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  const fare = parseFloat(trip.fare || 0);
  const totalFare = fare * selectedSeats.length;
  const seats = trip.seat_layout || trip.bus_layout || [];
  const stops = trip.route_stops || [];

  return (
    <div className="trip-detail-page">
      <div className="trip-detail-container">
        {/* Back Button */}
        <button
          onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
          className="back-button"
        >
          <i className={`bi bi-arrow-${step > 1 ? 'left' : 'left'}`} />
          {step > 1 ? 'Back to Seat Selection' : 'Back to Results'}
        </button>

        {/* Trip Summary Card */}
        <div className="trip-summary-card">
          <div className="trip-summary-content">
            <div>
              <div className="trip-route">
                <span className="trip-origin">{trip.origin}</span>
                <i className="bi bi-arrow-right" />
                <span className="trip-destination">{trip.destination}</span>
              </div>
              <div className="trip-meta">
                <span className="trip-vehicle">
                  <i className="bi bi-bus-front" />
                  {trip.matatu_name}
                </span>
                <span className="trip-plate">{trip.plate_number}</span>
                <span className="trip-time">
                  <i className="bi bi-clock" />
                  {trip.departure_time?.slice(0,5) || trip.run_number && `Run #${trip.run_number}`}
                </span>
              </div>
            </div>
            <div className="trip-fare">
              <span className="fare-amount">KES {fare}</span>
              <span className="fare-label">per seat</span>
            </div>
          </div>
        </div>

        {/* Step Progress */}
        <div className="step-progress">
          {[
            { step: 1, label: "Select Seat", icon: "bi-grid-3x3-gap" },
            { step: 2, label: "Your Details", icon: "bi-person" },
            { step: 3, label: "Payment", icon: "bi-phone" },
          ].map((item, idx) => (
            <div key={item.step} className="step-item">
              <div className={`step-indicator ${step >= item.step ? 'active' : ''}`}>
                <i className={`bi ${item.icon}`} />
              </div>
              <span className={`step-label ${step >= item.step ? 'active' : ''}`}>
                {item.label}
              </span>
              {idx < 2 && <div className={`step-connector ${step > item.step ? 'active' : ''}`} />}
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-circle-fill" />
            <span>{error}</span>
            <button onClick={() => setError("")} className="alert-close">
              <i className="bi bi-x" />
            </button>
          </div>
        )}

        {/* Step 1: Seat Selection */}
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <h2>Choose Your Seats</h2>
              {selectedSeats.length > 0 && (
                <span className="selected-count">{selectedSeats.length} selected</span>
              )}
            </div>

            <div className="seat-map-container">
              <SeatMap
                seats={seats}
                slug={slug}
                isStageRun={isStageRun}
                onSelectionChange={setSelectedSeats}
              />
            </div>

            {/* Legend */}
            <div className="seat-legend">
              <div className="legend-item">
                <div className="legend-color available" />
                <span>Available</span>
              </div>
              <div className="legend-item">
                <div className="legend-color selected" />
                <span>Selected</span>
              </div>
              <div className="legend-item">
                <div className="legend-color booked" />
                <span>Booked</span>
              </div>
              <div className="legend-item">
                <div className="legend-color driver" />
                <span>Driver</span>
              </div>
            </div>

            {/* Route Stops */}
            {stops.length > 0 && (
              <div className="route-stops">
                <h3>
                  <i className="bi bi-signpost-split" />
                  Route Stops
                </h3>
                <div className="stops-grid">
                  {stops.map(s => (
                    <div key={s.id} className="stop-item">
                      <span className="stop-order">{s.order}</span>
                      <span className="stop-name">{s.stage_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selection Summary */}
            <div className="selection-summary">
              <div className="summary-row">
                <span>Selected Seats:</span>
                <span className="selected-seats">
                  {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}
                </span>
              </div>
              {selectedSeats.length > 0 && (
                <div className="summary-row total">
                  <span>Total Fare:</span>
                  <span className="total-amount">KES {totalFare.toLocaleString()}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleProceedToInfo}
              disabled={selectedSeats.length === 0}
              className={`btn btn-primary btn-block btn-lg ${selectedSeats.length === 0 ? 'disabled' : ''}`}
            >
              Continue to Passenger Details
              <i className="bi bi-arrow-right" />
            </button>
          </div>
        )}

        {/* Step 2: Passenger Info */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <h2>Passenger Details</h2>
              <p>Enter your information to complete the booking</p>
            </div>

            <form onSubmit={handleCreateBooking} className="passenger-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.passenger_name}
                    onChange={e => setForm(f => ({ ...f, passenger_name: e.target.value }))}
                    required
                    className="form-control"
                    placeholder="John Doe"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Phone Number (M-Pesa) <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.passenger_phone}
                    onChange={e => setForm(f => ({ ...f, passenger_phone: e.target.value }))}
                    required
                    className="form-control"
                    placeholder="0712 345 678"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    value={form.passenger_email}
                    onChange={e => setForm(f => ({ ...f, passenger_email: e.target.value }))}
                    className="form-control"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ID Number</label>
                  <input
                    type="text"
                    value={form.passenger_id_number}
                    onChange={e => setForm(f => ({ ...f, passenger_id_number: e.target.value }))}
                    className="form-control"
                    placeholder="12345678"
                  />
                </div>
              </div>

              {stops.length > 0 && (
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Boarding Stage</label>
                    <select
                      value={form.boarding_stage_slug}
                      onChange={e => setForm(f => ({ ...f, boarding_stage_slug: e.target.value }))}
                      className="form-control"
                    >
                      <option value="">Select boarding stage</option>
                      {stops.map(s => (
                        <option key={s.id} value={s.stage}>{s.stage_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alighting Stage</label>
                    <select
                      value={form.alighting_stage_slug}
                      onChange={e => setForm(f => ({ ...f, alighting_stage_slug: e.target.value }))}
                      className="form-control"
                    >
                      <option value="">Select alighting stage</option>
                      {stops.map(s => (
                        <option key={s.id} value={s.stage}>{s.stage_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Booking Summary */}
              <div className="booking-summary">
                <h4>Booking Summary</h4>
                <div className="summary-details">
                  <div className="summary-item">
                    <span>Seats:</span>
                    <span className="summary-seats">{selectedSeats.join(", ")}</span>
                  </div>
                  <div className="summary-item">
                    <span>Fare per seat:</span>
                    <span>KES {fare.toLocaleString()}</span>
                  </div>
                  <div className="summary-item">
                    <span>Number of seats:</span>
                    <span>{selectedSeats.length}</span>
                  </div>
                  <div className="summary-item total">
                    <span>Total Amount:</span>
                    <span className="total-fare">KES {totalFare.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={paymentLoading}
                className="btn btn-primary btn-block btn-lg"
              >
                {paymentLoading ? (
                  <>
                    <span className="spinner spinner-sm" />
                    Creating Booking...
                  </>
                ) : (
                  <>
                    Confirm & Proceed to Payment
                    <i className="bi bi-arrow-right" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && booking && (
          <div className="step-content payment-step">
            <div className="payment-header">
              <div className="payment-icon">
                <i className="bi bi-phone" />
              </div>
              <h2>Complete Payment via M-Pesa</h2>
              <p>You'll receive an STK Push on your phone</p>
            </div>

            <div className="payment-details">
              <div className="detail-card">
                <div className="detail-row">
                  <span>Booking Reference</span>
                  <span className="reference">{booking.reference}</span>
                </div>
                <div className="detail-row">
                  <span>Amount to Pay</span>
                  <span className="amount">KES {booking.total_amount?.toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span>Phone Number</span>
                  <span className="phone">{form.passenger_phone}</span>
                </div>
              </div>
            </div>

            {!paymentStatus ? (
              <div className="payment-action">
                <p className="payment-note">
                  We'll send an STK Push to <strong>{form.passenger_phone}</strong>. 
                  Enter your M-Pesa PIN to complete the payment.
                </p>
                <button
                  onClick={handleInitiatePayment}
                  disabled={paymentLoading}
                  className="btn btn-primary btn-lg"
                >
                  {paymentLoading ? (
                    <>
                      <span className="spinner spinner-sm" />
                      Sending STK Push...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send" />
                      Send M-Pesa Request
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="payment-status">
                {paymentStatus.booking_status === "confirmed" ? (
                  <div className="status-success">
                    <div className="status-icon">
                      <i className="bi bi-check-circle-fill" />
                    </div>
                    <h3>Payment Confirmed!</h3>
                    <p>Redirecting to your booking...</p>
                    <div className="spinner" />
                  </div>
                ) : paymentStatus.payment_status === "failed" ? (
                  <div className="status-failed">
                    <div className="status-icon">
                      <i className="bi bi-x-circle-fill" />
                    </div>
                    <h3>Payment Failed</h3>
                    <p>{paymentStatus.message || "Something went wrong. Please try again."}</p>
                    <button
                      onClick={() => setPaymentStatus(null)}
                      className="btn btn-primary"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="status-pending">
                    <div className="status-icon">
                      <i className="bi bi-hourglass-split" />
                    </div>
                    <h3>Waiting for Payment</h3>
                    <p>Please check your phone and enter your M-Pesa PIN</p>
                    <div className="spinner" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .trip-detail-page {
          padding-top: var(--header-height);
          min-height: 100vh;
          background: var(--gray-50);
        }

        .trip-detail-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 32px 24px;
        }

        /* Back Button */
        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: var(--radius);
          padding: 10px 16px;
          color: var(--gray-700);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 24px;
        }

        .back-button:hover {
          background: var(--gray-50);
          border-color: var(--gray-300);
          transform: translateX(-4px);
        }

        /* Trip Summary Card */
        .trip-summary-card {
          background: white;
          border-radius: var(--radius-xl);
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow);
          overflow: hidden;
          margin-bottom: 32px;
        }

        .trip-summary-content {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .trip-route {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .trip-origin,
        .trip-destination {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
        }

        .trip-route i {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.2rem;
        }

        .trip-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .trip-vehicle,
        .trip-plate,
        .trip-time {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
        }

        .trip-plate {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
        }

        .trip-fare {
          text-align: right;
        }

        .fare-amount {
          display: block;
          font-size: 2rem;
          font-weight: 900;
          color: white;
          line-height: 1;
        }

        .fare-label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
        }

        /* Step Progress */
        .step-progress {
          display: flex;
          align-items: center;
          margin-bottom: 32px;
          background: white;
          padding: 20px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--gray-200);
        }

        .step-item {
          flex: 1;
          display: flex;
          align-items: center;
          position: relative;
        }

        .step-indicator {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--gray-100);
          border: 2px solid var(--gray-200);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gray-400);
          transition: all 0.3s;
        }

        .step-indicator.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .step-label {
          margin-left: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--gray-500);
        }

        .step-label.active {
          color: var(--primary);
          font-weight: 600;
        }

        .step-connector {
          flex: 1;
          height: 2px;
          background: var(--gray-200);
          margin: 0 12px;
        }

        .step-connector.active {
          background: var(--primary);
        }

        /* Step Content */
        .step-content {
          background: white;
          border-radius: var(--radius-xl);
          border: 1px solid var(--gray-200);
          padding: 32px;
          box-shadow: var(--shadow);
        }

        .step-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .step-header h2 {
          margin: 0;
          font-size: 1.25rem;
        }

        .step-header p {
          margin: 4px 0 0;
          color: var(--gray-500);
        }

        .selected-count {
          background: var(--primary-light);
          color: var(--primary);
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        /* Seat Legend */
        .seat-legend {
          display: flex;
          gap: 24px;
          margin: 24px 0;
          padding: 16px;
          background: var(--gray-50);
          border-radius: var(--radius);
          border: 1px solid var(--gray-200);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--gray-600);
        }

        .legend-color {
          width: 20px;
          height: 20px;
          border-radius: 4px;
        }

        .legend-color.available {
          background: var(--green-100);
          border: 1px solid var(--green-300);
        }

        .legend-color.selected {
          background: #dbeafe;
          border: 1px solid #93c5fd;
        }

        .legend-color.booked {
          background: #fee2e2;
          border: 1px solid #fca5a5;
        }

        .legend-color.driver {
          background: var(--gray-800);
          border: 1px solid var(--gray-700);
        }

        /* Route Stops */
        .route-stops {
          margin: 24px 0;
        }

        .route-stops h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
          margin-bottom: 16px;
        }

        .stops-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }

        .stop-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius);
        }

        .stop-order {
          width: 24px;
          height: 24px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .stop-name {
          font-size: 0.9rem;
          color: var(--gray-700);
        }

        /* Selection Summary */
        .selection-summary {
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius);
          padding: 20px;
          margin: 24px 0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          color: var(--gray-600);
        }

        .summary-row.total {
          border-top: 1px solid var(--gray-200);
          margin-top: 8px;
          padding-top: 16px;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--gray-900);
        }

        .selected-seats {
          font-weight: 600;
          color: var(--primary);
        }

        .total-amount {
          font-size: 1.25rem;
          color: var(--success);
        }

        /* Forms */
        .passenger-form {
          margin-top: 24px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--gray-700);
        }

        .required {
          color: var(--danger);
        }

        .form-control {
          height: 48px;
          padding: 0 16px;
          border: 1.5px solid var(--gray-200);
          border-radius: var(--radius);
          font-family: var(--font-body);
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px var(--primary-glow);
        }

        select.form-control {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 40px;
        }

        /* Booking Summary */
        .booking-summary {
          background: var(--primary-light);
          border: 1px solid var(--primary-border);
          border-radius: var(--radius-lg);
          padding: 24px;
          margin: 24px 0;
        }

        .booking-summary h4 {
          margin: 0 0 16px;
          color: var(--primary-dark);
        }

        .summary-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--gray-700);
        }

        .summary-item.total {
          border-top: 1px solid var(--primary-border);
          margin-top: 8px;
          padding-top: 16px;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--gray-900);
        }

        .summary-seats {
          font-weight: 600;
          color: var(--primary);
        }

        .total-fare {
          color: var(--success);
          font-size: 1.25rem;
        }

        /* Payment Step */
        .payment-step {
          text-align: center;
        }

        .payment-header {
          margin-bottom: 32px;
        }

        .payment-icon {
          width: 64px;
          height: 64px;
          background: var(--primary-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: var(--primary);
          font-size: 1.75rem;
        }

        .payment-header h2 {
          margin: 0 0 8px;
        }

        .payment-header p {
          color: var(--gray-500);
          margin: 0;
        }

        .payment-details {
          max-width: 400px;
          margin: 0 auto 32px;
        }

        .detail-card {
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-lg);
          padding: 24px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--gray-200);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-row span:first-child {
          color: var(--gray-500);
          font-size: 0.9rem;
        }

        .reference {
          font-family: var(--font-mono);
          font-weight: 700;
          color: var(--primary);
        }

        .amount {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--success);
        }

        .phone {
          font-weight: 600;
          color: var(--gray-900);
        }

        .payment-note {
          color: var(--gray-600);
          margin-bottom: 24px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .payment-action {
          margin-top: 24px;
        }

        /* Payment Status */
        .payment-status {
          text-align: center;
          padding: 24px;
        }

        .status-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .status-success .status-icon {
          color: var(--success);
        }

        .status-failed .status-icon {
          color: var(--danger);
        }

        .status-pending .status-icon {
          color: var(--warning);
        }

        .status-success h3,
        .status-failed h3,
        .status-pending h3 {
          margin: 0 0 8px;
        }

        .status-success p,
        .status-failed p,
        .status-pending p {
          color: var(--gray-500);
          margin: 0 0 20px;
        }

        /* Loading States */
        .trip-loading {
          text-align: center;
          padding: 80px 20px;
        }

        .trip-loading p {
          margin-top: 16px;
          color: var(--gray-500);
        }

        .trip-not-found {
          text-align: center;
          padding: 80px 20px;
          max-width: 400px;
          margin: 0 auto;
        }

        .trip-not-found i {
          font-size: 3rem;
          color: var(--danger);
          margin-bottom: 16px;
        }

        .trip-not-found h3 {
          margin: 0 0 8px;
        }

        .trip-not-found p {
          color: var(--gray-500);
          margin: 0 0 24px;
        }

        /* Buttons */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: var(--radius);
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
          outline: none;
          line-height: 1;
        }

        .btn-lg {
          padding: 16px 32px;
          font-size: 1rem;
        }

        .btn-block {
          width: 100%;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
          box-shadow: var(--shadow-green);
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--primary-dark);
          transform: translateY(-1px);
          box-shadow: var(--shadow-lg);
        }

        .btn-primary.disabled,
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Spinner */
        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--gray-200);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .spinner-sm {
          width: 16px;
          height: 16px;
          border-width: 2px;
        }

        .spinner.lg {
          width: 48px;
          height: 48px;
          border-width: 3px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Alert */
        .alert {
          position: relative;
          padding: 16px 20px;
          padding-right: 48px;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .alert-danger {
          background: var(--danger-light);
          border: 1px solid var(--danger);
          color: var(--danger);
        }

        .alert-close {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: currentColor;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .trip-detail-container {
            padding: 16px;
          }

          .step-progress {
            flex-direction: column;
            gap: 16px;
          }

          .step-item {
            width: 100%;
          }

          .step-connector {
            display: none;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .trip-summary-content {
            flex-direction: column;
            text-align: center;
          }

          .trip-fare {
            text-align: center;
          }

          .seat-legend {
            flex-wrap: wrap;
          }
        }

        @media (max-width: 480px) {
          .step-content {
            padding: 20px;
          }

          .trip-route {
            flex-direction: column;
            gap: 4px;
          }

          .trip-route i {
            transform: rotate(90deg);
          }
        }
      `}</style>
    </div>
  );
}