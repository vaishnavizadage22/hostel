import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import './AboutPage.css';

export const AboutPage = () => {
  return (
    <div className="about-page-wrapper">
      {/* Background Shapes */}
      <div className="about-bg-shape shape-1" aria-hidden="true" />
      <div className="about-bg-shape shape-2" aria-hidden="true" />

      <main className="about-main-container">
        {/* Hero Section */}
        <section className="about-hero-section">
          <span className="about-badge">Girls Hostel Management System</span>
          <h1 className="about-title">
            About Our Hostel & <span className="highlight-text">SPIOT Campus</span>
          </h1>
          <p className="about-subtitle">
            Providing a secure, comfortable, and technologically advanced living and learning environment for female students of Sharadchandra Pawar Institute of Technology (SPIOT), Someshwarnagar.
          </p>
          <div className="about-divider" />
        </section>

        {/* Key Features Grid */}
        <section className="about-features-grid">
          <div className="about-feature-card">
            <div className="feature-icon-box blue">🛏️</div>
            <h3 className="feature-title">50 Standard Rooms & 200 Beds</h3>
            <p className="feature-desc">
              Structured accommodation with 50 spacious rooms, each with 4-student capacity, private study desks, storage wardrobes, and high-speed Wi-Fi connectivity.
            </p>
          </div>

          <div className="about-feature-card">
            <div className="feature-icon-box green">👁️</div>
            <h3 className="feature-title">Biometric Face AI Security</h3>
            <p className="feature-desc">
              State-of-the-art OpenCV neural face verification at entry and exit gates ensuring zero proxy movements and 100% verified campus resident security.
            </p>
          </div>

          <div className="about-feature-card">
            <div className="feature-icon-box purple">👩‍💼</div>
            <h3 className="feature-title">24/7 Dedicated Warden Care</h3>
            <p className="feature-desc">
              Experienced resident wardens and female staff on-duty round the clock to look after student wellness, medical emergencies, study hours, and discipline.
            </p>
          </div>

          <div className="about-feature-card">
            <div className="feature-icon-box orange">👨‍👩‍👧</div>
            <h3 className="feature-title">Real-Time Parent Portal</h3>
            <p className="feature-desc">
              Instant visibility for parents into gate entry/exit logs, college lecture attendance, approved leaves, room allocations, and direct warden contact.
            </p>
          </div>

          <div className="about-feature-card">
            <div className="feature-icon-box teal">🎓</div>
            <h3 className="feature-title">SPIOT College Coordination</h3>
            <p className="feature-desc">
              Synchronized schedules between college hours (09:00 AM – 04:00 PM) and hostel gate controls ensuring students attend all lectures and practicals on time.
            </p>
          </div>

          <div className="about-feature-card">
            <div className="feature-icon-box red">🥗</div>
            <h3 className="feature-title">Hygienic Dining & Amenities</h3>
            <p className="feature-desc">
              Clean dining mess providing fresh, nutritious vegetarian meals, UV water purifiers, laundry facilities, CCTV perimeter monitoring, and solar water heating.
            </p>
          </div>
        </section>

        {/* Institution Spotlight */}
        <section className="about-institute-card">
          <div className="institute-card-content">
            <span className="inst-tag">ASSOCIATED INSTITUTION</span>
            <h2 className="inst-title">Sharadchandra Pawar Institute of Technology (SPIOT)</h2>
            <p className="inst-desc">
              Located in Someshwarnagar, Baramati, Pune, SPIOT is dedicated to engineering excellence and student innovation. Our Girls Hostel is conveniently located within the college campus premises to guarantee safety, zero commute hassle, and an academically nurturing atmosphere.
            </p>
            <div className="inst-actions">
              <a
                href="https://www.spiotsomeshwarnagar.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-inst-visit"
              >
                <span>Visit SPIOT Official Website</span>
                <span className="arrow">↗</span>
              </a>
              <Link to="/contact" className="btn-inst-contact">
                Contact Administration
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
