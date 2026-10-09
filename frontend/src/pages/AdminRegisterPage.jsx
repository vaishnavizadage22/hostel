import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { AdminAccessIllustration } from '../components/AdminAccessIllustration';
import { useAuth } from '../context/useAuth';
import { apiFetch } from '../utils/api';
import './AdminRegisterPage.css';

export const AdminRegisterPage = () => {
  const navigate = useNavigate();
  const { adminExists, checkAdminStatus } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const [hasExistingAdmin, setHasExistingAdmin] = useState(false);

  const fileInputRef = useRef(null);

  // Check backend whether an admin already exists
  useEffect(() => {
    const verifyStatus = async () => {
      setIsCheckingBackend(true);
      try {
        const res = await apiFetch('/auth/admin-status');
        if (res.ok) {
          const data = await res.json();
          setHasExistingAdmin(data.exists);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
      } finally {
        setIsCheckingBackend(false);
      }
    };
    verifyStatus();
  }, [checkAdminStatus]);

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

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Full Name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full Name must be at least 2 characters';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone (minimum 10 digits)
    const phoneRegex = /^\+?[0-9\s\-()]{10,16}$/;
    const digitsOnly = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone Number is required';
    } else if (!phoneRegex.test(formData.phone.trim()) || digitsOnly.length < 10) {
      newErrors.phone = 'Please enter a valid phone number (minimum 10 digits)';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm Password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Profile Photo
    if (!profilePhoto) {
      newErrors.profilePhoto = 'Profile photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // File selection
  const handleFile = (file) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        profilePhoto: 'Please select a valid image file (PNG, JPG)',
      }));
      return;
    }

    // Max 2MB
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        profilePhoto: 'File size exceeds 2MB limit',
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, profilePhoto: '' }));
    setProfilePhoto(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    setProfilePhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Form submission with FastAPI + MySQL backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        profile_photo: photoPreview || '',
      };

      const res = await apiFetch('/auth/admin-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409 || !res.ok) {
        // HTTP 409: Admin already exists
        const msg = data.detail?.message || data.detail || 'An Admin account already exists. Only one Admin is allowed.';
        setServerError(msg);
        setHasExistingAdmin(true);
        setIsSubmitting(false);
        return;
      }

      // First Admin registered successfully!
      // Update global admin status and redirect automatically to Admin Login page
      if (checkAdminStatus) {
        await checkAdminStatus();
      }

      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/login/admin', {
          state: {
            registeredEmail: formData.email.trim(),
            message: 'Admin account registered successfully! Please login with your credentials.',
          },
        });
      }, 300);
    } catch (err) {
      console.error('Registration error:', err);
      setServerError('Unable to reach the server. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-page-wrapper">
      {/* Decorative background shapes */}
      <div className="admin-bg-shape admin-bg-shape-top-left" aria-hidden="true" />
      <div className="admin-bg-shape admin-bg-shape-top-right" aria-hidden="true" />

      <main className="admin-main-container">
        {/* 2. Page Header */}
        <section className="admin-page-header">
          <div className="admin-badge">
            <svg
              className="admin-badge-icon"
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 9.07-7 10.18-3.87-1.11-7-5.51-7-10.18V6.3l7-3.12zm-1 5.82v6h2v-6h-2z" />
            </svg>
            <span>Admin Registration</span>
          </div>

          <h1 className="admin-page-title">Create Admin Account</h1>

          <p className="admin-page-subtitle">
            Register your account to manage the hostel system.
          </p>
        </section>

        {/* Content Two-Column Layout */}
        <div className="admin-content-grid">
          {/* Left Column: Form Card OR Blocked Screen */}
          <div className="admin-form-card">
            {isCheckingBackend ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                <p>Checking system configuration...</p>
              </div>
            ) : hasExistingAdmin || adminExists ? (
              /* REQUIRED RULE: If Admin already exists, DO NOT show registration form.
                 Instead show:
                 "Admin account already exists."
                 "Only one Admin account is allowed in this system."
                 Provide: [ Go to Login ] */
              <div className="admin-blocked-view" style={{ textAlign: 'center', padding: '42px 24px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#dc2626" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  Admin account already exists.
                </h2>
                <p style={{ fontSize: '0.96rem', color: '#64748b', lineHeight: 1.5, marginBottom: '24px' }}>
                  Only one Admin account is allowed in this system.
                </p>
                <button
                  type="button"
                  className="register-admin-btn"
                  onClick={() => navigate('/login/admin')}
                  style={{ width: 'auto', padding: '12px 32px' }}
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <>
                {/* Form Card Header */}
                <div className="form-card-header">
                  <div className="admin-avatar-icon-badge">
                    <svg
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="form-card-title-group">
                    <h2 className="form-card-title">Admin Details</h2>
                    <p className="form-card-subtitle">
                      Fill in the information below to create your admin account.
                    </p>
                  </div>
                </div>

                {serverError && (
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      color: '#b91c1c',
                      fontSize: '0.88rem',
                      marginBottom: '18px',
                    }}
                  >
                    {serverError}
                  </div>
                )}

                <form className="admin-registration-form" onSubmit={handleSubmit} noValidate>
                  {/* 2-Column Fields Grid */}
                  <div className="admin-fields-grid">
                    {/* Full Name * */}
                    <div className="admin-input-group">
                      <label htmlFor="fullName" className="field-label">
                        Full Name <span className="required-star">*</span>
                      </label>
                      <div className={`input-field-wrapper ${errors.fullName ? 'has-error' : ''}`}>
                        <span className="input-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </span>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          placeholder="Enter your full name"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      {errors.fullName && <span className="field-error-msg">{errors.fullName}</span>}
                    </div>

                    {/* Email Address * */}
                    <div className="admin-input-group">
                      <label htmlFor="email" className="field-label">
                        Email Address <span className="required-star">*</span>
                      </label>
                      <div className={`input-field-wrapper ${errors.email ? 'has-error' : ''}`}>
                        <span className="input-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                        </span>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          placeholder="Enter your email address"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      {errors.email && <span className="field-error-msg">{errors.email}</span>}
                    </div>

                    {/* Phone Number * */}
                    <div className="admin-input-group">
                      <label htmlFor="phone" className="field-label">
                        Phone Number <span className="required-star">*</span>
                      </label>
                      <div className={`input-field-wrapper ${errors.phone ? 'has-error' : ''}`}>
                        <span className="input-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                        </span>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          placeholder="Enter your phone number"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      {errors.phone && <span className="field-error-msg">{errors.phone}</span>}
                    </div>

                    {/* Password * */}
                    <div className="admin-input-group">
                      <label htmlFor="password" className="field-label">
                        Password <span className="required-star">*</span>
                      </label>
                      <div className={`input-field-wrapper ${errors.password ? 'has-error' : ''}`}>
                        <span className="input-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                        />
                        <button
                          type="button"
                          className="toggle-password-btn"
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
                      {errors.password && <span className="field-error-msg">{errors.password}</span>}
                    </div>

                    {/* Confirm Password * */}
                    <div className="admin-input-group">
                      <label htmlFor="confirmPassword" className="field-label">
                        Confirm Password <span className="required-star">*</span>
                      </label>
                      <div className={`input-field-wrapper ${errors.confirmPassword ? 'has-error' : ''}`}>
                        <span className="input-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </span>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          name="confirmPassword"
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                        />
                        <button
                          type="button"
                          className="toggle-password-btn"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
                      {errors.confirmPassword && (
                        <span className="field-error-msg">{errors.confirmPassword}</span>
                      )}
                    </div>
                  </div>

                  {/* 4. Profile Photo Upload Area */}
                  <div className="admin-photo-group">
                    <label className="field-label">
                      Profile Photo <span className="required-star">*</span>
                    </label>
                    <div
                      className={`photo-dropzone ${isDragging ? 'dragging' : ''} ${
                        errors.profilePhoto ? 'has-error' : ''
                      } ${photoPreview ? 'has-preview' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          fileInputRef.current?.click();
                        }
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="profilePhoto"
                        name="profilePhoto"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileInputChange}
                        className="hidden-file-input"
                      />

                      {photoPreview ? (
                        <div className="photo-preview-container">
                          <img src={photoPreview} alt="Profile Preview" className="photo-preview-img" />
                          <div className="photo-preview-details">
                            <span className="photo-filename">{profilePhoto?.name}</span>
                            <span className="photo-filesize">
                              {profilePhoto ? (profilePhoto.size / 1024).toFixed(1) + ' KB' : ''}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="photo-remove-btn"
                            onClick={handleRemovePhoto}
                            title="Remove Photo"
                            aria-label="Remove uploaded photo"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="dropzone-content">
                          <div className="upload-icon-circle">
                            <svg
                              viewBox="0 0 24 24"
                              width="22"
                              height="22"
                              fill="none"
                              stroke="#2563eb"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M16 16l-4-4-4 4" />
                              <path d="M12 12v9" />
                              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                            </svg>
                          </div>
                          <div className="dropzone-text-group">
                            <p className="dropzone-primary-text">
                              <span className="choose-file-link">Choose file</span> or drag and drop
                            </p>
                            <p className="dropzone-hint-text">PNG, JPG (Max 2MB)</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.profilePhoto && (
                      <span className="field-error-msg">{errors.profilePhoto}</span>
                    )}
                  </div>

                  {/* 5. Button: Large blue button */}
                  <button
                    type="submit"
                    className="register-admin-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span>Registering Admin...</span>
                    ) : (
                      <>
                        <svg
                          className="btn-user-icon"
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="8.5" cy="7" r="4" />
                          <line x1="20" y1="8" x2="20" y2="14" />
                          <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                        <span>Register Admin</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* 6. Right-side Admin Access panel */}
          <aside className="admin-access-panel" aria-label="Admin Access Highlights">
            <AdminAccessIllustration />

            <div className="panel-header">
              <h2 className="panel-title">Admin Access</h2>
              <p className="panel-subtitle">
                Manage hostel operations, users and system settings from your admin dashboard.
              </p>
            </div>

            <div className="panel-features-list">
              <div className="feature-item">
                <div className="feature-icon-circle feature-icon-blue">
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="feature-text">
                  <h3 className="feature-title">User Management</h3>
                  <p className="feature-desc">Manage students, wardens, staff and more</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-circle feature-icon-green">
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className="feature-text">
                  <h3 className="feature-title">Hostel Operations</h3>
                  <p className="feature-desc">Monitor rooms, admissions and facilities</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-circle feature-icon-purple">
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                    <line x1="6" y1="12" x2="6" y2="10" />
                    <line x1="10" y1="12" x2="10" y2="7" />
                    <line x1="14" y1="12" x2="14" y2="9" />
                    <line x1="18" y1="12" x2="18" y2="6" />
                  </svg>
                </div>
                <div className="feature-text">
                  <h3 className="feature-title">Reports & Analytics</h3>
                  <p className="feature-desc">View detailed reports and statistics</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-circle feature-icon-orange">
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <div className="feature-text">
                  <h3 className="feature-title">System Settings</h3>
                  <p className="feature-desc">Configure system preferences</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* 7. Footer */}
      <Footer />
    </div>
  );
};
