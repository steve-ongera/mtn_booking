// frontend/src/pages/Home.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function Home() {
  const [towns, setTowns] = useState([]);
  const [form, setForm] = useState({
    origin: "", destination: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getTowns().then(data => setTowns(data.results || data)).catch(() => {});
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!form.origin || !form.destination || !form.date) return;
    navigate(`/search?origin=${form.origin}&destination=${form.destination}&date=${form.date}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #007A3D 0%, #005C2E 50%, #1a1a2e 100%)" }}>
      {/* Hero */}
      <div style={{ padding: "80px 20px 60px", textAlign: "center" }}>
        <div style={{
          display: "inline-block",
          background: "rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: "6px 20px",
          marginBottom: 20,
          color: "#fbbf24",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 2,
        }}>
          MURANG'A COUNTY
        </div>
        <h1 style={{
          color: "#fff",
          fontSize: "clamp(32px, 6vw, 60px)",
          fontWeight: 900,
          margin: "0 0 12px",
          lineHeight: 1.1,
        }}>
          MTN Sacco
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 18, marginBottom: 8 }}>
          Book your seat. Travel with confidence.
        </p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
          Express trips & stage matatus across Murang'a County
        </p>
      </div>

      {/* Search Card */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 20px 80px" }}>
        <div style={{
          background: "#fff",
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}>
          <h2 style={{ margin: "0 0 24px", color: "#1f2937", fontSize: 22, fontWeight: 700 }}>
            🔍 Find Your Seat
          </h2>
          <form onSubmit={handleSearch}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                  FROM
                </label>
                <select
                  value={form.origin}
                  onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
                  required
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 10,
                    border: "2px solid #e5e7eb", fontSize: 15, outline: "none",
                    cursor: "pointer", background: "#f9fafb",
                  }}
                >
                  <option value="">Select origin</option>
                  {towns.map(t => (
                    <option key={t.id} value={t.slug}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                  TO
                </label>
                <select
                  value={form.destination}
                  onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                  required
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 10,
                    border: "2px solid #e5e7eb", fontSize: 15, outline: "none",
                    cursor: "pointer", background: "#f9fafb",
                  }}
                >
                  <option value="">Select destination</option>
                  {towns.filter(t => t.slug !== form.origin).map(t => (
                    <option key={t.id} value={t.slug}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                TRAVEL DATE
              </label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
                required
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 10,
                  border: "2px solid #e5e7eb", fontSize: 15, outline: "none",
                  background: "#f9fafb", boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "14px", background: "#007A3D",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 16, fontWeight: 700, cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#005C2E"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#007A3D"; }}
            >
              {loading ? "Searching..." : "Search Seats →"}
            </button>
          </form>
        </div>

        {/* Features */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 32 }}>
          {[
            { icon: "💺", title: "Choose Your Seat", desc: "Pick exactly where you sit" },
            { icon: "📱", title: "M-Pesa Payment", desc: "Pay instantly via STK Push" },
            { icon: "🎫", title: "Instant Ticket", desc: "Email confirmation" },
          ].map(f => (
            <div key={f.title} style={{
              background: "rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: "16px 12px",
              textAlign: "center",
              color: "#fff",
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}