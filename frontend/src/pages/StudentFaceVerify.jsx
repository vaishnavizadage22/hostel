import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { StudentCameraScanner } from '../components/StudentCameraScanner';
import { Footer } from '../components/Footer';
import { api } from '../services/api';
import './StudentFaceVerify.css';

export const StudentFaceVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const studentId = location.state?.studentId || sessionStorage.getItem('pending_student_id') || '';
  const studentName = location.state?.studentName || sessionStorage.getItem('pending_student_name') || 'Student';

  const [capturedImage, setCapturedImage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [matchResult, setMatchResult] = useState(null); // { success: boolean, message: string }
  const [errorMessage, setErrorMessage] = useState('');

  // If no student ID in state or session, redirect back to login
  useEffect(() => {
    if (!studentId) {
      navigate('/student/login', { replace: true });
    } else {
      sessionStorage.setItem('pending_student_id', studentId);
      sessionStorage.setItem('pending_student_name', studentName);
    }
  }, [studentId, studentName, navigate]);

  const handleCaptureSuccess = async (base64Image) => {
    setCapturedImage(base64Image);
    setErrorMessage('');
    setMatchResult(null);
    setIsVerifying(true);

    try {
      const res = await api.verifyStudentFace({
        student_id: studentId,
        face_image_base64: base64Image,
      });

      // Face MATCH ✅
      setMatchResult({
        success: true,
        message: 'Face Matched! Biometrics verified successfully.',
      });

      // Save token and profile
      localStorage.setItem('student_token', res.token);
      localStorage.setItem('student_data', JSON.stringify(res.student));
      sessionStorage.removeItem('pending_student_id');
      sessionStorage.removeItem('pending_student_name');

      // Redirect to Student Dashboard
      setTimeout(() => {
        navigate('/student/dashboard', { replace: true });
      }, 1400);
    } catch (err) {
      // Face NOT MATCH ❌
      console.error('Face verification failed:', err);
      setIsVerifying(false);
      setMatchResult({
        success: false,
        message: err.message || 'Face verification failed. Access denied.',
      });
      setErrorMessage(err.message || 'Face does not match registered biometrics.');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setMatchResult(null);
    setErrorMessage('');
    setIsVerifying(false);
  };

  if (!studentId) {
    return null;
  }

  return (
    <div className="face-verify-page-wrapper">
      <div className="verify-bg-shape verify-blob-left" aria-hidden="true" />
      <div className="verify-bg-shape verify-blob-right" aria-hidden="true" />

      <main className="face-verify-container">
        {/* Header Breadcrumb & Status */}
        <div className="verify-header-section">
          <div className="verify-step-badge">
            <span className="step-num">Step 2 of 2</span>
            <span className="step-divider">•</span>
            <span className="step-label">Live Biometric Face Verification</span>
          </div>

          <h1 className="verify-page-title">Biometric Face Authentication</h1>
          <p className="verify-page-subtitle">
            Welcome, <strong>{studentName}</strong> (<span className="student-id-tag">{studentId}</span>).
            Please look directly at the camera to verify your identity.
          </p>
        </div>

        {/* Status Banners */}
        {matchResult?.success && (
          <div className="verify-banner-success" role="status">
            <div className="status-badge-icon success-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#059669" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="banner-text">
              <h4>Face Matched Successfully! ✅</h4>
              <p>Biometric authentication approved. Opening your Student Dashboard...</p>
            </div>
          </div>
        )}

        {matchResult && !matchResult.success && (
          <div className="verify-banner-danger" role="alert">
            <div className="status-badge-icon danger-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#dc2626" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <div className="banner-text">
              <h4>Face Verification Failed ❌</h4>
              <p>{errorMessage || 'The live face does not match the registered profile on record.'}</p>
            </div>
          </div>
        )}

        {/* Verification Card */}
        <div className="face-verify-card">
          <div className="verify-card-header">
            <div className="security-icon-circle">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#2563eb" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="verify-card-titles">
              <h2 className="verify-subheading">Live Camera Verification</h2>
              <p className="verify-instructions">
                Look directly at the camera. The system will verify your facial biometrics against your registered profile.
              </p>
            </div>
          </div>

          {/* Biometric comparison loader indicator */}
          {isVerifying && (
            <div className="biometric-analyzing-bar">
              <div className="analyzing-spinner"></div>
              <span>Analyzing live facial embeddings & comparing with registered profile...</span>
            </div>
          )}

          {/* Real Camera Scanner */}
          <div className="verify-scanner-wrapper">
            <StudentCameraScanner
              onCaptureSuccess={handleCaptureSuccess}
              capturedImage={capturedImage}
              onRetake={handleRetake}
              mode="verify"
            />
          </div>

          {/* Fallback actions if failed */}
          {matchResult && !matchResult.success && (
            <div className="verify-failure-actions">
              <button
                type="button"
                className="btn-retry-scan"
                onClick={handleRetake}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M1 4v6h6" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                <span>Retry Face Scan</span>
              </button>

              <Link to="/student/login" className="btn-cancel-login">
                Cancel & Return to Login
              </Link>
            </div>
          )}

          {/* Privacy Note */}
          <div className="biometric-note">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#64748b" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>
              Real-time facial comparison protects girls hostel security. Only verified students are granted entry.
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
