import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StaffAvatar } from '../components/RoleAvatars';
import { Footer } from '../components/Footer';
import { api } from '../services/api';
import './StaffRegistrationPage.css';

export const StaffRegistrationPage = () => {
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

  // Photo select handler
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        profilePhoto: 'Please choose a PNG or JPG image file.',
      }));
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        profilePhoto: 'Profile photo size must be less than 2MB.',
      }));
      return;
    }

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

  // Validation
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
      newErrors.address = 'Address is required.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm Password is required.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
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

      const result = await api.registerStaff(payload);

      setRegisteredData({
        staff_id: result.staff_id,
        email: result.email,
        full_name: result.full_name,
        photoPreview: photoPreview,
      });

      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Staff registration error:', err);
      setIsSubmitting(false);
      setServerError(err.message || 'Staff registration failed. Please try again.');
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }
  };

  // Copy helper
  const handleCopyId = () => {
    if (!registeredData?.staff_id) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(registeredData.staff_id);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = registeredData.staff_id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2200);
  };

  return (
    <div className="staff-register-wrapper">
      <div className="bg-shape-staff-top" aria-hidden="true" />
      <div className="bg-shape-staff-bot" aria-hidden="true" />

      <main className="staff-register-main">
        {/* Navigation Breadcrumb */}
        <div className="staff-back-nav">
          <button
            type="button"
            className="staff-back-btn"
            onClick={() => navigate('/')}
            aria-label="Return to role selection"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Role Selection</span>
          </button>
        </div>

        {/* ================= SUCCESS VIEW ================= */}
        {registeredData ? (
          <div className="staff-success-card">
            <div className="staff-success-badge">
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#ffffff" strokeWidth="2.6">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h1 className="staff-success-title">Staff Registration Successful</h1>
            <p className="staff-success-subtitle">
              Your official College Staff account has been created and verified in the database.
            </p>

            <div className="staff-credentials-box">
              <div className="staff-credential-row">
                <div className="staff-cred-label-group">
                  <span className="staff-cred-label">Staff ID</span>
                  <span className="staff-cred-desc">Backend generated faculty identifier</span>
                </div>
                <div className="staff-cred-val-group">
                  <span className="staff-cred-id-code">{registeredData.staff_id}</span>
                  <button
                    type="button"
                    className={`staff-copy-btn ${copiedId ? 'copied' : ''}`}
                    onClick={handleCopyId}
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

              <div className="staff-credential-row">
                <div className="staff-cred-label-group">
                  <span className="staff-cred-label">Registered Email</span>
                  <span className="staff-cred-desc">Official login and notification email</span>
                </div>
                <div className="staff-cred-val-group">
                  <span className="staff-cred-email-code">{registeredData.email}</span>
                </div>
              </div>
            </div>

            <div className="staff-summary-preview">
              <div className="staff-summary-photo">
                {registeredData.photoPreview ? (
                  <img src={registeredData.photoPreview} alt={registeredData.full_name} />
                ) : (
                  <div className="staff-photo-placeholder">S</div>
                )}
              </div>
              <div className="staff-summary-info">
                <h3>{registeredData.full_name}</h3>
                <span className="staff-role-pill">Academic & College Attendance Staff</span>
              </div>
            </div>

            <div className="staff-success-actions">
              <Link
                to="/login/staff"
                state={{ registeredId: registeredData.staff_id, message: 'Registration complete. Please sign in.' }}
                className="btn-go-to-staff-login"
              >
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
          <div className="staff-register-card">
            <div className="staff-card-header">
              <div className="staff-header-avatar">
                <StaffAvatar />
              </div>
              <div className="staff-header-titles">
                <span className="staff-badge-tag">Academic Faculty & Attendance</span>
                <h1 className="staff-card-title">College Staff Registration</h1>
                <p className="staff-card-subtitle">
                  Register as college staff to manage academic records, lecture attendance, and track student campus presence.
                </p>
              </div>
            </div>

            {serverError && (
              <div className="staff-alert-banner error" role="alert">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#dc2626" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{serverError}</span>
              </div>
            )}

            <form className="staff-register-form" onSubmit={handleSubmit} noValidate>
              <div className="staff-grid">
                {/* 1. Staff ID (Backend Generated) */}
                <div className="form-group field-readonly">
                  <label htmlFor="staffIdDisplay">
                    Staff ID <span className="auto-pill">Generated by Backend</span>
                  </label>
                  <div className="input-lock-wrapper">
                    <input
                      type="text"
                      id="staffIdDisplay"
                      value="Auto-generated by backend upon submission"
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
                  <span className="field-hint">Unique Staff ID (e.g. STF20261001) will be assigned automatically.</span>
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
                    placeholder="e.g. Prof. Rajesh Deshmukh"
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
                    placeholder="e.g. r.deshmukh@college.edu"
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
                    placeholder="+91 98765 43210"
                    value={formData.mobile}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                  {errors.mobile && <span className="error-text">{errors.mobile}</span>}
                </div>

                {/* 6. Address * (Full width) */}
                <div className={`form-group full-width ${errors.address ? 'has-error' : ''}`}>
                  <label htmlFor="address">
                    Address <span className="req">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows="3"
                    placeholder="Enter complete residential or campus staff quarters address"
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
                <div className={`form-group full-width ${errors.profilePhoto ? 'has-error' : ''}`}>
                  <label>
                    Profile Photo <span className="req">*</span>
                  </label>

                  <div className="staff-photo-dropzone-container">
                    {photoPreview ? (
                      <div className="staff-preview-box">
                        <img src={photoPreview} alt="Staff Preview" className="staff-preview-img" />
                        <div className="staff-preview-info">
                          <span className="staff-photo-ok-badge">Photo Selected ✓</span>
                          <span className="staff-photo-note">Photo will be saved to your faculty record in MySQL</span>
                          <button
                            type="button"
                            className="btn-change-staff-photo"
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
                        className="staff-dropzone-card"
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            fileInputRef.current?.click();
                          }
                        }}
                      >
                        <div className="staff-dropzone-icon">
                          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#6d48c8" strokeWidth="1.8">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </div>
                        <div className="staff-dropzone-texts">
                          <span className="staff-dropzone-title">Upload Staff Profile Photo</span>
                          <span className="staff-dropzone-subtitle">JPG or PNG (Max 2MB)</span>
                        </div>
                        <span className="staff-browse-pill">Browse File</span>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      id="staffProfilePhoto"
                      name="staffProfilePhoto"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handlePhotoSelect}
                      style={{ display: 'none' }}
                    />
                  </div>
                  {errors.profilePhoto && <span className="error-text">{errors.profilePhoto}</span>}
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="staff-terms-row">
                <input type="checkbox" id="staffTerms" required defaultChecked />
                <label htmlFor="staffTerms">
                  I confirm that I am an authorized college faculty or staff member responsible for academic affairs and student attendance tracking.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="staff-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Registering College Staff...</span>
                ) : (
                  <>
                    <span>Register College Staff</span>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>

              <div className="staff-form-footer">
                <span>Already registered as College Staff? </span>
                <Link to="/login/staff" className="staff-login-link">
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
