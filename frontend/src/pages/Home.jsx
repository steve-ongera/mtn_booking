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
  }, [value, selectedTown]);

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
    <div className="form-group" ref={ref}>
      <label className="form-label">{label}</label>
      <div className="position-relative">
        <i className="bi bi-geo-alt position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(""); }}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete="off"
          className="form-control"
          style={{ paddingLeft: '36px' }}
        />
        {value && (
          <button
            onMouseDown={e => { e.preventDefault(); onChange(""); setQuery(""); setOpen(true); }}
            className="position-absolute"
            style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray-400)' }}
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
              className={`town-search-item ${town.slug === value ? 'active' : ''}`}
            >
              <i className="bi bi-geo-alt" />
              <span className="flex-1">{town.name}</span>
              {town.slug === value && <i className="bi bi-check2 text-primary" />}
            </div>
          ))}
        </div>
      )}

      {open && query.length > 1 && filtered.length === 0 && (
        <div className="town-search-empty">
          No towns matching "{query}"
        </div>
      )}

      <style>{`
        .town-search-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: var(--radius);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
        }

        .town-search-item {
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: var(--transition);
        }

        .town-search-item:hover {
          background: var(--gray-50);
        }

        .town-search-item.active {
          background: var(--primary-soft);
          color: var(--primary-dark);
          font-weight: 600;
        }

        .town-search-item i {
          color: var(--gray-400);
          font-size: 0.9rem;
          width: 20px;
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
      `}</style>
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
    },
    {
      icon: "bi-phone",
      title: "M-Pesa STK Push",
      desc: "Pay instantly from your phone. Enter your number once and confirm on your handset — no app needed.",
      img: FEATURE_IMAGES[1],
    },
    {
      icon: "bi-ticket-perforated",
      title: "Instant E-Ticket",
      desc: "Receive your booking confirmation the moment you pay. Track your journey status at any time.",
      img: FEATURE_IMAGES[2],
    },
  ];

  return (
    <>
      {/* ════════ HERO SECTION (from global CSS) ════════ */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              <span className="hero-badge-text">Murang'a County, Kenya</span>
            </div>

            <h1 className="hero-title">
              Travel Smart.
              <span>Ride Confident.</span>
            </h1>

            <p className="hero-description">
              Book your matatu seat in advance. Scheduled express trips and stage runs
              across Murang'a and beyond — secured with M-Pesa.
            </p>

            <div className="hero-stats">
              {stats.map(s => (
                <div key={s.label} className="hero-stat">
                  <span className="hero-stat-number">{s.value}</span>
                  <span className="hero-stat-label">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="hero-cta">
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
          <div className="hero-image" id="search-card">
            <div className="hero-card">
              <h3 className="hero-card-title">
                <i className="bi bi-search me-2" />
                Find Your Seat
              </h3>

              <form onSubmit={handleSearch} className="hero-search">
                <div className="d-flex align-center gap-2">
                  <div className="flex-1">
                    <TownSearch
                      label="From"
                      value={form.origin}
                      onChange={v => setForm(f => ({ ...f, origin: v }))}
                      towns={towns}
                      excludeSlug={form.destination}
                      placeholder="Origin town..."
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={swapLocations}
                    className="btn btn-outline-primary"
                    style={{ marginTop: '24px', padding: '8px 12px' }}
                    disabled={!form.origin || !form.destination}
                  >
                    <i className="bi bi-arrow-left-right" />
                  </button>

                  <div className="flex-1">
                    <TownSearch
                      label="To"
                      value={form.destination}
                      onChange={v => setForm(f => ({ ...f, destination: v }))}
                      towns={towns}
                      excludeSlug={form.origin}
                      placeholder="Destination..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="bi bi-calendar3 me-2" />
                    Travel Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    className="form-control"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !form.origin || !form.destination}
                  className="btn btn-primary w-100"
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-search" /> Search Seats
                    </>
                  )}
                </button>
              </form>

              <div className="d-flex justify-between mt-4">
                <button onClick={() => navigate("/track/enter")} className="btn btn-sm btn-outline-primary">
                  <i className="bi bi-qr-code-scan me-1" /> Track
                </button>
                <button onClick={() => navigate("/about")} className="btn btn-sm btn-outline-primary">
                  <i className="bi bi-info-circle me-1" /> About
                </button>
                <button onClick={() => navigate("/contact")} className="btn btn-sm btn-outline-primary">
                  <i className="bi bi-telephone me-1" /> Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ POPULAR ROUTES (from second Home page) ════════ */}
      <section className="routes-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">
              <i className="bi bi-signpost-split me-2" />
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
                  <span className={`badge badge-${route.type === 'express' ? 'success' : 'info'}`}>
                    <i className={`bi bi-${route.type === "express" ? "lightning-charge" : "bus-front"} me-1`} />
                    {route.type === "express" ? "Express" : "Stage"}
                  </span>
                  <span className="route-meta-item">
                    <i className="bi bi-clock" /> {route.duration}
                  </span>
                </div>

                <div className="route-cities">
                  <span>{route.from}</span>
                  <i className="bi bi-arrow-right mx-2" />
                  <span>{route.to}</span>
                </div>

                <div className="d-flex justify-between align-center mb-3">
                  <div className="route-meta-item">
                    <i className="bi bi-calendar-check" />
                    {route.departures}
                  </div>
                  <div className="route-price">{route.fare}</div>
                </div>

                <div className="d-flex align-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--gray-200)' }}>
                  <span className="text-primary fw-600">Book now</span>
                  <i className="bi bi-arrow-right-short text-primary fs-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ FEATURES (from second Home page) ════════ */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">
              <i className="bi bi-stars me-2" />
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
                <div className="feature-icon">
                  <i className={`bi ${f.icon}`} />
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-description">{f.desc}</p>
                <button className="btn btn-outline-primary btn-sm mt-3">
                  Learn more <i className="bi bi-arrow-right ms-1" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ CTA SECTION (from second Home page) ════════ */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-icon">
            <i className="bi bi-ticket-perforated" />
          </div>
          <h2 className="cta-title">Already booked? Track your seat.</h2>
          <p className="cta-description">
            Enter your booking reference to check status, view your seat, 
            and get all trip details instantly.
          </p>
          <button
            onClick={() => navigate("/track/enter")}
            className="btn btn-light btn-lg"
          >
            <i className="bi bi-geo-alt-fill me-2" />
            Track My Booking
          </button>
        </div>
      </section>

      {/* ════════ FOOTER (from second Home page) ════════ */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="footer-logo-icon">
                  <i className="bi bi-bus-front-fill" />
                </div>
                <div className="footer-logo-text">
                  MTN Sacco
                  <small>MURANG'A TRANSPORT NETWORK</small>
                </div>
              </div>
              <p className="footer-description">
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

            <div>
              <h4 className="footer-title">Quick Links</h4>
              <ul className="footer-links">
                <li><button onClick={() => navigate("/")}>Home</button></li>
                <li><button onClick={() => navigate("/search")}>Search Trips</button></li>
                <li><button onClick={() => navigate("/track/enter")}>Track Booking</button></li>
                <li><button onClick={() => navigate("/about")}>About Us</button></li>
                <li><button onClick={() => navigate("/contact")}>Contact</button></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-title">Support</h4>
              <ul className="footer-links">
                <li><button>FAQs</button></li>
                <li><button>Terms & Conditions</button></li>
                <li><button>Privacy Policy</button></li>
                <li><button>Refund Policy</button></li>
                <li><button>Help Center</button></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-title">Contact Us</h4>
              <ul className="footer-links">
                <li>
                  <i className="bi bi-telephone me-2" />
                  <span>+254 722 400 400</span>
                </li>
                <li>
                  <i className="bi bi-envelope me-2" />
                  <span>info@mtnsacco.co.ke</span>
                </li>
                <li>
                  <i className="bi bi-geo-alt me-2" />
                  <span>Murang'a Town, Kenya</span>
                </li>
                <li>
                  <i className="bi bi-clock me-2" />
                  <span>Open 24/7</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} MTN Sacco. All rights reserved.</div>
            <div className="footer-bottom-links">
              <span>Secured by M-Pesa</span>
              <i className="bi bi-shield-check ms-2" />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}