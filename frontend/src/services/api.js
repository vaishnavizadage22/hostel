const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const api = {
  // --- Student Registration ---
  async registerStudent(studentData) {
    const res = await fetch(`${API_BASE}/api/students/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Registration failed');
    }
    return data;
  },

  // --- Student Login (Step 1: ID + Password) ---
  async loginStudent(credentials) {
    const res = await fetch(`${API_BASE}/api/auth/student-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Login failed');
    }
    return data;
  },

  // --- Student Live Face Verification (Step 2: Biometric Comparison) ---
  async verifyStudentFace(verifyData) {
    const res = await fetch(`${API_BASE}/api/auth/student-face-verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifyData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Face verification failed');
    }
    return data;
  },

  // --- Authenticated Student Profile ---
  async getStudentProfile(token) {
    const res = await fetch(`${API_BASE}/api/students/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to fetch student profile');
    }
    return data;
  },

  // --- Attendance ---
  async getTodayAttendance(studentId) {
    const res = await fetch(`${API_BASE}/api/attendance/today/${encodeURIComponent(studentId)}`);
    return res.json();
  },

  async recordHostelIn(studentId) {
    const res = await fetch(`${API_BASE}/api/attendance/hostel-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ student_id: studentId }),
    });
    return res.json();
  },

  async recordHostelOut(studentId) {
    const res = await fetch(`${API_BASE}/api/attendance/hostel-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ student_id: studentId }),
    });
    return res.json();
  },

  // --- Warden Registration ---
  async registerWarden(wardenData) {
    const res = await fetch(`${API_BASE}/api/wardens/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wardenData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Warden registration failed');
    }
    return data;
  },

  // --- Student List for Admin/Warden ---
  async getAllStudents() {
    const res = await fetch(`${API_BASE}/api/students`);
    if (!res.ok) {
      throw new Error('Failed to fetch students');
    }
    return res.json();
  },

  // --- Attendance Details (College IN/OUT, Lunch Break, Gate Times, Bunk Alert) ---
  async getStudentAttendanceDetails(studentId) {
    const res = await fetch(`${API_BASE}/api/attendance/student/${encodeURIComponent(studentId)}`);
    return res.json();
  },

  // --- AI Feature 2: Attendance Risk Prediction ---
  async getAttendanceRisk(studentId) {
    const res = await fetch(`${API_BASE}/api/attendance/risk/${encodeURIComponent(studentId)}`);
    return res.json();
  },

  // --- Notices ---
  async getNotices() {
    const res = await fetch(`${API_BASE}/api/notices/student`);
    return res.json();
  },

  // --- Complaints (With AI Feature 1: Priority Detection) ---
  async submitComplaint(complaintData) {
    const res = await fetch(`${API_BASE}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(complaintData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to submit complaint');
    }
    return data;
  },

  async getStudentComplaints(studentId) {
    const res = await fetch(`${API_BASE}/api/complaints/student/${encodeURIComponent(studentId)}`);
    return res.json();
  },

  // --- Leave / Permission Requests ---
  async submitLeaveRequest(leaveData) {
    const res = await fetch(`${API_BASE}/api/leave-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leaveData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to submit leave request');
    }
    return data;
  },

  async getStudentLeaveRequests(studentId) {
    const res = await fetch(`${API_BASE}/api/leave-requests/student/${encodeURIComponent(studentId)}`);
    return res.json();
  },

  // --- AI Feature 3: Hostel Chatbot ---
  async sendChatMessage(chatData) {
    const res = await fetch(`${API_BASE}/api/chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Chatbot request failed');
    }
    return data;
  },

  // --- Admin Dashboard APIs ---
  async getAdminStats() {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API_BASE}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load dashboard stats');
    return res.json();
  },

  async getStudentFullDetails(studentId) {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API_BASE}/api/admin/students/${encodeURIComponent(studentId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch student details');
    return res.json();
  },

  async approveAdmission(studentId) {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API_BASE}/api/admin/students/${encodeURIComponent(studentId)}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to approve admission');
    return data;
  },

  async rejectAdmission(studentId) {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API_BASE}/api/admin/students/${encodeURIComponent(studentId)}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to reject admission');
    return data;
  },

  async getPendingAdmissions() {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API_BASE}/api/admin/admissions/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load pending admissions');
    return res.json();
  },

  async getAllWardens() {
    const res = await fetch(`${API_BASE}/api/wardens`);
    if (!res.ok) throw new Error('Failed to fetch wardens');
    return res.json();
  },

  async getAdminAttendance() {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API_BASE}/api/admin/attendance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load attendance summary');
    return res.json();
  },

  async getAdminComplaints() {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API_BASE}/api/admin/complaints`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load complaints');
    return res.json();
  },

  async updateComplaintStatus(complaintId, status) {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API_BASE}/api/admin/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to update complaint status');
    return data;
  },

  async getAdminLeaveRequests() {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API_BASE}/api/admin/leave-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load leave requests');
    return res.json();
  },

  async updateLeaveStatus(leaveId, status) {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API_BASE}/api/admin/leave-requests/${leaveId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to update leave status');
    return data;
  },

  async createAdminNotice(noticeData) {
    const res = await fetch(`${API_BASE}/api/notices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noticeData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to post notice');
    return data;
  },

  // ======================================================================
  // --- Warden Dashboard APIs ---
  // ======================================================================

  async loginWarden(credentials) {
    const res = await fetch(`${API_BASE}/api/warden/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Warden login failed');
    return data;
  },

  async logoutWarden() {
    const token = localStorage.getItem('warden_token');
    if (token) {
      try {
        await fetch(`${API_BASE}/api/warden/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore
      }
    }
    localStorage.removeItem('warden_token');
    localStorage.removeItem('warden_data');
  },

  async getWardenProfile() {
    const token = localStorage.getItem('warden_token');
    const res = await fetch(`${API_BASE}/api/warden/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load warden profile');
    return res.json();
  },

  async getWardenStats() {
    const token = localStorage.getItem('warden_token');
    const res = await fetch(`${API_BASE}/api/warden/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load warden dashboard statistics');
    return res.json();
  },

  async getWardenStudents() {
    const token = localStorage.getItem('warden_token');
    const res = await fetch(`${API_BASE}/api/warden/students`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load students');
    return res.json();
  },

  async getWardenStudentDetails(studentId) {
    const token = localStorage.getItem('warden_token');
    const res = await fetch(`${API_BASE}/api/warden/students/${encodeURIComponent(studentId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load student details');
    return res.json();
  },

  async getWardenHostelAttendance() {
    const token = localStorage.getItem('warden_token');
    const res = await fetch(`${API_BASE}/api/warden/hostel-attendance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load hostel gate attendance');
    return res.json();
  },

  async getWardenCollegeAttendance() {
    const token = localStorage.getItem('warden_token');
    const res = await fetch(`${API_BASE}/api/warden/attendance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load college attendance');
    return res.json();
  },

  async getWardenLeaveRequests() {
    const token = localStorage.getItem('warden_token');
    const res = await fetch(`${API_BASE}/api/warden/leave-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load leave requests');
    return res.json();
  },

  async approveWardenLeaveRequest(leaveId) {
    const token = localStorage.getItem('warden_token');
    const res = await fetch(`${API_BASE}/api/warden/leave-requests/${leaveId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to approve leave request');
    return data;
  },

  async rejectWardenLeaveRequest(leaveId) {
    const token = localStorage.getItem('warden_token');
    const res = await fetch(`${API_BASE}/api/warden/leave-requests/${leaveId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to reject leave request');
    return data;
  },

  async getWardenComplaints() {
    const token = localStorage.getItem('warden_token');
    const res = await fetch(`${API_BASE}/api/warden/complaints`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load complaints');
    return res.json();
  },

  async updateWardenComplaintStatus(complaintId, status) {
    const token = localStorage.getItem('warden_token');
    const res = await fetch(`${API_BASE}/api/warden/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to update complaint status');
    return data;
  },

  async createWardenNotice(noticeData) {
    const token = localStorage.getItem('warden_token');
    const res = await fetch(`${API_BASE}/api/warden/notices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(noticeData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to post notice');
    return data;
  },

  async getWardenNotices() {
    const token = localStorage.getItem('warden_token');
    const res = await fetch(`${API_BASE}/api/warden/notices`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load notices');
    return res.json();
  },

  // --- College Staff APIs ---
  async registerStaff(staffData) {
    const res = await fetch(`${API_BASE}/api/staff/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(staffData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Staff registration failed');
    }
    return data;
  },

  async loginStaff(credentials) {
    const res = await fetch(`${API_BASE}/api/staff/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Staff login failed');
    }
    return data;
  },

  async logoutStaff() {
    const token = localStorage.getItem('staff_token');
    try {
      await fetch(`${API_BASE}/api/staff/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      console.warn('Staff logout call failed:', e);
    } finally {
      localStorage.removeItem('staff_token');
      localStorage.removeItem('staff_data');
    }
  },

  async getStaffProfile() {
    const token = localStorage.getItem('staff_token');
    const res = await fetch(`${API_BASE}/api/staff/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch staff profile');
    return res.json();
  },

  async getStaffStats() {
    const token = localStorage.getItem('staff_token');
    const res = await fetch(`${API_BASE}/api/staff/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load staff dashboard statistics');
    return res.json();
  },

  async getStaffStudents(filters = {}) {
    const token = localStorage.getItem('staff_token');
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.department) params.append('department', filters.department);
    if (filters.class_year) params.append('class_year', filters.class_year);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/api/staff/students${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load students roster');
    return res.json();
  },

  async getStaffStudentDetails(studentId) {
    const token = localStorage.getItem('staff_token');
    const res = await fetch(`${API_BASE}/api/staff/students/${encodeURIComponent(studentId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load student academic details');
    return res.json();
  },

  async getStaffAttendance(params = {}) {
    const token = localStorage.getItem('staff_token');
    const urlParams = new URLSearchParams();
    if (params.date) urlParams.append('date', params.date);
    if (params.department) urlParams.append('department', params.department);
    if (params.class_year) urlParams.append('class_year', params.class_year);
    if (params.search) urlParams.append('search', params.search);

    const qs = urlParams.toString() ? `?${urlParams.toString()}` : '';
    const res = await fetch(`${API_BASE}/api/staff/attendance${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load student attendance');
    return res.json();
  },

  async updateStaffAttendance(payload) {
    const token = localStorage.getItem('staff_token');
    const res = await fetch(`${API_BASE}/api/staff/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to update attendance');
    return data;
  },

  async getStaffLectureAlerts() {
    const token = localStorage.getItem('staff_token');
    const res = await fetch(`${API_BASE}/api/staff/lecture-alerts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load lecture bunk alerts');
    return res.json();
  },

  async getStaffAttendanceReport() {
    const token = localStorage.getItem('staff_token');
    const res = await fetch(`${API_BASE}/api/staff/attendance/report`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load attendance report');
    return res.json();
  },

  async getStaffNotices() {
    const token = localStorage.getItem('staff_token');
    const res = await fetch(`${API_BASE}/api/staff/notices`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load notices');
    return res.json();
  },

  // --- Hostel Gate Movement Biometric API ---
  async recordHostelMovement(payload) {
    const res = await fetch(`${API_BASE}/api/hostel/movement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to record hostel movement');
    }
    return data;
  },

  async getTodayHostelMovements() {
    const res = await fetch(`${API_BASE}/api/hostel/movements/today`);
    if (!res.ok) throw new Error('Failed to fetch today movements');
    return res.json();
  },

  async getStudentTodayMovement(studentId) {
    const res = await fetch(`${API_BASE}/api/hostel/movements/student/${encodeURIComponent(studentId)}`);
    if (!res.ok) throw new Error('Failed to fetch student hostel activity');
    return res.json();
  },

  async getWardenMovementSummary() {
    const res = await fetch(`${API_BASE}/api/hostel/movements/warden/summary`);
    if (!res.ok) throw new Error('Failed to fetch warden movements summary');
    return res.json();
  },

  // --- PARENT PORTAL APIS ---
  async registerParent(payload) {
    const res = await fetch(`${API_BASE}/api/parent/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Parent registration failed');
    return data;
  },

  async loginParent(credentials) {
    const res = await fetch(`${API_BASE}/api/parent/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Parent login failed');
    return data;
  },

  async getParentDashboard() {
    const token = localStorage.getItem('parent_token');
    const res = await fetch(`${API_BASE}/api/parent/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load parent dashboard');
    return res.json();
  },

  async getParentStudent() {
    const token = localStorage.getItem('parent_token');
    const res = await fetch(`${API_BASE}/api/parent/student`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load student details');
    return res.json();
  },

  async getParentHostelActivity() {
    const token = localStorage.getItem('parent_token');
    const res = await fetch(`${API_BASE}/api/parent/hostel-activity`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load hostel activity');
    return res.json();
  },

  async getParentAttendance() {
    const token = localStorage.getItem('parent_token');
    const res = await fetch(`${API_BASE}/api/parent/attendance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load college attendance');
    return res.json();
  },

  async getParentLeaveRequests() {
    const token = localStorage.getItem('parent_token');
    const res = await fetch(`${API_BASE}/api/parent/leave-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load leave requests');
    return res.json();
  },

  async getParentComplaints() {
    const token = localStorage.getItem('parent_token');
    const res = await fetch(`${API_BASE}/api/parent/complaints`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load complaints');
    return res.json();
  },

  async getParentNotices() {
    const token = localStorage.getItem('parent_token');
    const res = await fetch(`${API_BASE}/api/parent/notices`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load notices');
    return res.json();
  },

  async getParentProfile() {
    const token = localStorage.getItem('parent_token');
    const res = await fetch(`${API_BASE}/api/parent/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load parent profile');
    return res.json();
  },
};



