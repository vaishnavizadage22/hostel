import re
from datetime import datetime
from typing import Optional, Union
from pydantic import BaseModel, field_validator

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

# --- ADMIN SCHEMAS ---
class AdminRegisterRequest(BaseModel):
    full_name: str
    email: str
    phone: str
    password: str
    profile_photo: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid email format")
        return clean

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class AdminResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    profile_photo: Optional[str] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    success: bool
    token: str
    token_type: str = "bearer"
    admin: AdminResponse

class AdminStatusResponse(BaseModel):
    exists: bool
    message: str


# --- STUDENT SCHEMAS ---
class StudentRegisterRequest(BaseModel):
    full_name: str
    date_of_birth: str
    mobile: str
    email: str
    address: str
    college_name: str
    department: str
    class_year: str
    parent_name: str
    parent_mobile: str
    parent_email: Optional[str] = None
    face_image_base64: str  # Base64 data URL or pure base64 captured by camera

class StudentRegisterResponse(BaseModel):
    success: bool
    message: str
    student_id: str
    temporary_password: str

class StudentLoginRequest(BaseModel):
    student_id: str
    password: str

class StudentLoginInitResponse(BaseModel):
    success: bool
    message: str
    require_face_verification: bool
    student_id: str
    full_name: str

class StudentFaceVerifyRequest(BaseModel):
    student_id: str
    face_image_base64: str

class StudentProfileResponse(BaseModel):
    student_id: str
    full_name: str
    date_of_birth: str
    mobile: str
    email: str
    address: str
    college_name: str
    department: str
    class_year: str
    parent_name: str
    parent_mobile: str
    parent_email: Optional[str] = None
    hostel_name: str
    wing: str
    room_number: Optional[str] = "Pending Allocation"
    hostel_status: str
    admission_status: Optional[str] = "PENDING"
    face_image_path: Optional[str] = None
    created_at: Optional[Union[datetime, str]] = None

    class Config:
        from_attributes = True

class StudentAuthResponse(BaseModel):
    success: bool
    token: str
    token_type: str = "bearer"
    student: StudentProfileResponse

class AttendanceRecordRequest(BaseModel):
    student_id: str

class AttendanceStatusResponse(BaseModel):
    success: bool
    message: str
    date: str
    time: str
    type: str  # "IN" or "OUT"

# --- WARDEN SCHEMAS ---
class WardenRegisterRequest(BaseModel):
    full_name: str
    date_of_birth: str
    email: str
    mobile: str
    address: str
    password: str
    profile_photo: str  # Base64 data URL or pure base64 string

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid email format")
        return clean

class WardenRegisterResponse(BaseModel):
    success: bool
    message: str
    warden_id: str
    password: str
    full_name: str

# --- NOTICE SCHEMAS ---
class NoticeCreateRequest(BaseModel):
    title: str
    message: str
    posted_by: Optional[str] = "Hostel Administration"
    target_audience: Optional[str] = "All Students"
    priority: Optional[str] = "Normal"

class NoticeResponse(BaseModel):
    id: int
    title: str
    message: str
    posted_by: str
    target_audience: Optional[str] = "All Students"
    priority: str
    created_at: str

    class Config:
        from_attributes = True

# --- COMPLAINT SCHEMAS ---
class ComplaintCreateRequest(BaseModel):
    student_id: str
    title: str
    description: str

class ComplaintResponse(BaseModel):
    id: int
    student_id: str
    title: str
    description: str
    ai_priority: str
    status: str
    created_at: str

    class Config:
        from_attributes = True

# --- LEAVE REQUEST SCHEMAS ---
class LeaveRequestCreate(BaseModel):
    student_id: str
    request_type: str
    reason: str
    from_date: str
    to_date: str

class LeaveRequestResponse(BaseModel):
    id: int
    student_id: str
    request_type: str
    reason: str
    from_date: str
    to_date: str
    status: str
    created_at: str

    class Config:
        from_attributes = True

# --- CHATBOT SCHEMAS ---
class ChatbotRequest(BaseModel):
    message: str
    student_id: Optional[str] = None

class ChatbotResponse(BaseModel):
    reply: str
    timestamp: str

# --- ATTENDANCE DETAIL & RISK SCHEMAS ---
class AttendanceDetailResponse(BaseModel):
    student_id: str
    date_formatted: str
    date_iso: str
    college_status: str
    college_in_time: str
    college_out_time: str
    lunch_break_status: str
    lunch_break_time: str
    in_time: str
    out_time: str
    hostel_timing: str
    lecture_bunk_alert: Optional[str] = None

class AttendanceRiskResponse(BaseModel):
    risk_level: str
    risk_score: int
    attendance_percentage: float
    total_days: int
    present_days: int
    explanation: str

# --- ADMIN DASHBOARD SCHEMAS ---
class WardenResponse(BaseModel):
    id: int
    warden_id: str
    full_name: str
    date_of_birth: str
    email: str
    mobile: str
    address: str
    status: str = "Active"
    is_logged_in: bool = False
    last_login: Optional[str] = None
    profile_photo: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True

class StudentDetailResponse(BaseModel):
    id: int
    student_id: str
    full_name: str
    date_of_birth: str
    mobile: str
    email: str
    address: str
    college_name: str
    department: str
    class_year: str
    parent_name: str
    parent_mobile: str
    parent_email: Optional[str] = None
    hostel_name: str
    wing: str
    room_number: str
    hostel_status: str
    admission_status: str
    face_registered: bool
    face_image_path: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True

class AdminDashboardStatsResponse(BaseModel):
    total_students: int
    total_wardens: int
    pending_admissions: int
    approved_admissions: int
    rejected_admissions: int
    total_complaints: int
    pending_complaints: int
    resolved_complaints: int
    total_leaves: int
    pending_leaves: int
    total_rooms: int
    occupied_rooms: int
    available_rooms: int
    room_allocation_available: bool
    room_capacity: int = 4
    total_bed_capacity: int = 200
    total_allocated_beds: int = 0

class RoomAssignRequest(BaseModel):
    room_number: str

class RoomOccupant(BaseModel):
    student_id: str
    student_name: str
    department: str
    class_year: str

class RoomDetail(BaseModel):
    room_number: str
    capacity: int = 4
    occupant_count: int
    available_beds: int
    is_full: bool
    occupants: list[RoomOccupant] = []

class HostelRoomsOverviewResponse(BaseModel):
    total_rooms: int = 50
    room_capacity: int = 4
    total_bed_capacity: int = 200
    occupied_rooms: int
    available_rooms: int
    total_residents: int
    rooms: list[RoomDetail]

class ComplaintStatusUpdateRequest(BaseModel):
    status: str  # "Pending", "In Progress", "Resolved"

class LeaveStatusUpdateRequest(BaseModel):
    status: str  # "Pending", "Approved", "Rejected"

class AdminAttendanceRecord(BaseModel):
    student_id: str
    student_name: str
    department: str
    class_year: str
    college_status: str
    college_in_time: str
    college_out_time: str
    in_time: str
    out_time: str
    lunch_break_status: str
    lecture_bunk_alert: Optional[str] = None

class AdminAttendanceSummaryResponse(BaseModel):
    date: str
    total_students: int
    present_count: int
    absent_count: int
    hostel_in_count: int
    hostel_out_count: int
    bunk_alerts_count: int
    records: list[AdminAttendanceRecord]

# ======================================================================
# WARDEN DASHBOARD SCHEMAS
# ======================================================================

class WardenLoginRequest(BaseModel):
    username: str  # Warden ID or Email
    password: str

class WardenLoginResponse(BaseModel):
    success: bool
    access_token: str
    token_type: str = "bearer"
    warden: WardenResponse

class WardenDashboardStatsResponse(BaseModel):
    total_students: int
    present_today: int
    hostel_in_today: int
    hostel_out_today: int
    pending_complaints: int
    pending_leaves: int

class WardenStudentItemResponse(BaseModel):
    student_id: str
    profile_photo: Optional[str] = None
    full_name: str
    college: str
    department: str
    class_year: str
    room_number: str
    parent_name: str
    parent_mobile: str
    today_hostel_status: str
    admission_status: str

class WardenStudentFullDetailsResponse(BaseModel):
    student_id: str
    profile_photo: Optional[str] = None
    full_name: str
    date_of_birth: str
    mobile: str
    email: str
    address: str
    college_name: str
    department: str
    class_year: str
    parent_name: str
    parent_mobile: str
    parent_email: Optional[str] = None
    hostel_name: str
    wing: str
    room_number: str
    admission_status: str
    face_registered: bool
    hostel_in_out_history: list[dict] = []
    attendance_history: list[dict] = []
    complaints: list[dict] = []
    leave_requests: list[dict] = []

class WardenHostelAttendanceRecord(BaseModel):
    student_id: str
    student_name: str
    room_number: str
    profile_photo: Optional[str] = None
    hostel_in_time: Optional[str] = None
    hostel_out_time: Optional[str] = None
    current_status: str  # "IN HOSTEL" or "OUTSIDE HOSTEL"
    lecture_bunk_alert: Optional[str] = None

class WardenCollegeAttendanceRecord(BaseModel):
    student_id: str
    student_name: str
    room_number: str
    date: str
    college_in: Optional[str] = None
    college_out: Optional[str] = None
    college_status: str
    lunch_break_status: str
    lunch_break_time: str
    lecture_bunk_alert: Optional[str] = None

class WardenLeaveRequestRecord(BaseModel):
    id: int
    student_id: str
    student_name: str
    room_number: str
    request_type: str
    reason: str
    from_date: str
    to_date: str
    status: str
    created_at: str

class WardenComplaintRecord(BaseModel):
    id: int
    student_id: str
    student_name: str
    room_number: str
    title: str
    description: str
    ai_priority: str
    status: str
    created_at: str


# --- COLLEGE STAFF SCHEMAS ---
class StaffRegisterRequest(BaseModel):
    full_name: str
    date_of_birth: str
    email: str
    mobile: str
    address: str
    password: str
    profile_photo: str  # Base64 data URL or pure base64 string

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid email format")
        return clean

class StaffRegisterResponse(BaseModel):
    success: bool
    message: str
    staff_id: str
    email: str
    full_name: str

class StaffLoginRequest(BaseModel):
    username: str
    password: str

class StaffResponse(BaseModel):
    id: int
    staff_id: str
    full_name: str
    date_of_birth: str
    email: str
    mobile: str
    address: str
    status: str
    is_logged_in: bool
    last_login: Optional[str] = ""
    profile_photo: Optional[str] = None
    created_at: Optional[str] = ""

class StaffLoginResponse(BaseModel):
    success: bool
    access_token: str
    token_type: str = "bearer"
    staff: StaffResponse

class StaffDashboardStatsResponse(BaseModel):
    total_students: int
    present_today: int
    absent_today: int
    late_today: int
    possible_lecture_alerts: int

class StaffStudentItemResponse(BaseModel):
    student_id: str
    profile_photo: Optional[str] = None
    full_name: str
    college: str
    department: str
    class_year: str
    attendance_percentage: float
    today_college_status: str
    today_college_in: Optional[str] = None
    today_college_out: Optional[str] = None

class StaffStudentFullDetailsResponse(BaseModel):
    student_id: str
    profile_photo: Optional[str] = None
    full_name: str
    date_of_birth: str
    mobile: str
    email: str
    address: str
    college_name: str
    department: str
    class_year: str
    parent_name: str
    parent_mobile: str
    parent_email: Optional[str] = None
    hostel_name: str
    room_number: str
    admission_status: str
    total_days_tracked: int
    present_days: int
    attendance_percentage: float
    attendance_history: list[dict] = []

class StaffAttendanceRecord(BaseModel):
    id: Optional[int] = None
    student_id: str
    student_name: str
    profile_photo: Optional[str] = None
    department: str
    class_year: str
    date: str
    college_in: Optional[str] = None
    college_out: Optional[str] = None
    college_status: str
    lunch_break_status: Optional[str] = "Present"
    lecture_bunk_alert: Optional[str] = None

class StaffAttendanceUpdateRequest(BaseModel):
    student_id: str
    date: Optional[str] = None
    college_status: str  # "Present", "Absent", "Late"
    college_in: Optional[str] = None
    college_out: Optional[str] = None

class StaffLectureAlertRecord(BaseModel):
    student_id: str
    student_name: str
    room_number: str
    department: str
    class_year: str
    hostel_status: str
    college_attendance_status: str
    alert_reason: str
    timestamp: str

class StaffAttendanceReportResponse(BaseModel):
    daily_summary: dict
    weekly_summary: dict
    monthly_summary: dict
    department_stats: list[dict]

# --- HOSTEL GATE MOVEMENT SCHEMAS ---
class HostelMovementRequest(BaseModel):
    student_id: Optional[str] = None
    movement_type: str  # "IN" or "OUT"
    face_image_base64: Optional[str] = None

class HostelMovementRecordResponse(BaseModel):
    id: int
    student_id: str
    student_name: str
    movement_type: str
    movement_date: str
    movement_time: str
    verified_by_face: bool

    class Config:
        from_attributes = True

class HostelMovementResponse(BaseModel):
    success: bool
    message: str
    student_name: str
    student_id: str
    movement_type: str
    movement_date: str
    movement_time: str
    status: str
    movement_id: int

class HostelStudentTodayActivity(BaseModel):
    student_id: str
    student_name: str
    date: str
    hostel_out_time: Optional[str] = None
    hostel_in_time: Optional[str] = None
    current_status: str  # "IN Hostel" / "OUT of Hostel" / "Not recorded yet"
    movements_count: int = 0

class HostelWardenMovementSummary(BaseModel):
    student_id: str
    student_name: str
    room_number: Optional[str] = "Pending Allocation"
    hostel_out_time: Optional[str] = None
    hostel_in_time: Optional[str] = None
    current_status: str  # "IN Hostel", "OUT of Hostel", "Not recorded yet"
    last_movement_time: Optional[str] = None

# --- PARENT MODULE SCHEMAS ---
class ParentLoginRequest(BaseModel):
    username: str  # Mobile, Email, or Student ID
    password: str

class ParentRegisterRequest(BaseModel):
    full_name: str
    mobile: str
    email: Optional[str] = None
    student_id: str
    password: str

class ParentStudentSummary(BaseModel):
    student_id: str
    full_name: str
    profile_photo: Optional[str] = None
    college_name: str
    department: str
    class_year: str
    room_number: Optional[str] = "Pending Allocation"
    wing: Optional[str] = "Wing A"
    hostel_name: Optional[str] = "Girls Hostel Campus Block A"

class ParentAdmissionStatus(BaseModel):
    status: str  # "PENDING", "APPROVED", "REJECTED"
    admission_date: Optional[str] = None
    room_number: Optional[str] = "Pending Allocation"
    hostel_status: str  # "Active", "In Hostel", etc.
    message: str

class ParentTodayHostelActivity(BaseModel):
    hostel_out_time: str = "Not recorded yet"
    college_in_time: str = "Not recorded yet"
    college_out_time: str = "Not recorded yet"
    hostel_in_time: str = "Not recorded yet"
    current_hostel_status: str = "Not Available"  # "Inside Hostel", "Currently Outside Hostel", "Not Available"

class ParentAttendanceSummary(BaseModel):
    today_status: str = "Not Marked"  # "Present", "Absent", "Late", "Not Marked"
    college_in_time: Optional[str] = None
    college_out_time: Optional[str] = None
    attendance_percentage: float = 100.0
    total_tracked_days: int = 0
    present_days: int = 0

class ParentRoomInfo(BaseModel):
    is_assigned: bool
    hostel_name: Optional[str] = None
    room_number: Optional[str] = None
    floor: Optional[str] = None
    warden_name: Optional[str] = None
    warden_contact: Optional[str] = None
    message: str

class ParentAlertItem(BaseModel):
    id: str
    type: str  # "admission", "movement", "leave", "notice"
    level: str  # "info", "warning", "success", "alert"
    title: str
    message: str
    timestamp: str

class ParentProfileResponse(BaseModel):
    parent_name: str
    parent_email: Optional[str] = None
    parent_mobile: str
    linked_student_name: str
    linked_student_id: str

class ParentDashboardResponse(BaseModel):
    welcome_message: str
    parent_name: str
    student: ParentStudentSummary
    admission_status: ParentAdmissionStatus
    today_hostel_activity: ParentTodayHostelActivity
    current_hostel_status: str
    college_attendance_summary: ParentAttendanceSummary
    room_info: ParentRoomInfo
    alerts: list[ParentAlertItem] = []
    leaves_count: dict = {}
    complaints_count: dict = {}

class ParentLeaveRequestItem(BaseModel):
    id: int
    request_type: str
    reason: str
    from_date: str
    to_date: str
    status: str
    warden_response: Optional[str] = None
    created_at: str

class ParentComplaintItem(BaseModel):
    id: int
    title: str
    description: str
    ai_priority: str
    status: str
    created_at: str

class ParentNoticeItem(BaseModel):
    id: int
    title: str
    message: str
    posted_by: str
    priority: str
    created_at: str

class ParentAttendanceDetailResponse(BaseModel):
    today_status: str
    today_in_time: Optional[str] = None
    today_out_time: Optional[str] = None
    attendance_percentage: float
    total_days: int
    present_days: int
    absent_days: int
    recent_records: list[dict] = []






