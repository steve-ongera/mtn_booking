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
    const onScroll = () => setScrolled(window.scrollY > 60);
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

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const navLinks = [
    { label: "Home",    path: "/" },
    { label: "About",   path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  // IMPROVED: On homepage, start with dark background and white text immediately
  // On other pages, always use white background with dark text
  const isTransparent = isHome && !scrolled;

  // Better contrast for initial state
  const navBg         = isTransparent ? "rgba(0, 0, 0, 0.6)"      : "#ffffff";
  const navBorder     = isTransparent ? "1px solid rgba(255,255,255,0.15)" : "1px solid var(--gray-100)";
  const navShadow     = isTransparent ? "none"                    : "0 2px 20px rgba(0,0,0,.06)";
  const navBackdrop   = isTransparent ? "blur(8px)"               : "none";
  const textColor     = isTransparent ? "#ffffff"                 : "var(--gray-700)";
  const activeColor   = isTransparent ? "#ffffff"                 : "var(--primary)";
  const activeBg      = isTransparent ? "rgba(255,255,255,0.2)"   : "var(--primary-light)";
  const logoTextColor = isTransparent ? "#ffffff"                 : "var(--gray-900)";
  const logoSubColor  = isTransparent ? "rgba(255,255,255,0.7)"   : "var(--gray-500)";
  const logoBg        = isTransparent ? "rgba(255,255,255,0.2)"   : "var(--primary)";
  const logoBorder    = isTransparent ? "1px solid rgba(255,255,255,0.3)" : "none";

  return (
    <>
      <nav style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 200,
        height: "var(--header-height)",
        background: navBg,
        borderBottom: navBorder,
        boxShadow: navShadow,
        backdropFilter: navBackdrop,
        WebkitBackdropFilter: navBackdrop,
        display: "flex",
        alignItems: "center",
        padding: "0 28px",
        gap: 12,
        transition: "all 0.3s ease",
      }}>

        {/* ── Logo ── */}
        <div
          onClick={() => navigate("/")}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            cursor: "pointer", flex: "0 0 auto",
            textDecoration: "none",
          }}
        >
          <div style={{
            width: 36, height: 36,
            background: logoBg,
            border: logoBorder,
            borderRadius: "var(--radius-sm)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 16,
            transition: "all 0.3s",
            flexShrink: 0,
          }}>
            <i className="bi bi-bus-front-fill" />
          </div>
          <div>
            <div style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: ".97rem",
              color: logoTextColor,
              lineHeight: 1,
              transition: "color 0.3s",
            }}>
              MTN Sacco
            </div>
            <div style={{
              fontSize: ".6rem",
              fontWeight: 600,
              color: logoSubColor,
              letterSpacing: ".05em",
              transition: "color 0.3s",
            }}>
              MURANG'A TRANSPORT
            </div>
          </div>
        </div>

        {/* ── Desktop Links ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 2,
          flex: 1, justifyContent: "center",
        }} className="nav-desktop-links">
          {navLinks.map(link => {
            const isActive = location.pathname === link.path;
            return (
              <a
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{
                  padding: "7px 16px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: ".88rem",
                  fontWeight: 600,
                  color: isActive ? activeColor : textColor,
                  background: isActive ? activeBg : "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = isTransparent
                      ? "rgba(255,255,255,0.15)" : "var(--gray-100)";
                    e.currentTarget.style.color = isTransparent
                      ? "#ffffff" : "var(--gray-900)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = textColor;
                  }
                }}
              >
                {link.label}
              </a>
            );
          })}
        </div>

        {/* ── Right Actions ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>

          {/* Track button */}
          <button
            onClick={() => navigate("/track/enter")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "7px 16px",
              borderRadius: "var(--radius)",
              fontFamily: "var(--font-body)",
              fontSize: ".86rem",
              fontWeight: 600,
              cursor: "pointer",
              border: "1.5px solid",
              transition: "all 0.3s",
              whiteSpace: "nowrap",
              lineHeight: 1,
              background: isTransparent ? "rgba(255,255,255,0.15)" : "#ffffff",
              color: isTransparent ? "#ffffff" : "var(--gray-700)",
              borderColor: isTransparent ? "rgba(255,255,255,0.3)" : "var(--gray-200)",
            }}
            onMouseEnter={e => {
              if (isTransparent) {
                e.currentTarget.style.background = "rgba(255,255,255,0.25)";
              }
            }}
            onMouseLeave={e => {
              if (isTransparent) {
                e.currentTarget.style.background = "rgba(255,255,255,0.15)";
              }
            }}
          >
            <i className="bi bi-geo-alt" />
            <span className="nav-label-hide">Track</span>
          </button>

          {/* Login button */}
          <button
            onClick={() => navigate("/admin/login")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "7px 16px",
              borderRadius: "var(--radius)",
              fontFamily: "var(--font-body)",
              fontSize: ".86rem",
              fontWeight: 700,
              cursor: "pointer",
              border: "1.5px solid",
              transition: "all 0.3s",
              whiteSpace: "nowrap",
              lineHeight: 1,
              background: isTransparent ? "#ffffff" : "var(--primary)",
              color: isTransparent ? "var(--primary)" : "#ffffff",
              borderColor: isTransparent ? "#ffffff" : "var(--primary)",
            }}
            onMouseEnter={e => {
              if (!isTransparent) {
                e.currentTarget.style.background = "var(--primary-dark)";
                e.currentTarget.style.borderColor = "var(--primary-dark)";
              }
            }}
            onMouseLeave={e => {
              if (!isTransparent) {
                e.currentTarget.style.background = "var(--primary)";
                e.currentTarget.style.borderColor = "var(--primary)";
              }
            }}
          >
            <i className="bi bi-person-circle" />
            <span className="nav-label-hide">Login</span>
          </button>

          {/* Mobile hamburger */}
          <button
            className="nav-hamburger"
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "var(--radius)",
              background: "transparent",
              border: "none",
              color: isTransparent ? "#ffffff" : "var(--gray-700)",
              fontSize: "1.2rem",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <i className={`bi bi-${menuOpen ? "x-lg" : "list"}`} />
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: "var(--header-height)",
            left: 16, right: 16,
            background: "#ffffff",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--gray-200)",
            boxShadow: "var(--shadow-xl)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            zIndex: 199,
            animation: "slideDown 0.2s ease",
          }}
        >
          {navLinks.map(link => (
            <a
              key={link.path}
              onClick={() => { navigate(link.path); setMenuOpen(false); }}
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius)",
                fontSize: ".95rem",
                fontWeight: 600,
                color: location.pathname === link.path ? "var(--primary)" : "var(--gray-700)",
                background: location.pathname === link.path ? "var(--primary-light)" : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                transition: "all 0.2s",
                textDecoration: "none",
              }}
              onMouseEnter={e => {
                if (location.pathname !== link.path) {
                  e.currentTarget.style.background = "var(--gray-100)";
                }
              }}
              onMouseLeave={e => {
                if (location.pathname !== link.path) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <i className={`bi bi-${
                link.label === "Home" ? "house" : 
                link.label === "About" ? "info-circle" : 
                "telephone"
              }`} style={{ fontSize: "1.1rem", opacity: 0.7 }} />
              {link.label}
            </a>
          ))}

          <div style={{ height: 1, background: "var(--gray-200)", margin: "8px 0" }} />

          <a
            onClick={() => { navigate("/track/enter"); setMenuOpen(false); }}
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius)",
              fontSize: ".95rem",
              fontWeight: 600,
              color: "var(--gray-700)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              transition: "all 0.2s",
              textDecoration: "none",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--gray-100)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <i className="bi bi-geo-alt" style={{ fontSize: "1.1rem", opacity: 0.7 }} />
            Track Booking
          </a>

          <a
            onClick={() => { navigate("/admin/login"); setMenuOpen(false); }}
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius)",
              fontSize: ".95rem",
              fontWeight: 700,
              color: "#ffffff",
              background: "var(--primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              transition: "all 0.2s",
              textDecoration: "none",
              marginTop: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--primary-dark)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--primary)"; }}
          >
            <i className="bi bi-person-circle" style={{ fontSize: "1.1rem" }} />
            Admin Login
          </a>
        </div>
      )}

      <style>{`
        @media (min-width: 769px) {
          .nav-hamburger { display: none !important; }
        }
        @media (max-width: 768px) {
          .nav-hamburger { display: flex !important; }
          .nav-desktop-links { display: none !important; }
          .nav-label-hide { display: none; }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Add padding to body to account for fixed navbar */
        body {
          padding-top: var(--header-height);
        }
      `}</style>
    </>
  );
}