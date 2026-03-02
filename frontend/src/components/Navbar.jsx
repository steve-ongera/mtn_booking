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
        </div>

        <div className="ad-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Desktop Navigation Links - Now on the right */}
          <div className="nav-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {navLinks.map(link => {
              const isActive = location.pathname === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`nav-link-btn ${isActive ? 'active' : ''}`}
                  style={{ 
                    color: isTransparent && !isActive ? '#ffffff' : 'var(--gray-700)',
                  }}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          {/* Track button - No border radius */}
          <button
            onClick={() => navigate("/track/enter")}
            className={`action-btn ${isTransparent ? 'light' : 'dark'}`}
          >
            <i className="bi bi-geo-alt" />
            <span>Track</span>
          </button>

          {/* Login button - Only this has border radius */}
          <button
            onClick={() => navigate("/admin/login")}
            className={`login-btn ${isTransparent ? 'light' : ''}`}
          >
            <i className="bi bi-person-circle" />
            <span>Login</span>
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
          padding: 0 32px;
          height: var(--header-height);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border-bottom: 1px solid var(--gray-200);
        }

        .ad-topbar.transparent {
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(255,255,255,0.1);
          box-shadow: none;
        }

        .ad-topbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ad-topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* Logo styles */
        .ad-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .ad-logo-icon {
          width: 36px;
          height: 36px;
          background: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1rem;
          transition: all 0.3s;
        }

        .ad-topbar.transparent .ad-logo-icon {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
        }

        .ad-logo-text {
          display: flex;
          flex-direction: column;
        }

        .ad-logo-main {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1rem;
          color: var(--gray-900);
          line-height: 1.2;
          transition: color 0.3s;
        }

        .ad-topbar.transparent .ad-logo-main {
          color: #ffffff;
        }

        .ad-logo-sub {
          font-size: 0.6rem;
          font-weight: 600;
          color: var(--gray-500);
          letter-spacing: 0.3px;
          transition: color 0.3s;
        }

        .ad-topbar.transparent .ad-logo-sub {
          color: rgba(255,255,255,0.7);
        }

        /* Navigation link buttons - CLEAN, NO BORDER RADIUS */
        .nav-link-btn {
          background: none;
          border: none;
          padding: 8px 12px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          border-bottom: 2px solid transparent;
        }

        .nav-link-btn:hover {
          color: var(--primary) !important;
        }

        .nav-link-btn.active {
          color: var(--primary);
          font-weight: 600;
          border-bottom-color: var(--primary);
        }

        .ad-topbar.transparent .nav-link-btn.active {
          color: #ffffff;
          border-bottom-color: #ffffff;
        }

        .ad-topbar.transparent .nav-link-btn:hover {
          color: #ffffff !important;
          opacity: 0.9;
        }

        /* Action buttons - CLEAN, NO BORDER RADIUS */
        .action-btn {
          background: none;
          border: none;
          padding: 8px 12px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          color: var(--gray-700);
          border-bottom: 2px solid transparent;
        }

        .action-btn i {
          font-size: 1rem;
        }

        .action-btn:hover {
          color: var(--primary);
        }

        .action-btn.light {
          color: #ffffff;
        }

        .ad-topbar.transparent .action-btn:not(.primary) {
          color: rgba(255,255,255,0.9);
        }

        .ad-topbar.transparent .action-btn:not(.primary):hover {
          color: #ffffff;
        }

        /* Login button - ONLY THIS HAS BORDER RADIUS */
        .login-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 8px 16px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          border-radius: var(--radius);
        }

        .login-btn:hover {
          background: var(--primary-dark);
        }

        .login-btn.light {
          background: #ffffff;
          color: var(--primary);
        }

        .login-btn.light:hover {
          background: rgba(255,255,255,0.9);
        }

        .login-btn i {
          font-size: 1rem;
        }

        /* Mobile menu toggle */
        .ad-menu-toggle {
          display: none;
          width: 40px;
          height: 40px;
          background: transparent;
          border: none;
          color: var(--gray-600);
          font-size: 1.25rem;
          cursor: pointer;
          transition: all 0.2s;
          align-items: center;
          justify-content: center;
        }

        .ad-topbar.transparent .ad-menu-toggle {
          color: rgba(255,255,255,0.9);
        }

        .ad-menu-toggle:hover {
          background: var(--gray-100);
        }

        .ad-topbar.transparent .ad-menu-toggle:hover {
          background: rgba(255,255,255,0.1);
        }

        /* Mobile menu styles */
        .mobile-menu {
          position: fixed;
          top: var(--header-height);
          left: 16px;
          right: 16px;
          background: #ffffff;
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow-xl);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 199;
          animation: slideDown 0.2s ease;
          border-radius: var(--radius);
        }

        .mobile-menu-item {
          padding: 12px 16px;
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--gray-700);
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
          width: 100%;
          text-align: left;
          border-left: 3px solid transparent;
        }

        .mobile-menu-item i {
          font-size: 1.1rem;
          color: var(--gray-500);
          width: 20px;
        }

        .mobile-menu-item:hover {
          background: var(--gray-50);
          border-left-color: var(--gray-300);
        }

        .mobile-menu-item.active {
          background: var(--primary-light);
          color: var(--primary-dark);
          font-weight: 600;
          border-left-color: var(--primary);
        }

        .mobile-menu-item.active i {
          color: var(--primary);
        }

        .mobile-menu-login {
          background: var(--primary);
          color: #ffffff;
          margin-top: 8px;
          border-left: none;
          border-radius: var(--radius);
        }

        .mobile-menu-login i {
          color: #ffffff;
        }

        .mobile-menu-login:hover {
          background: var(--primary-dark);
          border-left-color: transparent;
        }

        .divider {
          height: 1px;
          background: var(--gray-200);
          margin: 8px 0;
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
          
          .ad-topbar {
            padding: 0 20px;
          }
          
          .action-btn span,
          .login-btn span {
            display: none;
          }
          
          .action-btn,
          .login-btn {
            padding: 8px !important;
          }
          
          .action-btn i,
          .login-btn i {
            font-size: 1.2rem;
          }
        }

        @media (max-width: 480px) {
          .ad-logo-sub {
            display: none;
          }
          
          .ad-logo-icon {
            width: 32px;
            height: 32px;
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