import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { WardenAvatar } from '../components/RoleAvatars';
import { api } from '../services/api';
import './WardenLoginPage.css';

export const WardenLoginPage = () => {
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
      setErrorMessage('Please enter your Warden ID or Email.');
      return;
    }
    if (!trimmedPass) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api.loginWarden({
        username: trimmedUser,
        password: trimmedPass,
      });

      if (data.access_token) {
        localStorage.setItem('warden_token', data.access_token);
        if (data.warden) {
          localStorage.setItem('warden_data', JSON.stringify(data.warden));
        }

        const destination = location.state?.from?.pathname || '/warden/dashboard';
        navigate(destination, { replace: true });
      } else {
        throw new Error('Authentication token missing from response.');
      }
    } catch (err) {
      console.error('Warden login failed:', err);
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="warden-login-wrapper">
      <div className="bg-shape-warden-1" aria-hidden="true" />
      <div className="bg-shape-warden-2" aria-hidden="true" />

      <main className="warden-login-main">
        <div className="warden-login-card">
          <div className="warden-login-header">
            <div className="warden-login-avatar">
              <WardenAvatar />
            </div>
            <span className="warden-badge-chip">Girls Hostel Operations</span>
            <h1 className="warden-login-title">Warden Login</h1>
            <p className="warden-login-subtitle">
              Sign in with your generated Warden ID or Email to manage resident students and gate protocols.
            </p>
          </div>

          {errorMessage && (
            <div className="warden-login-alert error" role="alert">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="warden-login-alert success" role="alert">
              <span>✅</span>
              <span>{successNotice}</span>
            </div>
          )}

          <form className="warden-login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="warden-username">Warden ID or Email Address</label>
              <div className="form-input-container">
                <span className="input-icon-left">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="warden-username"
                  name="username"
                  type="text"
                  placeholder="e.g. WRD20261002 or email@domain.com"
                  value={credentials.username}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                />
              </div>
              <span className="field-hint">Enter the unique Warden ID generated during registration.</span>
            </div>

            <div className="form-group">
              <label htmlFor="warden-password">Password</label>
              <div className="form-input-container">
                <span className="input-icon-left">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="warden-password"
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

            <button type="submit" className="warden-login-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Warden Portal</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="warden-login-footer-links">
            <div>
              <span>Need to register as a new Warden? </span>
              <Link to="/register/warden">Register Warden Account</Link>
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
