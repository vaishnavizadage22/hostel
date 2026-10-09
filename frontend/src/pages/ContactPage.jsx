import { useState } from 'react';
import { Footer } from '../components/Footer';
import './ContactPage.css';

export const ContactPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    inquiryType: 'general',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.message) {
      alert('Please fill out your Name, Phone Number, and Message.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="contact-page-wrapper">
      <div className="contact-bg-shape shape-1" aria-hidden="true" />
      <div className="contact-bg-shape shape-2" aria-hidden="true" />

      <main className="contact-main-container">
        {/* Header Section */}
        <section className="contact-header-section">
          <span className="contact-badge">Hostel Office & Administration</span>
          <h1 className="contact-title">
            Get in Touch with <span className="highlight-text">Hostel Administration</span>
          </h1>
          <p className="contact-subtitle">
            Need information regarding girls hostel admission, room allocations, leave permissions, or student welfare? We are here to support you.
          </p>
          <div className="contact-divider" />
        </section>

        <div className="contact-content-grid">
          {/* Contact Details Card */}
          <div className="contact-info-panel">
            <h2 className="panel-title">Hostel Helpdesk & Office</h2>
            <p className="panel-desc">
              Sharadchandra Pawar Institute of Technology (SPIOT) Campus, Girls Hostel Block A.
            </p>

            <div className="info-items-list">
              <div className="info-item">
                <div className="info-icon blue">📍</div>
                <div>
                  <strong>Campus Address</strong>
                  <p>SPIOT Campus, Someshwarnagar, Tal - Baramati, Dist - Pune, Maharashtra 412306</p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon green">📞</div>
                <div>
                  <strong>Warden & Emergency Contacts</strong>
                  <p>Chief Warden: <strong>+91 98220 11223</strong></p>
                  <p>Hostel Office: <strong>+91 98220 11224</strong></p>
                  <p>Campus Gate Security: <strong>+91 98220 11225</strong></p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon purple">✉️</div>
                <div>
                  <strong>Official Email Support</strong>
                  <p>hostel@spiotsomeshwarnagar.com</p>
                  <p>admin@spiotsomeshwarnagar.com</p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon orange">⏰</div>
                <div>
                  <strong>Hostel Gate & Office Hours</strong>
                  <p>Hostel Gate Timings: <strong>06:00 AM – 06:00 PM</strong></p>
                  <p>Warden Office Desk: <strong>08:00 AM – 08:00 PM</strong></p>
                  <p>Emergency Staff Duty: <strong>24/7 Active</strong></p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon teal">🌐</div>
                <div>
                  <strong>College Website</strong>
                  <p>
                    <a
                      href="https://www.spiotsomeshwarnagar.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-spiot-web"
                    >
                      www.spiotsomeshwarnagar.com ↗
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Message Form */}
          <div className="contact-form-panel">
            <h2 className="panel-title">Send Inquiry to Warden Office</h2>
            <p className="panel-desc">
              Fill in your details and our administration will reach out to you directly.
            </p>

            {submitted ? (
              <div className="contact-success-banner">
                <div className="success-icon">✓</div>
                <h3>Inquiry Submitted Successfully!</h3>
                <p>Thank you for reaching out. The Warden office has received your message and will contact you via phone or email shortly.</p>
                <button
                  type="button"
                  className="btn-send-another"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ fullName: '', email: '', phone: '', inquiryType: 'general', message: '' });
                  }}
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-field">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field-row">
                  <div className="form-field">
                    <label htmlFor="phone">Mobile Number *</label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="e.g. 9822011223"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="e.g. parent@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="inquiryType">Topic / Inquiry Category</label>
                  <select
                    id="inquiryType"
                    value={formData.inquiryType}
                    onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                  >
                    <option value="admission">Hostel Admission & Enrollment</option>
                    <option value="room">Room Allocation (50 Rooms / 4 Capacity)</option>
                    <option value="leave">Leave & Gate Permission Query</option>
                    <option value="general">General Facilities & Mess</option>
                    <option value="emergency">Urgent Parent Request</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="message">Message / Details *</label>
                  <textarea
                    id="message"
                    rows="4"
                    placeholder="Provide details about your query or student details..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn-submit-contact">
                  Send Inquiry to Administration
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
