import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { WardenAvatar } from '../components/RoleAvatars';
import { Footer } from '../components/Footer';
import { api } from '../services/api';
import './WardenRegistration.css';

export const WardenRegistration = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    email: '',
    mobile: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredData, setRegisteredData] = useState(null);

  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    if (serverError) setServerError('');
  };

  // Photo change handler
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        profilePhoto: 'Please choose a PNG or JPG image file.',
      }));
      return;
    }

    // Validate size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        profilePhoto: 'Profile photo size must be less than 2MB.',
      }));
      return;
    }

    // Read and encode base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setProfilePhoto(base64String);
      setPhotoPreview(base64String);
      setErrors((prev) => ({
        ...prev,
        profilePhoto: '',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required.';
    }

    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of Birth is required.';
    } else {
      const dobDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (isNaN(dobDate.getTime()) || dobDate >= today) {
        newErrors.dateOfBirth = 'Please enter a valid past Date of Birth.';
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    const phoneRegex = /^\+?[0-9\s\-()]{10,16}$/;
    const digitsOnly = formData.mobile.replace(/\D/g, '');
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile Number is required.';
    } else if (!phoneRegex.test(formData.mobile.trim()) || digitsOnly.length < 10) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number.';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Residential Address is required.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm Password is required.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match. Please verify.';
    }

    if (!profilePhoto) {
      newErrors.profilePhoto = 'Profile photo is required. Please choose a photo.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        full_name: formData.fullName.trim(),
        date_of_birth: formData.dateOfBirth.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        address: formData.address.trim(),
        password: formData.password,
        profile_photo: profilePhoto,
      };

      const result = await api.registerWarden(payload);

      setRegisteredData({
        warden_id: result.warden_id,
        password: result.password,
        full_name: result.full_name,
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        photoPreview: photoPreview,
      });

      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Warden registration error:', err);
      setIsSubmitting(false);
      setServerError(err.message || 'Warden registration failed. Please try again.');
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }
  };

  // Copy helper
  const handleCopy = (text, type) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2200);
    } else if (type === 'pass') {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2200);
    }
  };

  return (
    <div className="warden-register-wrapper">
      <div className="bg-shape shape-warden-top" aria-hidden="true" />
      <div className="bg-shape shape-warden-bot" aria-hidden="true" />

      <main className="warden-register-main">
        {/* Navigation Breadcrumb / Back button */}
        <div className="warden-back-nav">
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

        {/* ================= SUCCESS VIEW ================= */}
        {registeredData ? (
          <div className="warden-success-card">
            <div className="success-icon-badge">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#ffffff" strokeWidth="2.6">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h1 className="success-heading">Registration Successful!</h1>
            <p className="success-lead">
              Warden ID and temporary password have been generated.
            </p>

            <div className="credentials-box">
              {/* Warden ID Row */}
              <div className="credential-row">
                <div className="credential-label-group">
                  <span className="credential-label">Generated Warden ID</span>
                  <span className="credential-hint">Authorized Hostel Staff ID</span>
                </div>
                <div className="credential-value-wrapper">
                  <span className="credential-code id-code">{registeredData.warden_id}</span>
                  <button
                    type="button"
                    className={`copy-credential-btn ${copiedId ? 'copied' : ''}`}
                    onClick={() => handleCopy(registeredData.warden_id, 'id')}
                  >
                    {copiedId ? (
                      <>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Password Row */}
              <div className="credential-row">
                <div className="credential-label-group">
                  <span className="credential-label">Warden Password</span>
                  <span className="credential-hint">Save this password securely for login</span>
                </div>
                <div className="credential-value-wrapper">
                  <span className="credential-code pass-code">{registeredData.password}</span>
                  <button
                    type="button"
                    className={`copy-credential-btn ${copiedPass ? 'copied' : ''}`}
                    onClick={() => handleCopy(registeredData.password, 'pass')}
                  >
                    {copiedPass ? (
                      <>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Copy Password</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Warden Summary details */}
            <div className="warden-summary-card">
              <div className="summary-avatar-box">
                {registeredData.photoPreview ? (
                  <img
                    src={registeredData.photoPreview}
                    alt={registeredData.full_name}
                    className="summary-photo-img"
                  />
                ) : (
                  <div className="summary-photo-placeholder">W</div>
                )}
              </div>
              <div className="summary-meta">
                <h3 className="summary-name">{registeredData.full_name}</h3>
                <span className="summary-badge">Girls Hostel Warden In-Charge</span>
                <p className="summary-info">
                  <strong>Email:</strong> {registeredData.email} • <strong>Mobile:</strong> {registeredData.mobile}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="success-footer-actions">
              <Link to="/login/warden" className="btn-go-to-login">
                <span>Go to Login</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          /* ================= REGISTRATION FORM ================= */
          <div className="warden-register-card">
            {/* Card Header */}
            <div className="warden-card-header">
              <div className="header-avatar-container">
                <WardenAvatar />
              </div>
              <div className="header-title-box">
                <div className="warden-tag-chip">Hostel Administration Staff</div>
                <h1 className="warden-card-title">Warden Registration</h1>
                <p className="warden-card-subtitle">
                  Create your account to manage Girls Hostel operations.
                </p>
              </div>
            </div>

            {serverError && (
              <div className="form-server-error" role="alert">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#dc2626" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{serverError}</span>
              </div>
            )}

            <form className="warden-form" onSubmit={handleSubmit} noValidate>
              <div className="form-fields-grid">
                {/* 1. Warden ID (Auto-generated by FastAPI backend) */}
                <div className="form-group field-readonly">
                  <label htmlFor="wardenIdDisplay">
                    Warden ID <span className="auto-badge">System Generated</span>
                  </label>
                  <div className="input-lock-wrapper">
                    <input
                      type="text"
                      id="wardenIdDisplay"
                      value="Auto-generated by backend upon registration"
                      readOnly
                      disabled
                      className="readonly-input"
                    />
                    <span className="lock-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                  </div>
                  <span className="field-hint">
                    Unique Warden ID (e.g. WRD20261001) will be generated automatically.
                  </span>
                </div>

                {/* 2. Full Name * */}
                <div className={`form-group ${errors.fullName ? 'has-error' : ''}`}>
                  <label htmlFor="fullName">
                    Full Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder="e.g. Dr. Anita Sharma"
                    value={formData.fullName}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                  {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                </div>

                {/* 3. Date of Birth * */}
                <div className={`form-group ${errors.dateOfBirth ? 'has-error' : ''}`}>
                  <label htmlFor="dateOfBirth">
                    Date of Birth <span className="req">*</span>
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
                </div>

                {/* 4. Email Address * */}
                <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
                  <label htmlFor="email">
                    Email Address <span className="req">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="e.g. anita.warden@campus.edu"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                {/* 5. Mobile Number * */}
                <div className={`form-group ${errors.mobile ? 'has-error' : ''}`}>
                  <label htmlFor="mobile">
                    Mobile Number <span className="req">*</span>
                  </label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    placeholder="+91 98220 11223"
                    value={formData.mobile}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                  {errors.mobile && <span className="error-text">{errors.mobile}</span>}
                </div>

                {/* 6. Address * (Full width) */}
                <div className={`form-group full-width ${errors.address ? 'has-error' : ''}`}>
                  <label htmlFor="address">
                    Residential Address <span className="req">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows="3"
                    placeholder="Enter complete residential address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                  {errors.address && <span className="error-text">{errors.address}</span>}
                </div>

                {/* 7. Password * */}
                <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
                  <label htmlFor="password">
                    Password <span className="req">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
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
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                {/* 8. Confirm Password * */}
                <div className={`form-group ${errors.confirmPassword ? 'has-error' : ''}`}>
                  <label htmlFor="confirmPassword">
                    Confirm Password <span className="req">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? (
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
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>

                {/* 9. Profile Photo * (Full width) */}
                <div className={`form-group full-width photo-upload-group ${errors.profilePhoto ? 'has-error' : ''}`}>
                  <label>
                    Profile Photo <span className="req">*</span>
                  </label>

                  <div className="photo-upload-container">
                    {photoPreview ? (
                      <div className="photo-preview-box">
                        <img src={photoPreview} alt="Warden Preview" className="preview-image" />
                        <div className="photo-preview-details">
                          <span className="photo-status-badge">Photo Selected ✓</span>
                          <span className="photo-note">Photo will be saved to your Warden account</span>
                          <button
                            type="button"
                            className="btn-remove-photo"
                            onClick={handleRemovePhoto}
                          >
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            <span>Change Photo</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="photo-dropzone"
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            fileInputRef.current?.click();
                          }
                        }}
                      >
                        <div className="dropzone-icon">
                          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#22a355" strokeWidth="1.8">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </div>
                        <div className="dropzone-texts">
                          <span className="dropzone-title">Choose Profile Photo</span>
                          <span className="dropzone-subtitle">PNG, JPG (Max 2MB)</span>
                        </div>
                        <span className="dropzone-browse-btn">Browse File</span>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      id="profilePhoto"
                      name="profilePhoto"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handlePhotoSelect}
                      style={{ display: 'none' }}
                    />
                  </div>
                  {errors.profilePhoto && <span className="error-text">{errors.profilePhoto}</span>}
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="warden-terms-row">
                <input type="checkbox" id="wardenTerms" required defaultChecked />
                <label htmlFor="wardenTerms">
                  I confirm that I am authorized hostel staff and agree to the Girls Hostel Safety Regulations and Staff Code of Conduct.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="warden-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Registering Warden Account...</span>
                ) : (
                  <>
                    <span>Register Warden</span>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>

              <div className="form-footer-login-row">
                <span>Already registered as Warden? </span>
                <Link to="/login/warden" className="login-link">
                  Log in here
                </Link>
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
