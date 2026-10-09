import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { api } from '../services/api';
import './StudentDashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const StudentDashboard = () => {
  const navigate = useNavigate();

  // Student Profile State
  const [student, setStudent] = useState(() => {
    const cached = localStorage.getItem('student_data');
    return cached ? JSON.parse(cached) : null;
  });

  // Attendance State (4 Cards: Attendance, Hostel IN, Hostel OUT, Lunch Break)
  const [attendance, setAttendance] = useState({
    college_status: 'Present',
    college_in_time: '08:55 AM',
    college_out_time: '04:05 PM',
    in_time: '07:35 AM',
    out_time: 'Pending OUT',
    lunch_break_status: 'Present',
    lunch_break_time: '11:00 AM - 11:35 AM',
    hostel_timing: '6:00 AM – 6:00 PM',
    date_formatted: '',
    lecture_bunk_alert: null,
  });

  // Today's Real Gate Movement State
  const [todayMovement, setTodayMovement] = useState({
    hostel_out_time: null,
    hostel_in_time: null,
    current_status: 'Not recorded yet',
  });

  // AI Feature 2: Attendance Risk Prediction State
  const [attendanceRisk, setAttendanceRisk] = useState({
    risk_level: 'LOW RISK',
    risk_score: 10,
    attendance_percentage: 100.0,
    explanation: 'Consistent attendance record with normal hostel hours.',
  });

  // Notices State
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(false);

  // Complaints State (With AI Feature 1: Priority Detection)
  const [complaints, setComplaints] = useState([]);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ title: '', description: '' });
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  // Leave Requests State
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    request_type: 'Weekend Home Visit',
    reason: '',
    from_date: '',
    to_date: '',
  });
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // AI Feature 3: Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! 👋 I am your Girls Hostel AI Assistant. How can I help you today? You can ask about gate hours, mess food, complaints, or leave procedures.',
      time: 'Just now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatMessagesEndRef = useRef(null);

  // General Status State
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [loading, setLoading] = useState(!student);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
  const [isRecording, setIsRecording] = useState(false);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatOpen && chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen]);

  // Load Dashboard Data
  const loadDashboardData = useCallback(async (sid) => {
    try {
      // 1. Attendance Details
      const attData = await api.getStudentAttendanceDetails(sid);
      setAttendance(attData);

      // 2. AI Feature 2: Attendance Risk
      const riskData = await api.getAttendanceRisk(sid);
      setAttendanceRisk(riskData);

      // 3. Notices
      const noticesData = await api.getNotices();
      setNotices(noticesData);

      // 4. Complaints
      const complaintsData = await api.getStudentComplaints(sid);
      setComplaints(complaintsData);

      // 5. Leave Requests
      const leavesData = await api.getStudentLeaveRequests(sid);
      setLeaveRequests(leavesData);

      // 6. Today's Hostel Activity from Gate Movements
      try {
        const movData = await api.getStudentTodayMovement(sid);
        if (movData) setTodayMovement(movData);
      } catch (e) {
        console.error('Failed to load today gate movements:', e);
      }
    } catch (err) {
      console.error('Failed to load dashboard records:', err);
    }
  }, []);

  // Check auth and fetch fresh profile
  useEffect(() => {
    const token = localStorage.getItem('student_token');
    if (!token) {
      if (localStorage.getItem('parent_token')) {
        navigate('/parent', { replace: true });
        return;
      }
      navigate('/student/login', { replace: true });
      return;
    }

    const fetchProfile = async () => {
      try {
        const freshProfile = await api.getStudentProfile(token);
        setStudent(freshProfile);
        localStorage.setItem('student_data', JSON.stringify(freshProfile));
        loadDashboardData(freshProfile.student_id);
      } catch (err) {
        console.error('Profile fetch failed:', err);
        if (err.message && err.message.toLowerCase().includes('token')) {
          localStorage.removeItem('student_token');
          localStorage.removeItem('student_data');
          navigate('/student/login', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, loadDashboardData]);

  // Handle Hostel IN record
  const handleRecordIn = async () => {
    if (!student) return;
    setIsRecording(true);
    setActionMessage({ type: '', text: '' });
    try {
      const res = await api.recordHostelIn(student.student_id);
      setActionMessage({
        type: 'success',
        text: res.message,
      });
      loadDashboardData(student.student_id);
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to record Hostel IN.',
      });
    } finally {
      setIsRecording(false);
    }
  };

  // Handle Hostel OUT record
  const handleRecordOut = async () => {
    if (!student) return;
    setIsRecording(true);
    setActionMessage({ type: '', text: '' });
    try {
      const res = await api.recordHostelOut(student.student_id);
      setActionMessage({
        type: 'success',
        text: res.message,
      });
      loadDashboardData(student.student_id);
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to record Hostel OUT.',
      });
    } finally {
      setIsRecording(false);
    }
  };

  // Submit Complaint with AI Priority Classification
  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!complaintForm.title.trim() || !complaintForm.description.trim()) return;

    setIsSubmittingComplaint(true);
    try {
      const res = await api.submitComplaint({
        student_id: student.student_id,
        title: complaintForm.title.trim(),
        description: complaintForm.description.trim(),
      });
      setComplaints((prev) => [res, ...prev]);
      setComplaintForm({ title: '', description: '' });
      setShowComplaintModal(false);
      setActionMessage({
        type: 'success',
        text: `Complaint submitted! AI classified priority as ${res.ai_priority}.`,
      });
    } catch (err) {
      alert(err.message || 'Failed to submit complaint.');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  // Submit Leave Request
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveForm.reason.trim() || !leaveForm.from_date || !leaveForm.to_date) return;

    setIsSubmittingLeave(true);
    try {
      const res = await api.submitLeaveRequest({
        student_id: student.student_id,
        request_type: leaveForm.request_type,
        reason: leaveForm.reason.trim(),
        from_date: leaveForm.from_date,
        to_date: leaveForm.to_date,
      });
      setLeaveRequests((prev) => [res, ...prev]);
      setLeaveForm({
        request_type: 'Weekend Home Visit',
        reason: '',
        from_date: '',
        to_date: '',
      });
      setShowLeaveModal(false);
      setActionMessage({
        type: 'success',
        text: 'Leave request submitted successfully for Warden approval.',
      });
    } catch (err) {
      alert(err.message || 'Failed to submit leave request.');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  // Send Chatbot Message (AI Feature 3)
  const handleSendMessage = async (textToSend) => {
    const message = textToSend || chatInput;
    if (!message.trim() || chatLoading) return;

    const userMsg = {
      sender: 'user',
      text: message.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.sendChatMessage({
        message: userMsg.text,
        student_id: student?.student_id,
      });
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.reply,
          time: res.timestamp,
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Sorry, I am having trouble connecting right now. Please try again or contact the Warden Office at +91 98220 11223.',
          time: 'Just now',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Logout (Clears session only, NEVER deletes student record)
  const handleLogout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_data');
    navigate('/student/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="student-dash-loading">
        <div className="dash-spinner"></div>
        <p>Loading your student profile and hostel records...</p>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  const facePhotoUrl = student.face_image_path
    ? (student.face_image_path.startsWith('http')
        ? student.face_image_path
        : `${API_BASE}/${student.face_image_path.replace(/^\/+/, '')}`)
    : null;

  return (
    <div className="student-dashboard-wrapper">
      <div className="dash-bg-blob blob-purple" aria-hidden="true" />
      <div className="dash-bg-blob blob-pink" aria-hidden="true" />

      <main className="student-dashboard-main">
        {/* ================= 1. STUDENT PROFILE HEADER ================= */}
        <section className="dashboard-hero-card">
          <div className="hero-left">
            <div className="student-avatar-ring">
              {facePhotoUrl ? (
                <img
                  src={facePhotoUrl}
                  alt={student.full_name}
                  className="student-registered-photo"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="student-fallback-avatar"
                style={{ display: facePhotoUrl ? 'none' : 'flex' }}
              >
                <span>{student.full_name?.charAt(0) || 'S'}</span>
              </div>
              <div className="biometric-verified-chip" title="Biometrically Verified">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ffffff" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <div className="hero-student-meta">
              <div className="hero-badges-row">
                <span className="badge-student-id">{student.student_id}</span>
                <span className="badge-resident">Active Resident</span>
                <span className="badge-biometric">Face ID Registered</span>
              </div>
              <h1 className="hero-student-name">{student.full_name}</h1>
              <p className="hero-academic-line">
                {student.department} • {student.class_year}
              </p>
              <p className="hero-college-name">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>{student.college_name}</span>
              </p>
            </div>
          </div>

          <div className="hero-right">
            <div className="live-clock-card">
              <span className="clock-label">Current Server Clock</span>
              <span className="clock-time">{currentTime}</span>
              <span className="clock-date">
                {attendance.date_formatted || new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            <button
              type="button"
              className="student-logout-btn"
              onClick={handleLogout}
              title="Logout from student portal (Account persists safely in MySQL)"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </section>

        {/* Action feedback banner */}
        {actionMessage.text && (
          <div className={`dash-action-banner ${actionMessage.type}`} role="alert">
            <div className="banner-icon">
              {actionMessage.type === 'success' ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#059669" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#dc2626" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                </svg>
              )}
            </div>
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Smart Rule-Based Lecture Bunk Warning */}
        {attendance.lecture_bunk_alert && (
          <div className="lecture-bunk-warning-banner" role="alert">
            <div className="bunk-alert-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#b45309" strokeWidth="2.4">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="bunk-alert-text">
              <h4>Smart Alert: Possible Lecture Absence</h4>
              <p>{attendance.lecture_bunk_alert}</p>
            </div>
          </div>
        )}

        {/* ================= 2. FOUR ATTENDANCE CARDS GRID ================= */}
        {/* Matches: Attendance | Hostel IN | Hostel OUT | Lunch Break */}
        <section className="attendance-four-cards-grid">
          {/* Card 1: College Attendance */}
          <div className="stat-overview-card college-att-card">
            <div className="card-top-header">
              <span className="card-category-label">Daily Attendance</span>
              <span className="badge-tag status-present">{attendance.college_status}</span>
            </div>
            <h3 className="stat-card-title">College Attendance</h3>
            <div className="att-time-details">
              <div className="time-sub-row">
                <span className="time-lbl">College IN:</span>
                <span className="time-val">{attendance.college_in_time}</span>
              </div>
              <div className="time-sub-row">
                <span className="time-lbl">College OUT:</span>
                <span className="time-val">{attendance.college_out_time}</span>
              </div>
              <span className="college-hours-tag">College Hours: 09:00 AM – 04:00 PM</span>
            </div>
          </div>

          {/* Card 2: Hostel IN */}
          <div className="stat-overview-card hostel-in-card">
            <div className="card-top-header">
              <span className="card-category-label">Hostel IN</span>
              <span className={`badge-tag ${attendance.in_time !== 'Pending IN' ? 'status-present' : 'status-pending'}`}>
                {attendance.in_time !== 'Pending IN' ? 'Recorded' : 'Pending'}
              </span>
            </div>
            <div className="big-time-display">{attendance.in_time}</div>
            <p className="card-micro-desc">Official server-logged entrance</p>
            <button
              type="button"
              className="quick-gate-btn in-btn"
              onClick={handleRecordIn}
              disabled={isRecording}
            >
              <span>Record Hostel IN</span>
            </button>
          </div>

          {/* Card 3: Hostel OUT */}
          <div className="stat-overview-card hostel-out-card">
            <div className="card-top-header">
              <span className="card-category-label">Hostel OUT</span>
              <span className={`badge-tag ${attendance.out_time !== 'Pending OUT' ? 'status-present' : 'status-pending'}`}>
                {attendance.out_time !== 'Pending OUT' ? 'Recorded' : 'Pending'}
              </span>
            </div>
            <div className="big-time-display">{attendance.out_time}</div>
            <p className="card-micro-desc">Official server-logged departure</p>
            <button
              type="button"
              className="quick-gate-btn out-btn"
              onClick={handleRecordOut}
              disabled={isRecording}
            >
              <span>Record Hostel OUT</span>
            </button>
          </div>

          {/* Card 4: Lunch Break */}
          <div className="stat-overview-card lunch-break-card">
            <div className="card-top-header">
              <span className="card-category-label">Lunch Break</span>
              <span className="badge-tag status-present">{attendance.lunch_break_status} ✅</span>
            </div>
            <div className="big-time-display">11:00 AM – 11:35 AM</div>
            <p className="card-micro-desc">Permitted mid-day college break</p>
            <div className="lunch-status-box">
              <span className="lunch-dot"></span>
              <span>Break Recorded On Time</span>
            </div>
          </div>
        </section>

        {/* ================= TODAY'S HOSTEL ACTIVITY (GATE MOVEMENTS) ================= */}
        <section className="student-gate-activity-card">
          <div className="gate-act-header">
            <div className="gate-act-title-box">
              <span className="gate-act-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <h3>Today's Hostel Activity</h3>
            </div>
            <span className={`status-pill ${todayMovement.current_status === 'IN Hostel' ? 'pill-in' : todayMovement.current_status === 'OUT of Hostel' ? 'pill-out' : 'pill-empty'}`}>
              Status: {todayMovement.current_status}
            </span>
          </div>

          <div className="gate-act-times-grid">
            <div className="gate-time-item">
              <span className="gate-time-label">Hostel OUT — time</span>
              <strong className="gate-time-value">
                {todayMovement.hostel_out_time || 'Not recorded yet'}
              </strong>
            </div>

            <div className="gate-time-divider"></div>

            <div className="gate-time-item">
              <span className="gate-time-label">Hostel IN — time</span>
              <strong className="gate-time-value">
                {todayMovement.hostel_in_time || 'Not recorded yet'}
              </strong>
            </div>
          </div>
        </section>

        {/* ================= 3. AI ATTENDANCE RISK CARD (AI FEATURE 2) ================= */}
        <section className="dash-card ai-risk-card">
          <div className="ai-risk-header">
            <div className="ai-chip-badge">
              <span className="ai-sparkle">✨</span>
              <span>AI Feature 2: Predictive Attendance Analytics</span>
            </div>
            <span className={`risk-level-badge risk-${attendanceRisk.risk_level.toLowerCase().replace(/\s+/g, '-')}`}>
              {attendanceRisk.risk_level}
            </span>
          </div>

          <div className="ai-risk-content">
            <div className="risk-metric-box">
              <span className="risk-metric-lbl">Attendance Consistency</span>
              <span className="risk-metric-val">{attendanceRisk.attendance_percentage}%</span>
            </div>
            <div className="risk-text-explanation">
              <h4 className="risk-title">AI Attendance Risk Assessment: {attendanceRisk.risk_level}</h4>
              <p className="risk-desc">{attendanceRisk.explanation}</p>
            </div>
          </div>
        </section>

        {/* ================= 4. NOTICES SECTION ================= */}
        <section className="dash-card notices-card">
          <div className="card-header">
            <div className="card-header-icon notice-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#d97706" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div className="card-titles">
              <h2 className="card-title">📢 Notices & Official Bulletins</h2>
              <p className="card-sub">Important announcements from Warden Office and Hostel Administration</p>
            </div>
          </div>

          {notices.length === 0 ? (
            <div className="empty-section-placeholder">
              <p>No new notices.</p>
            </div>
          ) : (
            <div className="notices-list">
              {notices.map((n) => (
                <div key={n.id} className="notice-item-card">
                  <div className="notice-item-header">
                    <h3 className="notice-item-title">{n.title}</h3>
                    <div className="notice-tags">
                      <span className="notice-priority-chip">{n.priority}</span>
                      <span className="notice-date">{n.created_at}</span>
                    </div>
                  </div>
                  <p className="notice-item-message">{n.message}</p>
                  <span className="notice-posted-by">Posted by: {n.posted_by}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================= 5. COMPLAINTS SECTION (WITH AI FEATURE 1: AI PRIORITY) ================= */}
        <section className="dash-card complaints-card">
          <div className="card-header space-between">
            <div className="header-left-group">
              <div className="card-header-icon complaint-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#dc2626" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div>
                <h2 className="card-title">📝 Grievances & Maintenance Complaints</h2>
                <p className="card-sub">AI Feature 1: Automatic AI Priority Detection (Emergency / High / Medium / Low)</p>
              </div>
            </div>

            <button
              type="button"
              className="btn-action-primary"
              onClick={() => setShowComplaintModal(true)}
            >
              <span>+ Submit Complaint</span>
            </button>
          </div>

          {complaints.length === 0 ? (
            <div className="empty-section-placeholder">
              <p>No complaints submitted yet. Need repairs or maintenance? Click "+ Submit Complaint".</p>
            </div>
          ) : (
            <div className="complaints-list">
              {complaints.map((c) => (
                <div key={c.id} className="complaint-item-card">
                  <div className="complaint-item-top">
                    <h4 className="complaint-title">{c.title}</h4>
                    <div className="complaint-badges">
                      <span className={`ai-priority-badge priority-${c.ai_priority.toLowerCase()}`}>
                        AI: {c.ai_priority}
                      </span>
                      <span className={`status-pill pill-${c.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                  <p className="complaint-desc">{c.description}</p>
                  <span className="complaint-date">Submitted on: {c.created_at}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================= 6. LEAVE / PERMISSION SECTION ================= */}
        <section className="dash-card leave-card">
          <div className="card-header space-between">
            <div className="header-left-group">
              <div className="card-header-icon leave-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#7c3aed" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <h2 className="card-title">📝 Leave & Night-Out Permissions</h2>
                <p className="card-sub">Request Warden authorization for weekend home visits and late gate passes</p>
              </div>
            </div>

            <button
              type="button"
              className="btn-action-primary"
              onClick={() => setShowLeaveModal(true)}
            >
              <span>+ Request Leave / Permission</span>
            </button>
          </div>

          {leaveRequests.length === 0 ? (
            <div className="empty-section-placeholder">
              <p>No active leave requests. Click "+ Request Leave / Permission" to request gate passes.</p>
            </div>
          ) : (
            <div className="leave-requests-list">
              {leaveRequests.map((l) => (
                <div key={l.id} className="leave-item-card">
                  <div className="leave-item-top">
                    <h4 className="leave-type">{l.request_type}</h4>
                    <span className={`leave-status-badge status-${l.status.toLowerCase()}`}>
                      {l.status}
                    </span>
                  </div>
                  <p className="leave-reason"><strong>Reason:</strong> {l.reason}</p>
                  <div className="leave-date-range">
                    <span><strong>From:</strong> {l.from_date}</span>
                    <span><strong>To:</strong> {l.to_date}</span>
                  </div>
                  <span className="leave-meta-date">Requested: {l.created_at}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================= 7. STUDENT & GUARDIAN RECORDS ================= */}
        <section className="dash-card student-details-card">
          <div className="card-header">
            <div className="card-header-icon profile-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#d8376b" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 className="card-title">Student & Guardian Records</h2>
              <p className="card-sub">Verified contact and academic information</p>
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Full Name</span>
              <span className="detail-value">{student.full_name}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Date of Birth</span>
              <span className="detail-value">{student.date_of_birth}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Mobile Number</span>
              <span className="detail-value">{student.mobile}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Email Address</span>
              <span className="detail-value">{student.email}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Guardian / Parent Name</span>
              <span className="detail-value">{student.parent_name}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Parent Mobile Number</span>
              <span className="detail-value">{student.parent_mobile}</span>
            </div>

            {student.parent_email && (
              <div className="detail-item">
                <span className="detail-label">Parent Email</span>
                <span className="detail-value">{student.parent_email}</span>
              </div>
            )}

            <div className="detail-item full-span">
              <span className="detail-label">Permanent Residential Address</span>
              <span className="detail-value">{student.address}</span>
            </div>
          </div>
        </section>
      </main>

      {/* ================= MODAL: SUBMIT COMPLAINT (WITH AI PRIORITY) ================= */}
      {showComplaintModal && (
        <div className="modal-backdrop" onClick={() => setShowComplaintModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Maintenance Complaint</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowComplaintModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleComplaintSubmit}>
              <div className="modal-body">
                <div className="modal-ai-notice">
                  <span>✨ AI Complaint Priority Active: Our NLP model will automatically analyze and assign response priority.</span>
                </div>
                <div className="form-group-modal">
                  <label htmlFor="compTitle">Issue Title *</label>
                  <input
                    type="text"
                    id="compTitle"
                    required
                    placeholder="e.g. Bathroom water tap leaking / Room door lock broken"
                    value={complaintForm.title}
                    onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                  />
                </div>
                <div className="form-group-modal">
                  <label htmlFor="compDesc">Description & Details *</label>
                  <textarea
                    id="compDesc"
                    rows="4"
                    required
                    placeholder="Provide details about the location, room number, and urgency..."
                    value={complaintForm.description}
                    onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowComplaintModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={isSubmittingComplaint}
                >
                  {isSubmittingComplaint ? 'Analyzing & Filing...' : 'Submit with AI Classification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REQUEST LEAVE / PERMISSION ================= */}
      {showLeaveModal && (
        <div className="modal-backdrop" onClick={() => setShowLeaveModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Leave / Night-Out Permission</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowLeaveModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleLeaveSubmit}>
              <div className="modal-body">
                <div className="form-group-modal">
                  <label htmlFor="leaveType">Leave Type *</label>
                  <select
                    id="leaveType"
                    value={leaveForm.request_type}
                    onChange={(e) => setLeaveForm({ ...leaveForm, request_type: e.target.value })}
                  >
                    <option value="Weekend Home Visit">Weekend Home Visit</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                    <option value="Night Out Permission">Night Out Permission</option>
                    <option value="Late Gate Entry">Late Gate Entry</option>
                  </select>
                </div>
                <div className="form-row-2col">
                  <div className="form-group-modal">
                    <label htmlFor="fromDate">From Date & Time *</label>
                    <input
                      type="datetime-local"
                      id="fromDate"
                      required
                      value={leaveForm.from_date}
                      onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group-modal">
                    <label htmlFor="toDate">To Date & Time *</label>
                    <input
                      type="datetime-local"
                      id="toDate"
                      required
                      value={leaveForm.to_date}
                      onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group-modal">
                  <label htmlFor="leaveReason">Reason for Permission *</label>
                  <textarea
                    id="leaveReason"
                    rows="3"
                    required
                    placeholder="State reason and parent consent details..."
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowLeaveModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={isSubmittingLeave}
                >
                  {isSubmittingLeave ? 'Submitting Request...' : 'Submit Request to Warden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 8. AI HOSTEL CHATBOT WIDGET (AI FEATURE 3) ================= */}
      {/* Floating launcher button */}
      <button
        type="button"
        className="floating-chatbot-launcher"
        onClick={() => setChatOpen(!chatOpen)}
        title="Open Girls Hostel AI Assistant"
      >
        <span className="chatbot-emoji">🤖</span>
        <span className="chatbot-launcher-text">Hostel AI Assistant</span>
      </button>

      {/* Interactive Chat Window */}
      {chatOpen && (
        <div className="chatbot-window-card">
          <div className="chatbot-window-header">
            <div className="bot-header-left">
              <span className="bot-avatar-emoji">🤖</span>
              <div>
                <h4 className="bot-title">Girls Hostel AI</h4>
                <span className="bot-online-indicator">Online 24/7 • Intelligent Assistant</span>
              </div>
            </div>
            <button
              type="button"
              className="bot-close-btn"
              onClick={() => setChatOpen(false)}
              title="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="bot-quick-chips">
            <button
              type="button"
              className="chip-btn"
              onClick={() => handleSendMessage('What are the hostel gate timings?')}
            >
              Hostel Timings
            </button>
            <button
              type="button"
              className="chip-btn"
              onClick={() => handleSendMessage('What is the mess meal schedule?')}
            >
              Mess Schedule
            </button>
            <button
              type="button"
              className="chip-btn"
              onClick={() => handleSendMessage('Warden emergency contact number')}
            >
              Warden Contact
            </button>
            <button
              type="button"
              className="chip-btn"
              onClick={() => handleSendMessage('How do I submit a complaint?')}
            >
              File Complaint
            </button>
          </div>

          {/* Message History */}
          <div className="chatbot-messages-scroll">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble-row ${msg.sender === 'user' ? 'row-user' : 'row-ai'}`}>
                {msg.sender === 'ai' && <span className="bubble-bot-avatar">🤖</span>}
                <div className={`chat-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-ai'}`}>
                  <p className="bubble-text">{msg.text}</p>
                  <span className="bubble-time">{msg.time}</span>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="chat-bubble-row row-ai">
                <span className="bubble-bot-avatar">🤖</span>
                <div className="chat-bubble bubble-ai typing-bubble">
                  <span>AI Assistant is typing...</span>
                </div>
              </div>
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            className="chatbot-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              type="text"
              placeholder="Ask about rules, timings, food, leaves..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="bot-send-btn" disabled={!chatInput.trim() || chatLoading}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <Footer />
    </div>
  );
};
