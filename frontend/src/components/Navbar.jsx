// frontend/src/components/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  const navBg = isHome && !scrolled
    ? "rgba(0,0,0,0)"
    : "#fff";
  const textColor = isHome && !scrolled ? "#fff" : "var(--gray-700)";
  const logoColor = isHome && !scrolled ? "#fff" : "var(--primary)";
  const borderBottom = isHome && !scrolled ? "none" : "1px solid var(--gray-200)";
  const boxShadow = scrolled ? "var(--shadow)" : "none";

  return (
    <nav
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 200,
        height: "var(--header-height)",
        background: navBg,
        borderBottom,
        boxShadow,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 12,
        transition: "background .25s, box-shadow .25s",
      }}
    >
      {/* Logo */}
      <div
        onClick={() => navigate("/")}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          cursor: "pointer", textDecoration: "none", flex: "0 0 auto",
        }}
      >
        <div style={{
          width: 34, height: 34,
          background: isHome && !scrolled ? "rgba(255,255,255,0.2)" : "var(--primary)",
          borderRadius: "var(--radius-sm)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 16,
          border: isHome && !scrolled ? "1.5px solid rgba(255,255,255,0.4)" : "none",
          transition: "background .25s",
        }}>
          <i className="bi bi-bus-front-fill" />
        </div>
        <div>
          <div style={{
            fontWeight: 800, fontSize: ".97rem", color: logoColor,
            lineHeight: 1, transition: "color .25s",
          }}>MTN Sacco</div>
          <div style={{
            fontSize: ".62rem", fontWeight: 500,
            color: isHome && !scrolled ? "rgba(255,255,255,0.7)" : "var(--gray-400)",
            letterSpacing: ".05em", transition: "color .25s",
          }}>Murang'a Transport Network</div>
        </div>
      </div>

      {/* Desktop Links */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        flex: 1, justifyContent: "center",
      }}
        className="nav-desktop-links"
      >
        {navLinks.map(link => (
          <a
            key={link.path}
            onClick={() => navigate(link.path)}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: ".88rem",
              fontWeight: 600,
              color: location.pathname === link.path
                ? (isHome && !scrolled ? "#fff" : "var(--primary)")
                : textColor,
              background: location.pathname === link.path
                ? (isHome && !scrolled ? "rgba(255,255,255,0.15)" : "var(--blue-50)")
                : "transparent",
              cursor: "pointer",
              transition: "all .15s",
              textDecoration: "none",
            }}
            onMouseEnter={e => {
              if (location.pathname !== link.path)
                e.currentTarget.style.background = isHome && !scrolled
                  ? "rgba(255,255,255,0.1)" : "var(--gray-100)";
            }}
            onMouseLeave={e => {
              if (location.pathname !== link.path)
                e.currentTarget.style.background = "transparent";
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Right Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
        <button
          onClick={() => navigate("/track/enter")}
          className="btn-ad btn-ad-sm"
          style={{
            background: isHome && !scrolled ? "rgba(255,255,255,0.15)" : "#fff",
            color: isHome && !scrolled ? "#fff" : "var(--gray-700)",
            borderColor: isHome && !scrolled ? "rgba(255,255,255,0.35)" : "var(--gray-300)",
            fontWeight: 600,
          }}
        >
          <i className="bi bi-geo-alt" />
          <span className="nav-track-label">Track</span>
        </button>
        <button
          onClick={() => navigate("/admin/login")}
          className="btn-ad btn-ad-sm btn-ad-primary"
          style={{
            background: isHome && !scrolled ? "#fff" : "var(--primary)",
            color: isHome && !scrolled ? "var(--primary)" : "#fff",
            borderColor: isHome && !scrolled ? "#fff" : "var(--primary)",
          }}
        >
          <i className="bi bi-person-circle" />
          <span className="nav-login-label">Login</span>
        </button>

        {/* Mobile hamburger */}
        <button
          className="btn-ad btn-ad-ghost nav-hamburger"
          style={{ color: textColor, padding: "6px 8px" }}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
        >
          <i className={`bi bi-${menuOpen ? "x-lg" : "list"}`} style={{ fontSize: "1.1rem" }} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: "var(--header-height)",
            left: 0, right: 0,
            background: "#fff",
            borderBottom: "1px solid var(--gray-200)",
            boxShadow: "var(--shadow-lg)",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            zIndex: 199,
            animation: "slideUp .15s ease",
          }}
        >
          {navLinks.map(link => (
            <a
              key={link.path}
              onClick={() => { navigate(link.path); setMenuOpen(false); }}
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                fontSize: ".9rem",
                fontWeight: 600,
                color: location.pathname === link.path ? "var(--primary)" : "var(--gray-700)",
                background: location.pathname === link.path ? "var(--blue-50)" : "transparent",
                cursor: "pointer",
              }}
            >
              {link.label}
            </a>
          ))}
          <div style={{ height: 1, background: "var(--gray-100)", margin: "6px 0" }} />
          <a
            onClick={() => { navigate("/track/enter"); setMenuOpen(false); }}
            style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: ".9rem", fontWeight: 600, color: "var(--gray-700)", cursor: "pointer" }}
          >
            <i className="bi bi-geo-alt" style={{ marginRight: 8 }} />
            Track Booking
          </a>
          <a
            onClick={() => { navigate("/admin/login"); setMenuOpen(false); }}
            style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: ".9rem", fontWeight: 600, color: "var(--primary)", cursor: "pointer" }}
          >
            <i className="bi bi-person-circle" style={{ marginRight: 8 }} />
            Login
          </a>
        </div>
      )}

      <style>{`
        @media (min-width: 769px) { .nav-hamburger { display: none !important; } }
        @media (max-width: 768px) {
          .nav-desktop-links { display: none !important; }
          .nav-track-label { display: none; }
          .nav-login-label { display: none; }
        }
        @media (max-width: 480px) { .nav-track-label, .nav-login-label { display: none; } }
      `}</style>
    </nav>
  );
}