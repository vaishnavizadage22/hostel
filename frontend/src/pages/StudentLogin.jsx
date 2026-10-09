import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { api } from '../services/api';
import './StudentLogin.css';

export const StudentLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const prefilledId = location.state?.prefilledId || '';
  const initialNotice = location.state?.message || '';

  const [credentials, setCredentials] = useState({
    studentId: prefilledId,
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

    const sid = credentials.studentId.trim();
    const pass = credentials.password;

    if (!sid) {
      setErrorMessage('Please enter your Student ID.');
      return;
    }
    if (!pass) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.loginStudent({
        student_id: sid,
        password: pass,
      });

      // CRITICAL REQUIREMENT: DO NOT directly open dashboard.
      // Redirect to Face Verification!
      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/student/face-verify', {
          state: {
            studentId: res.student_id,
            studentName: res.full_name,
          },
        });
      }, 250);
    } catch (err) {
      console.error('Student login error:', err);
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Invalid Student ID or Password.');
    }
  };

  return (
    <div className="student-login-wrapper">
      <div className="login-bg-shape blob-left" aria-hidden="true" />
      <div className="login-bg-shape blob-right" aria-hidden="true" />

      <main className="student-login-container">
        {/* Header Badge */}
        <div className="student-login-header">
          <div className="student-portal-badge">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span>Girls Hostel Student Access</span>
          </div>
          <h1 className="student-login-title">Student Login</h1>
          <p className="student-login-subtitle">
            Sign in with your Student ID and password (e.g. name@123)
          </p>
        </div>

        {/* Login Form Card */}
        <div className="student-login-card">
          <div className="student-login-card-head">
            <div className="student-icon-box">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#d8376b" strokeWidth="2.2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2 className="login-box-heading">Welcome Student</h2>
            <p className="login-box-subheading">Step 1 of 2: Credential Verification</p>
          </div>

          {successNotice && (
            <div className="login-notice-banner" role="status">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#059669" strokeWidth="2.2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{successNotice}</span>
            </div>
          )}

          {errorMessage && (
            <div className="login-err-banner" role="alert">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#dc2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="student-login-form" onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label htmlFor="studentId" className="form-label">
                Student ID <span className="req-dot">*</span>
              </label>
              <div className="input-wrapper">
                <span className="field-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <line x1="7" y1="8" x2="17" y2="8" />
                    <line x1="7" y1="12" x2="13" y2="12" />
                  </svg>
                </span>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  placeholder="e.g. pooja@123"
                  value={credentials.studentId}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password" className="form-label">
                Password <span className="req-dot">*</span>
              </label>
              <div className="input-wrapper">
                <span className="field-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Enter temporary password"
                  value={credentials.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-icon"
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

            <button
              type="submit"
              className="student-login-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Checking Credentials...</span>
              ) : (
                <>
                  <span>Verify & Proceed to Face Scan</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="login-card-bottom-link">
            <span>New student? </span>
            <Link to="/register/student" className="link-register">
              Register here
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
