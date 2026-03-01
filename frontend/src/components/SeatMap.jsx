// frontend/src/components/SeatMap.jsx
// Renders a matatu seat grid.
// Matatu typical configs:
//   14-seater: 2+2 per row (rows 1-3), row 4 back bench (3 seats)
//   33-seater: 2+2 per row
// Driver seat top-left, conductor near door.

import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";

const SEAT_COLORS = {
  available: { bg: "#22c55e", text: "#fff", border: "#16a34a" },
  selected:  { bg: "#f59e0b", text: "#fff", border: "#d97706" },
  booked:    { bg: "#ef4444", text: "#fff", border: "#dc2626" },
  locked:    { bg: "#f97316", text: "#fff", border: "#ea580c" },
  driver:    { bg: "#1e3a8a", text: "#fff", border: "#1e40af" },
  conductor: { bg: "#7c3aed", text: "#fff", border: "#6d28d9" },
  my_locked: { bg: "#f59e0b", text: "#fff", border: "#d97706" },
  aisle:     { bg: "transparent", text: "transparent", border: "transparent" },
};

function SeatCell({ seat, status, selected, onClick }) {
  if (seat.is_aisle_gap) {
    return <div style={{ width: 36, height: 36, gridColumn: `span ${seat.col_span || 1}` }} />;
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
    <div
      onClick={() => isBookable && onClick(seat)}
      title={
        seat.is_driver_seat ? "Driver" :
        seat.is_conductor_seat ? "Conductor" :
        status === "booked" ? "Booked" :
        status === "locked" ? "Locked by someone" :
        selected ? "Selected" : "Available"
      }
      style={{
        width: 36 + (seat.extra_padding || 0),
        height: 36,
        backgroundColor: seat.bg_color || color.bg,
        color: seat.text_color || color.text,
        border: `2px solid ${color.border}`,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        cursor: isBookable ? "pointer" : "default",
        userSelect: "none",
        transition: "transform 0.1s",
        gridColumn: `span ${seat.col_span || 1}`,
        gridRow: `span ${seat.row_span || 1}`,
        boxSizing: "border-box",
      }}
      onMouseEnter={e => { if (isBookable) e.currentTarget.style.transform = "scale(1.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {label}
    </div>
  );
}

export default function SeatMap({ seats, slug, isStageRun = false, onSelectionChange }) {
  const [selected, setSelected] = useState(new Set());
  const [seatStatus, setSeatStatus] = useState({ booked: [], locked_by_others: [], my_locks: {} });
  const pollRef = useRef(null);

  // Poll seat status every 4s
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const fn = isStageRun ? api.getStageRunSeatStatus : api.getTripSeatStatus;
        const data = await fn(slug);
        setSeatStatus(data);
      } catch {}
    };
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 4000);
    return () => clearInterval(pollRef.current);
  }, [slug, isStageRun]);

  const handleSeatClick = (seat) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(seat.seat_number)) {
        next.delete(seat.seat_number);
        // Release lock
        const fn = isStageRun ? api.lockStageRunSeats : api.lockTripSeats;
        fn(slug, [seat.seat_number], "release").catch(() => {});
      } else {
        next.add(seat.seat_number);
        // Acquire lock
        const fn = isStageRun ? api.lockStageRunSeats : api.lockTripSeats;
        fn(slug, [seat.seat_number]).catch(() => {
          // If lock fails, deselect
          setSelected(p => { const n = new Set(p); n.delete(seat.seat_number); return n; });
        });
      }
      return next;
    });
  };

  useEffect(() => {
    onSelectionChange?.(Array.from(selected));
  }, [selected]);

  const getSeatStatus = (seat) => {
    if (seatStatus.booked?.includes(seat.seat_number)) return "booked";
    if (seatStatus.locked_by_others?.includes(seat.seat_number)) return "locked";
    if (seatStatus.my_locks?.[seat.seat_number] !== undefined) return "my_locked";
    return "available";
  };

  // Build grid: find max row & col
  const maxRow = Math.max(...seats.map(s => s.row_number + (s.row_span || 1) - 1));
  const maxCol = Math.max(...seats.map(s => s.column_number + (s.col_span || 1) - 1));

  // Place seats in a CSS grid
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${maxCol}, 40px)`,
    gridTemplateRows: `repeat(${maxRow}, 44px)`,
    gap: "6px",
    padding: "12px",
    background: "#f3f4f6",
    borderRadius: 12,
    border: "2px solid #d1d5db",
    width: "fit-content",
    margin: "0 auto",
  };

  return (
    <div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, fontSize: 12 }}>
        {[
          ["#22c55e", "Available"],
          ["#f59e0b", "Selected"],
          ["#ef4444", "Booked"],
          ["#f97316", "Locked"],
          ["#1e3a8a", "Driver"],
          ["#7c3aed", "Conductor"],
        ].map(([color, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 14, height: 14, backgroundColor: color, borderRadius: 3 }} />
            <span style={{ color: "#374151" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Front of matatu indicator */}
      <div style={{
        textAlign: "center",
        fontSize: 12,
        color: "#6b7280",
        marginBottom: 6,
        fontWeight: 600,
        letterSpacing: 1,
      }}>
        ▲ FRONT
      </div>

      <div style={gridStyle}>
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

      {selected.size > 0 && (
        <div style={{
          marginTop: 12,
          padding: "8px 12px",
          background: "#fef3c7",
          borderRadius: 8,
          textAlign: "center",
          fontSize: 14,
          fontWeight: 600,
          color: "#92400e",
        }}>
          Selected: {Array.from(selected).join(", ")} ({selected.size} seat{selected.size > 1 ? "s" : ""})
        </div>
      )}
    </div>
  );
}