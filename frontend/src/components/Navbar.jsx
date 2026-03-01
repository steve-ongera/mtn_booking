// frontend/src/components/Navbar.jsx
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  return (
    <nav style={{
      background: "#007A3D",
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    }}>
      <div
        onClick={() => navigate("/")}
        style={{ color: "#fff", fontWeight: 900, fontSize: 22, cursor: "pointer", letterSpacing: 1 }}
      >
        🚌 MTN Sacco
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => navigate("/track/enter")}
          style={{
            padding: "8px 16px", background: "rgba(255,255,255,0.15)",
            color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          Track Booking
        </button>
      </div>
    </nav>
  );
}