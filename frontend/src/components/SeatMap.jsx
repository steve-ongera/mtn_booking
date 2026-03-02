// frontend/src/components/SeatMap.jsx
import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";

const SEAT_COLORS = {
  available: { bg: "var(--green-100)", text: "var(--green-700)", border: "var(--green-300)" },
  selected:  { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  booked:    { bg: "var(--danger-light)", text: "var(--danger)", border: "#fecaca" },
  locked:    { bg: "var(--warning-light)", text: "#c2410c", border: "#fed7aa" },
  driver:    { bg: "var(--gray-800)", text: "#fff", border: "var(--gray-700)" },
  conductor: { bg: "var(--primary-dark)", text: "#fff", border: "var(--primary)" },
  my_locked: { bg: "var(--warning-light)", text: "#c2410c", border: "#fed7aa" },
  aisle:     { bg: "transparent", text: "transparent", border: "transparent" },
};

function SeatCell({ seat, status, selected, onClick }) {
  if (seat.is_aisle_gap) {
    return <div className="seat-aisle" style={{ gridColumn: `span ${seat.col_span || 1}` }} />;
  }

  const isBookable = !seat.is_driver_seat && !seat.is_conductor_seat
    && status !== "booked" && status !== "locked";

  let colorKey = "available";
  if (seat.is_driver_seat) colorKey = "driver";
  else if (seat.is_conductor_seat) colorKey = "conductor";
  else if (status === "booked") colorKey = "booked";
  else if (status === "locked") colorKey = "locked";
  else if (status === "my_locked" || selected) colorKey = "selected";

  const color = SEAT_COLORS[colorKey];
  const label = seat.custom_label || seat.seat_number;

  return (
    <button
      onClick={() => isBookable && onClick(seat)}
      disabled={!isBookable}
      className={`seat-cell ${!isBookable ? 'disabled' : ''} ${selected ? 'selected' : ''}`}
      title={
        seat.is_driver_seat ? "Driver" :
        seat.is_conductor_seat ? "Conductor" :
        status === "booked" ? "Already Booked" :
        status === "locked" ? "Temporarily Unavailable" :
        selected ? "Selected" : "Click to Select"
      }
      style={{
        backgroundColor: color.bg,
        color: color.text,
        borderColor: color.border,
        gridColumn: `span ${seat.col_span || 1}`,
        gridRow: `span ${seat.row_span || 1}`,
      }}
    >
      {label}
    </button>
  );
}

export default function SeatMap({ seats, slug, isStageRun = false, onSelectionChange }) {
  const [selected, setSelected] = useState(new Set());
  const [seatStatus, setSeatStatus] = useState({ booked: [], locked_by_others: [], my_locks: {} });
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async (isInitial) => {
      try {
        const fn = isStageRun ? api.getStageRunSeatStatus : api.getTripSeatStatus;
        const data = await fn(slug);
        if (!isMounted) return;
        // Only update the status overlay — never touch `selected` or trigger
        // a loading state on background polls, so the user's interaction
        // is never interrupted.
        setSeatStatus(data);
      } catch {
        // silent on poll failures
      } finally {
        // Only clear the initial loading spinner once, never on polls
        if (isInitial && isMounted) setLoading(false);
      }
    };

    // First load: show spinner
    fetchStatus(true);

    // Background polls: completely silent, no loading state change
    pollRef.current = setInterval(() => fetchStatus(false), 8000);

    return () => {
      isMounted = false;
      clearInterval(pollRef.current);
    };
  }, [slug, isStageRun]);

  const handleSeatClick = async (seat) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(seat.seat_number)) {
        next.delete(seat.seat_number);
        const fn = isStageRun ? api.lockStageRunSeats : api.lockTripSeats;
        fn(slug, [seat.seat_number], "release").catch(() => {});
      } else {
        next.add(seat.seat_number);
        const fn = isStageRun ? api.lockStageRunSeats : api.lockTripSeats;
        fn(slug, [seat.seat_number]).catch(() => {
          setSelected(p => {
            const n = new Set(p);
            n.delete(seat.seat_number);
            return n;
          });
        });
      }
      return next;
    });
  };

  useEffect(() => {
    onSelectionChange?.(Array.from(selected));
  }, [selected, onSelectionChange]);

  const getSeatStatus = (seat) => {
    if (seatStatus.booked?.includes(seat.seat_number)) return "booked";
    if (seatStatus.locked_by_others?.includes(seat.seat_number)) return "locked";
    if (seatStatus.my_locks?.[seat.seat_number] !== undefined) return "my_locked";
    return "available";
  };

  const maxRow = Math.max(...seats.map(s => s.row_number + (s.row_span || 1) - 1), 0);
  const maxCol = Math.max(...seats.map(s => s.column_number + (s.col_span || 1) - 1), 0);

  if (loading) {
    return (
      <div className="seat-map-loading">
        <div className="spinner" />
        <p>Loading seat map...</p>
      </div>
    );
  }

  return (
    <div className="seat-map">
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
          <div className="legend-color locked" />
          <span>Temporarily Locked</span>
        </div>
        <div className="legend-item">
          <div className="legend-color driver" />
          <span>Driver</span>
        </div>
        <div className="legend-item">
          <div className="legend-color conductor" />
          <span>Conductor</span>
        </div>
      </div>

      {/* Matatu Front Indicator */}
      <div className="matatu-front">
        <div className="front-indicator">
          <i className="bi bi-arrow-up" />
          <span>FRONT OF MATATU</span>
        </div>
      </div>

      {/* Seat Grid */}
      <div
        className="seat-grid"
        style={{
          gridTemplateColumns: `repeat(${maxCol}, 1fr)`,
          gridTemplateRows: `repeat(${maxRow}, 1fr)`,
        }}
      >
        {seats.map(seat => (
          <div key={seat.id} style={{
            gridColumn: `${seat.column_number} / span ${seat.col_span || 1}`,
            gridRow: `${seat.row_number} / span ${seat.row_span || 1}`,
          }}>
            <SeatCell
              seat={seat}
              status={getSeatStatus(seat)}
              selected={selected.has(seat.seat_number)}
              onClick={handleSeatClick}
            />
          </div>
        ))}
      </div>

      {/* Selection Summary */}
      {selected.size > 0 && (
        <div className="selection-summary">
          <div className="selection-header">
            <i className="bi bi-check2-circle" />
            <span>Selected Seats</span>
          </div>
          <div className="selected-seats-list">
            {Array.from(selected).map(seat => (
              <span key={seat} className="selected-seat-tag">
                {seat}
              </span>
            ))}
          </div>
          <div className="selection-count">
            {selected.size} seat{selected.size > 1 ? 's' : ''} selected
          </div>
        </div>
      )}

      {/* Accessibility Info */}
      <div className="seat-map-footer">
        <i className="bi bi-info-circle" />
        <span>Click on an available seat to select it. Selected seats will be held for 5 minutes.</span>
      </div>

      <style>{`
        .seat-map {
          width: 100%;
          overflow-x: auto;
          padding: 16px 0;
        }

        .seat-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 24px;
          padding: 12px 16px;
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
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
          border: 1px solid;
        }

        .legend-color.available { background: var(--green-100); border-color: var(--green-300); }
        .legend-color.selected  { background: #dbeafe; border-color: #93c5fd; }
        .legend-color.booked    { background: var(--danger-light); border-color: #fecaca; }
        .legend-color.locked    { background: var(--warning-light); border-color: #fed7aa; }
        .legend-color.driver    { background: var(--gray-800); border-color: var(--gray-700); }
        .legend-color.conductor { background: var(--primary-dark); border-color: var(--primary); }

        .matatu-front {
          text-align: center;
          margin-bottom: 16px;
        }

        .front-indicator {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: var(--gray-100);
          border: 1px solid var(--gray-200);
          border-radius: 100px;
          color: var(--gray-500);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .front-indicator i { color: var(--primary); font-size: 0.8rem; }

        .seat-grid {
          display: grid;
          gap: 8px;
          padding: 24px;
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow);
          width: fit-content;
          margin: 0 auto;
        }

        .seat-cell {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          font-family: var(--font-mono);
          cursor: pointer;
          border: 2px solid;
          transition: all 0.15s;
          background: white;
          padding: 0;
          line-height: 1;
        }

        .seat-cell:hover:not(:disabled) { transform: scale(1.1); box-shadow: var(--shadow); z-index: 2; }
        .seat-cell.selected             { transform: scale(1.05); box-shadow: var(--shadow); }
        .seat-cell.disabled             { cursor: not-allowed; opacity: 0.7; }

        .seat-aisle { width: 44px; height: 44px; }

        .selection-summary {
          margin-top: 24px;
          padding: 16px 20px;
          background: var(--primary-light);
          border: 1px solid var(--primary-border);
          border-radius: var(--radius);
          animation: slideUp 0.2s ease;
        }

        .selection-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          color: var(--primary-dark);
          font-weight: 600;
        }

        .selection-header i { font-size: 1.1rem; }

        .selected-seats-list { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }

        .selected-seat-tag {
          padding: 4px 12px;
          background: white;
          border: 1px solid var(--primary-border);
          border-radius: 100px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--primary-dark);
          box-shadow: var(--shadow-xs);
        }

        .selection-count { font-size: 0.9rem; font-weight: 600; color: var(--primary-dark); }

        .seat-map-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
          padding: 12px 16px;
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius);
          font-size: 0.85rem;
          color: var(--gray-500);
        }

        .seat-map-footer i { color: var(--primary); }

        .seat-map-loading {
          text-align: center;
          padding: 40px 20px;
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-xl);
        }

        .seat-map-loading p { margin-top: 16px; color: var(--gray-500); }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--gray-200);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 768px) {
          .seat-cell   { width: 36px; height: 36px; font-size: 0.7rem; }
          .seat-legend { gap: 12px; }
          .legend-item { font-size: 0.75rem; }
          .legend-color { width: 16px; height: 16px; }
        }

        @media (max-width: 480px) {
          .seat-grid { padding: 16px; gap: 4px; }
          .seat-cell { width: 32px; height: 32px; }
        }
      `}</style>
    </div>
  );
}