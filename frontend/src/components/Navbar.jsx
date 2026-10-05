import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Brand Logo & Name */}
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <div className="brand-logo-icon">
            <svg
              viewBox="0 0 36 36"
              width="34"
              height="34"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* House roof outline & body */}
              <path
                d="M18 3.5L3 16.5H7.5V31.5C7.5 32.3 8.2 33 9 33H27C27.8 33 28.5 32.3 28.5 31.5V16.5H33L18 3.5Z"
                fill="#2563eb"
              />
              {/* Chimney */}
              <path d="M25 7V13.5L28.5 16.5V7H25Z" fill="#1d4ed8" />
              {/* 4-pane white window */}
              <rect x="13" y="18" width="10" height="9" rx="1.5" fill="#ffffff" />
              <line x1="18" y1="18" x2="18" y2="27" stroke="#2563eb" strokeWidth="1.5" />
              <line x1="13" y1="22.5" x2="23" y2="22.5" stroke="#2563eb" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="brand-title">Hostel Management System</span>
        </Link>

        {/* Mobile Hamburger Toggle Button */}
        <button
          className="mobile-toggle-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className={`bar ${mobileMenuOpen ? 'bar-top' : ''}`}></span>
          <span className={`bar ${mobileMenuOpen ? 'bar-mid' : ''}`}></span>
          <span className={`bar ${mobileMenuOpen ? 'bar-bot' : ''}`}></span>
        </button>

        {/* Navigation Links and Register CTA */}
        <nav className={`navbar-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <ul className="nav-links-list">
            <li>
              <Link
                to="/"
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Home
              </Link>
            </li>
            <li>
              <a
                href="#login"
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Login feature will be available once backend is connected.');
                  closeMobileMenu();
                }}
              >
                Login
              </a>
            </li>
            <li>
              <a
                href="#about"
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Hostel Management System: Providing smart room allocation, warden approvals, attendance tracking, and parent updates.');
                  closeMobileMenu();
                }}
              >
                About
              </a>
            </li>
            <li>
              <a
                href="#contact"
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Contact Hostel Administration: hostel-admin@campus.edu | +1 (800) 555-HOSTEL');
                  closeMobileMenu();
                }}
              >
                Contact
              </a>
            </li>
          </ul>

          {/* Blue Rounded Register Button */}
          <Link
            to="/"
            className="navbar-register-btn"
            onClick={closeMobileMenu}
          >
            {/* User-Plus SVG Icon */}
            <svg
              className="register-btn-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            <span>Register</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};
