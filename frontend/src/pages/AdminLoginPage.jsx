import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/useAuth';
import { apiFetch } from '../utils/api';
import './AdminLoginPage.css';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAdminAuthenticated, adminExists, checkAdminStatus } = useAuth();

  const registeredEmail = location.state?.registeredEmail || '';
  const initialNotice = location.state?.message || '';

  const [credentials, setCredentials] = useState({
    username: registeredEmail,
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState(initialNotice);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated admin, redirect straight to /admin
  useEffect(() => {
    if (isAdminAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAdminAuthenticated, navigate]);

  useEffect(() => {
    if (checkAdminStatus) {
      checkAdminStatus();
    }
  }, [checkAdminStatus]);

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
      setErrorMessage('Please enter your Email or Admin ID.');
      return;
    }

    if (!trimmedPass) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiFetch('/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: trimmedUser,
          password: trimmedPass,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsSubmitting(false);
        const errorDetail = data.detail || 'Invalid email/admin ID or password.';
        setErrorMessage(typeof errorDetail === 'string' ? errorDetail : 'Login failed. Please check your credentials.');
        return;
      }

      // Success: Save token & admin user session
      login(data.token, data.admin);

      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/admin');
      }, 200);
    } catch (err) {
      console.error('Login error:', err);
      setIsSubmitting(false);
      setErrorMessage('Unable to connect to server. Please try again.');
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-bg-shape admin-login-bg-shape-top-left" aria-hidden="true" />
      <div className="admin-login-bg-shape admin-login-bg-shape-top-right" aria-hidden="true" />

      <main className="admin-login-container">
        {/* Header Badge */}
        <div className="admin-login-header">
          <div className="admin-login-badge">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 9.07-7 10.18-3.87-1.11-7-5.51-7-10.18V6.3l7-3.12zm-1 5.82v6h2v-6h-2z" />
            </svg>
            <span>Admin Portal</span>
          </div>
          <h1 className="admin-login-title">Admin Login</h1>
          <p className="admin-login-subtitle">
            Sign in with your authorized admin credentials.
          </p>
        </div>

        {/* Login Form Card: ONLY Email/Admin ID, Password, and Login Button */}
        <div className="admin-login-card">
          <div className="admin-login-card-head">
            <div className="admin-login-icon-box">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2 className="admin-login-heading">Welcome Back</h2>
            <p className="admin-login-subheading">Enter your administrative credentials</p>
          </div>

          {/* Success Notification if redirected from registration */}
          {successNotice && (
            <div className="admin-login-alert-success" role="status">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#059669" strokeWidth="2.2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{successNotice}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="admin-login-alert-error" role="alert">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#dc2626" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="admin-login-form" onSubmit={handleSubmit} noValidate>
            {/* Field 1: Email / Admin ID */}
            <div className="admin-login-field">
              <label htmlFor="adminUsername" className="admin-login-label">
                Email / Admin ID <span className="required-star">*</span>
              </label>
              <div className="admin-login-input-wrap">
                <span className="input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  type="text"
                  id="adminUsername"
                  name="username"
                  placeholder="Enter email or admin ID"
                  value={credentials.username}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div className="admin-login-field">
              <label htmlFor="adminPassword" className="admin-login-label">
                Password <span className="required-star">*</span>
              </label>
              <div className="admin-login-input-wrap">
                <span className="input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="adminPassword"
                  name="password"
                  placeholder="Enter password"
                  value={credentials.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="toggle-pw-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Field 3: Login button */}
            <button
              type="submit"
              className="admin-login-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  <span>Login to Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* CRITICAL RULE: "Do not provide Admin registration from the Login page if an Admin already exists." */}
          {!adminExists && (
            <div className="admin-login-footer">
              <span>First time setup? </span>
              <button
                type="button"
                className="admin-reg-link"
                onClick={() => navigate('/register/admin')}
              >
                Register initial Admin
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
