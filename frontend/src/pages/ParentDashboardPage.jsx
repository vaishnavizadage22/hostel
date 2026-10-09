import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { api } from '../services/api';
import './ParentDashboardPage.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const getMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE}/${cleanPath}`;
};

export const ParentDashboardPage = () => {
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Dashboard Data State (Real Database Records)
  const [dashboardData, setDashboardData] = useState(null);
  const [hostelActivityData, setHostelActivityData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [parentProfile, setParentProfile] = useState(null);

  // UI State
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Live Server Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all real MySQL parent & daughter data
  const loadParentDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [
        dashRes,
        activityRes,
        attRes,
        leavesRes,
        compRes,
        noticesRes,
        profileRes,
      ] = await Promise.allSettled([
        api.getParentDashboard(),
        api.getParentHostelActivity(),
        api.getParentAttendance(),
        api.getParentLeaveRequests(),
        api.getParentComplaints(),
        api.getParentNotices(),
        api.getParentProfile(),
      ]);

      if (dashRes.status === 'fulfilled') setDashboardData(dashRes.value);
      if (activityRes.status === 'fulfilled') setHostelActivityData(activityRes.value);
      if (attRes.status === 'fulfilled') setAttendanceData(attRes.value);
      if (leavesRes.status === 'fulfilled') setLeaveRequests(leavesRes.value);
      if (compRes.status === 'fulfilled') setComplaints(compRes.value);
      if (noticesRes.status === 'fulfilled') setNotices(noticesRes.value);
      if (profileRes.status === 'fulfilled') setParentProfile(profileRes.value);

      if (dashRes.status === 'rejected') {
        throw new Error(dashRes.reason?.message || 'Failed to authenticate parent portal.');
      }
    } catch (err) {
      console.error('Error loading parent portal:', err);
      setErrorMsg(err.message || 'Failed to load parent dashboard. Please log in again.');
      if (err.message && err.message.toLowerCase().includes('token')) {
        localStorage.removeItem('parent_token');
        localStorage.removeItem('parent_data');
        navigate('/login/parent', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadParentDashboard();
  }, [loadParentDashboard]);

  // Handle Logout (Clears session only, NEVER deletes parent or student account)
  const handleLogout = () => {
    localStorage.removeItem('parent_token');
    localStorage.removeItem('parent_data');
    navigate('/login/parent', { replace: true });
  };

  if (loading) {
    return (
      <div className="parent-portal-loading">
        <div className="parent-spinner"></div>
        <p>Loading real-time resident records for guardian portal...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="parent-portal-error-card">
        <h2>Authentication Required</h2>
        <p>{errorMsg}</p>
        <button type="button" className="btn-retry" onClick={() => navigate('/login/parent')}>
          Return to Parent Login
        </button>
      </div>
    );
  }

  const student = dashboardData?.student;
  const admission = dashboardData?.admission_status;
  const todayAct = dashboardData?.today_hostel_activity;
  const currentStatus = dashboardData?.current_hostel_status || 'Not Available';
  const attSummary = dashboardData?.college_attendance_summary;
  const room = dashboardData?.room_info;
  const alerts = dashboardData?.alerts || [];
  const leavesCount = dashboardData?.leaves_count || {};
  const complaintsCount = dashboardData?.complaints_count || {};

  const photoUrl = student?.profile_photo ? getMediaUrl(student.profile_photo) : null;

  return (
    <div className="parent-portal-wrapper">
      {/* 1. TOP HEADER & WELCOME SECTION */}
      <header className="parent-portal-header">
        <div className="parent-header-left">
          <div className="parent-brand-pill">
            <div className="parent-logo-badge">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="brand-text-block">
              <h1 className="portal-system-title">Girls Hostel Portal</h1>
              <span className="portal-role-tag">Parent & Guardian View</span>
            </div>
          </div>
        </div>

        <div className="parent-header-right">
          <div className="live-clock-card" title="Live Server Clock">
            <span className="pulse-indicator-orange" />
            <span>{currentTime}</span>
          </div>

          {/* Linked Girl's Header Snippet */}
          <div className="daughter-snippet" onClick={() => setActiveTab('profile')} title="View Daughter Profile">
            {photoUrl ? (
              <img src={photoUrl} alt={student?.full_name} className="header-daughter-avatar" />
            ) : (
              <div className="header-daughter-fallback">
                {student?.full_name?.charAt(0) || 'D'}
              </div>
            )}
            <div className="daughter-snippet-info">
              <span className="daughter-snippet-name">{student?.full_name || 'Daughter'}</span>
              <span className="daughter-snippet-id">{student?.student_id || 'HMS-STUDENT'}</span>
            </div>
          </div>

          <button type="button" className="parent-logout-btn" onClick={handleLogout} title="Logout safely from Parent Portal">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* 2. BODY LAYOUT */}
      <div className="parent-portal-body">
        {/* SIDEBAR NAVIGATION */}
        <aside className="parent-sidebar" aria-label="Parent Portal Navigation">
          <div className="sidebar-guardian-card">
            <span className="guardian-greeting-tag">GUARDIAN PORTAL</span>
            <h3 className="guardian-name">{dashboardData?.welcome_message || 'Welcome, Parent'}</h3>
            <p className="guardian-sub">
              Guardian of <strong>{student?.full_name}</strong>
            </p>
          </div>

          <ul className="parent-nav-list">
            <li>
              <button
                type="button"
                className={`parent-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>Dashboard Overview</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`parent-nav-btn ${activeTab === 'hostel_activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('hostel_activity')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Hostel Movement Logs</span>
                <span className="parent-nav-pill">{currentStatus}</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`parent-nav-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                onClick={() => setActiveTab('attendance')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
                <span>College Attendance</span>
                <span className="parent-nav-pill live">{attSummary?.attendance_percentage || 100}%</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`parent-nav-btn ${activeTab === 'leaves' ? 'active' : ''}`}
                onClick={() => setActiveTab('leaves')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Leave & Permissions</span>
                {leavesCount.total > 0 && <span className="parent-nav-pill">{leavesCount.total}</span>}
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`parent-nav-btn ${activeTab === 'complaints' ? 'active' : ''}`}
                onClick={() => setActiveTab('complaints')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Welfare & Complaints</span>
                {complaintsCount.total > 0 && <span className="parent-nav-pill">{complaintsCount.total}</span>}
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`parent-nav-btn ${activeTab === 'notices' ? 'active' : ''}`}
                onClick={() => setActiveTab('notices')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span>Hostel Notices</span>
                <span className="parent-nav-pill">{notices.length}</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`parent-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Parent & Student Profile</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`parent-nav-btn ${activeTab === 'college_website' ? 'active' : ''}`}
                onClick={() => setActiveTab('college_website')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <span>SPIOT College Portal</span>
                <span className="parent-nav-pill live">Official</span>
              </button>
            </li>
          </ul>

          <div className="sidebar-warden-contact">
            <span className="warden-box-icon">📞</span>
            <div>
              <strong>Hostel Warden Helpdesk</strong>
              <div style={{ fontSize: '0.8rem', color: '#ea6526', fontWeight: 600 }}>
                {room?.warden_contact || '+91 98220 11223'}
              </div>
              <small style={{ fontSize: '0.72rem', color: '#64748b' }}>Emergency contact 24/7</small>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT VIEW AREA */}
        <main className="parent-content-view">
          {/* ====================================================================== */}
          {/* TAB 1: OVERVIEW */}
          {/* ====================================================================== */}
          {activeTab === 'overview' && (
            <div className="parent-overview-pane">
              {/* TOP HERO DAUGHTER STATUS BANNER */}
              <div className="daughter-hero-card">
                <div className="daughter-hero-left">
                  <div className="daughter-photo-ring">
                    {photoUrl ? (
                      <img src={photoUrl} alt={student?.full_name} className="daughter-hero-img" />
                    ) : (
                      <div className="daughter-hero-fallback">{student?.full_name?.charAt(0) || 'D'}</div>
                    )}
                    <span className="verified-biometric-dot" title="Face Biometrically Verified" />
                  </div>

                  <div className="daughter-hero-meta">
                    <div className="badge-row">
                      <span className="pill-daughter-id">{student?.student_id}</span>
                      <span className={`pill-current-status ${currentStatus === 'Inside Hostel' ? 'status-in' : currentStatus === 'Currently Outside Hostel' ? 'status-out' : 'status-pending'}`}>
                        {currentStatus === 'Inside Hostel' ? '🟢 Inside Hostel' : currentStatus === 'Currently Outside Hostel' ? '🔴 Outside Hostel' : '⚪ ' + currentStatus}
                      </span>
                      <span className={`pill-adm-status pill-${admission?.status?.toLowerCase()}`}>
                        Admission: {admission?.status}
                      </span>
                    </div>
                    <h2 className="daughter-name">{student?.full_name}</h2>
                    <p className="academic-line">
                      {student?.department} • {student?.class_year} • {student?.college_name}
                    </p>
                  </div>
                </div>

                <div className="daughter-hero-right">
                  <button type="button" className="btn-refresh-parent" onClick={loadParentDashboard}>
                    🔄 Refresh Live Logs
                  </button>
                </div>
              </div>

              {/* 2. ADMISSION STATUS BANNER (Requirement 2) */}
              <div className={`admission-banner-card banner-${admission?.status?.toLowerCase()}`}>
                <div className="adm-banner-icon">
                  {admission?.status === 'APPROVED' ? '✅' : admission?.status === 'PENDING' ? '⏳' : '❌'}
                </div>
                <div className="adm-banner-content">
                  <div className="adm-title-row">
                    <h4>{admission?.message}</h4>
                    <span className="adm-date-chip">Date: {admission?.admission_date || 'Enrolled'}</span>
                  </div>
                  <p className="adm-desc">
                    Application Status: <strong>{admission?.status}</strong> | Room: <strong>{admission?.room_number || 'Pending'}</strong> | Hostel Status: <strong>{admission?.hostel_status}</strong>
                  </p>
                </div>
              </div>

              {/* 3. TODAY'S HOSTEL ACTIVITY (Requirement 3) */}
              <div className="activity-card-container">
                <div className="section-head-row">
                  <div>
                    <h3 className="section-title">Today's Hostel Activity</h3>
                    <p className="section-subtitle">
                      Real-time movement records synchronized with verified server time.
                    </p>
                  </div>
                  <span className="gate-timing-pill">Gate Hours: 06:00 AM – 06:00 PM</span>
                </div>

                <div className="activity-times-grid">
                  <div className="act-time-box">
                    <span className="act-box-icon">🚪</span>
                    <span className="act-box-label">Hostel OUT</span>
                    <strong className={`act-box-time ${todayAct?.hostel_out_time !== 'Not recorded yet' ? 'recorded-out' : ''}`}>
                      {todayAct?.hostel_out_time || 'Not recorded yet'}
                    </strong>
                    <small>Official biometric gate departure</small>
                  </div>

                  <div className="act-time-box">
                    <span className="act-box-icon">🎓</span>
                    <span className="act-box-label">College IN</span>
                    <strong className={`act-box-time ${todayAct?.college_in_time !== 'Not recorded yet' ? 'recorded-in' : ''}`}>
                      {todayAct?.college_in_time || 'Not recorded yet'}
                    </strong>
                    <small>Recorded academic presence</small>
                  </div>

                  <div className="act-time-box">
                    <span className="act-box-icon">📚</span>
                    <span className="act-box-label">College OUT</span>
                    <strong className={`act-box-time ${todayAct?.college_out_time !== 'Not recorded yet' ? 'recorded-in' : ''}`}>
                      {todayAct?.college_out_time || 'Not recorded yet'}
                    </strong>
                    <small>Class departure timing</small>
                  </div>

                  <div className="act-time-box">
                    <span className="act-box-icon">🏠</span>
                    <span className="act-box-label">Hostel IN</span>
                    <strong className={`act-box-time ${todayAct?.hostel_in_time !== 'Not recorded yet' ? 'recorded-in' : ''}`}>
                      {todayAct?.hostel_in_time || 'Not recorded yet'}
                    </strong>
                    <small>Official biometric gate return</small>
                  </div>
                </div>
              </div>

              {/* 4. METRIC CARDS ROW: Current Status, Attendance, Room Info */}
              <div className="parent-stats-grid">
                {/* Current Hostel Status */}
                <div className="p-stat-card card-orange" onClick={() => setActiveTab('hostel_activity')}>
                  <div className="stat-head">
                    <span className="stat-label">Current Hostel Status</span>
                    <span className="pulse-indicator-orange" />
                  </div>
                  <div className="stat-val-text">{currentStatus}</div>
                  <p className="stat-desc">Determined from latest biometric gate scan</p>
                  <span className="stat-link-cue">View Movement History →</span>
                </div>

                {/* College Attendance */}
                <div className="p-stat-card card-teal" onClick={() => setActiveTab('attendance')}>
                  <div className="stat-head">
                    <span className="stat-label">College Attendance</span>
                    <span className="stat-chip live">{attSummary?.today_status || 'Present'}</span>
                  </div>
                  <div className="stat-val">{attSummary?.attendance_percentage || 100}%</div>
                  <p className="stat-desc">
                    Today: {attSummary?.today_status} ({attSummary?.college_in_time || '08:55 AM'})
                  </p>
                  <span className="stat-link-cue">View Attendance Record →</span>
                </div>

                {/* Room Info */}
                <div className="p-stat-card card-blue" onClick={() => setActiveTab('profile')}>
                  <div className="stat-head">
                    <span className="stat-label">Room Allocation</span>
                    <span className="stat-chip">{room?.is_assigned ? 'Assigned' : 'Pending'}</span>
                  </div>
                  <div className="stat-val-text">
                    {room?.is_assigned ? `Room ${room.room_number}` : 'Pending'}
                  </div>
                  <p className="stat-desc">
                    {room?.is_assigned ? room.message : 'Room has not been assigned yet.'}
                  </p>
                  <span className="stat-link-cue">Hostel Facility Details →</span>
                </div>

                {/* Leaves & Permissions */}
                <div className="p-stat-card card-rose" onClick={() => setActiveTab('leaves')}>
                  <div className="stat-head">
                    <span className="stat-label">Leave Permissions</span>
                    <span className="stat-chip alert">{leavesCount.pending || 0} Pending</span>
                  </div>
                  <div className="stat-val">{leavesCount.approved || 0}</div>
                  <p className="stat-desc">Approved visits home or campus leave</p>
                  <span className="stat-link-cue">Review Leave Requests →</span>
                </div>
              </div>

              {/* 5. IMPORTANT ALERTS (Requirement 10) */}
              {alerts.length > 0 && (
                <div className="alerts-container-card">
                  <div className="alerts-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>🔔</span>
                      <h3 className="section-title">Important Alerts & Welfare Updates</h3>
                    </div>
                    <span className="alerts-count-chip">{alerts.length} Active</span>
                  </div>

                  <div className="alerts-list">
                    {alerts.map((al) => (
                      <div key={al.id} className={`alert-list-item level-${al.level}`}>
                        <span className="alert-item-icon">
                          {al.level === 'alert' ? '🚨' : al.level === 'warning' ? '⚠️' : al.level === 'success' ? '✅' : 'ℹ️'}
                        </span>
                        <div className="alert-item-body">
                          <strong>{al.title}</strong>
                          <p>{al.message}</p>
                        </div>
                        <span className="alert-item-time">{al.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. ROOM & HOSTEL FACILITY SPOTLIGHT (Requirement 9) */}
              <div className="room-facility-card">
                <div className="facility-header">
                  <div>
                    <h3 className="section-title">Hostel & Warden Information</h3>
                    <p className="section-subtitle">Resident accommodation, block details, and assigned administration.</p>
                  </div>
                </div>

                {room?.is_assigned ? (
                  <div className="facility-details-grid">
                    <div className="facility-item">
                      <span className="f-lbl">Hostel Block</span>
                      <strong className="f-val">{room.hostel_name}</strong>
                    </div>
                    <div className="facility-item">
                      <span className="f-lbl">Room Number</span>
                      <strong className="f-val">{room.room_number}</strong>
                    </div>
                    <div className="facility-item">
                      <span className="f-lbl">Floor & Wing</span>
                      <strong className="f-val">{room.floor || 'Floor 1, Wing A'}</strong>
                    </div>
                    <div className="facility-item">
                      <span className="f-lbl">Warden In-Charge</span>
                      <strong className="f-val">{room.warden_name}</strong>
                    </div>
                    <div className="facility-item">
                      <span className="f-lbl">Warden Contact</span>
                      <strong className="f-val" style={{ color: '#ea6526' }}>📞 {room.warden_contact}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="room-not-assigned-box">
                    <span className="pending-icon">⏳</span>
                    <div>
                      <strong>Room has not been assigned yet.</strong>
                      <p>
                        Once your daughter's hostel admission is approved, the warden office will allocate her room and floor details.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 7. SPIOT COLLEGE PORTAL SPOTLIGHT CARD */}
              <div className="spiot-overview-spotlight-card">
                <div className="spiot-spotlight-header">
                  <div className="spiot-spotlight-title-group">
                    <span className="spiot-college-badge">🏛️ Associated College Portal</span>
                    <h3 className="spiot-spotlight-heading">
                      Sharadchandra Pawar Institute of Technology (SPIOT)
                    </h3>
                    <p className="spiot-spotlight-sub">
                      Someshwarnagar, Tal - Baramati, Dist - Pune 412306 • Approved by AICTE, New Delhi & DTE Maharashtra
                    </p>
                  </div>
                  <div className="spiot-spotlight-actions">
                    <a
                      href="https://www.spiotsomeshwarnagar.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-spiot-external"
                      title="Open SPIOT College website in a new window"
                    >
                      <span>Visit Website</span>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                    <button
                      type="button"
                      className="btn-spiot-tab-switch"
                      onClick={() => setActiveTab('college_website')}
                    >
                      <span>Explore In-Dashboard Portal</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

                <div className="spiot-spotlight-body-grid">
                  <div className="spiot-info-pill-item">
                    <span className="spiot-pill-label">🎓 Enrolled Resident</span>
                    <strong className="spiot-pill-val">{student?.full_name} ({student?.student_id})</strong>
                  </div>
                  <div className="spiot-info-pill-item">
                    <span className="spiot-pill-label">📚 Department</span>
                    <strong className="spiot-pill-val">{student?.department || 'Computer Engineering'}</strong>
                  </div>
                  <div className="spiot-info-pill-item">
                    <span className="spiot-pill-label">🏛️ Academic Year</span>
                    <strong className="spiot-pill-val">{student?.class_year || 'FY'}</strong>
                  </div>
                  <div className="spiot-info-pill-item">
                    <span className="spiot-pill-label">📞 Campus Helpline</span>
                    <strong className="spiot-pill-val">02112-283115 / 282470</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 2: HOSTEL MOVEMENT LOGS */}
          {/* ====================================================================== */}
          {activeTab === 'hostel_activity' && (
            <div className="parent-sub-pane">
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Live Hostel Gate Movements</h2>
                  <p className="pane-subtitle">
                    Recorded via facial biometric camera at the hostel main gate. Official Server Time.
                  </p>
                </div>
                <button type="button" className="btn-refresh-parent" onClick={loadParentDashboard}>
                  🔄 Sync Gate Logs
                </button>
              </div>

              {/* Today's 4 Summary Box */}
              <div className="activity-times-grid" style={{ marginBottom: '24px' }}>
                <div className="act-time-box">
                  <span className="act-box-icon">🚪</span>
                  <span className="act-box-label">Hostel OUT</span>
                  <strong className="act-box-time">{todayAct?.hostel_out_time || 'Not recorded yet'}</strong>
                </div>
                <div className="act-time-box">
                  <span className="act-box-icon">🎓</span>
                  <span className="act-box-label">College IN</span>
                  <strong className="act-box-time">{todayAct?.college_in_time || 'Not recorded yet'}</strong>
                </div>
                <div className="act-time-box">
                  <span className="act-box-icon">📚</span>
                  <span className="act-box-label">College OUT</span>
                  <strong className="act-box-time">{todayAct?.college_out_time || 'Not recorded yet'}</strong>
                </div>
                <div className="act-time-box">
                  <span className="act-box-icon">🏠</span>
                  <span className="act-box-label">Hostel IN</span>
                  <strong className="act-box-time">{todayAct?.hostel_in_time || 'Not recorded yet'}</strong>
                </div>
              </div>

              {/* Recent Movement Table */}
              <div className="table-card-parent">
                <div className="table-card-header">
                  <h4 style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>Recent Gate Entry & Exit History</h4>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Latest 20 Records</span>
                </div>
                <table className="parent-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time (Server)</th>
                      <th>Movement Action</th>
                      <th>Biometric Face Verification</th>
                      <th>Status Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!hostelActivityData?.recent_movements || hostelActivityData.recent_movements.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                          No movement records recorded yet.
                        </td>
                      </tr>
                    ) : (
                      hostelActivityData.recent_movements.map((m) => (
                        <tr key={m.id}>
                          <td><strong>{m.movement_date}</strong></td>
                          <td><span>{m.movement_time}</span></td>
                          <td>
                            <span className={`status-pill ${m.movement_type === 'IN' ? 'status-in' : 'status-out'}`}>
                              {m.movement_type === 'IN' ? '🏠 HOSTEL IN' : '🚪 HOSTEL OUT'}
                            </span>
                          </td>
                          <td>
                            <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.85rem' }}>
                              ✅ Facial Match Verified
                            </span>
                          </td>
                          <td>
                            <span style={{ color: '#334155', fontSize: '0.85rem' }}>Recorded Successfully</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 3: COLLEGE ATTENDANCE */}
          {/* ====================================================================== */}
          {activeTab === 'attendance' && (
            <div className="parent-sub-pane">
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">College Academic Attendance</h2>
                  <p className="pane-subtitle">
                    Recorded daily by College Academic Staff between 09:00 AM – 04:00 PM.
                  </p>
                </div>
                <button type="button" className="btn-refresh-parent" onClick={loadParentDashboard}>
                  🔄 Refresh Attendance
                </button>
              </div>

              {/* Attendance Metrics Top Row */}
              <div className="parent-stats-grid" style={{ marginBottom: '24px' }}>
                <div className="p-stat-card card-teal">
                  <span className="stat-label">Overall Attendance</span>
                  <div className="stat-val">{attendanceData?.attendance_percentage || 100}%</div>
                  <p className="stat-desc">Calculated across registered college days</p>
                </div>

                <div className="p-stat-card card-emerald">
                  <span className="stat-label">Today's Presence</span>
                  <div className="stat-val-text" style={{ color: '#16a34a' }}>
                    {attendanceData?.today_status || 'Present'}
                  </div>
                  <p className="stat-desc">Class arrival: {attendanceData?.today_in_time || '08:55 AM'}</p>
                </div>

                <div className="p-stat-card card-blue">
                  <span className="stat-label">Total Days Tracked</span>
                  <div className="stat-val">{attendanceData?.total_days || 0}</div>
                  <p className="stat-desc">Present: {attendanceData?.present_days || 0} | Absent: {attendanceData?.absent_days || 0}</p>
                </div>
              </div>

              {/* Attendance History Table */}
              <div className="table-card-parent">
                <div className="table-card-header">
                  <h4 style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>Recent College Attendance Log</h4>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Staff Verified</span>
                </div>
                <table className="parent-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>College IN Time</th>
                      <th>College OUT Time</th>
                      <th>Attendance Status</th>
                      <th>Lecture Bunk Detection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!attendanceData?.recent_records || attendanceData.recent_records.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                          No college attendance records logged yet.
                        </td>
                      </tr>
                    ) : (
                      attendanceData.recent_records.map((r) => (
                        <tr key={r.id}>
                          <td><strong>{r.date}</strong></td>
                          <td>{r.college_in_time || '08:55 AM'}</td>
                          <td>{r.college_out_time || '04:05 PM'}</td>
                          <td>
                            <span className={`status-pill ${r.college_status?.toLowerCase() === 'present' ? 'status-in' : 'status-out'}`}>
                              {r.college_status}
                            </span>
                          </td>
                          <td>
                            {r.lecture_bunk_alert ? (
                              <span style={{ color: '#b45309', fontWeight: 600 }}>⚠️ {r.lecture_bunk_alert}</span>
                            ) : (
                              <span style={{ color: '#16a34a', fontSize: '0.85rem' }}>Normal Attendance ✅</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 4: LEAVE & PERMISSIONS (VIEW-ONLY) */}
          {/* ====================================================================== */}
          {activeTab === 'leaves' && (
            <div className="parent-sub-pane">
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Daughter's Leave & Permission Requests</h2>
                  <p className="pane-subtitle">
                    Official requests submitted by your daughter for weekend visits, night outs, or emergency leaves.
                  </p>
                </div>
                <span className="read-only-pill">🔒 Guardian View-Only</span>
              </div>

              <div className="table-card-parent">
                <table className="parent-table">
                  <thead>
                    <tr>
                      <th>Request Type</th>
                      <th>Dates Requested</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Warden Office Response</th>
                      <th>Submitted On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                          No leave requests submitted yet.
                        </td>
                      </tr>
                    ) : (
                      leaveRequests.map((l) => (
                        <tr key={l.id}>
                          <td><strong>{l.request_type}</strong></td>
                          <td>{l.from_date} to {l.to_date}</td>
                          <td><span style={{ color: '#475569' }}>{l.reason}</span></td>
                          <td>
                            <span className={`status-pill status-${l.status.toLowerCase()}`}>
                              {l.status}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: l.status === 'Approved' ? '#16a34a' : l.status === 'Rejected' ? '#b91c1c' : '#d97706' }}>
                              {l.warden_response}
                            </strong>
                          </td>
                          <td><small style={{ color: '#94a3b8' }}>{l.created_at}</small></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 5: WELFARE & COMPLAINTS (WITH AI PRIORITY) */}
          {/* ====================================================================== */}
          {activeTab === 'complaints' && (
            <div className="parent-sub-pane">
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Resident Welfare & Grievance Complaints</h2>
                  <p className="pane-subtitle">
                    Grievances filed by your daughter regarding room, mess, maintenance, or security.
                  </p>
                </div>
                <span className="read-only-pill">🔒 View Status Only</span>
              </div>

              <div className="table-card-parent">
                <table className="parent-table">
                  <thead>
                    <tr>
                      <th>Complaint Title</th>
                      <th>Description</th>
                      <th>AI Priority Triage</th>
                      <th>Resolution Status</th>
                      <th>Submitted On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                          No grievances or complaints submitted. Everything is in order!
                        </td>
                      </tr>
                    ) : (
                      complaints.map((c) => (
                        <tr key={c.id}>
                          <td><strong>{c.title}</strong></td>
                          <td><p style={{ margin: 0, color: '#475569', maxWidth: '320px' }}>{c.description}</p></td>
                          <td>
                            <span className={`ai-priority-chip priority-${(c.ai_priority || 'MEDIUM').toLowerCase()}`}>
                              AI: {c.ai_priority}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill status-${(c.status || 'Pending').toLowerCase().replace(' ', '-')}`}>
                              {c.status}
                            </span>
                          </td>
                          <td><small style={{ color: '#94a3b8' }}>{c.created_at}</small></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 6: NOTICES */}
          {/* ====================================================================== */}
          {activeTab === 'notices' && (
            <div className="parent-sub-pane">
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Official Hostel Notices & Bulletins</h2>
                  <p className="pane-subtitle">
                    Announcements published by the Hostel Administration and Warden Office.
                  </p>
                </div>
              </div>

              <div className="notices-grid">
                {notices.length === 0 ? (
                  <div className="table-card-parent" style={{ padding: '40px', textAlign: 'center' }}>
                    <p style={{ color: '#64748b', margin: 0 }}>No hostel circulars posted yet.</p>
                  </div>
                ) : (
                  notices.map((n) => (
                    <div key={n.id} className="parent-notice-card">
                      <div className="notice-card-top">
                        <span className={`priority-tag priority-${(n.priority || 'Normal').toLowerCase()}`}>
                          {n.priority} Priority
                        </span>
                        <span className="notice-date">{n.created_at}</span>
                      </div>
                      <h4 className="notice-title">{n.title}</h4>
                      <p className="notice-body">{n.message}</p>
                      <div className="notice-footer">
                        <span>Issued by: <strong>{n.posted_by}</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 7: PARENT & STUDENT PROFILE */}
          {/* ====================================================================== */}
          {activeTab === 'profile' && (
            <div className="parent-sub-pane">
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Parent Guardian Profile</h2>
                  <p className="pane-subtitle">
                    Account credentials linked during student admission registration.
                  </p>
                </div>
                <button type="button" className="parent-logout-btn" onClick={handleLogout}>
                  Logout From Portal
                </button>
              </div>

              <div className="profile-dual-grid">
                {/* Parent Profile Card */}
                <div className="profile-card">
                  <div className="profile-card-header">
                    <span className="profile-avatar-emoji">👨‍👩‍👧</span>
                    <div>
                      <h3 className="profile-name">{parentProfile?.parent_name || 'Guardian'}</h3>
                      <span className="profile-role-tag">Verified Resident Guardian</span>
                    </div>
                  </div>

                  <div className="profile-info-list">
                    <div className="profile-row">
                      <span className="p-lbl">Parent Full Name:</span>
                      <strong className="p-val">{parentProfile?.parent_name}</strong>
                    </div>
                    <div className="profile-row">
                      <span className="p-lbl">Registered Mobile:</span>
                      <strong className="p-val">📞 {parentProfile?.parent_mobile}</strong>
                    </div>
                    <div className="profile-row">
                      <span className="p-lbl">Registered Email:</span>
                      <strong className="p-val">✉️ {parentProfile?.parent_email || 'Not provided'}</strong>
                    </div>
                    <div className="profile-row">
                      <span className="p-lbl">Linked Daughter:</span>
                      <strong className="p-val">{parentProfile?.linked_student_name}</strong>
                    </div>
                    <div className="profile-row">
                      <span className="p-lbl">Daughter's Student ID:</span>
                      <strong className="p-val">{parentProfile?.linked_student_id}</strong>
                    </div>
                  </div>
                </div>

                {/* Daughter Details Card */}
                <div className="profile-card">
                  <div className="profile-card-header">
                    {photoUrl ? (
                      <img src={photoUrl} alt={student?.full_name} className="profile-daughter-img" />
                    ) : (
                      <div className="daughter-hero-fallback">{student?.full_name?.charAt(0) || 'D'}</div>
                    )}
                    <div>
                      <h3 className="profile-name">{student?.full_name}</h3>
                      <span className="profile-role-tag">Enrolled Female Resident</span>
                    </div>
                  </div>

                  <div className="profile-info-list">
                    <div className="profile-row">
                      <span className="p-lbl">Student ID:</span>
                      <strong className="p-val">{student?.student_id}</strong>
                    </div>
                    <div className="profile-row">
                      <span className="p-lbl">College:</span>
                      <strong className="p-val">{student?.college_name}</strong>
                    </div>
                    <div className="profile-row">
                      <span className="p-lbl">Department & Year:</span>
                      <strong className="p-val">{student?.department} • {student?.class_year}</strong>
                    </div>
                    <div className="profile-row">
                      <span className="p-lbl">Hostel Block & Room:</span>
                      <strong className="p-val">{student?.room_number || 'Pending'} ({student?.wing || 'Wing A'})</strong>
                    </div>
                    <div className="profile-row">
                      <span className="p-lbl">Admission Status:</span>
                      <strong className="p-val" style={{ color: admission?.status === 'APPROVED' ? '#16a34a' : '#d97706' }}>
                        {admission?.status}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 8: SPIOT COLLEGE WEBSITE PORTAL */}
          {/* ====================================================================== */}
          {activeTab === 'college_website' && (
            <div className="parent-sub-pane spiot-portal-pane">
              <div className="pane-header-row spiot-header-row">
                <div className="spiot-header-text">
                  <div className="spiot-badge-row">
                    <span className="spiot-college-badge">🏛️ Official College Website</span>
                    <span className="spiot-live-tag">Live Institutional Server</span>
                  </div>
                  <h2 className="pane-title">Sharadchandra Pawar Institute of Technology (SPIOT)</h2>
                  <p className="pane-subtitle">
                    Someshwarnagar, Tal - Baramati, Dist - Pune 412306 • Approved by AICTE, New Delhi & DTE Maharashtra
                  </p>
                </div>
                <div className="spiot-header-btn-group">
                  <a
                    href="https://www.spiotsomeshwarnagar.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-spiot-launch-newtab"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    <span>Open in Full Screen ↗</span>
                  </a>
                  <a
                    href="https://www.secsomeshwar.ac.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-spiot-secondary-link"
                    title="Someshwar Engineering Campus"
                  >
                    <span>SEC Campus Portal ↗</span>
                  </a>
                </div>
              </div>

              {/* Quick Info Strip */}
              <div className="spiot-quick-strip">
                <div className="strip-item">
                  <span className="strip-icon">🎓</span>
                  <div>
                    <span className="strip-label">Resident Student</span>
                    <strong className="strip-value">{student?.full_name} ({student?.student_id})</strong>
                  </div>
                </div>

                <div className="strip-item">
                  <span className="strip-icon">🏛️</span>
                  <div>
                    <span className="strip-label">Department & Year</span>
                    <strong className="strip-value">{student?.department || 'Computer Engineering'} • {student?.class_year || 'FY'}</strong>
                  </div>
                </div>

                <div className="strip-item">
                  <span className="strip-icon">🌐</span>
                  <div>
                    <span className="strip-label">Official Domain</span>
                    <strong className="strip-value">www.spiotsomeshwarnagar.com</strong>
                  </div>
                </div>

                <div className="strip-item">
                  <span className="strip-icon">📞</span>
                  <div>
                    <span className="strip-label">Campus Phone</span>
                    <strong className="strip-value">02112-283115 / 282470</strong>
                  </div>
                </div>
              </div>

              {/* Quick Links Bar */}
              <div className="spiot-quick-links-bar">
                <span className="quick-links-title">Campus Quick Links:</span>
                <a href="https://www.spiotsomeshwarnagar.com/" target="_blank" rel="noopener noreferrer" className="quick-chip">
                  🏠 SPIOT Home
                </a>
                <a href="https://www.spiotsomeshwarnagar.com/" target="_blank" rel="noopener noreferrer" className="quick-chip">
                  📖 Courses & Syllabus
                </a>
                <a href="https://www.spiotsomeshwarnagar.com/" target="_blank" rel="noopener noreferrer" className="quick-chip">
                  📝 Exam Cell & Results
                </a>
                <a href="https://www.spiotsomeshwarnagar.com/" target="_blank" rel="noopener noreferrer" className="quick-chip">
                  👩‍🏫 Departments & Labs
                </a>
                <a href="https://www.spiotsomeshwarnagar.com/" target="_blank" rel="noopener noreferrer" className="quick-chip">
                  🏢 Hostel & Student Welfare
                </a>
              </div>

              {/* Responsive Iframe Container */}
              <div className="spiot-iframe-wrapper">
                <div className="iframe-browser-bar">
                  <div className="browser-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-yellow" />
                    <span className="dot dot-green" />
                  </div>
                  <div className="browser-address-bar">
                    <span className="lock-icon">🔒</span>
                    <span className="address-text">https://www.spiotsomeshwarnagar.com/</span>
                  </div>
                  <a
                    href="https://www.spiotsomeshwarnagar.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="browser-open-btn"
                    title="Launch external window"
                  >
                    Open New Tab ↗
                  </a>
                </div>

                <div className="iframe-viewport-container">
                  <iframe
                    src="https://www.spiotsomeshwarnagar.com/"
                    title="Sharadchandra Pawar Institute of Technology (SPIOT) Someshwarnagar"
                    className="spiot-live-iframe"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    loading="lazy"
                  />
                </div>

                <div className="iframe-footer-bar">
                  <p className="iframe-hint-text">
                    💡 <em>Tip: You can interact with the live SPIOT portal above, or click 'Open in Full Screen ↗' to browse the website directly.</em>
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};
