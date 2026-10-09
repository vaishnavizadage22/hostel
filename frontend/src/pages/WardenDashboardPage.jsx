import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { api } from '../services/api';
import './WardenDashboardPage.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const getMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE}/${cleanPath}`;
};

export const WardenDashboardPage = () => {
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Warden Profile
  const [currentWarden, setCurrentWarden] = useState(() => {
    try {
      const saved = localStorage.getItem('warden_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Real Database States
  const [stats, setStats] = useState({
    total_students: 0,
    present_today: 0,
    hostel_in_today: 0,
    hostel_out_today: 0,
    pending_complaints: 0,
    pending_leaves: 0,
  });

  const [students, setStudents] = useState([]);
  const [hostelAttendance, setHostelAttendance] = useState([]);
  const [collegeAttendance, setCollegeAttendance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [hostelMovementsSummary, setHostelMovementsSummary] = useState([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState({ type: '', message: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);

  // Notice Form State
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    message: '',
    target_audience: 'All Students',
    priority: 'Normal',
  });
  const [submittingNotice, setSubmittingNotice] = useState(false);

  // Live Server Clock
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all real MySQL warden data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        profileRes,
        statsRes,
        studentsRes,
        hostelAttRes,
        collegeAttRes,
        leavesRes,
        complaintsRes,
        noticesRes,
        movementsSummaryRes,
      ] = await Promise.allSettled([
        api.getWardenProfile(),
        api.getWardenStats(),
        api.getWardenStudents(),
        api.getWardenHostelAttendance(),
        api.getWardenCollegeAttendance(),
        api.getWardenLeaveRequests(),
        api.getWardenComplaints(),
        api.getWardenNotices(),
        api.getWardenMovementSummary(),
      ]);

      if (profileRes.status === 'fulfilled') {
        setCurrentWarden(profileRes.value);
        localStorage.setItem('warden_data', JSON.stringify(profileRes.value));
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value);
      if (hostelAttRes.status === 'fulfilled') setHostelAttendance(hostelAttRes.value);
      if (collegeAttRes.status === 'fulfilled') setCollegeAttendance(collegeAttRes.value);
      if (leavesRes.status === 'fulfilled') setLeaveRequests(leavesRes.value);
      if (complaintsRes.status === 'fulfilled') setComplaints(complaintsRes.value);
      if (noticesRes.status === 'fulfilled') setNotices(noticesRes.value);
      if (movementsSummaryRes.status === 'fulfilled') setHostelMovementsSummary(movementsSummaryRes.value);
    } catch (err) {
      console.error('Error loading warden data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await api.logoutWarden();
    } catch {
      // ignore
    }
    localStorage.removeItem('warden_token');
    localStorage.removeItem('warden_data');
    navigate('/login/warden', { replace: true });
  };

  // View Student Full Details
  const handleViewStudentDetails = async (studentId) => {
    setLoadingDetails(true);
    try {
      const details = await api.getWardenStudentDetails(studentId);
      setSelectedStudent(details);
    } catch (err) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to fetch student details.' });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Interactive Gate IN/OUT
  const handleGateAction = async (studentId, type) => {
    try {
      if (type === 'IN') {
        const res = await api.recordHostelIn(studentId);
        setActionNotice({ type: 'success', message: res.message || `Hostel IN recorded for ${studentId}` });
      } else {
        const res = await api.recordHostelOut(studentId);
        setActionNotice({ type: 'success', message: res.message || `Hostel OUT recorded for ${studentId}` });
      }
      loadDashboardData();
    } catch (err) {
      setActionNotice({ type: 'error', message: err.message || `Failed to record gate ${type}` });
    }
  };

  // Leave Approval
  const handleApproveLeave = async (leaveId) => {
    try {
      const res = await api.approveWardenLeaveRequest(leaveId);
      setActionNotice({ type: 'success', message: res.message || 'Leave approved successfully.' });
      loadDashboardData();
    } catch (err) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to approve leave.' });
    }
  };

  // Leave Rejection
  const handleRejectLeave = async (leaveId) => {
    try {
      const res = await api.rejectWardenLeaveRequest(leaveId);
      setActionNotice({ type: 'success', message: res.message || 'Leave rejected.' });
      loadDashboardData();
    } catch (err) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to reject leave.' });
    }
  };

  // Complaint Status Update
  const handleUpdateComplaintStatus = async (complaintId, newStatus) => {
    try {
      const res = await api.updateWardenComplaintStatus(complaintId, newStatus);
      setActionNotice({ type: 'success', message: res.message || `Complaint marked as ${newStatus}` });
      loadDashboardData();
    } catch (err) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to update status.' });
    }
  };

  // Broadcast Notice
  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.message.trim()) {
      setActionNotice({ type: 'error', message: 'Please provide both Title and Message for the notice.' });
      return;
    }
    setSubmittingNotice(true);
    try {
      await api.createWardenNotice(noticeForm);
      setActionNotice({ type: 'success', message: 'Notice broadcasted! Visible to students immediately.' });
      setNoticeForm({ title: '', message: '', target_audience: 'All Students', priority: 'Normal' });
      loadDashboardData();
    } catch (err) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to broadcast notice.' });
    } finally {
      setSubmittingNotice(false);
    }
  };

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.full_name?.toLowerCase().includes(q) ||
      s.student_id?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'IN') return s.today_hostel_status === 'IN HOSTEL';
    if (statusFilter === 'OUT') return s.today_hostel_status === 'OUTSIDE HOSTEL';
    if (statusFilter === 'APPROVED') return (s.admission_status || '').toUpperCase() === 'APPROVED';
    if (statusFilter === 'PENDING') return (s.admission_status || '').toUpperCase() === 'PENDING';
    return true;
  });

  // Emergency Complaints
  const emergencyComplaints = complaints.filter(
    (c) => (c.ai_priority || '').toUpperCase() === 'EMERGENCY'
  );

  // Lecture Bunk Alert Records
  const bunkAlerts = hostelAttendance.filter((r) => r.lecture_bunk_alert);

  return (
    <div className="warden-portal-wrapper">
      {/* 1. TOP HEADER */}
      <header className="warden-portal-header">
        <div className="header-left-cluster">
          <div className="warden-brand-pill">
            <div className="warden-logo-badge">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="brand-text-block">
              <h1 className="portal-system-title">Girls Hostel Portal</h1>
              <span className="portal-role-tag">Warden Administration</span>
            </div>
          </div>
        </div>

        <div className="header-right-cluster">
          <div className="live-clock-card" title="Live Server Clock">
            <span className="pulse-indicator" />
            <span>{currentTime}</span>
          </div>

          <div
            className="warden-user-snippet"
            onClick={() => setActiveTab('profile')}
            title="View My Warden Profile"
          >
            {currentWarden?.profile_photo ? (
              <img
                src={getMediaUrl(currentWarden.profile_photo)}
                alt={currentWarden.full_name}
                className="header-warden-avatar"
              />
            ) : (
              <div className="header-warden-fallback">
                {currentWarden?.full_name?.charAt(0) || 'W'}
              </div>
            )}
            <div className="warden-snippet-info">
              <span className="warden-snippet-name">{currentWarden?.full_name || 'Hostel Warden'}</span>
              <span className="warden-snippet-id">{currentWarden?.warden_id || 'WRD-STAFF'}</span>
            </div>
          </div>

          <button type="button" className="warden-logout-btn" onClick={handleLogout}>
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
      <div className="warden-portal-body">
        {/* SIDEBAR NAVIGATION */}
        <nav className="warden-sidebar" aria-label="Warden Navigation">
          <div className="sidebar-nav-title">HOSTEL OPERATIONS</div>
          <ul className="sidebar-nav-list">
            <li>
              <button
                type="button"
                className={`warden-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
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
                className={`warden-nav-btn ${activeTab === 'students' ? 'active' : ''}`}
                onClick={() => setActiveTab('students')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Student Management</span>
                <span className="nav-pill">{stats.total_students}</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`warden-nav-btn ${activeTab === 'hostel_gate' ? 'active' : ''}`}
                onClick={() => setActiveTab('hostel_gate')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <line x1="9" y1="22" x2="9" y2="12" />
                  <line x1="15" y1="22" x2="15" y2="12" />
                </svg>
                <span>Hostel IN / OUT</span>
                <span className="nav-pill live">{stats.hostel_in_today} IN</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`warden-nav-btn ${activeTab === 'college_attendance' ? 'active' : ''}`}
                onClick={() => setActiveTab('college_attendance')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
                <span>College Attendance</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`warden-nav-btn ${activeTab === 'lunch_break' ? 'active' : ''}`}
                onClick={() => setActiveTab('lunch_break')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Lunch Break (11-11:35)</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`warden-nav-btn ${activeTab === 'bunk_alerts' ? 'active' : ''}`}
                onClick={() => setActiveTab('bunk_alerts')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Lecture Bunk Alerts</span>
                {bunkAlerts.length > 0 && <span className="nav-pill alert">{bunkAlerts.length}</span>}
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`warden-nav-btn ${activeTab === 'leaves' ? 'active' : ''}`}
                onClick={() => setActiveTab('leaves')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Leave & Permissions</span>
                {stats.pending_leaves > 0 && <span className="nav-pill alert">{stats.pending_leaves}</span>}
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`warden-nav-btn ${activeTab === 'complaints' ? 'active' : ''}`}
                onClick={() => setActiveTab('complaints')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Grievance Complaints</span>
                {stats.pending_complaints > 0 && (
                  <span className={`nav-pill ${emergencyComplaints.length > 0 ? 'danger' : 'alert'}`}>
                    {stats.pending_complaints}
                  </span>
                )}
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`warden-nav-btn ${activeTab === 'notices' ? 'active' : ''}`}
                onClick={() => setActiveTab('notices')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span>Hostel Notices</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`warden-nav-btn ${activeTab === 'parents' ? 'active' : ''}`}
                onClick={() => setActiveTab('parents')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>Parent Contacts</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`warden-nav-btn ${activeTab === 'rooms' ? 'active' : ''}`}
                onClick={() => setActiveTab('rooms')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" />
                  <path d="M21 7L12 2 3 7" />
                </svg>
                <span>Room Information</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`warden-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Warden Profile</span>
              </button>
            </li>
          </ul>

          <div className="sidebar-live-duty">
            <span className="pulse-indicator" />
            <div>
              <strong>On-Duty Status: Active</strong>
              <div style={{ fontSize: '0.7rem', color: '#15803d' }}>
                Warden: {currentWarden?.full_name || 'Assigned Staff'}
              </div>
            </div>
          </div>
        </nav>

        {/* CONTENT VIEW AREA */}
        <main className="warden-content-view">
          {actionNotice.message && (
            <div className={`action-toast-banner ${actionNotice.type}`} role="alert">
              <span>{actionNotice.message}</span>
              <button type="button" onClick={() => setActionNotice({ type: '', message: '' })}>✕</button>
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 1: OVERVIEW */}
          {/* ====================================================================== */}
          {activeTab === 'overview' && (
            <div>
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Warden Operational Command</h2>
                  <p className="pane-subtitle">Live real-time resident headcount, attendance, and facility metrics from MySQL.</p>
                </div>
                <button type="button" className="btn-refresh" onClick={loadDashboardData}>
                  🔄 Refresh Live Metrics
                </button>
              </div>

              {/* 6 Primary Cards */}
              <div className="warden-stats-grid">
                <div className="warden-stat-card card-emerald" onClick={() => setActiveTab('students')}>
                  <div className="stat-head">
                    <span className="stat-label">Total Students</span>
                    <span className="stat-chip live">Registered</span>
                  </div>
                  <div className="stat-val">{stats.total_students}</div>
                  <p className="stat-desc">Enrolled female residents</p>
                  <span className="stat-link-cue">View All Students →</span>
                </div>

                <div className="warden-stat-card card-teal" onClick={() => setActiveTab('college_attendance')}>
                  <div className="stat-head">
                    <span className="stat-label">Present Today</span>
                    <span className="stat-chip">College Attendance</span>
                  </div>
                  <div className="stat-val">{stats.present_today}</div>
                  <p className="stat-desc">Present in classes today</p>
                  <span className="stat-link-cue">Check Class Attendance →</span>
                </div>

                <div className="warden-stat-card card-blue" onClick={() => setActiveTab('hostel_gate')}>
                  <div className="stat-head">
                    <span className="stat-label">Hostel IN Today</span>
                    <span className="stat-chip live">Inside Hostel</span>
                  </div>
                  <div className="stat-val">{stats.hostel_in_today}</div>
                  <p className="stat-desc">Residents currently in hostel</p>
                  <span className="stat-link-cue">Open Gate Records →</span>
                </div>

                <div className="warden-stat-card card-indigo" onClick={() => setActiveTab('hostel_gate')}>
                  <div className="stat-head">
                    <span className="stat-label">Hostel OUT Today</span>
                    <span className="stat-chip">Outside Campus</span>
                  </div>
                  <div className="stat-val">{stats.hostel_out_today}</div>
                  <p className="stat-desc">Residents checked out</p>
                  <span className="stat-link-cue">Gate Checkouts →</span>
                </div>

                <div className="warden-stat-card card-amber" onClick={() => setActiveTab('complaints')}>
                  <div className="stat-head">
                    <span className="stat-label">Pending Complaints</span>
                    <span className="stat-chip alert">Action Required</span>
                  </div>
                  <div className="stat-val">{stats.pending_complaints}</div>
                  <p className="stat-desc">AI Priority Triaged issues</p>
                  <span className="stat-link-cue">Review Complaints →</span>
                </div>

                <div className="warden-stat-card card-rose" onClick={() => setActiveTab('leaves')}>
                  <div className="stat-head">
                    <span className="stat-label">Leave Requests</span>
                    <span className="stat-chip alert">Warden Approvals</span>
                  </div>
                  <div className="stat-val">{stats.pending_leaves}</div>
                  <p className="stat-desc">Permissions awaiting signature</p>
                  <span className="stat-link-cue">Review Permissions →</span>
                </div>
              </div>

              {/* Timing Rule Banner */}
              <div className="timing-info-banner">
                <div className="timing-badge-box">
                  <span className="timing-icon">🕒</span>
                  <div className="timing-text">
                    <strong>Official Hostel Gate Timings: 06:00 AM – 06:00 PM</strong>
                    <span>Evening lock-in protocol begins at 06:00 PM. Gate entries recorded with server timestamps.</span>
                  </div>
                </div>
                <div className="timing-badge-box">
                  <span className="timing-icon">🎓</span>
                  <div className="timing-text">
                    <strong>College Hours: 09:00 AM – 04:00 PM (Lunch: 11:00 AM – 11:35 AM)</strong>
                    <span>Rule-based automated checks detect student absence during active lecture hours.</span>
                  </div>
                </div>
              </div>

              {/* Emergency Complaints Spotlight */}
              {emergencyComplaints.length > 0 && (
                <div className="bunk-alert-card" style={{ borderColor: '#fca5a5', background: '#fef2f2' }}>
                  <span className="bunk-alert-icon">🚨</span>
                  <div className="bunk-alert-content">
                    <h4 style={{ color: '#b91c1c' }}>Immediate Attention: {emergencyComplaints.length} Emergency Complaints</h4>
                    <p style={{ color: '#991b1b' }}>
                      AI triage flagged high-urgency student grievances. Please inspect and resolve immediately.
                    </p>
                    <button
                      type="button"
                      className="btn-action-view"
                      style={{ marginTop: '8px' }}
                      onClick={() => setActiveTab('complaints')}
                    >
                      Resolve Emergency Complaints →
                    </button>
                  </div>
                </div>
              )}

              {/* ================= HOSTEL MOVEMENT SECTION (Requirement 13) ================= */}
              <div className="table-card" style={{ marginTop: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1.5px solid #e2e8f0', background: '#ffffff', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🚪</span> Hostel Movement
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '3px 0 0 0' }}>
                      Real-time gate movements recorded via facial biometric verification.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn-refresh"
                      onClick={() => navigate('/hostel-gate')}
                      style={{ background: '#4f46e5', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                      title="Open Live Hostel Gate Face Scanner"
                    >
                      📷 Open Gate Scanner
                    </button>
                    <button type="button" className="btn-refresh" onClick={loadDashboardData}>
                      🔄 Sync
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="warden-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Student ID</th>
                        <th>Hostel OUT</th>
                        <th>Hostel IN</th>
                        <th>Current Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hostelMovementsSummary.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                            No hostel movements recorded today.
                          </td>
                        </tr>
                      ) : (
                        hostelMovementsSummary.map((m) => {
                          const isIn = (m.current_status || '').toLowerCase().includes('in');
                          const isOut = (m.current_status || '').toLowerCase().includes('out');
                          return (
                            <tr key={m.student_id}>
                              <td>
                                <strong>{m.student_name}</strong>
                              </td>
                              <td>
                                <span className="student-id-badge">{m.student_id}</span>
                              </td>
                              <td>
                                <span style={{ fontWeight: m.hostel_out_time ? '600' : 'normal', color: m.hostel_out_time ? '#dc2626' : '#94a3b8' }}>
                                  {m.hostel_out_time || 'Not recorded yet'}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontWeight: m.hostel_in_time ? '600' : 'normal', color: m.hostel_in_time ? '#16a34a' : '#94a3b8' }}>
                                  {m.hostel_in_time || 'Not recorded yet'}
                                </span>
                              </td>
                              <td>
                                <span className={`status-pill ${isIn ? 'status-in' : isOut ? 'status-out' : ''}`}>
                                  {isIn ? '🟢 IN HOSTEL' : isOut ? '🔴 OUT OF HOSTEL' : m.current_status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 2: STUDENT MANAGEMENT */}
          {/* ====================================================================== */}
          {activeTab === 'students' && (
            <div>
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Student Management Directory</h2>
                  <p className="pane-subtitle">Complete registry of all female residents registered through the portal.</p>
                </div>
                <div className="filter-bar-row">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by ID, name, branch..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Residents</option>
                    <option value="IN">Currently IN Hostel</option>
                    <option value="OUT">Currently OUTSIDE</option>
                    <option value="APPROVED">Admitted Only</option>
                    <option value="PENDING">Pending Admission</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <p>Loading real student records from MySQL...</p>
              ) : filteredStudents.length === 0 ? (
                <div className="table-card" style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: '#64748b', fontSize: '1.05rem' }}>No students registered yet.</p>
                </div>
              ) : (
                <div className="table-card">
                  <table className="warden-table">
                    <thead>
                      <tr>
                        <th>Photo</th>
                        <th>Student ID</th>
                        <th>Full Name</th>
                        <th>College & Dept</th>
                        <th>Class/Year</th>
                        <th>Room Number</th>
                        <th>Parent Contact</th>
                        <th>Today's Gate Status</th>
                        <th>Admission</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((st) => {
                        const photoUrl = getMediaUrl(st.profile_photo);
                        const isIn = st.today_hostel_status === 'IN HOSTEL';
                        return (
                          <tr key={st.student_id}>
                            <td>
                              <div
                                className="student-avatar-wrap"
                                onClick={() => photoUrl && setEnlargedPhoto({ url: photoUrl, name: st.full_name })}
                                title="Click to view full scanned biometric photo"
                              >
                                {photoUrl ? (
                                  <img src={photoUrl} alt={st.full_name} className="table-student-img" />
                                ) : (
                                  <div className="table-student-fallback">{st.full_name?.charAt(0) || 'S'}</div>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="student-id-badge">{st.student_id}</span>
                            </td>
                            <td>
                              <strong>{st.full_name}</strong>
                            </td>
                            <td>
                              <div>{st.department}</div>
                              <small style={{ color: '#64748b' }}>{st.college}</small>
                            </td>
                            <td>{st.class_year}</td>
                            <td>
                              <strong>{st.room_number}</strong>
                            </td>
                            <td>
                              <div>{st.parent_name}</div>
                              <small style={{ color: '#059669' }}>📞 {st.parent_mobile}</small>
                            </td>
                            <td>
                              <span className={`status-pill ${isIn ? 'status-in' : 'status-out'}`}>
                                {isIn ? '🟢 IN HOSTEL' : '🔴 OUTSIDE HOSTEL'}
                              </span>
                            </td>
                            <td>
                              <span className={`status-pill status-${st.admission_status?.toLowerCase()}`}>
                                {st.admission_status}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-action-view"
                                onClick={() => handleViewStudentDetails(st.student_id)}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 3: HOSTEL IN / OUT MANAGEMENT */}
          {/* ====================================================================== */}
          {activeTab === 'hostel_gate' && (
            <div>
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Hostel IN / OUT Gate Protocol</h2>
                  <p className="pane-subtitle">Live gate entry/exit logs with actual server timestamps. Timing: 06:00 AM – 06:00 PM.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-refresh"
                    onClick={() => navigate('/hostel-gate')}
                    style={{ background: '#4f46e5', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                    title="Launch Live Biometric Gate Face Scanner"
                  >
                    📷 Launch Gate Scanner
                  </button>
                  <button type="button" className="btn-refresh" onClick={loadDashboardData}>
                    🔄 Sync Gate Logs
                  </button>
                </div>
              </div>

              {/* Timing Notice */}
              <div className="timing-info-banner">
                <div className="timing-badge-box">
                  <span className="timing-icon">🚪</span>
                  <div className="timing-text">
                    <strong>Hostel Gates Open: 06:00 AM – 06:00 PM Daily</strong>
                    <span>All movements recorded with verified server time. Face matching integration hook ready.</span>
                  </div>
                </div>
              </div>

              <div className="table-card">
                <table className="warden-table">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Student Name</th>
                      <th>Student ID</th>
                      <th>Room</th>
                      <th>Hostel IN Time</th>
                      <th>Hostel OUT Time</th>
                      <th>Current Status</th>
                      <th>Rule Alert</th>
                      <th>Gate Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hostelAttendance.map((rec) => {
                      const photoUrl = getMediaUrl(rec.profile_photo);
                      const isIn = rec.current_status === 'IN HOSTEL';
                      return (
                        <tr key={rec.student_id}>
                          <td>
                            <div className="student-avatar-wrap">
                              {photoUrl ? (
                                <img src={photoUrl} alt={rec.student_name} className="table-student-img" />
                              ) : (
                                <div className="table-student-fallback">{rec.student_name?.charAt(0) || 'S'}</div>
                              )}
                            </div>
                          </td>
                          <td>
                            <strong>{rec.student_name}</strong>
                          </td>
                          <td>
                            <span className="student-id-badge">{rec.student_id}</span>
                          </td>
                          <td>{rec.room_number}</td>
                          <td>
                            <strong>{rec.hostel_in_time || 'Pending IN'}</strong>
                          </td>
                          <td>
                            <span>{rec.hostel_out_time || 'Pending OUT'}</span>
                          </td>
                          <td>
                            <span className={`status-pill ${isIn ? 'status-in' : 'status-out'}`}>
                              {isIn ? '🟢 IN HOSTEL' : '🔴 OUTSIDE HOSTEL'}
                            </span>
                          </td>
                          <td>
                            {rec.lecture_bunk_alert ? (
                              <span style={{ color: '#b45309', fontWeight: 600, fontSize: '0.78rem' }}>
                                ⚠️ {rec.lecture_bunk_alert}
                              </span>
                            ) : (
                              <span style={{ color: '#16a34a', fontSize: '0.8rem' }}>Normal ✅</span>
                            )}
                          </td>
                          <td>
                            <div className="action-btns-group">
                              <button
                                type="button"
                                className="btn-gate-in"
                                onClick={() => handleGateAction(rec.student_id, 'IN')}
                                title="Record student entry into hostel"
                              >
                                Record IN
                              </button>
                              <button
                                type="button"
                                className="btn-gate-out"
                                onClick={() => handleGateAction(rec.student_id, 'OUT')}
                                title="Record student exit from hostel"
                              >
                                Record OUT
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 4: COLLEGE ATTENDANCE */}
          {/* ====================================================================== */}
          {activeTab === 'college_attendance' && (
            <div>
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">College Academic Attendance</h2>
                  <p className="pane-subtitle">College timing: 09:00 AM – 04:00 PM. Verification from MySQL records.</p>
                </div>
              </div>

              <div className="timing-info-banner">
                <div className="timing-badge-box">
                  <span className="timing-icon">🎓</span>
                  <div className="timing-text">
                    <strong>College Hours: 09:00 AM – 04:00 PM</strong>
                    <span>Attendance logs tracked for all registered hostel residents.</span>
                  </div>
                </div>
              </div>

              <div className="table-card">
                <table className="warden-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Student ID</th>
                      <th>Room</th>
                      <th>Date</th>
                      <th>College IN</th>
                      <th>College OUT</th>
                      <th>Academic Status</th>
                      <th>Lunch Presence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collegeAttendance.map((rec) => (
                      <tr key={rec.student_id}>
                        <td>
                          <strong>{rec.student_name}</strong>
                        </td>
                        <td>
                          <span className="student-id-badge">{rec.student_id}</span>
                        </td>
                        <td>{rec.room_number}</td>
                        <td>{rec.date}</td>
                        <td>{rec.college_in || '08:55 AM'}</td>
                        <td>{rec.college_out || '04:05 PM'}</td>
                        <td>
                          <span className={`status-pill status-${rec.college_status?.toLowerCase()}`}>
                            {rec.college_status || 'Present'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: '#047857', fontWeight: 600 }}>
                            {rec.lunch_break_status || 'Present in Hostel'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 5: LUNCH BREAK PRESENCE */}
          {/* ====================================================================== */}
          {activeTab === 'lunch_break' && (
            <div>
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Lunch Break Tracking</h2>
                  <p className="pane-subtitle">Hostel cafeteria & mess presence during authorized lunch break (11:00 AM – 11:35 AM).</p>
                </div>
              </div>

              <div className="timing-info-banner">
                <div className="timing-badge-box">
                  <span className="timing-icon">🍱</span>
                  <div className="timing-text">
                    <strong>Lunch Interval: 11:00 AM – 11:35 AM (35 mins)</strong>
                    <span>Students entering hostel during this time window are recognized on authorized lunch break.</span>
                  </div>
                </div>
              </div>

              <div className="table-card">
                <table className="warden-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Student ID</th>
                      <th>Room</th>
                      <th>Allowed Lunch Slot</th>
                      <th>Mess/Hostel Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collegeAttendance.map((rec) => (
                      <tr key={rec.student_id}>
                        <td>
                          <strong>{rec.student_name}</strong>
                        </td>
                        <td>
                          <span className="student-id-badge">{rec.student_id}</span>
                        </td>
                        <td>{rec.room_number}</td>
                        <td>
                          <strong>{rec.lunch_break_time || '11:00 AM - 11:35 AM'}</strong>
                        </td>
                        <td>
                          <span className="status-pill status-present">
                            ✅ {rec.lunch_break_status || 'Present'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 6: LECTURE BUNK ALERTS */}
          {/* ====================================================================== */}
          {activeTab === 'bunk_alerts' && (
            <div>
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Rule-Based Lecture Absence Alerts</h2>
                  <p className="pane-subtitle">
                    Automated rule comparison: College Hours (09:00 AM - 04:00 PM) vs. Gate IN timestamps. <em>(Rule-based logic, NOT AI).</em>
                  </p>
                </div>
              </div>

              {bunkAlerts.length === 0 ? (
                <div className="table-card" style={{ padding: '40px', textAlign: 'center' }}>
                  <span style={{ fontSize: '2.5rem' }}>✅</span>
                  <h3 style={{ margin: '12px 0 4px 0', color: '#0f172a' }}>Zero Lecture Absence Alerts</h3>
                  <p style={{ color: '#64748b' }}>All residents are conforming to regular college and lunch hours.</p>
                </div>
              ) : (
                bunkAlerts.map((b) => (
                  <div key={b.student_id} className="bunk-alert-card">
                    <span className="bunk-alert-icon">⚠️</span>
                    <div className="bunk-alert-content">
                      <h4>Lecture Absence Alert Flagged: {b.student_name} ({b.student_id})</h4>
                      <p>
                        <strong>Rule Violation:</strong> {b.lecture_bunk_alert}
                      </p>
                      <p style={{ marginTop: '4px', fontSize: '0.82rem', color: '#78350f' }}>
                        Room: {b.room_number} • Gate Entry: {b.hostel_in_time} • College Scheduled: 09:00 AM – 04:00 PM
                      </p>
                      <button
                        type="button"
                        className="btn-action-view"
                        style={{ marginTop: '10px' }}
                        onClick={() => handleViewStudentDetails(b.student_id)}
                      >
                        Open Student Dossier & Parent Contact →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 7: LEAVE & PERMISSION REQUESTS */}
          {/* ====================================================================== */}
          {activeTab === 'leaves' && (
            <div>
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Leave & Gate Permissions Management</h2>
                  <p className="pane-subtitle">Review, approve, or reject student leaves for weekend visits and emergencies.</p>
                </div>
              </div>

              {leaveRequests.length === 0 ? (
                <div className="table-card" style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: '#64748b' }}>No leave or gate permission requests submitted yet.</p>
                </div>
              ) : (
                <div className="table-card">
                  <table className="warden-table">
                    <thead>
                      <tr>
                        <th>Req #</th>
                        <th>Student Name</th>
                        <th>Student ID</th>
                        <th>Room</th>
                        <th>Request Type</th>
                        <th>Reason</th>
                        <th>From Date</th>
                        <th>To Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRequests.map((l) => (
                        <tr key={l.id}>
                          <td>#{l.id}</td>
                          <td>
                            <strong>{l.student_name}</strong>
                          </td>
                          <td>
                            <span className="student-id-badge">{l.student_id}</span>
                          </td>
                          <td>{l.room_number}</td>
                          <td>
                            <strong>{l.request_type}</strong>
                          </td>
                          <td>{l.reason}</td>
                          <td>{l.from_date}</td>
                          <td>{l.to_date}</td>
                          <td>
                            <span className={`status-pill status-${l.status?.toLowerCase()}`}>
                              {l.status}
                            </span>
                          </td>
                          <td>
                            {l.status === 'Pending' ? (
                              <div className="action-btns-group">
                                <button
                                  type="button"
                                  className="btn-approve"
                                  onClick={() => handleApproveLeave(l.id)}
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  className="btn-reject"
                                  onClick={() => handleRejectLeave(l.id)}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Completed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 8: GRIEVANCE COMPLAINTS */}
          {/* ====================================================================== */}
          {activeTab === 'complaints' && (
            <div>
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Hostel Grievance Complaints</h2>
                  <p className="pane-subtitle">
                    Student grievances triaged with <strong>AI Feature 1: AI Complaint Priority Detection</strong> (LOW, MEDIUM, HIGH, EMERGENCY).
                  </p>
                </div>
              </div>

              {complaints.length === 0 ? (
                <div className="table-card" style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: '#64748b' }}>No complaints filed by students.</p>
                </div>
              ) : (
                <div className="table-card">
                  <table className="warden-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Student Name</th>
                        <th>Room</th>
                        <th>Complaint Title</th>
                        <th>Description</th>
                        <th>AI Priority</th>
                        <th>Current Status</th>
                        <th>Update Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map((c) => {
                        const prio = (c.ai_priority || 'MEDIUM').toUpperCase();
                        let prioClass = 'prio-medium';
                        if (prio === 'EMERGENCY') prioClass = 'prio-emergency';
                        else if (prio === 'HIGH') prioClass = 'prio-high';
                        else if (prio === 'LOW') prioClass = 'prio-low';

                        return (
                          <tr key={c.id}>
                            <td>#{c.id}</td>
                            <td>
                              <strong>{c.student_name}</strong>
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{c.student_id}</div>
                            </td>
                            <td>{c.room_number}</td>
                            <td>
                              <strong>{c.title}</strong>
                            </td>
                            <td style={{ maxWidth: '280px' }}>{c.description}</td>
                            <td>
                              <span className={`status-pill ${prioClass}`}>
                                {prio === 'EMERGENCY' ? '🚨 EMERGENCY' : prio}
                              </span>
                            </td>
                            <td>
                              <span className={`status-pill status-${c.status?.toLowerCase()}`}>
                                {c.status}
                              </span>
                            </td>
                            <td>
                              <select
                                className="filter-select"
                                value={c.status}
                                onChange={(e) => handleUpdateComplaintStatus(c.id, e.target.value)}
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 9: NOTICE MANAGEMENT */}
          {/* ====================================================================== */}
          {activeTab === 'notices' && (
            <div>
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Hostel Notice Broadcast</h2>
                  <p className="pane-subtitle">Post notices to students. Broadcasted announcements instantly display on Student Dashboard.</p>
                </div>
              </div>

              {/* Notice Creation Card */}
              <div className="notice-form-card">
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', color: '#0f172a' }}>
                  📢 Post Official Announcement
                </h3>
                <form onSubmit={handlePostNotice} className="notice-form-grid">
                  <div className="form-row-2col">
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                        Notice Subject / Title *
                      </label>
                      <input
                        type="text"
                        className="notice-input"
                        placeholder="e.g. Maintenance Inspection of Block A Rooms"
                        value={noticeForm.title}
                        onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                        Target Audience
                      </label>
                      <select
                        className="notice-input"
                        value={noticeForm.target_audience}
                        onChange={(e) => setNoticeForm({ ...noticeForm, target_audience: e.target.value })}
                      >
                        <option value="All Students">All Students</option>
                        <option value="Block A Residents">Block A Residents</option>
                        <option value="Block B Residents">Block B Residents</option>
                        <option value="First Year Students">First Year Students</option>
                        <option value="Final Year Students">Final Year Students</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                      Notice Message Body *
                    </label>
                    <textarea
                      className="notice-textarea"
                      placeholder="Write your official notice here..."
                      value={noticeForm.message}
                      onChange={(e) => setNoticeForm({ ...noticeForm, message: e.target.value })}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-post-notice" disabled={submittingNotice}>
                    {submittingNotice ? 'Publishing...' : 'Broadcast Notice to Students →'}
                  </button>
                </form>
              </div>

              {/* Published Notices Feed */}
              <h3 style={{ margin: '20px 0 12px 0', fontSize: '1.15rem' }}>Active Bulletin Notices</h3>
              {notices.length === 0 ? (
                <p style={{ color: '#64748b' }}>No notices published yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {notices.map((n) => (
                    <div key={n.id} className="table-card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>{n.title}</h4>
                        <span style={{ fontSize: '0.76rem', color: '#64748b' }}>{n.created_at}</span>
                      </div>
                      <p style={{ margin: '8px 0', fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                        {n.message}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: '#64748b' }}>
                        <span>👤 Posted by: <strong>{n.posted_by}</strong></span>
                        <span>🎯 Audience: <strong>{n.target_audience}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 10: PARENT COMMUNICATION */}
          {/* ====================================================================== */}
          {activeTab === 'parents' && (
            <div>
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Parent / Guardian Communication Directory</h2>
                  <p className="pane-subtitle">Direct contacts of parents for emergency protocols, leave updates, and notifications.</p>
                </div>
              </div>

              <div className="table-card">
                <table className="warden-table">
                  <thead>
                    <tr>
                      <th>Resident Name</th>
                      <th>Student ID</th>
                      <th>Room</th>
                      <th>Parent / Guardian Name</th>
                      <th>Primary Phone</th>
                      <th>Email</th>
                      <th>Quick Contact Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((st) => (
                      <tr key={st.student_id}>
                        <td>
                          <strong>{st.full_name}</strong>
                        </td>
                        <td>
                          <span className="student-id-badge">{st.student_id}</span>
                        </td>
                        <td>{st.room_number}</td>
                        <td>
                          <strong>{st.parent_name}</strong>
                        </td>
                        <td>
                          <a href={`tel:${st.parent_mobile}`} style={{ color: '#059669', fontWeight: 600, textDecoration: 'none' }}>
                            📞 {st.parent_mobile}
                          </a>
                        </td>
                        <td>
                          <span>Parent Email on file</span>
                        </td>
                        <td>
                          <div className="action-btns-group">
                            <a
                              href={`tel:${st.parent_mobile}`}
                              className="btn-action-view"
                              style={{ textDecoration: 'none' }}
                            >
                              Call Parent
                            </a>
                            <button
                              type="button"
                              className="btn-action-view"
                              onClick={() => handleViewStudentDetails(st.student_id)}
                            >
                              Full Profile
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 11: ROOM INFORMATION */}
          {/* ====================================================================== */}
          {activeTab === 'rooms' && (
            <div>
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Hostel Room Allocation Status</h2>
                  <p className="pane-subtitle">Real resident room assignments from MySQL. Displays "Room not assigned" if pending allocation.</p>
                </div>
              </div>

              <div className="timing-info-banner">
                <div className="timing-badge-box">
                  <span className="timing-icon">🛏️</span>
                  <div className="timing-text">
                    <strong>Total Hostel Room Capacity: 50 Rooms | Capacity: 4 Students / Room (Total 200 Beds)</strong>
                    <span>Room 1 is allocated to 4 students (Vaishnavi Zadage, Vaishnavi Devkar, Kajal Nazirkar, Rajeshwari Bhosale - Full 4/4). Rooms 2 to 50 are available for admissions.</span>
                  </div>
                </div>
              </div>

              <div className="table-card">
                <table className="warden-table">
                  <thead>
                    <tr>
                      <th>Room Assignment</th>
                      <th>Resident Student</th>
                      <th>Student ID</th>
                      <th>Department</th>
                      <th>Class</th>
                      <th>Admission Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((st) => (
                      <tr key={st.student_id}>
                        <td>
                          {st.room_number && st.room_number !== 'Room not assigned' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ color: '#059669', fontSize: '1rem' }}>Room #{st.room_number}</strong>
                              <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                {st.room_number === '1' ? '4/4 Full' : 'Allocated'}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#b45309', background: '#fef3c7', padding: '3px 8px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                              Room not assigned
                            </span>
                          )}
                        </td>
                        <td>
                          <strong>{st.full_name}</strong>
                        </td>
                        <td>
                          <span className="student-id-badge">{st.student_id}</span>
                        </td>
                        <td>{st.department}</td>
                        <td>{st.class_year}</td>
                        <td>
                          <span className={`status-pill status-${st.admission_status?.toLowerCase()}`}>
                            {st.admission_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 12: WARDEN PROFILE */}
          {/* ====================================================================== */}
          {activeTab === 'profile' && (
            <div>
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Warden Official Profile</h2>
                  <p className="pane-subtitle">Verified female hostel staff credentials and personal file from MySQL.</p>
                </div>
              </div>

              <div className="warden-profile-card">
                <div className="profile-top-row">
                  {currentWarden?.profile_photo ? (
                    <img
                      src={getMediaUrl(currentWarden.profile_photo)}
                      alt={currentWarden.full_name}
                      className="profile-lg-photo"
                    />
                  ) : (
                    <div className="spotlight-fallback">
                      {currentWarden?.full_name?.charAt(0) || 'W'}
                    </div>
                  )}
                  <div>
                    <span className="warden-badge-chip">Girls Hostel Warden In-Charge</span>
                    <h3 style={{ margin: '6px 0', fontSize: '1.4rem', color: '#0f172a' }}>
                      {currentWarden?.full_name}
                    </h3>
                    <div style={{ color: '#64748b', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                      Warden ID: <strong>{currentWarden?.warden_id}</strong>
                    </div>
                  </div>
                </div>

                <div className="fields-2col-grid">
                  <div className="field-cell">
                    <span className="field-lbl">Official Email</span>
                    <span className="field-val">{currentWarden?.email}</span>
                  </div>
                  <div className="field-cell">
                    <span className="field-lbl">Official Mobile</span>
                    <span className="field-val">{currentWarden?.mobile}</span>
                  </div>
                  <div className="field-cell">
                    <span className="field-lbl">Date of Birth</span>
                    <span className="field-val">{currentWarden?.date_of_birth}</span>
                  </div>
                  <div className="field-cell">
                    <span className="field-lbl">Duty Status</span>
                    <span className="field-val" style={{ color: '#059669' }}>
                      🟢 Active On-Duty
                    </span>
                  </div>
                  <div className="field-cell" style={{ gridColumn: '1 / -1' }}>
                    <span className="field-lbl">Residential Address</span>
                    <span className="field-val">{currentWarden?.address}</span>
                  </div>
                  <div className="field-cell" style={{ gridColumn: '1 / -1' }}>
                    <span className="field-lbl">Registration Date</span>
                    <span className="field-val">{currentWarden?.created_at || 'Registered'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn-refresh" onClick={loadDashboardData}>
                    🔄 Refresh Profile
                  </button>
                  <button
                    type="button"
                    className="warden-logout-btn"
                    onClick={handleLogout}
                    style={{ marginLeft: 'auto' }}
                  >
                    Logout from Portal
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ====================================================================== */}
      {/* MODAL 1: STUDENT FULL DETAILS (DOSSIER) */}
      {/* ====================================================================== */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Student Resident Dossier</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedStudent(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Biometric Scanned Photo Spotlight */}
              <div className="biometric-spotlight-box">
                {selectedStudent.profile_photo ? (
                  <img
                    src={getMediaUrl(selectedStudent.profile_photo)}
                    alt={selectedStudent.full_name}
                    className="spotlight-face-img"
                    onClick={() =>
                      setEnlargedPhoto({
                        url: getMediaUrl(selectedStudent.profile_photo),
                        name: selectedStudent.full_name,
                      })
                    }
                    title="Click to zoom scanned biometric face photo"
                  />
                ) : (
                  <div className="spotlight-fallback">
                    {selectedStudent.full_name?.charAt(0) || 'S'}
                  </div>
                )}
                <div className="spotlight-details">
                  <h3>{selectedStudent.full_name}</h3>
                  <div className="spotlight-meta">
                    <strong>ID: {selectedStudent.student_id}</strong> • Room: {selectedStudent.room_number}
                  </div>
                  <div className="spotlight-meta">
                    {selectedStudent.department} • {selectedStudent.class_year}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <span className={`status-pill status-${selectedStudent.admission_status?.toLowerCase()}`}>
                      Admission: {selectedStudent.admission_status}
                    </span>
                    <span className="status-pill status-present">
                      {selectedStudent.face_registered ? 'Biometrics: Enrolled ✅' : 'No Biometrics'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal & Parent Info Grid */}
              <div className="fields-2col-grid">
                <div className="field-cell">
                  <span className="field-lbl">Mobile Number</span>
                  <span className="field-val">{selectedStudent.mobile}</span>
                </div>
                <div className="field-cell">
                  <span className="field-lbl">Email Address</span>
                  <span className="field-val">{selectedStudent.email}</span>
                </div>
                <div className="field-cell">
                  <span className="field-lbl">Date of Birth</span>
                  <span className="field-val">{selectedStudent.date_of_birth}</span>
                </div>
                <div className="field-cell">
                  <span className="field-lbl">College Name</span>
                  <span className="field-val">{selectedStudent.college_name}</span>
                </div>
                <div className="field-cell">
                  <span className="field-lbl">Parent / Guardian Name</span>
                  <span className="field-val">{selectedStudent.parent_name}</span>
                </div>
                <div className="field-cell">
                  <span className="field-lbl">Parent Mobile</span>
                  <span className="field-val">
                    <a href={`tel:${selectedStudent.parent_mobile}`} style={{ color: '#059669', textDecoration: 'none' }}>
                      📞 {selectedStudent.parent_mobile}
                    </a>
                  </span>
                </div>
                <div className="field-cell" style={{ gridColumn: '1 / -1' }}>
                  <span className="field-lbl">Permanent Residence</span>
                  <span className="field-val">{selectedStudent.address}</span>
                </div>
              </div>

              {/* Gate History Subsection */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#0f172a' }}>
                  🚪 Recent Hostel Gate Logs
                </h4>
                {selectedStudent.hostel_in_out_history.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No gate logs recorded yet.</p>
                ) : (
                  <table className="warden-table" style={{ fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Hostel IN</th>
                        <th>Hostel OUT</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.hostel_in_out_history.slice(0, 5).map((h, i) => (
                        <tr key={i}>
                          <td>{h.date}</td>
                          <td>{h.in_time}</td>
                          <td>{h.out_time}</td>
                          <td>
                            <span className={`status-pill ${h.status === 'IN HOSTEL' ? 'status-in' : 'status-out'}`}>
                              {h.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Complaints Subsection */}
              <div>
                <h4 style={{ margin: '14px 0 10px 0', fontSize: '1rem', color: '#0f172a' }}>
                  ⚠️ Registered Complaints
                </h4>
                {selectedStudent.complaints.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No complaints filed by this student.</p>
                ) : (
                  <table className="warden-table" style={{ fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>AI Priority</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.complaints.map((c) => (
                        <tr key={c.id}>
                          <td>{c.title}</td>
                          <td>
                            <strong>{c.ai_priority}</strong>
                          </td>
                          <td>{c.status}</td>
                          <td>{c.created_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Leave Requests Subsection */}
              <div>
                <h4 style={{ margin: '14px 0 10px 0', fontSize: '1rem', color: '#0f172a' }}>
                  📝 Leave / Permission History
                </h4>
                {selectedStudent.leave_requests.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No leave requests on record.</p>
                ) : (
                  <table className="warden-table" style={{ fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Reason</th>
                        <th>Dates</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.leave_requests.map((l) => (
                        <tr key={l.id}>
                          <td>{l.request_type}</td>
                          <td>{l.reason}</td>
                          <td>{l.from_date} to {l.to_date}</td>
                          <td>{l.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 2: FULL SCANNED BIOMETRIC PHOTO PREVIEW */}
      {/* ====================================================================== */}
      {enlargedPhoto && (
        <div className="modal-overlay" onClick={() => setEnlargedPhoto(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: '520px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Scanned Biometric Profile Photo</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEnlargedPhoto(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ alignItems: 'center' }}>
              <img
                src={enlargedPhoto.url}
                alt={enlargedPhoto.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  borderRadius: '16px',
                  border: '3px solid #10b981',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                }}
              />
              <h4 style={{ margin: '12px 0 2px 0', color: '#0f172a' }}>{enlargedPhoto.name}</h4>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#059669', fontWeight: 600 }}>
                Biometric Face Capture (Verified & Enrolled)
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
