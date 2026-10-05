import { BuildingDecoration } from './BuildingDecoration';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="footer-container">
      {/* Centered Safe Stay Badge with flanking lines */}
      <div className="footer-divider-center">
        <span className="footer-line"></span>
        <div className="footer-tagline">
          <span>Safe Stay</span>
          <span className="footer-heart" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </span>
          <span>Better Tomorrow</span>
        </div>
        <span className="footer-line"></span>
      </div>

      {/* Subtle outline building decoration at bottom right */}
      <div className="footer-building-wrapper">
        <BuildingDecoration />
      </div>
    </footer>
  );
};
