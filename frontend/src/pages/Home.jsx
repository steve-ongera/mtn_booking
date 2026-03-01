// frontend/src/pages/Home.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

// Unsplash SEO images - Kenyan/matatu themed
const HERO_IMAGE = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&q=80&fit=crop"; // bus/transport
const FEATURE_IMAGES = [
  "https://images.unsplash.com/photo-1570547255950-da99cfa46d6a?w=400&q=80&fit=crop", // seat
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80&fit=crop", // mobile payment
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&q=80&fit=crop", // ticket/confirm
];

// Combobox search component
function TownSearch({ label, value, onChange, towns, excludeSlug, placeholder }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);

  const selectedTown = towns.find(t => t.slug === value);

  useEffect(() => {
    if (selectedTown) setQuery(selectedTown.name);
  }, [value, towns]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        if (selectedTown) setQuery(selectedTown.name);
        else setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selectedTown]);

  const filtered = towns.filter(t =>
    t.slug !== excludeSlug &&
    t.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (town) => {
    onChange(town.slug);
    setQuery(town.name);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setOpen(true);
    if (!e.target.value) onChange("");
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <label style={{
        display: "block",
        fontSize: ".72rem",
        fontWeight: 700,
        color: "var(--gray-500)",
        textTransform: "uppercase",
        letterSpacing: ".06em",
        marginBottom: 6,
      }}>
        {label}
      </label>
      <div style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        background: "#fff",
        border: `2px solid ${focused ? "var(--primary)" : "var(--gray-200)"}`,
        borderRadius: "var(--radius)",
        transition: "border-color .15s, box-shadow .15s",
        boxShadow: focused ? "0 0 0 3px rgba(37,99,235,.1)" : "none",
      }}>
        <i className="bi bi-search" style={{
          position: "absolute", left: 12,
          color: focused ? "var(--primary)" : "var(--gray-400)",
          fontSize: ".88rem", pointerEvents: "none",
          transition: "color .15s",
        }} />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            width: "100%",
            padding: "11px 12px 11px 34px",
            border: "none",
            background: "transparent",
            fontSize: ".9rem",
            color: "var(--gray-800)",
            fontFamily: "var(--font-body)",
            outline: "none",
            borderRadius: "var(--radius)",
          }}
        />
        {value && (
          <button
            onMouseDown={e => { e.preventDefault(); onChange(""); setQuery(""); setOpen(true); }}
            style={{
              background: "none", border: "none",
              color: "var(--gray-400)", cursor: "pointer",
              padding: "0 10px", fontSize: ".88rem",
            }}
          >
            <i className="bi bi-x" />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0, right: 0,
          background: "#fff",
          border: "1.5px solid var(--gray-200)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-lg)",
          zIndex: 300,
          maxHeight: 200,
          overflowY: "auto",
          animation: "slideUp .12s ease",
        }}>
          {filtered.map(town => (
            <div
              key={town.id}
              onMouseDown={e => { e.preventDefault(); handleSelect(town); }}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: ".88rem",
                color: town.slug === value ? "var(--primary)" : "var(--gray-700)",
                background: town.slug === value ? "var(--blue-50)" : "#fff",
                fontWeight: town.slug === value ? 600 : 400,
                transition: "background .1s",
              }}
              onMouseEnter={e => { if (town.slug !== value) e.currentTarget.style.background = "var(--gray-50)"; }}
              onMouseLeave={e => { if (town.slug !== value) e.currentTarget.style.background = "#fff"; }}
            >
              <i className="bi bi-geo-alt" style={{ color: "var(--gray-400)", flexShrink: 0 }} />
              {town.name}
              {town.slug === value && <i className="bi bi-check2" style={{ marginLeft: "auto", color: "var(--primary)" }} />}
            </div>
          ))}
        </div>
      )}

      {open && query.length > 1 && filtered.length === 0 && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0, right: 0,
          background: "#fff",
          border: "1.5px solid var(--gray-200)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-lg)",
          zIndex: 300,
          padding: "14px 16px",
          fontSize: ".85rem",
          color: "var(--gray-400)",
          textAlign: "center",
        }}>
          <i className="bi bi-search" style={{ marginRight: 6 }} />
          No towns matching "{query}"
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [towns, setTowns] = useState([]);
  const [form, setForm] = useState({
    origin: "",
    destination: "",
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
    setLoading(true);
    navigate(`/search?origin=${form.origin}&destination=${form.destination}&date=${form.date}`);
  };

  const swapLocations = () => {
    if (form.origin && form.destination)
      setForm(f => ({ ...f, origin: f.destination, destination: f.origin }));
  };

  const stats = [
    { icon: "bi-bus-front", value: "50+", label: "Matatus" },
    { icon: "bi-people", value: "2K+", label: "Daily Riders" },
    { icon: "bi-geo-alt", value: "12", label: "Routes" },
    { icon: "bi-shield-check", value: "99%", label: "On Time" },
  ];

  const features = [
    {
      icon: "bi-grid-3x3",
      title: "Choose Your Seat",
      desc: "Pick exactly where you sit — window, aisle, or front. Real-time seat map updates.",
      img: FEATURE_IMAGES[0],
      color: "var(--blue-50)",
      iconColor: "var(--primary)",
    },
    {
      icon: "bi-phone",
      title: "M-Pesa STK Push",
      desc: "Pay instantly from your phone. Enter amount once — no app downloads needed.",
      img: FEATURE_IMAGES[1],
      color: "var(--success-light)",
      iconColor: "var(--success)",
    },
    {
      icon: "bi-ticket-perforated",
      title: "Instant E-Ticket",
      desc: "Receive your booking confirmation immediately. Track your booking anytime.",
      img: FEATURE_IMAGES[2],
      color: "var(--warning-light)",
      iconColor: "var(--warning)",
    },
  ];

  const popularRoutes = [
    { from: "Murang'a", to: "Nairobi", duration: "2h 30m", fare: "KES 350", type: "express" },
    { from: "Murang'a", to: "Thika", duration: "1h 30m", fare: "KES 200", type: "stage" },
    { from: "Murang'a", to: "Nyeri", duration: "2h", fare: "KES 300", type: "express" },
    { from: "Thika", to: "Nairobi", duration: "1h", fare: "KES 150", type: "stage" },
  ];

  return (
    <div style={{ paddingTop: "var(--header-height)" }}>

      {/* ── Hero ── */}
      <section style={{
        position: "relative",
        minHeight: "calc(100vh - var(--header-height))",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        background: "#0f2027",
      }}>
        {/* Background Image */}
        <img
          src={HERO_IMAGE}
          alt="MTN Sacco matatu transport Murang'a Kenya"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            opacity: .35,
          }}
        />

        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(30,58,138,.85) 0%, rgba(5,122,61,.7) 60%, rgba(0,0,0,.5) 100%)",
        }} />

        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: "10%", right: "8%",
          width: 300, height: 300,
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: "50%", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: "20%", right: "12%",
          width: 180, height: 180,
          border: "1px solid rgba(255,255,255,.06)",
          borderRadius: "50%", pointerEvents: "none",
        }} />

        <div style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 1100,
          margin: "0 auto",
          padding: "60px 24px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 48,
          alignItems: "center",
        }}
          className="hero-grid"
        >
          {/* Left - Hero text */}
          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(251,191,36,.15)",
              border: "1px solid rgba(251,191,36,.3)",
              borderRadius: 99,
              padding: "4px 14px",
              marginBottom: 20,
            }}>
              <i className="bi bi-geo-fill" style={{ color: "#fbbf24", fontSize: ".75rem" }} />
              <span style={{ color: "#fbbf24", fontSize: ".75rem", fontWeight: 700, letterSpacing: ".08em" }}>
                MURANG'A COUNTY, KENYA
              </span>
            </div>

            <h1 style={{
              color: "#fff",
              fontSize: "clamp(32px, 5vw, 58px)",
              fontWeight: 900,
              lineHeight: 1.05,
              margin: "0 0 16px",
              letterSpacing: "-.02em",
            }}>
              Travel Smart.<br />
              <span style={{
                background: "linear-gradient(90deg, #fbbf24, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Ride Confident.
              </span>
            </h1>

            <p style={{
              color: "rgba(255,255,255,.75)",
              fontSize: "1.05rem",
              lineHeight: 1.65,
              margin: "0 0 28px",
              maxWidth: 440,
            }}>
              Book your matatu seat in advance. Express scheduled trips and stage runs
              across Murang'a County and beyond — secured with M-Pesa.
            </p>

            {/* Stats strip */}
            <div style={{
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
            }}>
              {stats.map(stat => (
                <div key={stat.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff" }}>{stat.value}</div>
                  <div style={{ fontSize: ".72rem", color: "rgba(255,255,255,.55)", fontWeight: 600, letterSpacing: ".05em" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Search Card */}
          <div>
            <div style={{
              background: "#fff",
              borderRadius: "var(--radius-xl)",
              padding: 28,
              boxShadow: "var(--shadow-lg)",
            }}>
              <h2 style={{
                margin: "0 0 6px",
                fontSize: "1.05rem",
                fontWeight: 800,
                color: "var(--gray-900)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <i className="bi bi-search" style={{ color: "var(--primary)" }} />
                Find Your Seat
              </h2>
              <p style={{ margin: "0 0 20px", fontSize: ".8rem", color: "var(--gray-400)" }}>
                Search express trips and stage runs
              </p>

              <form onSubmit={handleSearch}>
                {/* Origin / Destination */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "flex-end", marginBottom: 14 }}>
                  <TownSearch
                    label="From"
                    value={form.origin}
                    onChange={v => setForm(f => ({ ...f, origin: v }))}
                    towns={towns}
                    excludeSlug={form.destination}
                    placeholder="Origin town..."
                  />

                  {/* Swap button */}
                  <div style={{ paddingBottom: 2 }}>
                    <button
                      type="button"
                      onClick={swapLocations}
                      className="btn-ad btn-ad-ghost"
                      style={{
                        padding: "10px 10px",
                        border: "1.5px solid var(--gray-200)",
                        borderRadius: "var(--radius)",
                        color: form.origin && form.destination ? "var(--primary)" : "var(--gray-300)",
                        transition: "all .15s",
                      }}
                      title="Swap origin and destination"
                    >
                      <i className="bi bi-arrow-left-right" />
                    </button>
                  </div>

                  <TownSearch
                    label="To"
                    value={form.destination}
                    onChange={v => setForm(f => ({ ...f, destination: v }))}
                    towns={towns}
                    excludeSlug={form.origin}
                    placeholder="Destination..."
                  />
                </div>

                {/* Date */}
                <div className="ad-form-group" style={{ marginBottom: 18 }}>
                  <label className="ad-label">
                    <i className="bi bi-calendar3" style={{ marginRight: 5 }} />
                    Travel Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    className="ad-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !form.origin || !form.destination}
                  className="btn-ad btn-ad-primary w-100"
                  style={{ padding: "12px 20px", fontSize: ".95rem", justifyContent: "center", borderRadius: "var(--radius)" }}
                >
                  {loading
                    ? <><span className="ad-spinner ad-spinner-sm ad-spinner-white" /> Searching...</>
                    : <><i className="bi bi-search" /> Search Seats</>
                  }
                </button>
              </form>

              {/* Quick Links */}
              <div style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid var(--gray-100)",
                display: "flex",
                justifyContent: "space-between",
                fontSize: ".75rem",
                color: "var(--gray-400)",
              }}>
                <span
                  onClick={() => navigate("/track/enter")}
                  style={{ cursor: "pointer", color: "var(--primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                >
                  <i className="bi bi-qr-code-scan" /> Track Booking
                </span>
                <span style={{ color: "var(--gray-300)" }}>|</span>
                <span
                  onClick={() => navigate("/about")}
                  style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                >
                  <i className="bi bi-info-circle" /> About MTN Sacco
                </span>
                <span style={{ color: "var(--gray-300)" }}>|</span>
                <span
                  onClick={() => navigate("/contact")}
                  style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                >
                  <i className="bi bi-telephone" /> Contact Us
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Popular Routes ── */}
      <section style={{ background: "#fff", padding: "64px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div className="ad-section-title" style={{ justifyContent: "center", display: "flex", marginBottom: 8 }}>
              <i className="bi bi-signpost-split" style={{ marginRight: 6 }} />
              Popular Routes
            </div>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, color: "var(--gray-900)", margin: 0 }}>
              Where are you heading today?
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}>
            {popularRoutes.map((route, i) => (
              <div
                key={i}
                onClick={() => {
                  const originSlug = route.from.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
                  const destSlug = route.to.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
                  const today = new Date().toISOString().split("T")[0];
                  navigate(`/search?origin=${originSlug}&destination=${destSlug}&date=${today}`);
                }}
                className="ad-card"
                style={{
                  padding: 20,
                  cursor: "pointer",
                  transition: "transform .15s, box-shadow .15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span className={`badge badge-${route.type}`}>
                    <i className={`bi bi-${route.type === "express" ? "lightning-charge" : "geo-alt"}`} />
                    {route.type === "express" ? "Express" : "Stage"}
                  </span>
                  <span style={{ fontSize: ".72rem", color: "var(--gray-400)" }}>
                    <i className="bi bi-clock" style={{ marginRight: 3 }} />
                    {route.duration}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--gray-900)" }}>{route.from}</div>
                  <i className="bi bi-arrow-right" style={{ color: "var(--primary)", fontSize: ".9rem" }} />
                  <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--gray-900)" }}>{route.to}</div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--success)" }}>{route.fare}</span>
                  <span style={{ fontSize: ".75rem", color: "var(--primary)", fontWeight: 600 }}>
                    Book now <i className="bi bi-arrow-right-short" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ background: "var(--gray-50)", padding: "64px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div className="ad-section-title" style={{ justifyContent: "center", display: "flex", marginBottom: 8 }}>
              <i className="bi bi-stars" style={{ marginRight: 6 }} />
              Why MTN Sacco
            </div>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, color: "var(--gray-900)", margin: 0 }}>
              A better way to travel
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 24,
          }}>
            {features.map((f, i) => (
              <div key={i} className="ad-card" style={{ overflow: "hidden" }}>
                {/* Feature Image */}
                <div style={{ height: 160, overflow: "hidden", position: "relative" }}>
                  <img
                    src={f.img}
                    alt={f.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                  />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,.4) 0%, transparent 50%)",
                  }} />
                </div>
                <div style={{ padding: "20px 20px 22px" }}>
                  <div style={{
                    width: 38, height: 38,
                    background: f.color,
                    borderRadius: "var(--radius-sm)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 12,
                  }}>
                    <i className={`bi ${f.icon}`} style={{ color: f.iconColor, fontSize: "1.1rem" }} />
                  </div>
                  <h3 style={{ fontSize: ".97rem", fontWeight: 700, color: "var(--gray-900)", margin: "0 0 6px" }}>{f.title}</h3>
                  <p style={{ fontSize: ".84rem", color: "var(--gray-500)", margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
        background: "linear-gradient(135deg, var(--blue-800) 0%, var(--blue-600) 100%)",
        padding: "64px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "-30%", left: "50%",
          width: 500, height: 500,
          background: "radial-gradient(circle, rgba(255,255,255,.07) 0%, transparent 70%)",
          transform: "translateX(-50%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
          <i className="bi bi-ticket-perforated" style={{ fontSize: "2.5rem", color: "rgba(255,255,255,.6)", display: "block", marginBottom: 16 }} />
          <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 900, color: "#fff", margin: "0 0 12px" }}>
            Already booked? Track your seat.
          </h2>
          <p style={{ color: "rgba(255,255,255,.7)", fontSize: "1rem", margin: "0 0 28px" }}>
            Enter your booking reference to check status, view your seat, and get trip details.
          </p>
          <button
            onClick={() => navigate("/track/enter")}
            className="btn-ad btn-ad-lg"
            style={{
              background: "#fff",
              color: "var(--primary)",
              borderColor: "#fff",
              fontWeight: 800,
            }}
          >
            <i className="bi bi-geo-alt-fill" />
            Track My Booking
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: "var(--gray-900)",
        color: "rgba(255,255,255,.6)",
        padding: "40px 24px 24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 32,
            marginBottom: 32,
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 32, height: 32,
                  background: "var(--primary)",
                  borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: "1rem",
                }}>
                  <i className="bi bi-bus-front-fill" />
                </div>
                <span style={{ color: "#fff", fontWeight: 800 }}>MTN Sacco</span>
              </div>
              <p style={{ fontSize: ".8rem", lineHeight: 1.65, margin: 0 }}>
                Murang'a Transport Network — safe, affordable, and reliable matatu travel across Murang'a County.
              </p>
            </div>

            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: ".85rem", marginBottom: 12 }}>Quick Links</div>
              {[
                { label: "Home", path: "/" },
                { label: "Search Trips", path: "/search" },
                { label: "Track Booking", path: "/track/enter" },
                { label: "About", path: "/about" },
                { label: "Contact", path: "/contact" },
              ].map(link => (
                <div key={link.path} style={{ marginBottom: 7 }}>
                  <a
                    onClick={() => navigate(link.path)}
                    style={{ cursor: "pointer", fontSize: ".82rem", color: "rgba(255,255,255,.55)", transition: "color .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,.55)"; }}
                  >
                    <i className="bi bi-chevron-right" style={{ fontSize: ".65rem", marginRight: 4 }} />
                    {link.label}
                  </a>
                </div>
              ))}
            </div>

            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: ".85rem", marginBottom: 12 }}>Contact</div>
              {[
                { icon: "bi-telephone", text: "+254 722 400 400" },
                { icon: "bi-envelope", text: "info@mtnsacco.co.ke" },
                { icon: "bi-geo-alt", text: "Murang'a Town, Kenya" },
              ].map(item => (
                <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: ".82rem" }}>
                  <i className={`bi ${item.icon}`} style={{ color: "var(--primary)", flexShrink: 0 }} />
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          <div style={{
            borderTop: "1px solid rgba(255,255,255,.08)",
            paddingTop: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
            fontSize: ".75rem",
          }}>
            <span>© {new Date().getFullYear()} MTN Sacco. All rights reserved.</span>
            <span>Powered by M-Pesa <i className="bi bi-heart-fill" style={{ color: "var(--danger)", fontSize: ".65rem" }} /></span>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}