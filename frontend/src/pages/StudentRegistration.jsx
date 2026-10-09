import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { StudentCameraScanner } from '../components/StudentCameraScanner';
import { api } from '../services/api';
import './StudentRegistration.css';

export const StudentRegistration = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    mobile: '',
    email: '',
    address: '',
    collegeName: '',
    department: '',
    classYear: '',
    parentName: '',
    parentMobile: '',
    parentEmail: '',
  });

  const [capturedFaceImage, setCapturedFaceImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [registeredData, setRegisteredData] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

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

  const handleCaptureSuccess = (base64Image) => {
    setCapturedFaceImage(base64Image);
    if (errors.faceImage) {
      setErrors((prev) => ({ ...prev, faceImage: '' }));
    }
  };

  const handleRetake = () => {
    setCapturedFaceImage(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.dateOfBirth.trim()) newErrors.dateOfBirth = 'Date of Birth is required';

    const phoneRegex = /^\+?[0-9\s\-()]{10,16}$/;
    const digitsOnly = formData.mobile.replace(/\D/g, '');
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile Number is required';
    } else if (!phoneRegex.test(formData.mobile.trim()) || digitsOnly.length < 10) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.address.trim()) newErrors.address = 'Residential Address is required';
    if (!formData.collegeName.trim()) newErrors.collegeName = 'College Name is required';
    if (!formData.department.trim()) newErrors.department = 'Department / Branch is required';
    if (!formData.classYear.trim()) newErrors.classYear = 'Class / Academic Year is required';
    if (!formData.parentName.trim()) newErrors.parentName = 'Parent Name is required';

    const parentDigits = formData.parentMobile.replace(/\D/g, '');
    if (!formData.parentMobile.trim()) {
      newErrors.parentMobile = 'Parent Mobile Number is required';
    } else if (!phoneRegex.test(formData.parentMobile.trim()) || parentDigits.length < 10) {
      newErrors.parentMobile = 'Enter a valid 10-digit parent mobile number';
    }

    if (formData.parentEmail && !emailRegex.test(formData.parentEmail.trim())) {
      newErrors.parentEmail = 'Enter a valid parent email address';
    }

    if (!capturedFaceImage) {
      newErrors.faceImage = 'Live face capture is required. Please start the camera and complete face scan.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
        date_of_birth: formData.dateOfBirth.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        college_name: formData.collegeName.trim(),
        department: formData.department.trim(),
        class_year: formData.classYear.trim(),
        parent_name: formData.parentName.trim(),
        parent_mobile: formData.parentMobile.trim(),
        parent_email: formData.parentEmail ? formData.parentEmail.trim().toLowerCase() : null,
        face_image_base64: capturedFaceImage,
      };

      const result = await api.registerStudent(payload);

      setRegisteredData({
        studentId: result.student_id,
        temporaryPassword: result.temporary_password,
        studentName: formData.fullName.trim(),
      });
      setIsSubmitting(false);
    } catch (err) {
      console.error('Student registration error:', err);
      setServerError(err.message || 'Registration failed. Please check inputs and try again.');
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  return (
    <div className="student-reg-wrapper">
      <div className="student-reg-bg-blob blob-top-left" aria-hidden="true" />
      <div className="student-reg-bg-blob blob-top-right" aria-hidden="true" />

      <main className="student-reg-container">
        {/* Page Header */}
        <div className="student-reg-header">
          <div className="student-hostel-badge">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span>Girls Hostel Portal</span>
          </div>
          <h1 className="student-reg-title">Student Registration</h1>
          <p className="student-reg-subtitle">
            Create your account for Girls Hostel Management System
          </p>
        </div>

        {/* 10. REGISTRATION SUCCESS VIEW */}
        {registeredData ? (
          <div className="reg-success-card">
            <div className="reg-success-icon-badge">
              <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#ffffff" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="reg-success-heading">Registration Successful!</h2>
            <p className="reg-success-desc">
              Your biometric face profile and hostel application for <strong>{registeredData.studentName}</strong> have been securely registered.
            </p>
            <p className="reg-credentials-note">
              Your Student ID and Password have been generated (Format: <strong>&lt;name&gt;@123</strong>):
            </p>

            <div className="credentials-box">
              <div className="credential-row">
                <div className="cred-info">
                  <span className="cred-label">Student ID</span>
                  <span className="cred-val highlight-id">{registeredData.studentId}</span>
                </div>
                <button
                  type="button"
                  className="copy-cred-btn"
                  onClick={() => copyToClipboard(registeredData.studentId, 'id')}
                >
                  {copiedId ? 'Copied ✓' : 'Copy ID'}
                </button>
              </div>

              <div className="credential-row">
                <div className="cred-info">
                  <span className="cred-label">Password</span>
                  <span className="cred-val highlight-pass">{registeredData.temporaryPassword}</span>
                </div>
                <button
                  type="button"
                  className="copy-cred-btn"
                  onClick={() => copyToClipboard(registeredData.temporaryPassword, 'pass')}
                >
                  {copiedPass ? 'Copied ✓' : 'Copy Password'}
                </button>
              </div>
            </div>

            <div className="reg-success-action-group">
              <button
                type="button"
                className="proceed-login-btn"
                onClick={() =>
                  navigate('/student/login', {
                    state: {
                      prefilledId: registeredData.studentId,
                      message: 'Account registered! Login with your Student ID and password.',
                    },
                  })
                }
              >
                <span>Proceed to Student Login</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          /* FORM + CAMERA SECTION */
          <div className="student-reg-grid">
            {/* Left Column: Student Details Form */}
            <div className="student-form-card">
              <div className="form-card-title-bar">
                <div className="form-icon-pill">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="2.2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h2 className="form-card-heading">Student Details</h2>
                  <p className="form-card-subheading">Enter your official details. Student ID & password will be created as <strong>name@123</strong>.</p>
                </div>
              </div>

              {serverError && (
                <div className="form-server-error" role="alert">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#dc2626" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{serverError}</span>
                </div>
              )}

              <form className="student-form" onSubmit={handleSubmit} noValidate>
                {/* Section 1: Academic & Personal */}
                <div className="form-subheading-label">Personal & Contact Info</div>
                <div className="fields-two-col">
                  {/* Full Name * */}
                  <div className="field-group">
                    <label htmlFor="fullName" className="input-label">
                      Full Name <span className="req-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      placeholder="e.g. Ananya Deshmukh"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={errors.fullName ? 'input-error' : ''}
                      required
                    />
                    {errors.fullName && <span className="err-text">{errors.fullName}</span>}
                  </div>

                  {/* Date of Birth * */}
                  <div className="field-group">
                    <label htmlFor="dateOfBirth" className="input-label">
                      Date of Birth <span className="req-star">*</span>
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={errors.dateOfBirth ? 'input-error' : ''}
                      required
                    />
                    {errors.dateOfBirth && <span className="err-text">{errors.dateOfBirth}</span>}
                  </div>

                  {/* Mobile Number * */}
                  <div className="field-group">
                    <label htmlFor="mobile" className="input-label">
                      Mobile Number <span className="req-star">*</span>
                    </label>
                    <input
                      type="tel"
                      id="mobile"
                      name="mobile"
                      placeholder="e.g. 9876543210"
                      value={formData.mobile}
                      onChange={handleChange}
                      className={errors.mobile ? 'input-error' : ''}
                      required
                    />
                    {errors.mobile && <span className="err-text">{errors.mobile}</span>}
                  </div>

                  {/* Email Address * */}
                  <div className="field-group">
                    <label htmlFor="email" className="input-label">
                      Email Address <span className="req-star">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="ananya@college.edu"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? 'input-error' : ''}
                      required
                    />
                    {errors.email && <span className="err-text">{errors.email}</span>}
                  </div>
                </div>

                {/* Residential Address * */}
                <div className="field-group full-width-field">
                  <label htmlFor="address" className="input-label">
                    Permanent Address <span className="req-star">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows="2"
                    placeholder="Enter full permanent residential address"
                    value={formData.address}
                    onChange={handleChange}
                    className={errors.address ? 'input-error' : ''}
                    required
                  />
                  {errors.address && <span className="err-text">{errors.address}</span>}
                </div>

                {/* Section 2: College & Academic Details */}
                <div className="form-subheading-label">College & Department Details</div>
                <div className="fields-two-col">
                  {/* College Name * */}
                  <div className="field-group full-width-field">
                    <label htmlFor="collegeName" className="input-label">
                      College Name <span className="req-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="collegeName"
                      name="collegeName"
                      placeholder="e.g. Government College of Engineering"
                      value={formData.collegeName}
                      onChange={handleChange}
                      className={errors.collegeName ? 'input-error' : ''}
                      required
                    />
                    {errors.collegeName && <span className="err-text">{errors.collegeName}</span>}
                  </div>

                  {/* Department * */}
                  <div className="field-group">
                    <label htmlFor="department" className="input-label">
                      Department / Branch <span className="req-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      placeholder="e.g. Computer Engineering"
                      value={formData.department}
                      onChange={handleChange}
                      className={errors.department ? 'input-error' : ''}
                      required
                    />
                    {errors.department && <span className="err-text">{errors.department}</span>}
                  </div>

                  {/* Class / Year * */}
                  <div className="field-group">
                    <label htmlFor="classYear" className="input-label">
                      Class / Year <span className="req-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="classYear"
                      name="classYear"
                      placeholder="e.g. B.Tech 3rd Year (TY)"
                      value={formData.classYear}
                      onChange={handleChange}
                      className={errors.classYear ? 'input-error' : ''}
                      required
                    />
                    {errors.classYear && <span className="err-text">{errors.classYear}</span>}
                  </div>
                </div>

                {/* Section 3: Parent / Guardian Details */}
                <div className="form-subheading-label">Parent / Guardian Details</div>
                <div className="fields-two-col">
                  {/* Parent Name * */}
                  <div className="field-group">
                    <label htmlFor="parentName" className="input-label">
                      Parent Name <span className="req-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="parentName"
                      name="parentName"
                      placeholder="e.g. Ramesh Deshmukh"
                      value={formData.parentName}
                      onChange={handleChange}
                      className={errors.parentName ? 'input-error' : ''}
                      required
                    />
                    {errors.parentName && <span className="err-text">{errors.parentName}</span>}
                  </div>

                  {/* Parent Mobile Number * */}
                  <div className="field-group">
                    <label htmlFor="parentMobile" className="input-label">
                      Parent Mobile Number <span className="req-star">*</span>
                    </label>
                    <input
                      type="tel"
                      id="parentMobile"
                      name="parentMobile"
                      placeholder="e.g. 9822012345"
                      value={formData.parentMobile}
                      onChange={handleChange}
                      className={errors.parentMobile ? 'input-error' : ''}
                      required
                    />
                    {errors.parentMobile && <span className="err-text">{errors.parentMobile}</span>}
                  </div>

                  {/* Parent Email Address (Optional) */}
                  <div className="field-group full-width-field">
                    <label htmlFor="parentEmail" className="input-label">
                      Parent Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      id="parentEmail"
                      name="parentEmail"
                      placeholder="parent@example.com"
                      value={formData.parentEmail}
                      onChange={handleChange}
                      className={errors.parentEmail ? 'input-error' : ''}
                    />
                    {errors.parentEmail && <span className="err-text">{errors.parentEmail}</span>}
                  </div>
                </div>

                {errors.faceImage && (
                  <div className="face-required-banner">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{errors.faceImage}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="student-reg-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Registering Biometrics & Account...</span>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                      </svg>
                      <span>Complete Student Registration</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Real Camera Face Scanner */}
            <aside className="student-camera-panel">
              <div className="camera-panel-header">
                <div className="camera-header-icon">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#d8376b" strokeWidth="2.2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <div>
                  <h3 className="camera-panel-title">Biometric Face Registration</h3>
                  <p className="camera-panel-desc">Real camera verification for hostel security.</p>
                </div>
              </div>

              <StudentCameraScanner
                onCaptureSuccess={handleCaptureSuccess}
                capturedImage={capturedFaceImage}
                onRetake={handleRetake}
              />

              <div className="camera-rules-card">
                <h4 className="rules-heading">Face Scan Instructions</h4>
                <ul className="rules-list">
                  <li>Position your face centered within the oval guide frame.</li>
                  <li>Ensure proper lighting without glare or backlight.</li>
                  <li>Hold still when "Face Detected" appears for the 3-second capture.</li>
                  <li>Face biometrics will be matched during hostel entry and exit.</li>
                </ul>
              </div>

              <div className="already-registered-link">
                <span>Already have a Student ID? </span>
                <Link to="/student/login" className="login-link-highlight">
                  Student Login
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
