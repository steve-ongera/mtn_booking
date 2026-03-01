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
    <div
      className="ad-card"
      style={{
        transition: "transform .15s, box-shadow .15s",
        overflow: "visible",
        opacity: isFull ? .7 : 1,
      }}
      onMouseEnter={e => { if (!isFull) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow)"; }}}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
    >
      <div style={{ padding: "18px 20px" }}>
        {/* Top row */}
        <div className="d-flex align-center justify-between" style={{ marginBottom: 14 }}>
          <span className={`badge badge-${isTrip ? "express" : "stage"}`}>
            <i className={`bi bi-${isTrip ? "lightning-charge-fill" : "geo-alt-fill"}`} />
            {isTrip ? "Express Trip" : "Stage Run"}
          </span>
          <div className="d-flex align-center gap-2">
            {available > 0
              ? <span style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="dot dot-green" />
                  {available} seats left
                </span>
              : <span style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--danger)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="dot dot-red" />
                  Full
                </span>
            }
          </div>
        </div>

        {/* Route */}
        <div className="d-flex align-center" style={{ gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--gray-900)", lineHeight: 1 }}>{item.origin}</div>
            <div style={{ fontSize: ".72rem", color: "var(--gray-400)", marginTop: 3 }}>
              <i className="bi bi-geo-alt" style={{ marginRight: 3 }} />
              {item.origin_stage_name || "Main Stage"}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <i className="bi bi-arrow-right" style={{ color: "var(--primary)", fontSize: "1.2rem" }} />
            {isTrip && item.duration_minutes && (
              <div style={{ fontSize: ".65rem", color: "var(--gray-400)", fontWeight: 600, whiteSpace: "nowrap" }}>
                {item.duration_minutes} min
              </div>
            )}
          </div>

          <div style={{ flex: 1, textAlign: "right" }}>
            <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--gray-900)", lineHeight: 1 }}>{item.destination}</div>
            <div style={{ fontSize: ".72rem", color: "var(--gray-400)", marginTop: 3 }}>
              <i className="bi bi-geo-alt" style={{ marginRight: 3 }} />
              {item.destination_stage_name || "Main Stage"}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="divider" style={{ margin: "12px 0" }} />

        {/* Details grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginBottom: 16,
        }}>
          {isTrip ? (
            <>
              <div>
                <div className="text-xs text-muted" style={{ marginBottom: 3 }}>
                  <i className="bi bi-clock" style={{ marginRight: 3 }} />DEPARTURE
                </div>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--gray-900)", fontFamily: "var(--font-mono)" }}>
                  {item.departure_time?.slice(0, 5)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted" style={{ marginBottom: 3 }}>
                  <i className="bi bi-bus-front" style={{ marginRight: 3 }} />VEHICLE
                </div>
                <div className="fw-600" style={{ fontSize: ".85rem" }}>{item.matatu_name}</div>
                <div className="ad-tag" style={{ marginTop: 2, fontSize: ".65rem" }}>{item.plate_number}</div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-xs text-muted" style={{ marginBottom: 3 }}>
                  <i className="bi bi-hash" style={{ marginRight: 3 }} />RUN
                </div>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--gray-900)" }}>
                  #{item.run_number}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted" style={{ marginBottom: 3 }}>
                  <i className="bi bi-car-front" style={{ marginRight: 3 }} />PLATE
                </div>
                <div className="ad-tag">{item.plate_number}</div>
              </div>
            </>
          )}
          <div style={{ textAlign: "right" }}>
            <div className="text-xs text-muted" style={{ marginBottom: 3 }}>
              <i className="bi bi-cash-coin" style={{ marginRight: 3 }} />FARE
            </div>
            <div style={{ fontWeight: 900, fontSize: "1.15rem", color: "var(--success)" }}>
              KES {item.fare}
            </div>
          </div>
        </div>

        {/* Amenities */}
        {item.amenities?.length > 0 && (
          <div className="d-flex gap-1 flex-wrap" style={{ marginBottom: 14 }}>
            {item.amenities.map(a => (
              <span key={a} className="ad-tag">
                <i className={`bi bi-${
                  a === "WiFi" ? "wifi" :
                  a === "AC" ? "thermometer-snow" :
                  a === "USB" ? "usb-plug" :
                  a === "Music" ? "music-note" : "star"
                }`} style={{ fontSize: ".7rem" }} />
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Capacity bar */}
        {item.total_seats && (
          <div style={{ marginBottom: 16 }}>
            <div className="d-flex justify-between" style={{ marginBottom: 5 }}>
              <span className="text-xs text-muted">Seat capacity</span>
              <span className="text-xs fw-600" style={{ color: isFull ? "var(--danger)" : "var(--gray-600)" }}>
                {item.total_seats - available}/{item.total_seats} filled
              </span>
            </div>
            <div className="ad-progress">
              <div
                className="ad-progress-bar"
                style={{
                  width: `${((item.total_seats - available) / item.total_seats) * 100}%`,
                  background: isFull ? "var(--danger)" : available < 5 ? "var(--warning)" : "var(--primary)",
                }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleBook}
          disabled={isFull}
          className={`btn-ad w-100 ${isFull ? "" : "btn-ad-primary"}`}
          style={{
            justifyContent: "center",
            background: isFull ? "var(--gray-200)" : undefined,
            color: isFull ? "var(--gray-400)" : undefined,
            borderColor: isFull ? "var(--gray-200)" : undefined,
            cursor: isFull ? "not-allowed" : "pointer",
          }}
        >
          {isFull
            ? <><i className="bi bi-x-circle" /> No Seats Available</>
            : <><i className="bi bi-grid-3x3" /> Select Seat →</>
          }
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

  // Format date nicely
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
    <div style={{ paddingTop: "var(--header-height)", minHeight: "100vh", background: "var(--gray-50)" }}>

      {/* ── Hero Header ── */}
      <div style={{
        background: "var(--blue-900)",
        padding: "32px 24px",
        position: "relative",
        overflow: "hidden",
      }}>
        <img
          src={SEARCH_IMAGE}
          alt={`${origin} to ${destination} matatu`}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", opacity: .15,
          }}
        />
        <div style={{ position: "relative", maxWidth: 900, margin: "0 auto" }}>
          <button
            onClick={() => navigate("/")}
            className="btn-ad btn-ad-ghost btn-ad-sm"
            style={{ color: "rgba(255,255,255,.7)", marginBottom: 16, padding: "4px 0" }}
          >
            <i className="bi bi-arrow-left" /> Back to Search
          </button>

          <div className="d-flex align-center flex-wrap gap-3">
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h1 style={{
                  margin: 0,
                  fontSize: "clamp(20px, 4vw, 30px)",
                  fontWeight: 900,
                  color: "#fff",
                  textTransform: "uppercase",
                  letterSpacing: ".02em",
                }}>
                  {origin?.replace(/-/g, " ")}
                </h1>
                <i className="bi bi-arrow-right" style={{ color: "var(--blue-300)", fontSize: "1.4rem" }} />
                <h1 style={{
                  margin: 0,
                  fontSize: "clamp(20px, 4vw, 30px)",
                  fontWeight: 900,
                  color: "#fff",
                  textTransform: "uppercase",
                  letterSpacing: ".02em",
                }}>
                  {destination?.replace(/-/g, " ")}
                </h1>
              </div>
              <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ color: "var(--blue-300)", fontSize: ".85rem" }}>
                  <i className="bi bi-calendar3" style={{ marginRight: 4 }} />
                  {formattedDate}
                </span>
                {!loading && (
                  <span style={{
                    background: total > 0 ? "rgba(52,211,153,.2)" : "rgba(239,68,68,.2)",
                    color: total > 0 ? "#34d399" : "#f87171",
                    padding: "2px 10px",
                    borderRadius: 99,
                    fontSize: ".75rem",
                    fontWeight: 700,
                  }}>
                    {total} option{total !== 1 ? "s" : ""} found
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 48px" }}>

        {loading && (
          <div className="ad-empty" style={{ background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)" }}>
            <div className="ad-spinner ad-spinner-lg" style={{ marginBottom: 16 }} />
            <h5>Finding matatus...</h5>
            <p>Searching express trips and stage runs</p>
          </div>
        )}

        {error && (
          <div className="ad-alert ad-alert-error">
            <i className="bi bi-exclamation-circle-fill" />
            <div>
              <div style={{ fontWeight: 600 }}>Search failed</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {!loading && total === 0 && !error && (
          <div className="ad-empty" style={{ background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--gray-200)" }}>
            <i className="bi bi-bus-front" />
            <h5>No matatus found</h5>
            <p>Try a different date or route</p>
            <button
              onClick={() => navigate("/")}
              className="btn-ad btn-ad-primary"
              style={{ marginTop: 12 }}
            >
              <i className="bi bi-search" /> New Search
            </button>
          </div>
        )}

        {/* Express Trips */}
        {results.trips.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 14,
              padding: "10px 14px",
              background: "var(--blue-50)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--primary-border)",
            }}>
              <i className="bi bi-lightning-charge-fill" style={{ color: "var(--primary)" }} />
              <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: ".9rem" }}>
                Express Scheduled Trips
              </span>
              <span style={{
                marginLeft: "auto",
                background: "var(--primary)",
                color: "#fff",
                padding: "1px 8px",
                borderRadius: 99,
                fontSize: ".7rem",
                fontWeight: 700,
              }}>
                {results.trips.length}
              </span>
            </div>
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
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 14,
              padding: "10px 14px",
              background: "var(--warning-light)",
              borderRadius: "var(--radius)",
              border: "1px solid #fde68a",
            }}>
              <i className="bi bi-geo-alt-fill" style={{ color: "var(--warning)" }} />
              <span style={{ fontWeight: 700, color: "var(--warning)", fontSize: ".9rem" }}>
                Available at Stage Now
              </span>
              <span style={{
                marginLeft: "auto",
                background: "var(--warning)",
                color: "#fff",
                padding: "1px 8px",
                borderRadius: 99,
                fontSize: ".7rem",
                fontWeight: 700,
              }}>
                {results.stage_runs.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {results.stage_runs.map(r => (
                <ResultCard key={r.id} item={r} type="stage_run" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}