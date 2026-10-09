import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/useAuth';
import { api } from '../services/api';
import './AdminDashboardPage.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const getMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE}/${cleanPath}`;
};

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { currentAdmin, logout } = useAuth();

  // Active Tab: 'overview' | 'students' | 'admissions' | 'wardens' | 'hostel' | 'attendance' | 'complaints' | 'leaves' | 'notices' | 'reports' | 'profile'
  const [activeTab, setActiveTab] = useState('overview');

  // Real Database States
  const [stats, setStats] = useState({
    total_students: 0,
    total_wardens: 0,
    pending_admissions: 0,
    approved_admissions: 0,
    rejected_admissions: 0,
    total_complaints: 0,
    pending_complaints: 0,
    resolved_complaints: 0,
    total_leaves: 0,
    pending_leaves: 0,
    total_rooms: 50,
    occupied_rooms: 0,
    available_rooms: 50,
    room_allocation_available: false,
  });

  const [students, setStudents] = useState([]);
  const [wardens, setWardens] = useState([]);
  const [attendanceData, setAttendanceData] = useState({
    date: '',
    total_students: 0,
    present_count: 0,
    absent_count: 0,
    hostel_in_count: 0,
    hostel_out_count: 0,
    bunk_alerts_count: 0,
    records: [],
  });
  const [complaints, setComplaints] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [notices, setNotices] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState({ type: '', message: '' });
  const [searchStudent, setSearchStudent] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected Student Details Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Create Notice Modal
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    message: '',
    target_audience: 'All Students',
    priority: 'Normal',
  });
  const [submittingNotice, setSubmittingNotice] = useState(false);

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all real MySQL dashboard data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        studentsRes,
        wardensRes,
        attRes,
        complaintsRes,
        leavesRes,
        noticesRes,
      ] = await Promise.allSettled([
        api.getAdminStats(),
        api.getAllStudents(),
        api.getAllWardens(),
        api.getAdminAttendance(),
        api.getAdminComplaints(),
        api.getAdminLeaveRequests(),
        api.getNotices(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value);
      if (wardensRes.status === 'fulfilled') setWardens(wardensRes.value);
      if (attRes.status === 'fulfilled') setAttendanceData(attRes.value);
      if (complaintsRes.status === 'fulfilled') setComplaints(complaintsRes.value);
      if (leavesRes.status === 'fulfilled') setLeaveRequests(leavesRes.value);
      if (noticesRes.status === 'fulfilled') setNotices(noticesRes.value);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Notice auto-dismiss
  useEffect(() => {
    if (actionNotice.message) {
      const timer = setTimeout(() => setActionNotice({ type: '', message: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionNotice]);

  const handleLogout = async () => {
    await logout();
    navigate('/login/admin');
  };

  // View Student Full Details Modal
  const handleViewStudentDetails = async (studentId) => {
    setLoadingDetails(true);
    try {
      const details = await api.getStudentFullDetails(studentId);
      setSelectedStudent(details);
    } catch (err) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to fetch student details.' });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Approve Admission
  const handleApprove = async (studentId) => {
    try {
      const res = await api.approveAdmission(studentId);
      setActionNotice({ type: 'success', message: res.message });
      // Update local state
      setStudents((prev) =>
        prev.map((s) => (s.student_id === studentId ? { ...s, admission_status: 'APPROVED', hostel_status: 'Active' } : s))
      );
      if (selectedStudent && selectedStudent.student_id === studentId) {
        setSelectedStudent((prev) => ({ ...prev, admission_status: 'APPROVED', hostel_status: 'Active' }));
      }
      setStats((prev) => ({
        ...prev,
        pending_admissions: Math.max(0, prev.pending_admissions - 1),
        approved_admissions: prev.approved_admissions + 1,
      }));
    } catch (err) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to approve admission.' });
    }
  };

  // Reject Admission
  const handleReject = async (studentId) => {
    if (!window.confirm(`Are you sure you want to reject admission for student ${studentId}?`)) return;
    try {
      const res = await api.rejectAdmission(studentId);
      setActionNotice({ type: 'success', message: res.message });
      // Update local state
      setStudents((prev) =>
        prev.map((s) => (s.student_id === studentId ? { ...s, admission_status: 'REJECTED', hostel_status: 'Rejected' } : s))
      );
      if (selectedStudent && selectedStudent.student_id === studentId) {
        setSelectedStudent((prev) => ({ ...prev, admission_status: 'REJECTED', hostel_status: 'Rejected' }));
      }
      setStats((prev) => ({
        ...prev,
        pending_admissions: Math.max(0, prev.pending_admissions - 1),
        rejected_admissions: prev.rejected_admissions + 1,
      }));
    } catch (err) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to reject admission.' });
    }
  };

  // Update Complaint Status
  const handleComplaintStatus = async (complaintId, newStatus) => {
    try {
      const res = await api.updateComplaintStatus(complaintId, newStatus);
      setActionNotice({ type: 'success', message: res.message });
      setComplaints((prev) =>
        prev.map((c) => (c.id === complaintId ? { ...c, status: newStatus } : c))
      );
      // Refresh stats
      const updatedStats = await api.getAdminStats();
      setStats(updatedStats);
    } catch (err) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to update complaint status.' });
    }
  };

  // Update Leave Status
  const handleLeaveStatus = async (leaveId, newStatus) => {
    try {
      const res = await api.updateLeaveStatus(leaveId, newStatus);
      setActionNotice({ type: 'success', message: res.message });
      setLeaveRequests((prev) =>
        prev.map((l) => (l.id === leaveId ? { ...l, status: newStatus } : l))
      );
      const updatedStats = await api.getAdminStats();
      setStats(updatedStats);
    } catch (err) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to update leave status.' });
    }
  };

  // Create Notice
  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.message.trim()) return;

    setSubmittingNotice(true);
    try {
      const res = await api.createAdminNotice({
        title: noticeForm.title.trim(),
        message: noticeForm.message.trim(),
        target_audience: noticeForm.target_audience,
        priority: noticeForm.priority,
        posted_by: currentAdmin?.full_name ? `${currentAdmin.full_name} (Admin)` : 'Hostel Administration',
      });
      setNotices((prev) => [res, ...prev]);
      setNoticeForm({ title: '', message: '', target_audience: 'All Students', priority: 'Normal' });
      setShowNoticeModal(false);
      setActionNotice({ type: 'success', message: 'Notice posted successfully. It is now live on Student Dashboards!' });
    } catch (err) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to create notice.' });
    } finally {
      setSubmittingNotice(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const q = searchStudent.toLowerCase();
    const matchesSearch =
      s.full_name?.toLowerCase().includes(q) ||
      s.student_id?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : (s.admission_status || 'PENDING').toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingStudentsList = students.filter(
    (s) => (s.admission_status || 'PENDING').toUpperCase() === 'PENDING'
  );

  return (
    <div className="admin-portal-wrapper">
      {/* Top Banner Navigation Bar */}
      <header className="admin-portal-topbar">
        <div className="topbar-left">
          <div className="portal-shield-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ffffff" strokeWidth="2.3">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div>
            <h1 className="portal-app-title">Girls Hostel Central Administration</h1>
            <span className="portal-sub-badge">Authorized Master Console • Real-Time Database</span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="server-clock-badge">
            <span className="pulse-dot"></span>
            <span className="clock-val">{currentTime}</span>
          </div>

          <div className="admin-user-pill">
            {currentAdmin?.profile_photo ? (
              <img src={currentAdmin.profile_photo} alt="Admin" className="admin-pill-photo" />
            ) : (
              <div className="admin-pill-fallback">
                {currentAdmin?.full_name?.charAt(0) || 'A'}
              </div>
            )}
            <div className="admin-pill-text">
              <span className="admin-pill-name">{currentAdmin?.full_name || 'System Admin'}</span>
              <span className="admin-pill-role">Primary Administrator</span>
            </div>
          </div>

          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
            title="Log out from Admin portal"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="admin-portal-body">
        {/* Navigation Sidebar */}
        <nav className="admin-sidebar" aria-label="Admin navigation">
          <div className="sidebar-section-title">MANAGEMENT CONSOLE</div>
          <ul className="sidebar-nav-list">
            <li>
              <button
                type="button"
                className={`nav-item-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="9" />
                  <rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" />
                  <rect x="3" y="16" width="7" height="5" />
                </svg>
                <span>Dashboard Overview</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`nav-item-btn ${activeTab === 'students' ? 'active' : ''}`}
                onClick={() => setActiveTab('students')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Student Management</span>
                <span className="counter-pill">{students.length}</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`nav-item-btn ${activeTab === 'admissions' ? 'active' : ''}`}
                onClick={() => setActiveTab('admissions')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
                <span>Pending Admissions</span>
                {stats.pending_admissions > 0 && (
                  <span className="counter-pill alert-pill">{stats.pending_admissions}</span>
                )}
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`nav-item-btn ${activeTab === 'wardens' ? 'active' : ''}`}
                onClick={() => setActiveTab('wardens')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Warden Management</span>
                <span className="counter-pill">{wardens.length}</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`nav-item-btn ${activeTab === 'hostel' ? 'active' : ''}`}
                onClick={() => setActiveTab('hostel')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Hostel & Rooms</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`nav-item-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                onClick={() => setActiveTab('attendance')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Attendance Records</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`nav-item-btn ${activeTab === 'complaints' ? 'active' : ''}`}
                onClick={() => setActiveTab('complaints')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span>Grievance Complaints</span>
                {stats.pending_complaints > 0 && (
                  <span className="counter-pill warn-pill">{stats.pending_complaints}</span>
                )}
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`nav-item-btn ${activeTab === 'leaves' ? 'active' : ''}`}
                onClick={() => setActiveTab('leaves')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Leave & Permissions</span>
                {stats.pending_leaves > 0 && (
                  <span className="counter-pill">{stats.pending_leaves}</span>
                )}
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`nav-item-btn ${activeTab === 'notices' ? 'active' : ''}`}
                onClick={() => setActiveTab('notices')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span>Official Notices</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`nav-item-btn ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <span>Reports & Analytics</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`nav-item-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Admin Profile</span>
              </button>
            </li>
          </ul>

          <div className="sidebar-db-status">
            <div className="status-dot-live"></div>
            <span>MySQL Connected: <strong>hostel_db</strong></span>
          </div>
        </nav>

        {/* Content View Area */}
        <main className="admin-content-view">
          {/* Action Notification Banner */}
          {actionNotice.message && (
            <div className={`action-toast-banner ${actionNotice.type}`} role="alert">
              <span>{actionNotice.message}</span>
              <button type="button" onClick={() => setActionNotice({ type: '', message: '' })}>✕</button>
            </div>
          )}

          {/* ====================================================================== */}
          {/* 1. DASHBOARD OVERVIEW TAB */}
          {/* ====================================================================== */}
          {activeTab === 'overview' && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Real-Time Operational Overview</h2>
                  <p className="pane-subtitle">Live metrics and resident counters queried directly from MySQL database.</p>
                </div>
                <button type="button" className="btn-refresh" onClick={loadAllData}>
                  🔄 Refresh Data
                </button>
              </div>

              {/* Four Primary Statistics Cards */}
              <div className="admin-stats-grid">
                <div
                  className="admin-stat-card card-purple interactive"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setActiveTab('students');
                    setStatusFilter('ALL');
                    setSearchStudent('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveTab('students');
                      setStatusFilter('ALL');
                      setSearchStudent('');
                    }
                  }}
                  title="Click to view all registered students"
                >
                  <div className="stat-card-head">
                    <span className="stat-title">Total Students</span>
                    <span className="stat-badge">MySQL</span>
                  </div>
                  <div className="stat-number">{stats.total_students}</div>
                  <p className="stat-foot">Registered hostel residents</p>
                  <span className="stat-action-hint">View Students Directory →</span>
                </div>

                <div
                  className="admin-stat-card card-blue interactive"
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveTab('wardens')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setActiveTab('wardens');
                  }}
                  title="Click to view all wardens"
                >
                  <div className="stat-card-head">
                    <span className="stat-title">Total Wardens</span>
                    <span className="stat-badge">Staff</span>
                  </div>
                  <div className="stat-number">{stats.total_wardens}</div>
                  <p className="stat-foot">Hostel supervisors on duty</p>
                  <span className="stat-action-hint">View Wardens Directory →</span>
                </div>

                <div
                  className="admin-stat-card card-amber interactive"
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveTab('admissions')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setActiveTab('admissions');
                  }}
                  title="Click to view pending admissions"
                >
                  <div className="stat-card-head">
                    <span className="stat-title">Pending Admissions</span>
                    <span className="stat-badge alert">Requires Action</span>
                  </div>
                  <div className="stat-number">{stats.pending_admissions}</div>
                  <p className="stat-foot">Applications awaiting approval</p>
                  <span className="stat-action-hint">Manage Pending Admissions →</span>
                </div>

                <div
                  className="admin-stat-card card-green interactive"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setActiveTab('students');
                    setStatusFilter('APPROVED');
                    setSearchStudent('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveTab('students');
                      setStatusFilter('APPROVED');
                      setSearchStudent('');
                    }
                  }}
                  title="Click to view approved students"
                >
                  <div className="stat-card-head">
                    <span className="stat-title">Approved Admissions</span>
                    <span className="stat-badge success">Admitted</span>
                  </div>
                  <div className="stat-number">{stats.approved_admissions}</div>
                  <p className="stat-foot">Verified resident students</p>
                  <span className="stat-action-hint">View Approved Students →</span>
                </div>
              </div>

              {/* Secondary Metrics Row */}
              <div className="admin-secondary-stats-row">
                <div
                  className="sec-stat-box interactive"
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveTab('attendance')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setActiveTab('attendance');
                  }}
                  title="Click to view attendance records"
                >
                  <span className="sec-stat-lbl">Today's Present Attendance</span>
                  <span className="sec-stat-val text-success">
                    {attendanceData.present_count} / {stats.total_students}
                  </span>
                </div>
                <div
                  className="sec-stat-box interactive"
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveTab('complaints')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setActiveTab('complaints');
                  }}
                  title="Click to view grievance complaints"
                >
                  <span className="sec-stat-lbl">Grievance Complaints</span>
                  <span className="sec-stat-val text-warn">
                    {stats.pending_complaints} Pending / {stats.total_complaints} Total
                  </span>
                </div>
                <div
                  className="sec-stat-box interactive"
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveTab('leaves')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setActiveTab('leaves');
                  }}
                  title="Click to view leave requests"
                >
                  <span className="sec-stat-lbl">Leave Requests</span>
                  <span className="sec-stat-val">
                    {stats.pending_leaves} Pending Approval
                  </span>
                </div>
                <div
                  className="sec-stat-box interactive"
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveTab('hostel')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setActiveTab('hostel');
                  }}
                  title="Click to view hostel rooms"
                >
                  <span className="sec-stat-lbl">Hostel Room Capacity</span>
                  <span className="sec-stat-val">
                    {stats.occupied_rooms} Occupied / {stats.total_rooms} Rooms
                  </span>
                </div>
              </div>

              {/* Quick Actions & Pending Admissions Highlights */}
              <div className="overview-split-layout">
                <div className="content-card pending-spotlight-card">
                  <div className="card-title-bar">
                    <h3 className="section-head">⏳ Admissions Requiring Immediate Decision</h3>
                    <button
                      type="button"
                      className="link-action-btn"
                      onClick={() => setActiveTab('admissions')}
                    >
                      View All ({stats.pending_admissions}) →
                    </button>
                  </div>

                  {pendingStudentsList.length === 0 ? (
                    <div className="empty-alert-box">
                      <p>✅ All student admissions are reviewed. No pending applications.</p>
                    </div>
                  ) : (
                    <div className="quick-admissions-list">
                      {pendingStudentsList.slice(0, 4).map((st) => (
                        <div key={st.student_id} className="quick-admission-item">
                          <div className="adm-student-info">
                            <span className="adm-id">{st.student_id}</span>
                            <strong className="adm-name">{st.full_name}</strong>
                            <span className="adm-meta">{st.department} • {st.class_year}</span>
                          </div>
                          <div className="adm-action-buttons">
                            <button
                              type="button"
                              className="btn-quick-view"
                              onClick={() => handleViewStudentDetails(st.student_id)}
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              className="btn-quick-approve"
                              onClick={() => handleApprove(st.student_id)}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn-quick-reject"
                              onClick={() => handleReject(st.student_id)}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="content-card quick-links-card">
                  <h3 className="section-head">⚡ Fast Administrator Tools</h3>
                  <div className="fast-tools-grid">
                    <button
                      type="button"
                      className="tool-btn"
                      onClick={() => {
                        setActiveTab('notices');
                        setShowNoticeModal(true);
                      }}
                    >
                      <span className="tool-icon">📢</span>
                      <strong>Broadcast Notice</strong>
                      <small>Post bulletin to student portal</small>
                    </button>

                    <button
                      type="button"
                      className="tool-btn"
                      onClick={() => setActiveTab('attendance')}
                    >
                      <span className="tool-icon">📋</span>
                      <strong>Attendance Review</strong>
                      <small>Check bunk alerts & gate logs</small>
                    </button>

                    <button
                      type="button"
                      className="tool-btn"
                      onClick={() => setActiveTab('complaints')}
                    >
                      <span className="tool-icon">⚠️</span>
                      <strong>Manage Complaints</strong>
                      <small>Resolve AI-prioritized issues</small>
                    </button>

                    <button
                      type="button"
                      className="tool-btn"
                      onClick={() => setActiveTab('wardens')}
                    >
                      <span className="tool-icon">👩‍🏫</span>
                      <strong>View Wardens</strong>
                      <small>Check on-duty hostel wardens</small>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* 2. STUDENT MANAGEMENT TAB */}
          {/* ====================================================================== */}
          {activeTab === 'students' && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Student Management Directory</h2>
                  <p className="pane-subtitle">Live records of all registered Girls Hostel students from MySQL.</p>
                </div>
                <div className="filter-controls-row">
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search by ID, name, email..."
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                  />
                  <select
                    className="admin-filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending Only</option>
                    <option value="APPROVED">Approved Only</option>
                    <option value="REJECTED">Rejected Only</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <p className="loading-notice">Loading student records from MySQL database...</p>
              ) : filteredStudents.length === 0 ? (
                <div className="empty-table-card">
                  <p>No students registered yet matching filter.</p>
                </div>
              ) : (
                <div className="table-responsive-card">
                  <table className="portal-data-table">
                    <thead>
                      <tr>
                        <th>Photo</th>
                        <th>Student ID</th>
                        <th>Full Name</th>
                        <th>Email & Mobile</th>
                        <th>College & Department</th>
                        <th>Class / Year</th>
                        <th>Parent / Guardian</th>
                        <th>Admission Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((st) => {
                        const admStatus = (st.admission_status || 'PENDING').toUpperCase();
                        const photoUrl = getMediaUrl(st.face_image_path);

                        return (
                          <tr key={st.student_id}>
                            <td className="table-avatar-cell">
                              {photoUrl ? (
                                <img src={photoUrl} alt={st.full_name} className="table-student-photo" />
                              ) : (
                                <div className="table-student-fallback">
                                  {st.full_name?.charAt(0) || 'S'}
                                </div>
                              )}
                            </td>
                            <td>
                              <strong className="table-id-tag">{st.student_id}</strong>
                            </td>
                            <td>
                              <div className="cell-name-box">
                                <strong>{st.full_name}</strong>
                                <small>{st.room_number || 'Pending Allocation'}</small>
                              </div>
                            </td>
                            <td>
                              <div className="cell-contact-box">
                                <span>{st.email}</span>
                                <small>{st.mobile}</small>
                              </div>
                            </td>
                            <td>
                              <div className="cell-college-box">
                                <span>{st.department}</span>
                                <small>{st.college_name}</small>
                              </div>
                            </td>
                            <td>{st.class_year}</td>
                            <td>
                              <div className="cell-parent-box">
                                <span>{st.parent_name}</span>
                                <small>{st.parent_mobile}</small>
                              </div>
                            </td>
                            <td>
                              <span className={`status-tag status-${admStatus.toLowerCase()}`}>
                                {admStatus}
                              </span>
                            </td>
                            <td>
                              <div className="table-actions-cell">
                                <button
                                  type="button"
                                  className="btn-tbl-action btn-view"
                                  onClick={() => handleViewStudentDetails(st.student_id)}
                                  title="View full student record"
                                >
                                  View Details
                                </button>
                                {admStatus !== 'APPROVED' && (
                                  <button
                                    type="button"
                                    className="btn-tbl-action btn-approve"
                                    onClick={() => handleApprove(st.student_id)}
                                    title="Approve hostel admission"
                                  >
                                    Approve
                                  </button>
                                )}
                                {admStatus !== 'REJECTED' && (
                                  <button
                                    type="button"
                                    className="btn-tbl-action btn-reject"
                                    onClick={() => handleReject(st.student_id)}
                                    title="Reject hostel admission"
                                  >
                                    Reject
                                  </button>
                                )}
                              </div>
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
          {/* 3. PENDING ADMISSIONS TAB */}
          {/* ====================================================================== */}
          {activeTab === 'admissions' && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Pending Hostel Admissions ({pendingStudentsList.length})</h2>
                  <p className="pane-subtitle">Review new student admission applications and make enrollment decisions.</p>
                </div>
              </div>

              {pendingStudentsList.length === 0 ? (
                <div className="empty-table-card">
                  <p>No pending admissions. All student applications have been processed.</p>
                </div>
              ) : (
                <div className="pending-grid-cards">
                  {pendingStudentsList.map((st) => {
                    const photoUrl = getMediaUrl(st.face_image_path);
                    return (
                      <div key={st.student_id} className="admission-app-card">
                        <div className="app-card-head">
                          {photoUrl ? (
                            <img src={photoUrl} alt={st.full_name} className="app-photo" />
                          ) : (
                            <div className="app-photo-fallback">{st.full_name?.charAt(0) || 'S'}</div>
                          )}
                          <div>
                            <span className="app-id-pill">{st.student_id}</span>
                            <h3 className="app-student-name">{st.full_name}</h3>
                            <span className="app-dept-line">{st.department} • {st.class_year}</span>
                          </div>
                        </div>

                        <div className="app-details-body">
                          <div className="app-detail-row">
                            <span className="lbl">College:</span>
                            <span className="val">{st.college_name}</span>
                          </div>
                          <div className="app-detail-row">
                            <span className="lbl">Contact:</span>
                            <span className="val">{st.mobile} • {st.email}</span>
                          </div>
                          <div className="app-detail-row">
                            <span className="lbl">Parent:</span>
                            <span className="val">{st.parent_name} ({st.parent_mobile})</span>
                          </div>
                          <div className="app-detail-row">
                            <span className="lbl">Address:</span>
                            <span className="val">{st.address}</span>
                          </div>
                        </div>

                        <div className="app-actions-footer">
                          <button
                            type="button"
                            className="btn-full-details"
                            onClick={() => handleViewStudentDetails(st.student_id)}
                          >
                            Full Dossier
                          </button>
                          <button
                            type="button"
                            className="btn-adm-approve"
                            onClick={() => handleApprove(st.student_id)}
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            className="btn-adm-reject"
                            onClick={() => handleReject(st.student_id)}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ====================================================================== */}
          {/* 4. WARDEN MANAGEMENT TAB */}
          {/* ====================================================================== */}
          {activeTab === 'wardens' && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Hostel Warden Management</h2>
                  <p className="pane-subtitle">Supervisory staff registered in MySQL database.</p>
                </div>
                <span className="counter-pill">{wardens.length} Wardens</span>
              </div>

              {wardens.length === 0 ? (
                <div className="empty-table-card">
                  <p>No wardens registered yet.</p>
                </div>
              ) : (
                <div className="wardens-cards-grid">
                  {wardens.map((w) => {
                    const photoUrl = getMediaUrl(w.profile_photo);
                    return (
                      <div key={w.warden_id} className="warden-profile-card">
                        <div className="warden-card-top">
                          {photoUrl ? (
                            <img src={photoUrl} alt={w.full_name} className="warden-photo" />
                          ) : (
                            <div className="warden-photo-fallback">{w.full_name?.charAt(0) || 'W'}</div>
                          )}
                          <div className="warden-header-meta">
                            <span className="warden-id-chip">{w.warden_id}</span>
                            <h3 className="warden-name">{w.full_name}</h3>
                            <span className="warden-status-active">● Active Supervisory Staff</span>
                          </div>
                        </div>

                        <div className="warden-info-grid">
                          <div className="winfo-item">
                            <span className="wlbl">Email Address</span>
                            <span className="wval">{w.email}</span>
                          </div>
                          <div className="winfo-item">
                            <span className="wlbl">Mobile Number</span>
                            <span className="wval">{w.mobile}</span>
                          </div>
                          <div className="winfo-item">
                            <span className="wlbl">Date of Birth</span>
                            <span className="wval">{w.date_of_birth}</span>
                          </div>
                          <div className="winfo-item">
                            <span className="wlbl">Registered At</span>
                            <span className="wval">{w.created_at || 'Registered'}</span>
                          </div>
                          <div className="winfo-item full-col">
                            <span className="wlbl">Residential Address</span>
                            <span className="wval">{w.address}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ====================================================================== */}
          {/* 5. HOSTEL & ROOMS TAB */}
          {/* ====================================================================== */}
          {activeTab === 'hostel' && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Hostel Infrastructure & Room Capacity</h2>
                  <p className="pane-subtitle">Campus Blocks, Room Allocations, and Capacity Status.</p>
                </div>
              </div>

              <div className="hostel-stats-cards-row">
                <div className="hstat-card">
                  <span className="hlbl">Total Hostel Rooms</span>
                  <span className="hval">{stats.total_rooms}</span>
                  <small>Standard capacity</small>
                </div>
                <div className="hstat-card">
                  <span className="hlbl">Occupied Rooms</span>
                  <span className="hval">{stats.occupied_rooms}</span>
                  <small>Allocated to residents</small>
                </div>
                <div className="hstat-card">
                  <span className="hlbl">Available Rooms</span>
                  <span className="hval">{stats.available_rooms}</span>
                  <small>Vacant and ready</small>
                </div>
                <div className="hstat-card">
                  <span className="hlbl">Total Residents</span>
                  <span className="hval">{stats.total_students}</span>
                  <small>Registered students</small>
                </div>
              </div>

              <div className="content-card hostel-rooms-distribution-card">
                <div className="hostel-distribution-header">
                  <div>
                    <h3 className="distribution-title">Hostel Rooms Distribution (50 Rooms Total)</h3>
                    <p className="distribution-subtitle">
                      Hostel Block: <strong>Girls Hostel Campus Block A</strong> • Standard capacity: <strong>4 Students per room</strong> (Total: 200 beds)
                    </p>
                  </div>
                  <div className="distribution-badges">
                    <span className="badge-room1-full">
                      ✓ Room 1: Full (4/4 Students Allocated)
                    </span>
                    <span className="badge-rooms-free">
                      Rooms 2–50: Available (49 Rooms / 196 Beds)
                    </span>
                  </div>
                </div>

                {/* Room 1 Showcase Box */}
                <div className="room1-showcase-box">
                  <div className="room1-showcase-header">
                    <div>
                      <h4 className="room1-title">
                        🛏️ Room 1 — Active Residents (4 / 4 Occupants)
                      </h4>
                      <small className="room1-sub">Floor 1 • Wing A • Status: Fully Occupied</small>
                    </div>
                    <span className="room1-cap-pill">
                      MAX CAPACITY REACHED (4/4)
                    </span>
                  </div>

                  <div className="room1-residents-grid">
                    {students.filter(s => s.room_number === '1' || s.room_number === 'Room 1').map((st, idx) => (
                      <div key={st.student_id} className="resident-bed-card">
                        <div className="bed-header">
                          <span className="bed-tag">
                            Bed #{idx + 1}
                          </span>
                          <span className="bed-status">Active Resident</span>
                        </div>
                        <strong className="resident-name">{st.full_name}</strong>
                        <div className="resident-meta">
                          <div><strong>ID:</strong> {st.student_id}</div>
                          <div><strong>Dept:</strong> {st.department} ({st.class_year})</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 50 Rooms Grid Overview */}
                <div className="rooms-50-section">
                  <h4 className="rooms-50-title">
                    Overview of All 50 Rooms (Girls Hostel Block A)
                  </h4>
                  <div className="rooms-50-grid">
                    {Array.from({ length: 50 }, (_, i) => i + 1).map((rNum) => {
                      const isRoom1 = rNum === 1;
                      return (
                        <div
                          key={rNum}
                          className={`room-grid-tile ${isRoom1 ? 'room-tile-full' : 'room-tile-free'}`}
                        >
                          <strong className="room-tile-number">
                            R-{rNum}
                          </strong>
                          <span className="room-tile-status">
                            {isRoom1 ? '4/4 Full' : '0/4 Free'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* 6. ATTENDANCE RECORDS TAB */}
          {/* ====================================================================== */}
          {activeTab === 'attendance' && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Daily Attendance & Gate Control Log</h2>
                  <p className="pane-subtitle">
                    College hours: 09:00 AM – 04:00 PM | Hostel gate timings: 06:00 AM – 06:00 PM
                  </p>
                </div>
                <span className="att-date-badge">{attendanceData.date || 'Today'}</span>
              </div>

              <div className="att-summary-strip">
                <div className="att-pill pill-present">
                  <span>Present in College:</span> <strong>{attendanceData.present_count}</strong>
                </div>
                <div className="att-pill pill-absent">
                  <span>Absent:</span> <strong>{attendanceData.absent_count}</strong>
                </div>
                <div className="att-pill pill-in">
                  <span>Hostel IN Logged:</span> <strong>{attendanceData.hostel_in_count}</strong>
                </div>
                <div className="att-pill pill-out">
                  <span>Hostel OUT Logged:</span> <strong>{attendanceData.hostel_out_count}</strong>
                </div>
                {attendanceData.bunk_alerts_count > 0 && (
                  <div className="att-pill pill-bunk">
                    <span>Smart Lecture Bunk Alerts:</span> <strong>{attendanceData.bunk_alerts_count}</strong>
                  </div>
                )}
              </div>

              {attendanceData.records.length === 0 ? (
                <div className="empty-table-card">
                  <p>No attendance records logged for today yet.</p>
                </div>
              ) : (
                <div className="table-responsive-card">
                  <table className="portal-data-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Department</th>
                        <th>College Attendance</th>
                        <th>College Hours</th>
                        <th>Hostel IN</th>
                        <th>Hostel OUT</th>
                        <th>Lunch Break</th>
                        <th>Smart Alert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.records.map((r) => (
                        <tr key={r.student_id}>
                          <td><strong>{r.student_id}</strong></td>
                          <td>{r.student_name}</td>
                          <td>{r.department}</td>
                          <td>
                            <span className={`status-tag status-${r.college_status.toLowerCase()}`}>
                              {r.college_status}
                            </span>
                          </td>
                          <td>{r.college_in_time} – {r.college_out_time}</td>
                          <td>
                            <span className={r.in_time !== 'Not Logged' ? 'gate-logged' : 'gate-empty'}>
                              {r.in_time}
                            </span>
                          </td>
                          <td>
                            <span className={r.out_time !== 'Not Logged' ? 'gate-logged' : 'gate-empty'}>
                              {r.out_time}
                            </span>
                          </td>
                          <td>{r.lunch_break_status}</td>
                          <td>
                            {r.lecture_bunk_alert ? (
                              <span className="bunk-alert-tag" title={r.lecture_bunk_alert}>
                                ⚠️ Lecture Absence
                              </span>
                            ) : (
                              <span className="normal-tag">Normal</span>
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
          {/* 7. GRIEVANCE COMPLAINTS TAB */}
          {/* ====================================================================== */}
          {activeTab === 'complaints' && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Grievances & Maintenance Complaints ({complaints.length})</h2>
                  <p className="pane-subtitle">Student issues categorized with AI Priority Detection (Emergency / High / Medium / Low).</p>
                </div>
              </div>

              {complaints.length === 0 ? (
                <div className="empty-table-card">
                  <p>No student complaints submitted yet.</p>
                </div>
              ) : (
                <div className="complaints-admin-list">
                  {complaints.map((c) => (
                    <div key={c.id} className="complaint-admin-card">
                      <div className="cadmin-top">
                        <div className="cadmin-left-meta">
                          <span className={`priority-chip chip-${c.ai_priority?.toLowerCase()}`}>
                            AI: {c.ai_priority}
                          </span>
                          <span className="cadmin-student-ref">
                            {c.student_name} ({c.student_id}) • {c.department}
                          </span>
                        </div>
                        <div className="cadmin-status-control">
                          <label htmlFor={`comp-${c.id}`}>Status:</label>
                          <select
                            id={`comp-${c.id}`}
                            className={`status-dropdown dropdown-${c.status?.toLowerCase().replace(/\s+/g, '-')}`}
                            value={c.status}
                            onChange={(e) => handleComplaintStatus(c.id, e.target.value)}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </div>
                      </div>

                      <h3 className="cadmin-title">{c.title}</h3>
                      <p className="cadmin-desc">{c.description}</p>
                      <span className="cadmin-date">Submitted on: {c.created_at}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ====================================================================== */}
          {/* 8. LEAVE REQUESTS TAB */}
          {/* ====================================================================== */}
          {activeTab === 'leaves' && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Leave & Night-Out Permissions ({leaveRequests.length})</h2>
                  <p className="pane-subtitle">Student gate authorization requests for weekend home visits and leaves.</p>
                </div>
              </div>

              {leaveRequests.length === 0 ? (
                <div className="empty-table-card">
                  <p>No student leave requests submitted yet.</p>
                </div>
              ) : (
                <div className="leave-admin-grid">
                  {leaveRequests.map((l) => (
                    <div key={l.id} className="leave-admin-card">
                      <div className="leave-card-head">
                        <div>
                          <strong className="leave-student-name">{l.student_name} ({l.student_id})</strong>
                          <span className="leave-type-chip">{l.request_type}</span>
                        </div>
                        <span className={`status-tag status-${l.status?.toLowerCase()}`}>
                          {l.status}
                        </span>
                      </div>

                      <div className="leave-body">
                        <p><strong>Reason:</strong> {l.reason}</p>
                        <p><strong>Duration:</strong> From <em>{l.from_date}</em> to <em>{l.to_date}</em></p>
                        {l.parent_mobile && (
                          <p><strong>Parent Contact:</strong> {l.parent_mobile}</p>
                        )}
                        <small className="leave-submitted-date">Requested: {l.created_at}</small>
                      </div>

                      <div className="leave-actions-row">
                        <button
                          type="button"
                          className="btn-leave-approve"
                          onClick={() => handleLeaveStatus(l.id, 'Approved')}
                        >
                          ✓ Grant Permission
                        </button>
                        <button
                          type="button"
                          className="btn-leave-reject"
                          onClick={() => handleLeaveStatus(l.id, 'Rejected')}
                        >
                          ✕ Reject Permission
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ====================================================================== */}
          {/* 9. NOTICES MANAGEMENT TAB */}
          {/* ====================================================================== */}
          {activeTab === 'notices' && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Hostel Bulletins & Notices ({notices.length})</h2>
                  <p className="pane-subtitle">Post official administrative announcements to student and staff portals.</p>
                </div>
                <button
                  type="button"
                  className="btn-primary-action"
                  onClick={() => setShowNoticeModal(true)}
                >
                  + Post New Notice
                </button>
              </div>

              {notices.length === 0 ? (
                <div className="empty-table-card">
                  <p>No notices posted yet. Click "+ Post New Notice" to broadcast announcements.</p>
                </div>
              ) : (
                <div className="notices-admin-grid">
                  {notices.map((n) => (
                    <div key={n.id} className="notice-admin-card">
                      <div className="ncard-head">
                        <h3 className="ncard-title">{n.title}</h3>
                        <div className="ncard-chips">
                          <span className="audience-pill">{n.target_audience || 'All Students'}</span>
                          <span className="priority-pill">{n.priority}</span>
                        </div>
                      </div>
                      <p className="ncard-msg">{n.message}</p>
                      <div className="ncard-footer">
                        <span>Posted by: {n.posted_by}</span>
                        <span>{n.created_at}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ====================================================================== */}
          {/* 10. REPORTS & ANALYTICS TAB */}
          {/* ====================================================================== */}
          {activeTab === 'reports' && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Hostel Performance Reports & Analytics</h2>
                  <p className="pane-subtitle">Database-driven summaries computed directly from MySQL records.</p>
                </div>
              </div>

              <div className="reports-metrics-grid">
                <div className="report-card">
                  <h3>Admission Funnel</h3>
                  <div className="funnel-metric-row">
                    <span>Approved Residents</span>
                    <strong>{stats.approved_admissions}</strong>
                  </div>
                  <div className="funnel-metric-row">
                    <span>Pending Decisions</span>
                    <strong>{stats.pending_admissions}</strong>
                  </div>
                  <div className="funnel-metric-row">
                    <span>Rejected</span>
                    <strong>{stats.rejected_admissions}</strong>
                  </div>
                  <div className="funnel-metric-row total">
                    <span>Total Applicants</span>
                    <strong>{stats.total_students}</strong>
                  </div>
                </div>

                <div className="report-card">
                  <h3>Attendance Health</h3>
                  <div className="funnel-metric-row">
                    <span>Total Residents</span>
                    <strong>{stats.total_students}</strong>
                  </div>
                  <div className="funnel-metric-row">
                    <span>Present in College</span>
                    <strong>{attendanceData.present_count}</strong>
                  </div>
                  <div className="funnel-metric-row">
                    <span>Lecture Bunk Warnings</span>
                    <strong>{attendanceData.bunk_alerts_count}</strong>
                  </div>
                  <div className="funnel-metric-row total">
                    <span>Daily Attendance Rate</span>
                    <strong>
                      {stats.total_students > 0
                        ? `${Math.round((attendanceData.present_count / stats.total_students) * 100)}%`
                        : 'N/A'}
                    </strong>
                  </div>
                </div>

                <div className="report-card">
                  <h3>Grievance Resolution</h3>
                  <div className="funnel-metric-row">
                    <span>Resolved Complaints</span>
                    <strong>{stats.resolved_complaints}</strong>
                  </div>
                  <div className="funnel-metric-row">
                    <span>Pending Review</span>
                    <strong>{stats.pending_complaints}</strong>
                  </div>
                  <div className="funnel-metric-row total">
                    <span>Total Grievances</span>
                    <strong>{stats.total_complaints}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* 11. ADMIN PROFILE TAB */}
          {/* ====================================================================== */}
          {activeTab === 'profile' && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h2 className="pane-title">Administrator Profile & Security</h2>
                  <p className="pane-subtitle">Authorized administrator credentials and session metadata.</p>
                </div>
              </div>

              <div className="content-card profile-dossier-card">
                <div className="profile-dossier-header">
                  {currentAdmin?.profile_photo ? (
                    <img src={currentAdmin.profile_photo} alt="Admin" className="dossier-photo" />
                  ) : (
                    <div className="dossier-photo-fallback">
                      {currentAdmin?.full_name?.charAt(0) || 'A'}
                    </div>
                  )}
                  <div>
                    <span className="dossier-badge">PRIMARY SYSTEM ADMINISTRATOR</span>
                    <h2 className="dossier-name">{currentAdmin?.full_name || 'System Admin'}</h2>
                    <p className="dossier-email">{currentAdmin?.email}</p>
                  </div>
                </div>

                <div className="dossier-grid">
                  <div className="dossier-item">
                    <span className="lbl">Full Name</span>
                    <span className="val">{currentAdmin?.full_name}</span>
                  </div>
                  <div className="dossier-item">
                    <span className="lbl">Official Email</span>
                    <span className="val">{currentAdmin?.email}</span>
                  </div>
                  <div className="dossier-item">
                    <span className="lbl">Contact Phone</span>
                    <span className="val">{currentAdmin?.phone || 'Not configured'}</span>
                  </div>
                  <div className="dossier-item">
                    <span className="lbl">System Role</span>
                    <span className="val">Authorized Master Admin</span>
                  </div>
                  <div className="dossier-item">
                    <span className="lbl">Authentication Type</span>
                    <span className="val">JWT Bearer (HS256)</span>
                  </div>
                  <div className="dossier-item">
                    <span className="lbl">Database Connection</span>
                    <span className="val">MySQL hostel_db (Active)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ====================================================================== */}
      {/* MODAL: COMPLETE STUDENT DETAILS (VIEW DETAILS) */}
      {/* ====================================================================== */}
      {selectedStudent && (
        <div className="admin-modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="modal-header-meta">
                <span className="modal-id-pill">{selectedStudent.student_id}</span>
                <h3 className="modal-title">Student Dossier: {selectedStudent.full_name}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedStudent(null)}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="student-dossier-top">
                {selectedStudent.face_image_path ? (
                  <img
                    src={getMediaUrl(selectedStudent.face_image_path)}
                    alt={selectedStudent.full_name}
                    className="dossier-student-img"
                  />
                ) : (
                  <div className="dossier-student-fallback">
                    {selectedStudent.full_name?.charAt(0) || 'S'}
                  </div>
                )}
                <div>
                  <h4 className="dossier-student-name">{selectedStudent.full_name}</h4>
                  <p className="dossier-student-dept">
                    {selectedStudent.department} • {selectedStudent.class_year}
                  </p>
                  <p className="dossier-student-college">{selectedStudent.college_name}</p>
                  <div className="dossier-badge-row">
                    <span className={`status-tag status-${(selectedStudent.admission_status || 'PENDING').toLowerCase()}`}>
                      Admission: {selectedStudent.admission_status || 'PENDING'}
                    </span>
                    <span className="status-tag status-present">
                      {selectedStudent.face_registered ? 'Biometrics: Enrolled ✅' : 'No Face'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="dossier-field-grid">
                <div className="dfield-box">
                  <span className="dlbl">Student ID</span>
                  <span className="dval highlight">{selectedStudent.student_id}</span>
                </div>
                <div className="dfield-box">
                  <span className="dlbl">Date of Birth</span>
                  <span className="dval">{selectedStudent.date_of_birth}</span>
                </div>
                <div className="dfield-box">
                  <span className="dlbl">Student Mobile</span>
                  <span className="dval">{selectedStudent.mobile}</span>
                </div>
                <div className="dfield-box">
                  <span className="dlbl">Student Email</span>
                  <span className="dval">{selectedStudent.email}</span>
                </div>
                <div className="dfield-box">
                  <span className="dlbl">Hostel / Wing</span>
                  <span className="dval">{selectedStudent.hostel_name} ({selectedStudent.wing})</span>
                </div>
                <div className="dfield-box">
                  <span className="dlbl">Room Number</span>
                  <span className="dval">{selectedStudent.room_number}</span>
                </div>
                <div className="dfield-box">
                  <span className="dlbl">Parent / Guardian Name</span>
                  <span className="dval">{selectedStudent.parent_name}</span>
                </div>
                <div className="dfield-box">
                  <span className="dlbl">Parent Mobile</span>
                  <span className="dval">{selectedStudent.parent_mobile}</span>
                </div>
                {selectedStudent.parent_email && (
                  <div className="dfield-box">
                    <span className="dlbl">Parent Email</span>
                    <span className="dval">{selectedStudent.parent_email}</span>
                  </div>
                )}
                <div className="dfield-box full-span">
                  <span className="dlbl">Permanent Residential Address</span>
                  <span className="dval">{selectedStudent.address}</span>
                </div>
                <div className="dfield-box full-span">
                  <span className="dlbl">Registration Date</span>
                  <span className="dval">{selectedStudent.created_at || 'Registered'}</span>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setSelectedStudent(null)}
              >
                Close Dossier
              </button>
              {(selectedStudent.admission_status || 'PENDING').toUpperCase() !== 'APPROVED' && (
                <button
                  type="button"
                  className="btn-modal-approve"
                  onClick={() => handleApprove(selectedStudent.student_id)}
                >
                  ✓ Approve Admission
                </button>
              )}
              {(selectedStudent.admission_status || 'PENDING').toUpperCase() !== 'REJECTED' && (
                <button
                  type="button"
                  className="btn-modal-reject"
                  onClick={() => handleReject(selectedStudent.student_id)}
                >
                  ✕ Reject Admission
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL: POST NEW NOTICE */}
      {/* ====================================================================== */}
      {showNoticeModal && (
        <div className="admin-modal-overlay" onClick={() => setShowNoticeModal(false)}>
          <div className="admin-modal-box notice-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="modal-title">Broadcast Official Notice</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowNoticeModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNotice}>
              <div className="admin-modal-body">
                <div className="form-group-modal">
                  <label htmlFor="noticeTitle">Notice Title *</label>
                  <input
                    type="text"
                    id="noticeTitle"
                    required
                    placeholder="e.g. Annual Hostel Maintenance Schedule"
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  />
                </div>

                <div className="form-row-two">
                  <div className="form-group-modal">
                    <label htmlFor="targetAudience">Target Audience *</label>
                    <select
                      id="targetAudience"
                      value={noticeForm.target_audience}
                      onChange={(e) => setNoticeForm({ ...noticeForm, target_audience: e.target.value })}
                    >
                      <option value="All Students">All Students</option>
                      <option value="Students">Students</option>
                      <option value="Wardens">Wardens</option>
                      <option value="College Staff">College Staff</option>
                      <option value="Parents">Parents</option>
                    </select>
                  </div>

                  <div className="form-group-modal">
                    <label htmlFor="noticePriority">Priority Level *</label>
                    <select
                      id="noticePriority"
                      value={noticeForm.priority}
                      onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Important">Important</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-modal">
                  <label htmlFor="noticeMessage">Notice Message *</label>
                  <textarea
                    id="noticeMessage"
                    rows="4"
                    required
                    placeholder="Write the full announcement details..."
                    value={noticeForm.message}
                    onChange={(e) => setNoticeForm({ ...noticeForm, message: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setShowNoticeModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-approve"
                  disabled={submittingNotice}
                >
                  {submittingNotice ? 'Broadcasting...' : '📢 Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
