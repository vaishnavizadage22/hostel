import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { StaffAvatar } from '../components/RoleAvatars';
import { api } from '../services/api';
import './StaffDashboardPage.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const getMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE}/${cleanPath}`;
};

export const StaffDashboardPage = () => {
  const navigate = useNavigate();

  // Navigation tab
  const [activeTab, setActiveTab] = useState('overview');

  // Logged in staff profile
  const [currentStaff, setCurrentStaff] = useState(() => {
    try {
      const saved = localStorage.getItem('staff_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Real Database States
  const [stats, setStats] = useState({
    total_students: 0,
    present_today: 0,
    absent_today: 0,
    late_today: 0,
    possible_lecture_alerts: 0,
  });

  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [lectureAlerts, setLectureAlerts] = useState([]);
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [notices, setNotices] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState({ type: '', message: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal State
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all Real MySQL Staff Data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        profileRes,
        statsRes,
        studentsRes,
        attRes,
        alertsRes,
        reportRes,
        noticesRes,
      ] = await Promise.allSettled([
        api.getStaffProfile(),
        api.getStaffStats(),
        api.getStaffStudents(),
        api.getStaffAttendance({ date: selectedDate, department: selectedDept, class_year: selectedClass }),
        api.getStaffLectureAlerts(),
        api.getStaffAttendanceReport(),
        api.getStaffNotices(),
      ]);

      if (profileRes.status === 'fulfilled') {
        setCurrentStaff(profileRes.value);
        localStorage.setItem('staff_data', JSON.stringify(profileRes.value));
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value);
      if (attRes.status === 'fulfilled') setAttendanceRecords(attRes.value);
      if (alertsRes.status === 'fulfilled') setLectureAlerts(alertsRes.value);
      if (reportRes.status === 'fulfilled') setAttendanceReport(reportRes.value);
      if (noticesRes.status === 'fulfilled') setNotices(noticesRes.value);
    } catch (err) {
      console.error('Error fetching college staff data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedDept, selectedClass]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Filter Attendance Handler
  const handleReloadAttendance = async (overrideDate, overrideDept, overrideClass) => {
    const d = overrideDate !== undefined ? overrideDate : selectedDate;
    const dept = overrideDept !== undefined ? overrideDept : selectedDept;
    const cls = overrideClass !== undefined ? overrideClass : selectedClass;

    try {
      const recs = await api.getStaffAttendance({
        date: d,
        department: dept,
        class_year: cls,
      });
      setAttendanceRecords(recs);
    } catch (err) {
      console.error('Failed to filter attendance:', err);
    }
  };

  // Quick Attendance Marking Action
  const handleMarkAttendance = async (studentId, statusValue) => {
    try {
      const updated = await api.updateStaffAttendance({
        student_id: studentId,
        date: selectedDate,
        college_status: statusValue,
      });

      // Update in local records state
      setAttendanceRecords((prev) =>
        prev.map((r) => (r.student_id === studentId ? { ...r, ...updated } : r))
      );

      setActionNotice({
        type: 'success',
        message: `Attendance for ${updated.student_name} (${studentId}) updated to ${statusValue}.`,
      });

      // Refresh stats & alerts silently
      api.getStaffStats().then(setStats).catch(() => {});
      api.getStaffLectureAlerts().then(setLectureAlerts).catch(() => {});
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to update attendance status.',
      });
    }
  };

  // View Student Academic Dossier
  const handleViewStudentDetails = async (studentId) => {
    setLoadingDetails(true);
    try {
      const details = await api.getStaffStudentDetails(studentId);
      setSelectedStudentDetails(details);
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to load student academic details.',
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await api.logoutStaff();
    } catch {
      // ignore
    }
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_data');
    navigate('/login/staff', { replace: true });
  };

  // Filtered Students for Directory
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.full_name?.toLowerCase().includes(q) ||
      s.student_id?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q) ||
      s.class_year?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (selectedDept !== 'ALL' && !s.department?.toLowerCase().includes(selectedDept.toLowerCase())) return false;
    if (selectedClass !== 'ALL' && !s.class_year?.toLowerCase().includes(selectedClass.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="staff-portal-wrapper">
      {/* Top Header */}
      <header className="staff-header-banner">
        <div className="staff-header-content">
          <div className="staff-brand-box">
            <div className="staff-header-avatar-circle">
              {currentStaff?.profile_photo ? (
                <img
                  src={getMediaUrl(currentStaff.profile_photo)}
                  alt="Staff"
                  className="staff-avatar-mini"
                />
              ) : (
                <div className="staff-avatar-placeholder">S</div>
              )}
            </div>
            <div>
              <div className="staff-role-pill-header">College Staff Academic Portal</div>
              <h1 className="staff-title-text">
                {currentStaff?.full_name || 'College Faculty'}
              </h1>
              <div className="staff-submeta-text">
                <span>Staff ID: <strong>{currentStaff?.staff_id || 'STF-FACULTY'}</strong></span>
                <span className="dot-divider">•</span>
                <span>Email: {currentStaff?.email}</span>
              </div>
            </div>
          </div>

          <div className="staff-header-actions">
            <div className="staff-live-clock-badge">
              <span className="clock-pulse" />
              <span>{currentTime}</span>
              <span className="college-hours-pill">Lectures: 09:00 AM – 04:00 PM</span>
            </div>

            <button
              type="button"
              className="staff-logout-btn"
              onClick={handleLogout}
              title="Logout from College Staff portal"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Action Notification Toast */}
      {actionNotice.message && (
        <div className={`staff-notice-banner ${actionNotice.type}`} role="alert">
          <span>{actionNotice.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{actionNotice.message}</span>
          <button
            type="button"
            className="notice-close-btn"
            onClick={() => setActionNotice({ type: '', message: '' })}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="staff-portal-body">
        {/* Navigation Sidebar */}
        <aside className="staff-nav-sidebar">
          <nav className="staff-nav-menu">
            <button
              type="button"
              className={`staff-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Overview & Stats</span>
            </button>

            <button
              type="button"
              className={`staff-nav-tab ${activeTab === 'attendance' ? 'active' : ''}`}
              onClick={() => setActiveTab('attendance')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span>Class Attendance</span>
              <span className="tab-pill live-pill">{stats.present_today} Present</span>
            </button>

            <button
              type="button"
              className={`staff-nav-tab ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Student Directory</span>
              <span className="tab-pill">{stats.total_students}</span>
            </button>

            <button
              type="button"
              className={`staff-nav-tab ${activeTab === 'lecture_alerts' ? 'active' : ''}`}
              onClick={() => setActiveTab('lecture_alerts')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Lecture Bunk Alerts</span>
              {stats.possible_lecture_alerts > 0 && (
                <span className="tab-pill alert-pill">{stats.possible_lecture_alerts}</span>
              )}
            </button>

            <button
              type="button"
              className={`staff-nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Attendance Reports</span>
            </button>

            <button
              type="button"
              className={`staff-nav-tab ${activeTab === 'notices' ? 'active' : ''}`}
              onClick={() => setActiveTab('notices')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>Notices (Read-Only)</span>
            </button>

            <button
              type="button"
              className={`staff-nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="7" r="4" />
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              </svg>
              <span>Staff Profile</span>
            </button>
          </nav>
        </aside>

        {/* Content Pane */}
        <main className="staff-main-pane">
          {/* ====================================================================== */}
          {/* TAB 1: OVERVIEW & REAL STATS */}
          {/* ====================================================================== */}
          {activeTab === 'overview' && (
            <div className="staff-tab-view">
              <div className="staff-section-header">
                <div>
                  <h2 className="section-heading">College Academic Overview</h2>
                  <p className="section-subheading">
                    Real-time academic lecture presence and student statistics from MySQL database.
                  </p>
                </div>
                <button
                  type="button"
                  className="staff-btn-refresh"
                  onClick={loadDashboardData}
                  disabled={loading}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  <span>Sync MySQL Data</span>
                </button>
              </div>

              {/* Real Metric Cards Grid */}
              <div className="staff-metrics-grid">
                <div
                  className="staff-stat-card card-total"
                  onClick={() => setActiveTab('students')}
                >
                  <div className="stat-card-top">
                    <span className="stat-icon-wrap icon-purple">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                    </span>
                    <span className="stat-badge">Roster</span>
                  </div>
                  <div className="stat-value">{stats.total_students}</div>
                  <div className="stat-title">Total Registered Students</div>
                  <div className="stat-hint">Enrolled resident female students</div>
                </div>

                <div
                  className="staff-stat-card card-present"
                  onClick={() => setActiveTab('attendance')}
                >
                  <div className="stat-card-top">
                    <span className="stat-icon-wrap icon-green">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="stat-badge badge-green">09:00 AM – 04:00 PM</span>
                  </div>
                  <div className="stat-value">{stats.present_today}</div>
                  <div className="stat-title">Present Today</div>
                  <div className="stat-hint">Attending lectures today</div>
                </div>

                <div
                  className="staff-stat-card card-absent"
                  onClick={() => setActiveTab('attendance')}
                >
                  <div className="stat-card-top">
                    <span className="stat-icon-wrap icon-red">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </span>
                    <span className="stat-badge badge-red">Unreported</span>
                  </div>
                  <div className="stat-value">{stats.absent_today}</div>
                  <div className="stat-title">Absent Today</div>
                  <div className="stat-hint">Not marked in college lectures</div>
                </div>

                <div
                  className="staff-stat-card card-late"
                  onClick={() => setActiveTab('attendance')}
                >
                  <div className="stat-card-top">
                    <span className="stat-icon-wrap icon-amber">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </span>
                    <span className="stat-badge badge-amber">After 09:15 AM</span>
                  </div>
                  <div className="stat-value">{stats.late_today}</div>
                  <div className="stat-title">Late Today</div>
                  <div className="stat-hint">Arrived after scheduled bell</div>
                </div>

                <div
                  className="staff-stat-card card-alerts"
                  onClick={() => setActiveTab('lecture_alerts')}
                >
                  <div className="stat-card-top">
                    <span className="stat-icon-wrap icon-alert">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </span>
                    <span className="stat-badge badge-purple">Rule-Based</span>
                  </div>
                  <div className="stat-value">{stats.possible_lecture_alerts}</div>
                  <div className="stat-title">Possible Lecture Alerts</div>
                  <div className="stat-hint">Absent with in-hostel gate status</div>
                </div>
              </div>

              {/* College Protocol Banner */}
              <div className="staff-protocol-banner">
                <div className="protocol-icon">🏛️</div>
                <div className="protocol-text">
                  <h3>College Academic Timing Protocol</h3>
                  <p>
                    Official lectures are scheduled from <strong>09:00 AM – 04:00 PM</strong> with Lunch Break from <strong>11:00 AM – 11:35 AM</strong>.
                    Students residing in Girls Hostel must report to lecture halls before 09:00 AM.
                    Attendance records are securely synced with MySQL.
                  </p>
                </div>
                <div className="protocol-actions">
                  <button
                    type="button"
                    className="staff-action-pill"
                    onClick={() => setActiveTab('attendance')}
                  >
                    Open Attendance Sheet →
                  </button>
                </div>
              </div>

              {/* Quick Lecture Alerts Highlight */}
              {lectureAlerts.length > 0 && (
                <div className="staff-alert-spotlight">
                  <div className="spotlight-header">
                    <span className="spotlight-icon">⚠️</span>
                    <div>
                      <h4>Rule-Based Lecture Absence Alerts ({lectureAlerts.length})</h4>
                      <p>
                        The following students are marked absent or missing college entry, yet hostel biometric gate records indicate they are physically inside hostel premises or did not arrive.
                      </p>
                    </div>
                  </div>
                  <div className="spotlight-list">
                    {lectureAlerts.slice(0, 3).map((al) => (
                      <div key={al.student_id} className="spotlight-item">
                        <div>
                          <strong>{al.student_name} ({al.student_id})</strong>
                          <span className="spotlight-meta">
                            {al.department} • Room: {al.room_number} • Gate: {al.hostel_status}
                          </span>
                          <span className="spotlight-reason">{al.alert_reason}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-resolve-alert"
                          onClick={() => handleMarkAttendance(al.student_id, 'Present')}
                        >
                          Mark Present
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 2: STUDENT ATTENDANCE (VIEW, FILTER, MARK/UPDATE) */}
          {/* ====================================================================== */}
          {activeTab === 'attendance' && (
            <div className="staff-tab-view">
              <div className="staff-section-header">
                <div>
                  <h2 className="section-heading">Student Lecture Attendance</h2>
                  <p className="section-subheading">
                    College hours: 09:00 AM – 04:00 PM. Filter by Department, Class/Year, and Date to mark or update attendance.
                  </p>
                </div>
                <div className="header-badge-timing">
                  <span>Class Hours: 09:00 AM – 04:00 PM</span>
                </div>
              </div>

              {/* Filter Controls Row */}
              <div className="staff-filters-card">
                <div className="filter-item">
                  <label htmlFor="filterDate">Select Date</label>
                  <input
                    type="date"
                    id="filterDate"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      handleReloadAttendance(e.target.value, selectedDept, selectedClass);
                    }}
                  />
                </div>

                <div className="filter-item">
                  <label htmlFor="filterDept">Department</label>
                  <select
                    id="filterDept"
                    value={selectedDept}
                    onChange={(e) => {
                      setSelectedDept(e.target.value);
                      handleReloadAttendance(selectedDate, e.target.value, selectedClass);
                    }}
                  >
                    <option value="ALL">All Departments</option>
                    <option value="Computer">Computer Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics & Telecomm</option>
                    <option value="Mechanical">Mechanical Engineering</option>
                    <option value="Civil">Civil Engineering</option>
                  </select>
                </div>

                <div className="filter-item">
                  <label htmlFor="filterClass">Class / Year</label>
                  <select
                    id="filterClass"
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      handleReloadAttendance(selectedDate, selectedDept, e.target.value);
                    }}
                  >
                    <option value="ALL">All Classes / Years</option>
                    <option value="First Year">First Year (FE)</option>
                    <option value="Second Year">Second Year (SE)</option>
                    <option value="Third Year">Third Year (TE)</option>
                    <option value="Final Year">Final Year (BE)</option>
                  </select>
                </div>

                <div className="filter-item filter-search-item">
                  <label htmlFor="filterSearch">Search Student</label>
                  <input
                    type="text"
                    id="filterSearch"
                    placeholder="Search by Name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Attendance Table */}
              {loading ? (
                <div className="staff-empty-card">
                  <p>Loading real attendance data from MySQL...</p>
                </div>
              ) : attendanceRecords.length === 0 ? (
                <div className="staff-empty-card">
                  <p>No students found matching current filters.</p>
                </div>
              ) : (
                <div className="staff-table-card">
                  <table className="staff-table">
                    <thead>
                      <tr>
                        <th>Photo</th>
                        <th>Student ID</th>
                        <th>Full Name</th>
                        <th>Department</th>
                        <th>Class / Year</th>
                        <th>Date</th>
                        <th>College IN</th>
                        <th>College OUT</th>
                        <th>Attendance Status</th>
                        <th>Actions (Mark Attendance)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords
                        .filter((r) => {
                          if (!searchQuery.trim()) return true;
                          const q = searchQuery.toLowerCase();
                          return (
                            r.student_name?.toLowerCase().includes(q) ||
                            r.student_id?.toLowerCase().includes(q)
                          );
                        })
                        .map((rec) => {
                          const photoUrl = getMediaUrl(rec.profile_photo);
                          const isPresent = rec.college_status === 'Present';
                          const isLate = rec.college_status === 'Late';
                          const isAbsent = rec.college_status === 'Absent';

                          return (
                            <tr key={rec.student_id}>
                              <td>
                                <div
                                  className="staff-student-thumb"
                                  onClick={() =>
                                    photoUrl && setEnlargedPhoto({ url: photoUrl, name: rec.student_name })
                                  }
                                >
                                  {photoUrl ? (
                                    <img src={photoUrl} alt={rec.student_name} />
                                  ) : (
                                    <div className="thumb-placeholder">
                                      {rec.student_name ? rec.student_name[0] : 'S'}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span className="id-badge-code">{rec.student_id}</span>
                              </td>
                              <td>
                                <strong>{rec.student_name}</strong>
                              </td>
                              <td>{rec.department}</td>
                              <td>{rec.class_year}</td>
                              <td>{rec.date}</td>
                              <td>
                                <span className="time-code">{rec.college_in || '-'}</span>
                              </td>
                              <td>
                                <span className="time-code">{rec.college_out || '-'}</span>
                              </td>
                              <td>
                                <span
                                  className={`status-pill ${
                                    isPresent ? 'status-present' : isLate ? 'status-late' : 'status-absent'
                                  }`}
                                >
                                  {rec.college_status}
                                </span>
                              </td>
                              <td>
                                <div className="quick-action-btn-group">
                                  <button
                                    type="button"
                                    className={`btn-quick-mark btn-present ${isPresent ? 'selected' : ''}`}
                                    onClick={() => handleMarkAttendance(rec.student_id, 'Present')}
                                    title="Mark Present"
                                  >
                                    Present
                                  </button>
                                  <button
                                    type="button"
                                    className={`btn-quick-mark btn-late ${isLate ? 'selected' : ''}`}
                                    onClick={() => handleMarkAttendance(rec.student_id, 'Late')}
                                    title="Mark Late"
                                  >
                                    Late
                                  </button>
                                  <button
                                    type="button"
                                    className={`btn-quick-mark btn-absent ${isAbsent ? 'selected' : ''}`}
                                    onClick={() => handleMarkAttendance(rec.student_id, 'Absent')}
                                    title="Mark Absent"
                                  >
                                    Absent
                                  </button>
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
          {/* TAB 3: STUDENT ACADEMIC DIRECTORY & SEARCH */}
          {/* ====================================================================== */}
          {activeTab === 'students' && (
            <div className="staff-tab-view">
              <div className="staff-section-header">
                <div>
                  <h2 className="section-heading">Student Academic Directory</h2>
                  <p className="section-subheading">
                    View student academic information and cumulative attendance percentages.
                  </p>
                </div>
                <div className="directory-search-box">
                  <input
                    type="text"
                    placeholder="Search by Student Name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="staff-empty-card">
                  <p>No registered students found.</p>
                </div>
              ) : (
                <div className="staff-table-card">
                  <table className="staff-table">
                    <thead>
                      <tr>
                        <th>Photo</th>
                        <th>Student ID</th>
                        <th>Full Name</th>
                        <th>College</th>
                        <th>Department</th>
                        <th>Class / Year</th>
                        <th>Attendance %</th>
                        <th>Today's Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((st) => {
                        const photoUrl = getMediaUrl(st.profile_photo);
                        const pct = st.attendance_percentage || 100;
                        const isGoodPct = pct >= 75;

                        return (
                          <tr key={st.student_id}>
                            <td>
                              <div
                                className="staff-student-thumb"
                                onClick={() =>
                                  photoUrl && setEnlargedPhoto({ url: photoUrl, name: st.full_name })
                                }
                              >
                                {photoUrl ? (
                                  <img src={photoUrl} alt={st.full_name} />
                                ) : (
                                  <div className="thumb-placeholder">{st.full_name?.[0] || 'S'}</div>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="id-badge-code">{st.student_id}</span>
                            </td>
                            <td>
                              <strong>{st.full_name}</strong>
                            </td>
                            <td>{st.college}</td>
                            <td>{st.department}</td>
                            <td>{st.class_year}</td>
                            <td>
                              <div className="attendance-pct-bar-wrapper">
                                <span className={`pct-label ${isGoodPct ? 'good' : 'warning'}`}>
                                  {pct}%
                                </span>
                                <div className="pct-bar-track">
                                  <div
                                    className={`pct-bar-fill ${isGoodPct ? 'good' : 'warning'}`}
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`status-pill ${
                                  st.today_college_status === 'Present'
                                    ? 'status-present'
                                    : st.today_college_status === 'Late'
                                    ? 'status-late'
                                    : 'status-absent'
                                }`}
                              >
                                {st.today_college_status}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-view-dossier"
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
          {/* TAB 4: RULE-BASED (NOT AI) LECTURE BUNK ALERTS */}
          {/* ====================================================================== */}
          {activeTab === 'lecture_alerts' && (
            <div className="staff-tab-view">
              <div className="staff-section-header">
                <div>
                  <h2 className="section-heading">Possible Lecture Bunk / Campus Absence Alerts</h2>
                  <p className="section-subheading">
                    Automated rule-based verification comparing scheduled lecture hours against hostel gate logs.
                  </p>
                </div>
                <div className="engine-badge-pill">
                  <span className="engine-icon">⚙️</span>
                  <span>Rule-Based Verification Engine (NOT AI)</span>
                </div>
              </div>

              {/* Informative Rule Description Card */}
              <div className="rule-info-box">
                <div className="rule-info-icon">📋</div>
                <div className="rule-info-text">
                  <h4>Verification Rule Logic</h4>
                  <p>
                    A student is flagged when:
                    <br />
                    1. They are <strong>Absent</strong> or missing college entry between <strong>09:00 AM – 04:00 PM</strong>, AND
                    <br />
                    2. Hostel Gate biometrics report student is <strong>physically inside hostel</strong> during lecture hours OR student <strong>checked out of hostel</strong> for campus but never reported to college.
                  </p>
                </div>
              </div>

              {lectureAlerts.length === 0 ? (
                <div className="staff-empty-card success">
                  <div className="empty-icon">✅</div>
                  <h3>No Lecture Bunk Alerts Detected</h3>
                  <p>All resident students are either accounted for in lectures or on approved leaves.</p>
                </div>
              ) : (
                <div className="staff-table-card">
                  <table className="staff-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Room Number</th>
                        <th>Department & Class</th>
                        <th>Hostel Gate Status</th>
                        <th>College Attendance</th>
                        <th>Alert Reason</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lectureAlerts.map((al) => (
                        <tr key={al.student_id}>
                          <td>
                            <span className="id-badge-code">{al.student_id}</span>
                          </td>
                          <td>
                            <strong>{al.student_name}</strong>
                          </td>
                          <td>
                            <span className="room-badge">{al.room_number}</span>
                          </td>
                          <td>
                            {al.department} • {al.class_year}
                          </td>
                          <td>
                            <span
                              className={`status-pill ${
                                al.hostel_status === 'IN HOSTEL' ? 'status-in-hostel' : 'status-out-hostel'
                              }`}
                            >
                              {al.hostel_status}
                            </span>
                          </td>
                          <td>
                            <span className="status-pill status-absent">
                              {al.college_attendance_status}
                            </span>
                          </td>
                          <td>
                            <span className="alert-reason-text">{al.alert_reason}</span>
                          </td>
                          <td>
                            <div className="quick-action-btn-group">
                              <button
                                type="button"
                                className="btn-resolve-alert"
                                onClick={() => handleMarkAttendance(al.student_id, 'Present')}
                              >
                                Mark Present
                              </button>
                              <button
                                type="button"
                                className="btn-view-dossier"
                                onClick={() => handleViewStudentDetails(al.student_id)}
                              >
                                Dossier
                              </button>
                            </div>
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
          {/* TAB 5: ATTENDANCE REPORTS */}
          {/* ====================================================================== */}
          {activeTab === 'reports' && (
            <div className="staff-tab-view">
              <div className="staff-section-header">
                <div>
                  <h2 className="section-heading">Attendance Analytics & Reports</h2>
                  <p className="section-subheading">
                    Aggregated daily, weekly, monthly summaries, and departmental breakdowns.
                  </p>
                </div>
              </div>

              {attendanceReport && (
                <div className="reports-container">
                  {/* Daily & Monthly Cards Row */}
                  <div className="report-summary-cards-grid">
                    <div className="report-card">
                      <h3>Daily Summary ({attendanceReport.daily_summary.date})</h3>
                      <div className="report-metric-row">
                        <span>Total Students:</span>
                        <strong>{attendanceReport.daily_summary.total_students}</strong>
                      </div>
                      <div className="report-metric-row">
                        <span>Present:</span>
                        <strong className="text-green">{attendanceReport.daily_summary.present}</strong>
                      </div>
                      <div className="report-metric-row">
                        <span>Late:</span>
                        <strong className="text-amber">{attendanceReport.daily_summary.late}</strong>
                      </div>
                      <div className="report-metric-row">
                        <span>Absent:</span>
                        <strong className="text-red">{attendanceReport.daily_summary.absent}</strong>
                      </div>
                      <div className="report-highlight-box">
                        <span>Attendance Rate:</span>
                        <strong>{attendanceReport.daily_summary.present_pct}%</strong>
                      </div>
                    </div>

                    <div className="report-card">
                      <h3>Monthly Summary ({attendanceReport.monthly_summary.month})</h3>
                      <div className="report-metric-row">
                        <span>Working Days:</span>
                        <strong>{attendanceReport.monthly_summary.total_working_days}</strong>
                      </div>
                      <div className="report-metric-row">
                        <span>Average Attendance:</span>
                        <strong className="text-purple">{attendanceReport.monthly_summary.average_attendance_pct}%</strong>
                      </div>
                      <div className="report-metric-row">
                        <span>Overall Grade:</span>
                        <span className="grade-badge">{attendanceReport.monthly_summary.attendance_grade}</span>
                      </div>
                      <div className="report-highlight-box">
                        <span>Best Performing:</span>
                        <small>{attendanceReport.monthly_summary.best_attendance_class}</small>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Trend Breakdown */}
                  <div className="report-card full-width">
                    <h3>Weekly 7-Day Attendance Trend</h3>
                    <div className="weekly-bars-container">
                      {attendanceReport.weekly_summary.days.map((d) => (
                        <div key={d.date} className="weekly-bar-item">
                          <div className="bar-height-wrapper">
                            <div
                              className="bar-fill"
                              style={{ height: `${Math.max(d.attendance_pct, 12)}%` }}
                              title={`${d.day}: ${d.attendance_pct}% (${d.present_count} present)`}
                            />
                          </div>
                          <span className="bar-pct">{d.attendance_pct}%</span>
                          <span className="bar-day">{d.day}</span>
                          <span className="bar-date">{d.date.slice(5)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Department Breakdown */}
                  <div className="report-card full-width">
                    <h3>Department Attendance Breakdown</h3>
                    <div className="dept-stats-grid">
                      {attendanceReport.department_stats.map((dept) => (
                        <div key={dept.department} className="dept-stat-box">
                          <h4>{dept.department}</h4>
                          <div className="dept-stat-meta">
                            <span>Students: {dept.total_students}</span>
                            <span className="dept-stat-pct">{dept.attendance_percentage}%</span>
                          </div>
                          <div className="pct-bar-track">
                            <div
                              className="pct-bar-fill good"
                              style={{ width: `${Math.min(dept.attendance_percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 6: NOTICES (READ-ONLY) */}
          {/* ====================================================================== */}
          {activeTab === 'notices' && (
            <div className="staff-tab-view">
              <div className="staff-section-header">
                <div>
                  <h2 className="section-heading">Campus & Hostel Notices</h2>
                  <p className="section-subheading">
                    Official announcements posted by Hostel Administration and Wardens (Read-Only).
                  </p>
                </div>
                <span className="read-only-pill">Read-Only View</span>
              </div>

              {notices.length === 0 ? (
                <div className="staff-empty-card">
                  <p>No notices published at this time.</p>
                </div>
              ) : (
                <div className="staff-notices-grid">
                  {notices.map((n) => (
                    <div key={n.id} className="staff-notice-card">
                      <div className="notice-card-header">
                        <span className={`notice-prio-pill ${n.priority?.toLowerCase()}`}>
                          {n.priority || 'Normal'}
                        </span>
                        <span className="notice-date-text">{n.created_at}</span>
                      </div>
                      <h3 className="notice-card-title">{n.title}</h3>
                      <p className="notice-card-body">{n.message}</p>
                      <div className="notice-card-footer">
                        <span>Posted by: <strong>{n.posted_by}</strong></span>
                        <span>Audience: {n.target_audience}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ====================================================================== */}
          {/* TAB 7: STAFF PROFILE */}
          {/* ====================================================================== */}
          {activeTab === 'profile' && (
            <div className="staff-tab-view">
              <div className="staff-section-header">
                <div>
                  <h2 className="section-heading">Faculty & Staff Profile</h2>
                  <p className="section-subheading">
                    Verified College Staff credentials stored in MySQL database.
                  </p>
                </div>
              </div>

              {currentStaff && (
                <div className="staff-profile-card">
                  <div className="profile-card-left">
                    <div className="profile-photo-circle">
                      {currentStaff.profile_photo ? (
                        <img
                          src={getMediaUrl(currentStaff.profile_photo)}
                          alt={currentStaff.full_name}
                        />
                      ) : (
                        <div className="profile-placeholder">S</div>
                      )}
                    </div>
                    <h3>{currentStaff.full_name}</h3>
                    <span className="profile-tag">Authorized College Faculty</span>
                    <span className="profile-id-pill">{currentStaff.staff_id}</span>
                  </div>

                  <div className="profile-card-right">
                    <div className="profile-detail-grid">
                      <div className="detail-field">
                        <span className="field-label">Full Name</span>
                        <span className="field-value">{currentStaff.full_name}</span>
                      </div>
                      <div className="detail-field">
                        <span className="field-label">Staff ID</span>
                        <span className="field-value font-mono">{currentStaff.staff_id}</span>
                      </div>
                      <div className="detail-field">
                        <span className="field-label">Email Address</span>
                        <span className="field-value">{currentStaff.email}</span>
                      </div>
                      <div className="detail-field">
                        <span className="field-label">Mobile Number</span>
                        <span className="field-value">{currentStaff.mobile}</span>
                      </div>
                      <div className="detail-field">
                        <span className="field-label">Date of Birth</span>
                        <span className="field-value">{currentStaff.date_of_birth}</span>
                      </div>
                      <div className="detail-field">
                        <span className="field-label">Status</span>
                        <span className="field-value text-green">● {currentStaff.status || 'Active'}</span>
                      </div>
                      <div className="detail-field full-row">
                        <span className="field-label">Residential Address</span>
                        <span className="field-value">{currentStaff.address}</span>
                      </div>
                      <div className="detail-field full-row">
                        <span className="field-label">Last Login Timestamp</span>
                        <span className="field-value">{currentStaff.last_login || 'Active Session'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ====================================================================== */}
      {/* MODAL: STUDENT ACADEMIC DOSSIER */}
      {/* ====================================================================== */}
      {selectedStudentDetails && (
        <div className="staff-modal-overlay" onClick={() => setSelectedStudentDetails(null)}>
          <div className="staff-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-info">
                <h3>Student Academic & Attendance Dossier</h3>
                <span className="modal-student-id">{selectedStudentDetails.student_id}</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedStudentDetails(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body-scroll">
              {/* Student Identity Header */}
              <div className="modal-student-banner">
                <div className="modal-student-photo">
                  {selectedStudentDetails.profile_photo ? (
                    <img
                      src={getMediaUrl(selectedStudentDetails.profile_photo)}
                      alt={selectedStudentDetails.full_name}
                      onClick={() =>
                        setEnlargedPhoto({
                          url: getMediaUrl(selectedStudentDetails.profile_photo),
                          name: selectedStudentDetails.full_name,
                        })
                      }
                    />
                  ) : (
                    <div className="photo-placeholder">{selectedStudentDetails.full_name?.[0] || 'S'}</div>
                  )}
                </div>
                <div className="modal-student-titles">
                  <h4>{selectedStudentDetails.full_name}</h4>
                  <p>
                    {selectedStudentDetails.department} • {selectedStudentDetails.class_year}
                  </p>
                  <p className="college-name-sub">{selectedStudentDetails.college_name}</p>
                </div>
                <div className="modal-attendance-gauge">
                  <span className="gauge-num">{selectedStudentDetails.attendance_percentage}%</span>
                  <span className="gauge-label">Attendance</span>
                </div>
              </div>

              {/* Academic & Resident Info Grid */}
              <div className="modal-section-title">Academic & Contact Information</div>
              <div className="modal-info-grid">
                <div>
                  <span className="info-key">Date of Birth:</span>
                  <span className="info-val">{selectedStudentDetails.date_of_birth}</span>
                </div>
                <div>
                  <span className="info-key">Student Mobile:</span>
                  <span className="info-val">{selectedStudentDetails.mobile}</span>
                </div>
                <div>
                  <span className="info-key">Student Email:</span>
                  <span className="info-val">{selectedStudentDetails.email}</span>
                </div>
                <div>
                  <span className="info-key">Parent Name:</span>
                  <span className="info-val">{selectedStudentDetails.parent_name}</span>
                </div>
                <div>
                  <span className="info-key">Parent Mobile:</span>
                  <span className="info-val">{selectedStudentDetails.parent_mobile}</span>
                </div>
                <div>
                  <span className="info-key">Hostel Residence:</span>
                  <span className="info-val">{selectedStudentDetails.hostel_name} (Room: {selectedStudentDetails.room_number})</span>
                </div>
                <div className="full-grid-span">
                  <span className="info-key">Address:</span>
                  <span className="info-val">{selectedStudentDetails.address}</span>
                </div>
              </div>

              {/* Attendance Log (Past 30 Days) */}
              <div className="modal-section-title">Attendance History Log (Past 30 Days)</div>
              {selectedStudentDetails.attendance_history?.length === 0 ? (
                <p className="no-history-text">No attendance history records logged yet.</p>
              ) : (
                <table className="staff-modal-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>College Status</th>
                      <th>College IN</th>
                      <th>College OUT</th>
                      <th>Hostel IN</th>
                      <th>Hostel OUT</th>
                      <th>Bunk Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudentDetails.attendance_history.map((h, idx) => (
                      <tr key={idx}>
                        <td>{h.date}</td>
                        <td>
                          <span
                            className={`status-pill ${
                              h.college_status === 'Present'
                                ? 'status-present'
                                : h.college_status === 'Late'
                                ? 'status-late'
                                : 'status-absent'
                            }`}
                          >
                            {h.college_status}
                          </span>
                        </td>
                        <td>{h.college_in}</td>
                        <td>{h.college_out}</td>
                        <td>{h.hostel_in}</td>
                        <td>{h.hostel_out}</td>
                        <td>{h.lecture_bunk_alert || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL: PHOTO ENLARGEMENT */}
      {/* ====================================================================== */}
      {enlargedPhoto && (
        <div className="staff-modal-overlay" onClick={() => setEnlargedPhoto(null)}>
          <div className="staff-photo-modal-card" onClick={(e) => e.stopPropagation()}>
            <img src={enlargedPhoto.url} alt={enlargedPhoto.name} className="enlarged-img" />
            <div className="photo-modal-footer">
              <span>{enlargedPhoto.name}</span>
              <button
                type="button"
                className="btn-close-photo"
                onClick={() => setEnlargedPhoto(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
