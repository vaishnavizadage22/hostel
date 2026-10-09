import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { StaffAvatar } from '../components/RoleAvatars';
import { api } from '../services/api';
import './StaffLoginPage.css';

export const StaffLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const registeredId = location.state?.registeredId || '';
  const initialNotice = location.state?.message || '';

  const [credentials, setCredentials] = useState({
    username: registeredId,
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState(initialNotice);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorMessage) setErrorMessage('');
    if (successNotice) setSuccessNotice('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedUser = credentials.username.trim();
    const trimmedPass = credentials.password;

    if (!trimmedUser) {
      setErrorMessage('Please enter your Staff ID or Email Address.');
      return;
    }
    if (!trimmedPass) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api.loginStaff({
        username: trimmedUser,
        password: trimmedPass,
      });

      if (data.access_token) {
        localStorage.setItem('staff_token', data.access_token);
        if (data.staff) {
          localStorage.setItem('staff_data', JSON.stringify(data.staff));
        }

        // ROLE IS STAFF: Always redirect to /staff or /staff/dashboard (NEVER /admin or /warden)
        const destination = location.state?.from?.pathname || '/staff';
        navigate(destination, { replace: true });
      } else {
        throw new Error('Authentication token missing from response.');
      }
    } catch (err) {
      console.error('College Staff login failed:', err);
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="staff-login-wrapper">
      <div className="bg-shape-staff-log-1" aria-hidden="true" />
      <div className="bg-shape-staff-log-2" aria-hidden="true" />

      <main className="staff-login-main">
        <div className="staff-login-card">
          <div className="staff-login-header">
            <div className="staff-login-avatar">
              <StaffAvatar />
            </div>
            <span className="staff-badge-chip">Academic Faculty & Attendance</span>
            <h1 className="staff-login-title">College Staff Login</h1>
            <p className="staff-login-subtitle">
              Sign in with your generated Staff ID or Email to manage college attendance, student academics, and campus presence.
            </p>
          </div>

          {errorMessage && (
            <div className="staff-login-alert error" role="alert">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="staff-login-alert success" role="alert">
              <span>✅</span>
              <span>{successNotice}</span>
            </div>
          )}

          <form className="staff-login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="staff-username">Staff ID or Email Address</label>
              <div className="staff-input-container">
                <span className="input-icon-left">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="staff-username"
                  name="username"
                  type="text"
                  placeholder="e.g. STF20261001 or email@college.edu"
                  value={credentials.username}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                />
              </div>
              <span className="field-hint">Enter your backend generated Staff ID or registered email.</span>
            </div>

            <div className="form-group">
              <label htmlFor="staff-password">Password</label>
              <div className="staff-input-container">
                <span className="input-icon-left">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="staff-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your secret password"
                  value={credentials.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="staff-login-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Staff Portal</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="staff-login-footer-links">
            <div>
              <span>Need to register as College Staff? </span>
              <Link to="/register/staff">Register Staff Account</Link>
            </div>
            <div>
              <Link to="/">← Back to Role Selection</Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
