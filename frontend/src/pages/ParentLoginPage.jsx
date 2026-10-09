import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { ParentAvatar } from '../components/RoleAvatars';
import { api } from '../services/api';
import './ParentLoginPage.css';

export const ParentLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedUser = credentials.username.trim();
    const trimmedPass = credentials.password;

    if (!trimmedUser) {
      setErrorMessage('Please enter your Mobile Number, Email, or daughter\'s Student ID.');
      return;
    }
    if (!trimmedPass) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api.loginParent({
        username: trimmedUser,
        password: trimmedPass,
      });

      if (data.access_token) {
        localStorage.setItem('parent_token', data.access_token);
        localStorage.setItem('parent_data', JSON.stringify(data));

        // ROLE IS PARENT: Always redirect to /parent (NEVER /admin, /warden, /staff, or /student)
        const destination = location.state?.from?.pathname || '/parent';
        navigate(destination, { replace: true });
      } else {
        throw new Error('Authentication token missing from response.');
      }
    } catch (err) {
      console.error('Parent login failed:', err);
      setErrorMessage(err.message || 'Login failed. Please check credentials or contact the hostel office.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="parent-login-wrapper">
      <div className="bg-shape-parent-log-1" aria-hidden="true" />
      <div className="bg-shape-parent-log-2" aria-hidden="true" />

      <main className="parent-login-main">
        <div className="parent-login-card">
          <div className="parent-login-header">
            <div className="parent-login-avatar">
              <ParentAvatar />
            </div>
            <span className="parent-badge-chip">Resident Guardian & Family Portal</span>
            <h1 className="parent-login-title">Parent Login</h1>
            <p className="parent-login-subtitle">
              Sign in with your registered Mobile Number, Email, or daughter's Student ID to view live hostel movements, attendance, and welfare updates.
            </p>
          </div>

          {errorMessage && (
            <div className="parent-login-alert error" role="alert">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="parent-login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group-parent">
              <label htmlFor="username" className="parent-form-label">
                Parent Mobile / Email / Student ID <span className="req-star">*</span>
              </label>
              <div className="input-with-icon">
                <svg className="field-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  id="username"
                  name="username"
                  autoComplete="username"
                  required
                  placeholder="e.g. 9922438839 or vaishnavi@123"
                  value={credentials.username}
                  onChange={handleChange}
                  className="parent-input"
                />
              </div>
              <span className="field-hint">Use the parent contact details provided during student registration.</span>
            </div>

            <div className="form-group-parent">
              <label htmlFor="password" className="parent-form-label">
                Password <span className="req-star">*</span>
              </label>
              <div className="input-with-icon">
                <svg className="field-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={handleChange}
                  className="parent-input"
                />
                <button
                  type="button"
                  className="toggle-pwd-btn"
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
                      <circle cx="12" cy="7" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="parent-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Verifying Parent Access...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Parent</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="parent-login-footer">
            <div className="security-guarantee">
              <span className="shield-icon">🛡️</span>
              <span>Encrypted Resident Parent Portal • Linked to MySQL</span>
            </div>
            <div className="alt-role-links">
              <span>Need to switch portal? </span>
              <Link to="/student/login">Student Login</Link>
              <span> • </span>
              <Link to="/login/warden">Warden</Link>
              <span> • </span>
              <Link to="/login/staff">Staff</Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
