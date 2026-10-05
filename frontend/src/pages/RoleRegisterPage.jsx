import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  AdminAvatar,
  WardenAvatar,
  StaffAvatar,
  ParentAvatar,
  StudentAvatar,
} from '../components/RoleAvatars';
import { Footer } from '../components/Footer';
import './RoleRegisterPage.css';

const roleConfig = {
  admin: {
    title: 'Admin',
    subtitle: 'Manage the entire hostel system, users and settings.',
    avatar: AdminAvatar,
    accentColor: '#2563eb',
    bgColor: '#edf4ff',
    borderColor: '#d2e3fc',
    roleFieldLabel: 'Administrator Access Code',
    roleFieldPlaceholder: 'Enter your authorized admin code',
  },
  warden: {
    title: 'Warden',
    subtitle: 'Oversee hostel operations, manage students and approvals.',
    avatar: WardenAvatar,
    accentColor: '#22a355',
    bgColor: '#edf9f1',
    borderColor: '#c6eed3',
    roleFieldLabel: 'Hostel Block / Designation',
    roleFieldPlaceholder: 'e.g. Block A - Senior Warden',
  },
  staff: {
    title: 'College Staff',
    subtitle: 'Manage attendance, academic details and student records.',
    avatar: StaffAvatar,
    accentColor: '#6d48c8',
    bgColor: '#f3f0fd',
    borderColor: '#dfd2fa',
    roleFieldLabel: 'Department & Faculty ID',
    roleFieldPlaceholder: 'e.g. Computer Science - FAC4092',
  },
  parent: {
    title: 'Parent',
    subtitle: "Monitor your child's hostel activities, attendance and updates.",
    avatar: ParentAvatar,
    accentColor: '#ea6526',
    bgColor: '#fff3e8',
    borderColor: '#fedbbe',
    roleFieldLabel: "Child's Student ID / Admission No",
    roleFieldPlaceholder: 'e.g. HMS-2026-8841',
  },
  student: {
    title: 'Student',
    subtitle: 'Apply for hostel admission, manage your profile and stay updates.',
    avatar: StudentAvatar,
    accentColor: '#d8376b',
    bgColor: '#fff0f4',
    borderColor: '#fed2dc',
    roleFieldLabel: 'Student Roll / Enrollment No',
    roleFieldPlaceholder: 'e.g. 24BCS1089',
  },
};

export const RoleRegisterPage = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const currentRole = roleConfig[role] || roleConfig.student;
  const Avatar = currentRole.avatar;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    roleSpecific: '',
    password: '',
    confirmPassword: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match. Please check again.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="register-page-wrapper">
      <main className="register-main-container">
        {/* Navigation Breadcrumb / Back button */}
        <div className="register-back-nav">
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate('/')}
            aria-label="Return to role selection"
          >
            <svg
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
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Role Selection</span>
          </button>
        </div>

        {/* Registration Card Form */}
        <div
          className="register-card"
          style={{
            '--accent-color': currentRole.accentColor,
            '--header-bg': currentRole.bgColor,
            '--header-border': currentRole.borderColor,
          }}
        >
          {/* Card Header with Role Avatar */}
          <div className="register-card-header">
            <div className="header-avatar-container">
              <Avatar />
            </div>
            <h1 className="register-card-title">{currentRole.title} Registration</h1>
            <p className="register-card-subtitle">{currentRole.subtitle}</p>
          </div>

          {submitted ? (
            <div className="register-success-view">
              <div className="success-icon-badge" style={{ backgroundColor: currentRole.accentColor }}>
                <svg
                  viewBox="0 0 24 24"
                  width="28"
                  height="28"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2>Application Received!</h2>
              <p>
                Thank you for initiating your <strong>{currentRole.title}</strong> account registration.
                Once backend services are linked, confirmation will be delivered to <strong>{formData.email || 'your email'}</strong>.
              </p>
              <div className="success-actions">
                <button
                  type="button"
                  className="primary-action-btn"
                  style={{ backgroundColor: currentRole.accentColor }}
                  onClick={() => navigate('/')}
                >
                  Return to Role Selection
                </button>
              </div>
            </div>
          ) : (
            <form className="register-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    required
                    placeholder="e.g. Alex Johnson"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="alex@domain.edu"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    placeholder="+1 (555) 019-2834"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="roleSpecific">{currentRole.roleFieldLabel}</label>
                  <input
                    type="text"
                    id="roleSpecific"
                    name="roleSpecific"
                    required
                    placeholder={currentRole.roleFieldPlaceholder}
                    value={formData.roleSpecific}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-terms">
                <input type="checkbox" id="terms" required defaultChecked />
                <label htmlFor="terms">
                  I agree to the Hostel Regulations, Safety Policy, and Code of Conduct.
                </label>
              </div>

              <button
                type="submit"
                className="register-submit-btn"
                style={{ backgroundColor: currentRole.accentColor }}
              >
                <span>Register as {currentRole.title}</span>
                <svg
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
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              <div className="form-footer-login">
                <span>Already registered? </span>
                <Link to="/" style={{ color: currentRole.accentColor, fontWeight: 600 }}>
                  Log in here
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
