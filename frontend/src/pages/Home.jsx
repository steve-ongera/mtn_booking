// frontend/src/pages/Home.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

const HERO_IMAGE = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&q=80&fit=crop";
const FEATURE_IMAGES = [
  "https://images.unsplash.com/photo-1570547255950-da99cfa46d6a?w=600&q=80&fit=crop",
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80&fit=crop",
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80&fit=crop",
];

/* ─── Town Combobox (Improved) ─── */
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

  return (
    <div ref={ref} className="town-search-container">
      <label className="town-search-label">{label}</label>
      <div className={`town-search-input-wrapper ${focused ? 'focused' : ''}`}>
        <i className="bi bi-geo-alt town-search-icon" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(""); }}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete="off"
          className="town-search-input"
        />
        {value && (
          <button
            onMouseDown={e => { e.preventDefault(); onChange(""); setQuery(""); setOpen(true); }}
            className="town-search-clear"
          >
            <i className="bi bi-x" />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="town-search-dropdown">
          {filtered.map(town => (
            <div
              key={town.id}
              onMouseDown={e => { e.preventDefault(); onChange(town.slug); setQuery(town.name); setOpen(false); }}
              className={`town-search-item ${town.slug === value ? 'selected' : ''}`}
            >
              <i className="bi bi-geo-alt" />
              {town.name}
              {town.slug === value && <i className="bi bi-check2" />}
            </div>
          ))}
        </div>
      )}

      {open && query.length > 1 && filtered.length === 0 && (
        <div className="town-search-empty">
          No towns matching "{query}"
        </div>
      )}
    </div>
  );
}

/* ─── Main Home Component ─── */
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
    { value: "50+", label: "Matatus", icon: "bi-bus-front" },
    { value: "2K+", label: "Daily Riders", icon: "bi-people" },
    { value: "12",  label: "Routes", icon: "bi-signpost-split" },
    { value: "99%", label: "On Time", icon: "bi-clock-history" },
  ];

  const popularRoutes = [
    { from: "Murang'a", to: "Nairobi", duration: "2h 30m", fare: "KES 350", type: "express", departures: "15 daily" },
    { from: "Murang'a", to: "Thika",   duration: "1h 30m", fare: "KES 200", type: "stage", departures: "25 daily" },
    { from: "Murang'a", to: "Nyeri",   duration: "2h",     fare: "KES 300", type: "express", departures: "12 daily" },
    { from: "Thika",    to: "Nairobi", duration: "1h",     fare: "KES 150", type: "stage", departures: "30 daily" },
    { from: "Murang'a", to: "Embu",    duration: "3h",     fare: "KES 450", type: "express", departures: "8 daily" },
    { from: "Nairobi",  to: "Murang'a", duration: "2h 30m", fare: "KES 350", type: "express", departures: "15 daily" },
  ];

  const features = [
    {
      icon: "bi-grid-3x3-gap",
      title: "Choose Your Seat",
      desc: "Pick exactly where you sit — window, aisle, or front row. Live seat map updates in real time.",
      img: FEATURE_IMAGES[0],
      iconBg: "var(--primary-light)",
      iconColor: "var(--primary)",
    },
    {
      icon: "bi-phone",
      title: "M-Pesa STK Push",
      desc: "Pay instantly from your phone. Enter your number once and confirm on your handset — no app needed.",
      img: FEATURE_IMAGES[1],
      iconBg: "#f0fdf4",
      iconColor: "#15803d",
    },
    {
      icon: "bi-ticket-perforated",
      title: "Instant E-Ticket",
      desc: "Receive your booking confirmation the moment you pay. Track your journey status at any time.",
      img: FEATURE_IMAGES[2],
      iconBg: "var(--warning-light)",
      iconColor: "var(--warning)",
    },
  ];

  return (
    <div className="home-page">

      {/* ════════ HERO SECTION ════════ */}
      <section className="home-hero">
        <div className="home-hero-overlay" />
        <img src={HERO_IMAGE} alt="MTN Sacco matatu transport" className="home-hero-bg" />
        
        <div className="home-hero-container">
          <div className="home-hero-content">
            <div className="home-hero-badge">
              <span className="home-hero-badge-dot" />
              <span>Murang'a County, Kenya</span>
            </div>

            <h1 className="home-hero-title">
              Travel Smart.
              <span>Ride Confident.</span>
            </h1>

            <p className="home-hero-description">
              Book your matatu seat in advance. Scheduled express trips and stage runs
              across Murang'a and beyond — secured with M-Pesa.
            </p>

            <div className="home-hero-stats">
              {stats.map(s => (
                <div key={s.label} className="home-hero-stat">
                  <i className={`bi ${s.icon}`} />
                  <div>
                    <div className="home-hero-stat-value">{s.value}</div>
                    <div className="home-hero-stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="home-hero-actions">
              <button
                onClick={() => document.getElementById("search-card")?.scrollIntoView({ behavior: "smooth" })}
                className="btn btn-primary btn-lg"
              >
                <i className="bi bi-search" /> Book a Seat
              </button>
              <button
                onClick={() => navigate("/track/enter")}
                className="btn btn-outline-light btn-lg"
              >
                <i className="bi bi-geo-alt" /> Track Booking
              </button>
            </div>
          </div>

          {/* Search Card */}
          <div className="home-search-card" id="search-card">
            <div className="home-search-header">
              <i className="bi bi-search" />
              <div>
                <h3>Find Your Seat</h3>
                <p>Search express trips and stage runs</p>
              </div>
            </div>

            <form onSubmit={handleSearch}>
              <div className="home-search-grid">
                <TownSearch
                  label="From"
                  value={form.origin}
                  onChange={v => setForm(f => ({ ...f, origin: v }))}
                  towns={towns}
                  excludeSlug={form.destination}
                  placeholder="Origin town..."
                />
                
                <button
                  type="button"
                  onClick={swapLocations}
                  className="home-search-swap"
                  disabled={!form.origin || !form.destination}
                >
                  <i className="bi bi-arrow-left-right" />
                </button>

                <TownSearch
                  label="To"
                  value={form.destination}
                  onChange={v => setForm(f => ({ ...f, destination: v }))}
                  towns={towns}
                  excludeSlug={form.origin}
                  placeholder="Destination..."
                />
              </div>

              <div className="home-search-date">
                <label>
                  <i className="bi bi-calendar3" /> Travel Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !form.origin || !form.destination}
                className="btn btn-primary btn-block"
              >
                {loading ? (
                  <>
                    <span className="spinner spinner-sm" />
                    Searching...
                  </>
                ) : (
                  <>
                    <i className="bi bi-search" /> Search Seats
                  </>
                )}
              </button>
            </form>

            <div className="home-search-footer">
              <button onClick={() => navigate("/track/enter")}>
                <i className="bi bi-qr-code-scan" /> Track Booking
              </button>
              <button onClick={() => navigate("/about")}>
                <i className="bi bi-info-circle" /> About MTN
              </button>
              <button onClick={() => navigate("/contact")}>
                <i className="bi bi-telephone" /> Contact
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ POPULAR ROUTES ════════ */}
      <section className="home-routes">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">
              <i className="bi bi-signpost-split" />
              Popular Routes
            </div>
            <h2 className="section-title">Where are you heading today?</h2>
            <p className="section-description">
              Most traveled routes by our passengers
            </p>
          </div>

          <div className="routes-grid">
            {popularRoutes.map((route, i) => (
              <div
                key={i}
                className="route-card"
                onClick={() => {
                  const originSlug = route.from.toLowerCase().replace(/[^a-z0-9]/g, "-");
                  const destSlug = route.to.toLowerCase().replace(/[^a-z0-9]/g, "-");
                  navigate(`/search?origin=${originSlug}&destination=${destSlug}&date=${new Date().toISOString().split("T")[0]}`);
                }}
              >
                <div className="route-header">
                  <span className={`badge badge-${route.type}`}>
                    <i className={`bi bi-${route.type === "express" ? "lightning-charge" : "bus-front"}`} />
                    {route.type === "express" ? "Express" : "Stage"}
                  </span>
                  <span className="route-duration">
                    <i className="bi bi-clock" /> {route.duration}
                  </span>
                </div>

                <div className="route-cities">
                  <span>{route.from}</span>
                  <i className="bi bi-arrow-right" />
                  <span>{route.to}</span>
                </div>

                <div className="route-info">
                  <div className="route-departures">
                    <i className="bi bi-calendar-check" />
                    {route.departures}
                  </div>
                  <div className="route-price">{route.fare}</div>
                </div>

                <div className="route-footer">
                  <span>Book now</span>
                  <i className="bi bi-arrow-right-short" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ FEATURES ════════ */}
      <section className="home-features">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">
              <i className="bi bi-stars" />
              Why MTN Sacco
            </div>
            <h2 className="section-title">A better way to travel</h2>
            <p className="section-description">
              Experience the future of matatu travel with our modern features
            </p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-image">
                  <img src={f.img} alt={f.title} />
                  <div className="feature-image-overlay" />
                </div>
                <div className="feature-content">
                  <div className="feature-icon" style={{ background: f.iconBg, color: f.iconColor }}>
                    <i className={`bi ${f.icon}`} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                  <button className="feature-link">
                    Learn more <i className="bi bi-arrow-right" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ CTA SECTION ════════ */}
      <section className="home-cta">
        <div className="container">
          <div className="cta-content">
            <div className="cta-icon">
              <i className="bi bi-ticket-perforated" />
            </div>
            <h2>Already booked? Track your seat.</h2>
            <p>
              Enter your booking reference to check status, view your seat, 
              and get all trip details instantly.
            </p>
            <button
              onClick={() => navigate("/track/enter")}
              className="btn btn-light btn-lg"
            >
              <i className="bi bi-geo-alt-fill" />
              Track My Booking
            </button>
          </div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="home-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="footer-logo-icon">
                  <i className="bi bi-bus-front-fill" />
                </div>
                <div className="footer-logo-text">
                  <span>MTN Sacco</span>
                  <small>MURANG'A TRANSPORT NETWORK</small>
                </div>
              </div>
              <p>
                Safe, affordable, and reliable matatu travel across Murang'a County and beyond.
              </p>
              <div className="footer-social">
                <a href="#" className="footer-social-link">
                  <i className="bi bi-facebook" />
                </a>
                <a href="#" className="footer-social-link">
                  <i className="bi bi-twitter-x" />
                </a>
                <a href="#" className="footer-social-link">
                  <i className="bi bi-instagram" />
                </a>
                <a href="#" className="footer-social-link">
                  <i className="bi bi-whatsapp" />
                </a>
              </div>
            </div>

            <div className="footer-links">
              <h4>Quick Links</h4>
              <ul>
                <li><button onClick={() => navigate("/")}>Home</button></li>
                <li><button onClick={() => navigate("/search")}>Search Trips</button></li>
                <li><button onClick={() => navigate("/track/enter")}>Track Booking</button></li>
                <li><button onClick={() => navigate("/about")}>About Us</button></li>
                <li><button onClick={() => navigate("/contact")}>Contact</button></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Support</h4>
              <ul>
                <li><button>FAQs</button></li>
                <li><button>Terms & Conditions</button></li>
                <li><button>Privacy Policy</button></li>
                <li><button>Refund Policy</button></li>
                <li><button>Help Center</button></li>
              </ul>
            </div>

            <div className="footer-contact">
              <h4>Contact Us</h4>
              <ul>
                <li>
                  <i className="bi bi-telephone" />
                  <span>+254 722 400 400</span>
                </li>
                <li>
                  <i className="bi bi-envelope" />
                  <span>info@mtnsacco.co.ke</span>
                </li>
                <li>
                  <i className="bi bi-geo-alt" />
                  <span>Murang'a Town, Kenya</span>
                </li>
                <li>
                  <i className="bi bi-clock" />
                  <span>Open 24/7</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} MTN Sacco. All rights reserved.</div>
            <div className="footer-bottom-links">
              <span>Secured by M-Pesa</span>
              <i className="bi bi-shield-check" />
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .home-page {
          padding-top: var(--header-height);
        }

        /* Hero Section */
        .home-hero {
          position: relative;
          min-height: 600px;
          display: flex;
          align-items: center;
          overflow: hidden;
        }

        .home-hero-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .home-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.9) 0%,
            rgba(0, 0, 0, 0.7) 50%,
            rgba(0, 0, 0, 0.8) 100%
          );
          z-index: 1;
        }

        .home-hero-container {
          position: relative;
          z-index: 2;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
          width: 100%;
        }

        .home-hero-content {
          color: white;
        }

        .home-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 8px 16px;
          border-radius: 100px;
          margin-bottom: 24px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .home-hero-badge-dot {
          width: 6px;
          height: 6px;
          background: var(--primary-light);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .home-hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 20px;
          color: white;
        }

        .home-hero-title span {
          color: var(--primary-light);
          display: block;
        }

        .home-hero-description {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 32px;
          max-width: 500px;
        }

        .home-hero-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 40px;
        }

        .home-hero-stat {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .home-hero-stat i {
          font-size: 1.5rem;
          color: var(--primary-light);
          background: rgba(255, 255, 255, 0.1);
          padding: 10px;
          border-radius: var(--radius);
        }

        .home-hero-stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          line-height: 1.2;
        }

        .home-hero-stat-label {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .home-hero-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        /* Search Card */
        .home-search-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: var(--radius-2xl);
          padding: 32px;
          box-shadow: var(--shadow-xl);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .home-search-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .home-search-header i {
          width: 48px;
          height: 48px;
          background: var(--primary-light);
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          font-size: 1.25rem;
        }

        .home-search-header h3 {
          margin: 0 0 4px;
          font-size: 1.25rem;
        }

        .home-search-header p {
          margin: 0;
          color: var(--gray-500);
          font-size: 0.9rem;
        }

        .home-search-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }

        .home-search-swap {
          width: 42px;
          height: 42px;
          border: 1px solid var(--gray-200);
          border-radius: var(--radius);
          background: white;
          color: var(--gray-400);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 24px;
        }

        .home-search-swap:hover:not(:disabled) {
          background: var(--primary-light);
          color: var(--primary);
          border-color: var(--primary);
        }

        .home-search-swap:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .home-search-date {
          margin-bottom: 20px;
        }

        .home-search-date label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--gray-700);
        }

        .home-search-date input {
          width: 100%;
          height: 48px;
          padding: 0 16px;
          border: 1px solid var(--gray-300);
          border-radius: var(--radius);
          font-family: var(--font-body);
          transition: all 0.2s;
        }

        .home-search-date input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px var(--primary-glow);
        }

        .home-search-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--gray-200);
        }

        .home-search-footer button {
          background: none;
          border: none;
          color: var(--gray-500);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s;
          padding: 0;
        }

        .home-search-footer button:hover {
          color: var(--primary);
        }

        /* Town Search Component */
        .town-search-container {
          position: relative;
          width: 100%;
        }

        .town-search-label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--gray-600);
        }

        .town-search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          border: 1px solid var(--gray-300);
          border-radius: var(--radius);
          transition: all 0.2s;
          background: white;
        }

        .town-search-input-wrapper.focused {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px var(--primary-glow);
        }

        .town-search-icon {
          position: absolute;
          left: 12px;
          color: var(--gray-400);
          font-size: 0.9rem;
        }

        .town-search-input {
          width: 100%;
          height: 48px;
          padding: 0 12px 0 36px;
          border: none;
          border-radius: var(--radius);
          font-family: var(--font-body);
          font-size: 0.95rem;
        }

        .town-search-input:focus {
          outline: none;
        }

        .town-search-clear {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: var(--gray-400);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .town-search-clear:hover {
          color: var(--gray-600);
        }

        .town-search-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: var(--radius);
          box-shadow: var(--shadow-lg);
          z-index: 100;
          max-height: 200px;
          overflow-y: auto;
        }

        .town-search-item {
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s;
        }

        .town-search-item:hover {
          background: var(--gray-50);
        }

        .town-search-item.selected {
          background: var(--primary-light);
          color: var(--primary);
          font-weight: 600;
        }

        .town-search-item i {
          color: var(--gray-400);
          font-size: 0.9rem;
        }

        .town-search-item .bi-check2 {
          margin-left: auto;
          color: var(--primary);
        }

        .town-search-empty {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: var(--radius);
          box-shadow: var(--shadow-lg);
          padding: 16px;
          text-align: center;
          color: var(--gray-500);
        }

        /* Button styles */
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

        .btn-primary {
          background: var(--primary);
          color: white;
          box-shadow: var(--shadow-green);
        }

        .btn-primary:hover {
          background: var(--primary-dark);
          transform: translateY(-1px);
          box-shadow: var(--shadow-lg);
        }

        .btn-outline-light {
          background: transparent;
          border: 1.5px solid rgba(255, 255, 255, 0.5);
          color: white;
        }

        .btn-outline-light:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: white;
          transform: translateY(-1px);
        }

        .btn-light {
          background: white;
          color: var(--primary-dark);
          border: 1.5px solid white;
        }

        .btn-light:hover {
          background: rgba(255, 255, 255, 0.9);
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .btn-block {
          width: 100%;
        }

        /* Spinner */
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .spinner-sm {
          width: 14px;
          height: 14px;
          border-width: 2px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .home-hero-container {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          
          .home-hero-title {
            font-size: 2.5rem;
          }
        }

        @media (max-width: 768px) {
          .home-hero-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .home-search-grid {
            grid-template-columns: 1fr;
          }
          
          .home-search-swap {
            margin-top: 0;
            width: 100%;
          }
          
          .home-search-footer {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
        }

        @media (max-width: 480px) {
          .home-hero-actions {
            flex-direction: column;
          }
          
          .home-hero-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}