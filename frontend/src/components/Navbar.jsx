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
    { label: "Home",    path: "/", icon: "house" },
    { label: "About",   path: "/about", icon: "info-circle" },
    { label: "Contact", path: "/contact", icon: "telephone" },
  ];

  // On homepage, start with dark background and white text
  // On other pages, use white background with dark text
  const isTransparent = isHome && !scrolled;

  return (
    <>
      <nav className={`ad-topbar ${isTransparent ? 'transparent' : ''}`}>
        <div className="ad-topbar-left">
          {/* Mobile menu toggle - hidden on desktop */}
          <button 
            className="ad-menu-toggle nav-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <i className={`bi bi-${menuOpen ? "x-lg" : "list"}`} />
          </button>

          {/* Logo */}
          <div className="ad-logo" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
            <div className="ad-logo-icon">
              <i className="bi bi-bus-front-fill" />
            </div>
            <div className="ad-logo-text">
              <span className="ad-logo-main">MTN Sacco</span>
              <span className="ad-logo-sub">MURANG'A TRANSPORT</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="nav-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '32px' }}>
            {navLinks.map(link => {
              const isActive = location.pathname === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`ad-nav-item ${isActive ? 'active' : ''}`}
                  style={{ 
                    background: isTransparent && !isActive ? 'rgba(255,255,255,0.15)' : undefined,
                    color: isTransparent && !isActive ? '#ffffff' : undefined
                  }}
                >
                  <i className={`bi bi-${link.icon}`} />
                  {link.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="ad-topbar-right">
          {/* Track button */}
          <button
            onClick={() => navigate("/track/enter")}
            className={`btn ${isTransparent ? 'btn-outline-light' : 'btn-outline-primary'}`}
            style={{ padding: '8px 16px' }}
          >
            <i className="bi bi-geo-alt" />
            <span className="nav-label-hide">Track</span>
          </button>

          {/* Login button */}
          <button
            onClick={() => navigate("/admin/login")}
            className={`btn ${isTransparent ? 'btn-light' : 'btn-primary'}`}
            style={{ padding: '8px 16px' }}
          >
            <i className="bi bi-person-circle" />
            <span className="nav-label-hide">Login</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="mobile-menu"
        >
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => { navigate(link.path); setMenuOpen(false); }}
              className={`mobile-menu-item ${location.pathname === link.path ? 'active' : ''}`}
            >
              <i className={`bi bi-${link.icon}`} />
              {link.label}
            </button>
          ))}

          <div className="divider" />

          <button
            onClick={() => { navigate("/track/enter"); setMenuOpen(false); }}
            className="mobile-menu-item"
          >
            <i className="bi bi-geo-alt" />
            Track Booking
          </button>

          <button
            onClick={() => { navigate("/admin/login"); setMenuOpen(false); }}
            className="mobile-menu-item mobile-menu-login"
          >
            <i className="bi bi-person-circle" />
            Admin Login
          </button>
        </div>
      )}

      <style>{`
        /* Navbar custom styles */
        .ad-topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 200;
          transition: all 0.3s ease;
        }

        .ad-topbar.transparent {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(255,255,255,0.15);
          box-shadow: none;
        }

        .ad-topbar.transparent .ad-logo-main {
          color: #ffffff;
        }

        .ad-topbar.transparent .ad-logo-sub {
          color: rgba(255,255,255,0.7);
        }

        .ad-topbar.transparent .ad-logo-icon {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
        }

        .ad-topbar.transparent .ad-nav-item {
          color: rgba(255,255,255,0.9);
        }

        .ad-topbar.transparent .ad-nav-item:hover {
          background: rgba(255,255,255,0.15);
          color: #ffffff;
        }

        .ad-topbar.transparent .ad-nav-item.active {
          background: rgba(255,255,255,0.2);
          color: #ffffff;
          border-left: 3px solid #ffffff;
        }

        .ad-topbar.transparent .ad-nav-item i {
          color: rgba(255,255,255,0.7);
        }

        .ad-topbar.transparent .ad-nav-item:hover i,
        .ad-topbar.transparent .ad-nav-item.active i {
          color: #ffffff;
        }

        /* Mobile menu styles */
        .mobile-menu {
          position: fixed;
          top: var(--header-height);
          left: 16px;
          right: 16px;
          background: #ffffff;
          border-radius: var(--radius-lg);
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow-xl);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 199;
          animation: slideDown 0.2s ease;
        }

        .mobile-menu-item {
          padding: 12px 16px;
          border-radius: var(--radius);
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--gray-700);
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: var(--transition);
          width: 100%;
          text-align: left;
        }

        .mobile-menu-item i {
          font-size: 1.1rem;
          opacity: 0.7;
          color: var(--gray-500);
        }

        .mobile-menu-item:hover {
          background: var(--gray-100);
        }

        .mobile-menu-item.active {
          background: var(--primary-light);
          color: var(--primary-dark);
        }

        .mobile-menu-item.active i {
          color: var(--primary);
        }

        .mobile-menu-login {
          background: var(--primary);
          color: #ffffff;
          margin-top: 4px;
        }

        .mobile-menu-login i {
          color: #ffffff;
          opacity: 1;
        }

        .mobile-menu-login:hover {
          background: var(--primary-dark);
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

        /* Responsive */
        @media (min-width: 769px) {
          .nav-hamburger {
            display: none !important;
          }
        }

        @media (max-width: 768px) {
          .nav-hamburger {
            display: flex !important;
          }
          
          .nav-desktop-links {
            display: none !important;
          }
          
          .nav-label-hide {
            display: none;
          }
          
          .ad-topbar .btn {
            padding: 8px 12px !important;
          }
        }

        @media (max-width: 480px) {
          .ad-topbar {
            padding: 0 16px;
          }
          
          .ad-logo-sub {
            display: none;
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