from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from database import Base

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    admin_slot = Column(Integer, unique=True, nullable=False, default=1)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(30), nullable=False)
    password_hash = Column(String(255), nullable=False)
    profile_photo = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    date_of_birth = Column(String(20), nullable=False)
    mobile = Column(String(30), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    address = Column(Text, nullable=False)
    college_name = Column(String(150), nullable=False)
    department = Column(String(100), nullable=False)
    class_year = Column(String(50), nullable=False)
    parent_name = Column(String(100), nullable=False)
    parent_mobile = Column(String(30), nullable=False)
    parent_email = Column(String(150), nullable=True)
    password_hash = Column(String(255), nullable=False)
    face_image_path = Column(String(255), nullable=True)
    face_embedding = Column(Text, nullable=True)  # JSON-encoded array of 128 floats
    
    # Hostel allocation information
    hostel_name = Column(String(100), default="Girls Hostel Campus Block A")
    wing = Column(String(50), default="Wing A")
    room_number = Column(String(50), default="Pending Allocation")
    hostel_status = Column(String(50), default="Active")
    admission_status = Column(String(50), default="PENDING")
    created_at = Column(DateTime, default=datetime.utcnow)

class StudentAttendance(Base):
    __tablename__ = "student_attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), nullable=False, index=True)
    date = Column(String(20), nullable=False)  # Format: "YYYY-MM-DD"
    college_present_time = Column(String(30), nullable=True)
    in_time = Column(String(30), nullable=True)
    out_time = Column(String(30), nullable=True)
    college_in_time = Column(String(30), nullable=True, default="08:55 AM")
    college_out_time = Column(String(30), nullable=True, default="04:05 PM")
    college_status = Column(String(30), nullable=True, default="Present")
    lunch_break_status = Column(String(30), nullable=True, default="Present")
    lunch_break_time = Column(String(50), nullable=True, default="11:00 AM - 11:35 AM")
    lecture_bunk_alert = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class HostelConfig(Base):
    __tablename__ = "hostel_config"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(100), unique=True, nullable=False)
    config_value = Column(String(255), nullable=False)

class Warden(Base):
    __tablename__ = "wardens"

    id = Column(Integer, primary_key=True, index=True)
    warden_id = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    date_of_birth = Column(String(20), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    mobile = Column(String(30), nullable=False)
    address = Column(Text, nullable=False)
    password_hash = Column(String(255), nullable=False)
    profile_photo = Column(String(255), nullable=False)
    status = Column(String(50), default="Active")
    is_logged_in = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    posted_by = Column(String(100), default="Hostel Administration")
    target_audience = Column(String(100), default="All Students")
    priority = Column(String(50), default="Normal")
    created_at = Column(DateTime, default=datetime.utcnow)

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    ai_priority = Column(String(50), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, EMERGENCY
    status = Column(String(50), default="Pending")  # Pending, In Progress, Resolved
    created_at = Column(DateTime, default=datetime.utcnow)

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), nullable=False, index=True)
    request_type = Column(String(100), nullable=False)
    reason = Column(Text, nullable=False)
    from_date = Column(String(50), nullable=False)
    to_date = Column(String(50), nullable=False)
    status = Column(String(50), default="Pending")  # Pending, Approved, Rejected
    created_at = Column(DateTime, default=datetime.utcnow)

class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    date_of_birth = Column(String(20), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    mobile = Column(String(30), nullable=False)
    address = Column(Text, nullable=False)
    password_hash = Column(String(255), nullable=False)
    profile_photo = Column(String(255), nullable=False)
    status = Column(String(50), default="Active")
    is_logged_in = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class HostelMovement(Base):
    __tablename__ = "hostel_movements"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), nullable=False, index=True)
    movement_type = Column(String(10), nullable=False)  # IN / OUT
    movement_date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    movement_time = Column(String(20), nullable=False)  # e.g., 05:45 PM
    verified_by_face = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Parent(Base):
    __tablename__ = "parents"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(String(50), unique=True, nullable=False, index=True)
    student_id = Column(String(50), nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    mobile = Column(String(30), nullable=False, index=True)
    email = Column(String(150), nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)




