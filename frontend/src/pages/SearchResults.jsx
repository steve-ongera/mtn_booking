// frontend/src/pages/SearchResults.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";

const SEARCH_IMAGE = "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80&fit=crop";

function ResultCard({ item, type }) {
  const navigate = useNavigate();
  const isTrip = type === "trip";
  const available = item.available_seats;
  const isFull = available === 0;

  const handleBook = () => {
    const path = isTrip ? `/trips/${item.slug}` : `/stage-runs/${item.slug}`;
    navigate(path);
  };

  return (
    <div className={`result-card ${isFull ? 'full' : ''}`}>
      <div className="result-card-header">
        <div className="result-card-badges">
          <span className={`badge badge-${isTrip ? 'primary' : 'warning'}`}>
            <i className={`bi bi-${isTrip ? 'lightning-charge' : 'bus-front'}`} />
            {isTrip ? "Express Trip" : "Stage Run"}
          </span>
          
          {available > 0 ? (
            <span className="seat-availability available">
              <span className="status-dot success" />
              {available} {available === 1 ? 'seat' : 'seats'} left
            </span>
          ) : (
            <span className="seat-availability full">
              <span className="status-dot danger" />
              Fully Booked
            </span>
          )}
        </div>

        <div className="result-card-route">
          <div className="route-point">
            <div className="route-location">{item.origin}</div>
            <div className="route-stage">
              <i className="bi bi-geo-alt" />
              {item.origin_stage_name || "Main Stage"}
            </div>
          </div>

          <div className="route-connector">
            <i className="bi bi-arrow-right" />
            {isTrip && item.duration_minutes && (
              <span className="route-duration">{item.duration_minutes} min</span>
            )}
          </div>

          <div className="route-point text-right">
            <div className="route-location">{item.destination}</div>
            <div className="route-stage">
              <i className="bi bi-geo-alt" />
              {item.destination_stage_name || "Main Stage"}
            </div>
          </div>
        </div>

        <div className="result-card-details">
          {isTrip ? (
            <>
              <div className="detail-item">
                <div className="detail-label">
                  <i className="bi bi-clock" /> DEPARTURE
                </div>
                <div className="detail-value time">
                  {item.departure_time?.slice(0, 5)}
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <i className="bi bi-bus-front" /> VEHICLE
                </div>
                <div className="detail-value">
                  <span className="vehicle-name">{item.matatu_name}</span>
                  <span className="vehicle-plate">{item.plate_number}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="detail-item">
                <div className="detail-label">
                  <i className="bi bi-hash" /> RUN NUMBER
                </div>
                <div className="detail-value run-number">
                  #{item.run_number}
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <i className="bi bi-car-front" /> PLATE
                </div>
                <div className="detail-value">
                  <span className="vehicle-plate">{item.plate_number}</span>
                </div>
              </div>
            </>
          )}
          <div className="detail-item text-right">
            <div className="detail-label">
              <i className="bi bi-cash-coin" /> FARE
            </div>
            <div className="detail-value fare">
              KES {item.fare}
            </div>
          </div>
        </div>

        {item.amenities?.length > 0 && (
          <div className="result-card-amenities">
            {item.amenities.map(a => (
              <span key={a} className="amenity-tag">
                <i className={`bi bi-${
                  a === "WiFi" ? "wifi" :
                  a === "AC" ? "thermometer-snow" :
                  a === "USB" ? "usb-plug" :
                  a === "Music" ? "music-note" : "star"
                }`} />
                {a}
              </span>
            ))}
          </div>
        )}

        {item.total_seats && (
          <div className="result-card-capacity">
            <div className="capacity-header">
              <span className="capacity-label">Seat occupancy</span>
              <span className={`capacity-count ${isFull ? 'full' : available < 5 ? 'warning' : ''}`}>
                {item.total_seats - available}/{item.total_seats} filled
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className={`progress-fill ${isFull ? 'full' : available < 5 ? 'warning' : ''}`}
                style={{ width: `${((item.total_seats - available) / item.total_seats) * 100}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleBook}
          disabled={isFull}
          className={`btn ${isFull ? 'btn-secondary' : 'btn-primary'} btn-block`}
        >
          {isFull ? (
            <>
              <i className="bi bi-x-circle" />
              No Seats Available
            </>
          ) : (
            <>
              <i className="bi bi-grid-3x3-gap" />
              Select Seat
              <i className="bi bi-arrow-right" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function SearchResults() {
  const [params] = useSearchParams();
  const [results, setResults] = useState({ trips: [], stage_runs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const origin = params.get("origin");
  const destination = params.get("destination");
  const date = params.get("date");

  const formattedDate = date ? new Date(date + "T00:00:00").toLocaleDateString("en-KE", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }) : "";

  useEffect(() => {
    if (!origin || !destination || !date) return;
    setLoading(true);
    api.searchTrips(origin, destination, date)
      .then(data => setResults(data))
      .catch(err => setError(err.error || "Search failed"))
      .finally(() => setLoading(false));
  }, [origin, destination, date]);

  const total = results.trips.length + results.stage_runs.length;

  return (
    <div className="search-results-page">

      {/* Hero Header */}
      <div className="search-results-hero">
        <div className="hero-background">
          <img src={SEARCH_IMAGE} alt="Search results" />
          <div className="hero-overlay" />
        </div>
        
        <div className="hero-content">
          <button onClick={() => navigate("/")} className="back-button">
            <i className="bi bi-arrow-left" />
            Back to Search
          </button>

          <div className="route-header">
            <div className="route-cities">
              <h1>{origin?.replace(/-/g, " ")}</h1>
              <i className="bi bi-arrow-right" />
              <h1>{destination?.replace(/-/g, " ")}</h1>
            </div>
            
            <div className="route-meta">
              <span className="date">
                <i className="bi bi-calendar3" />
                {formattedDate}
              </span>
              
              {!loading && (
                <span className={`results-count ${total > 0 ? 'has-results' : 'no-results'}`}>
                  {total} {total === 1 ? 'option' : 'options'} found
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="results-container">
        {loading && (
          <div className="loading-state">
            <div className="spinner lg" />
            <h3>Finding matatus...</h3>
            <p>Searching express trips and stage runs</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-circle-fill" />
            <div>
              <strong>Search failed</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!loading && total === 0 && !error && (
          <div className="empty-state">
            <i className="bi bi-bus-front" />
            <h3>No matatus found</h3>
            <p>Try a different date or route</p>
            <button onClick={() => navigate("/")} className="btn btn-primary">
              <i className="bi bi-search" />
              New Search
            </button>
          </div>
        )}

        {/* Express Trips */}
        {results.trips.length > 0 && (
          <div className="results-section">
            <div className="section-header">
              <div className="section-badge primary">
                <i className="bi bi-lightning-charge" />
                <span>Express Scheduled Trips</span>
              </div>
              <span className="section-count">{results.trips.length}</span>
            </div>
            
            <div className="results-grid">
              {results.trips.map(t => (
                <ResultCard key={t.id} item={t} type="trip" />
              ))}
            </div>
          </div>
        )}

        {/* Stage Runs */}
        {results.stage_runs.length > 0 && (
          <div className="results-section">
            <div className="section-header">
              <div className="section-badge warning">
                <i className="bi bi-geo-alt" />
                <span>Available at Stage Now</span>
              </div>
              <span className="section-count">{results.stage_runs.length}</span>
            </div>
            
            <div className="results-grid">
              {results.stage_runs.map(r => (
                <ResultCard key={r.id} item={r} type="stage_run" />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .search-results-page {
          padding-top: var(--header-height);
          min-height: 100vh;
          background: var(--gray-50);
        }

        /* Hero Section */
        .search-results-hero {
          position: relative;
          background: linear-gradient(135deg, var(--primary-dark) 0%, var(--gray-900) 100%);
          padding: 48px 24px;
          overflow: hidden;
        }

        .hero-background {
          position: absolute;
          inset: 0;
        }

        .hero-background img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.15;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 50%, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%);
        }

        .hero-content {
          position: relative;
          max-width: 1200px;
          margin: 0 auto;
          z-index: 2;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: var(--radius);
          padding: 8px 16px;
          color: rgba(255,255,255,0.8);
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 24px;
        }

        .back-button:hover {
          background: rgba(255,255,255,0.2);
          color: white;
          transform: translateX(-4px);
        }

        .route-header {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .route-cities {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .route-cities h1 {
          margin: 0;
          font-size: clamp(24px, 4vw, 40px);
          font-weight: 800;
          color: white;
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }

        .route-cities i {
          color: var(--primary-light);
          font-size: 1.5rem;
        }

        .route-meta {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .date {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,0.7);
          font-size: 0.95rem;
        }

        .results-count {
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .results-count.has-results {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .results-count.no-results {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        /* Results Container */
        .results-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px;
        }

        /* Loading State */
        .loading-state {
          text-align: center;
          padding: 60px 24px;
          background: white;
          border-radius: var(--radius-xl);
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow);
        }

        .loading-state h3 {
          margin: 16px 0 4px;
          color: var(--gray-900);
        }

        .loading-state p {
          color: var(--gray-500);
          margin: 0;
        }

        /* Alert */
        .alert {
          padding: 16px 20px;
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

        .alert-danger strong {
          display: block;
          margin-bottom: 4px;
        }

        .alert-danger p {
          margin: 0;
          font-size: 0.9rem;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 60px 24px;
          background: white;
          border-radius: var(--radius-xl);
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow);
        }

        .empty-state i {
          font-size: 3rem;
          color: var(--gray-400);
          margin-bottom: 16px;
        }

        .empty-state h3 {
          margin: 0 0 4px;
          color: var(--gray-900);
        }

        .empty-state p {
          color: var(--gray-500);
          margin: 0 0 20px;
        }

        /* Results Section */
        .results-section {
          margin-bottom: 40px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 0 4px;
        }

        .section-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius);
          font-weight: 600;
          font-size: 0.9rem;
        }

        .section-badge.primary {
          background: var(--primary-light);
          color: var(--primary);
          border: 1px solid var(--primary-border);
        }

        .section-badge.warning {
          background: var(--warning-light);
          color: var(--warning);
          border: 1px solid #fde68a;
        }

        .section-count {
          background: var(--gray-200);
          color: var(--gray-600);
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .results-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Result Card */
        .result-card {
          background: white;
          border-radius: var(--radius-xl);
          border: 1px solid var(--gray-200);
          overflow: hidden;
          transition: all 0.2s;
          box-shadow: var(--shadow-sm);
        }

        .result-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary-border);
        }

        .result-card.full {
          opacity: 0.7;
          background: var(--gray-50);
        }

        .result-card-header {
          padding: 24px;
        }

        .result-card-badges {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .seat-availability {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .seat-availability.available {
          color: var(--success);
        }

        .seat-availability.full {
          color: var(--danger);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .status-dot.success {
          background: var(--success);
        }

        .status-dot.danger {
          background: var(--danger);
        }

        .result-card-route {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .route-point {
          flex: 1;
        }

        .route-point.text-right {
          text-align: right;
        }

        .route-location {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--gray-900);
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .route-stage {
          font-size: 0.8rem;
          color: var(--gray-500);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .route-stage i {
          font-size: 0.75rem;
        }

        .route-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .route-connector i {
          color: var(--primary);
          font-size: 1.2rem;
        }

        .route-duration {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--gray-400);
          white-space: nowrap;
        }

        .result-card-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin: 16px 0;
          padding: 16px 0;
          border-top: 1px solid var(--gray-200);
          border-bottom: 1px solid var(--gray-200);
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-item.text-right {
          align-items: flex-end;
        }

        .detail-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--gray-500);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .detail-value {
          font-weight: 700;
          color: var(--gray-900);
        }

        .detail-value.time {
          font-family: var(--font-mono);
          font-size: 1.1rem;
        }

        .detail-value.run-number {
          font-size: 1.1rem;
        }

        .detail-value.fare {
          color: var(--success);
          font-size: 1.2rem;
        }

        .vehicle-name {
          display: block;
          font-size: 0.9rem;
          margin-bottom: 2px;
        }

        .vehicle-plate {
          display: inline-block;
          background: var(--gray-100);
          border: 1px solid var(--gray-200);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--gray-600);
        }

        .result-card-amenities {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .amenity-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: var(--gray-100);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--gray-600);
        }

        .amenity-tag i {
          font-size: 0.7rem;
        }

        .result-card-capacity {
          margin-bottom: 20px;
        }

        .capacity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .capacity-label {
          font-size: 0.75rem;
          color: var(--gray-500);
        }

        .capacity-count {
          font-size: 0.75rem;
          font-weight: 600;
        }

        .capacity-count.warning {
          color: var(--warning);
        }

        .capacity-count.full {
          color: var(--danger);
        }

        .progress-bar {
          height: 6px;
          background: var(--gray-200);
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .progress-fill:not(.full):not(.warning) {
          background: var(--primary);
        }

        .progress-fill.warning {
          background: var(--warning);
        }

        .progress-fill.full {
          background: var(--danger);
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

        .btn-secondary {
          background: var(--gray-200);
          color: var(--gray-500);
          cursor: not-allowed;
        }

        .btn-block {
          width: 100%;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--gray-200);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin: 0 auto;
        }

        .spinner.lg {
          width: 40px;
          height: 40px;
          border-width: 3px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .result-card-details {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .detail-item.text-right {
            align-items: flex-start;
          }
          
          .result-card-route {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .route-point.text-right {
            text-align: left;
          }
          
          .route-connector {
            flex-direction: row;
            margin-left: 0;
          }
          
          .route-cities {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .route-cities i {
            transform: rotate(90deg);
          }
        }

        @media (max-width: 480px) {
          .result-card-badges {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .hero-content {
            padding: 0 16px;
          }
        }
      `}</style>
    </div>
  );
}