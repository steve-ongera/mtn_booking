// frontend/src/pages/SearchResults.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";

function ResultCard({ item, type }) {
  const navigate = useNavigate();
  const isTrip = type === "trip";
  const available = item.available_seats;

  const handleBook = () => {
    const path = isTrip ? `/trips/${item.slug}` : `/stage-runs/${item.slug}`;
    navigate(path);
  };

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      padding: 24,
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      border: "1px solid #e5e7eb",
      transition: "box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.15)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"; }}
    >
      {/* Type badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <span style={{
          display: "inline-block",
          padding: "4px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          background: isTrip ? "#dbeafe" : "#fef3c7",
          color: isTrip ? "#1d4ed8" : "#92400e",
        }}>
          {isTrip ? "✈ EXPRESS" : "🚏 STAGE RUN"}
        </span>
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: available > 0 ? "#059669" : "#dc2626",
        }}>
          {available > 0 ? `${available} seats` : "Full"}
        </span>
      </div>

      {/* Route */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{item.origin}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>{item.origin_stage_name || "Main Stage"}</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 20, color: "#007A3D" }}>→</div>
          {isTrip && item.duration_minutes && (
            <div style={{ fontSize: 11, color: "#6b7280" }}>{item.duration_minutes} min</div>
          )}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{item.destination}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>{item.destination_stage_name || "Main Stage"}</div>
        </div>
      </div>

      {/* Times & details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {isTrip ? (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>DEPARTURE</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{item.departure_time?.slice(0, 5)}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>MATATU</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{item.matatu_name}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>{item.plate_number}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>FARE</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#007A3D" }}>
                KES {item.fare}
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>RUN #</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{item.run_number}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>PLATE</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{item.plate_number}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>FARE</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#007A3D" }}>
                KES {item.fare}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Amenities */}
      {item.amenities?.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {item.amenities.map(a => (
            <span key={a} style={{
              padding: "2px 8px", background: "#f3f4f6",
              borderRadius: 12, fontSize: 11, color: "#374151",
            }}>{a}</span>
          ))}
        </div>
      )}

      <button
        onClick={handleBook}
        disabled={available === 0}
        style={{
          width: "100%", padding: "12px",
          background: available > 0 ? "#007A3D" : "#9ca3af",
          color: "#fff", border: "none", borderRadius: 10,
          fontSize: 15, fontWeight: 700, cursor: available > 0 ? "pointer" : "not-allowed",
        }}
      >
        {available > 0 ? "Select Seat →" : "No Seats Available"}
      </button>
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
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none", border: "none", color: "#007A3D",
            fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 12,
          }}
        >
          ← Back to Search
        </button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#111827" }}>
          {origin?.toUpperCase()} → {destination?.toUpperCase()}
        </h1>
        <p style={{ color: "#6b7280", marginTop: 4 }}>
          {date} · {loading ? "Searching..." : `${total} option${total !== 1 ? "s" : ""} found`}
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div>Finding matatus...</div>
        </div>
      )}

      {error && (
        <div style={{
          padding: 20, background: "#fef2f2", borderRadius: 12,
          color: "#dc2626", border: "1px solid #fecaca",
        }}>
          {error}
        </div>
      )}

      {!loading && total === 0 && !error && (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚌</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No matatus found</div>
          <div>Try a different date or route</div>
        </div>
      )}

      {/* Express Trips */}
      {results.trips.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 12 }}>
            🚀 Express Scheduled Trips
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {results.trips.map(t => (
              <ResultCard key={t.id} item={t} type="trip" />
            ))}
          </div>
        </div>
      )}

      {/* Stage Runs */}
      {results.stage_runs.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 12 }}>
            🚏 Available at Stage Now
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {results.stage_runs.map(r => (
              <ResultCard key={r.id} item={r} type="stage_run" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}