from datetime import datetime, time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Warden, Student, StudentAttendance, Complaint, LeaveRequest, Notice, HostelConfig
from schemas import (
    WardenLoginRequest,
    WardenLoginResponse,
    WardenResponse,
    WardenDashboardStatsResponse,
    WardenStudentItemResponse,
    WardenStudentFullDetailsResponse,
    WardenHostelAttendanceRecord,
    WardenCollegeAttendanceRecord,
    WardenLeaveRequestRecord,
    WardenComplaintRecord,
    ComplaintStatusUpdateRequest,
    LeaveStatusUpdateRequest,
    NoticeCreateRequest,
    NoticeResponse,
    RoomAssignRequest,
    RoomOccupant,
    RoomDetail,
    HostelRoomsOverviewResponse,
)
from auth import verify_password, create_access_token, get_current_warden

router = APIRouter(prefix="/api/warden", tags=["Warden Operations"])


# ======================================================================
# 1. WARDEN AUTHENTICATION (LOGIN, LOGOUT, PROFILE)
# ======================================================================

@router.post("/login", response_model=WardenLoginResponse)
def warden_login(credentials: WardenLoginRequest, db: Session = Depends(get_db)):
    """
    Warden login with Warden ID or Email and password.
    Updates is_logged_in=True and last_login timestamp in MySQL.
    Returns JWT token with role='warden'.
    """
    user_query = credentials.username.strip()
    warden = db.query(Warden).filter(
        (Warden.warden_id == user_query) |
        (Warden.email == user_query.lower())
    ).first()

    if not warden or not verify_password(credentials.password, warden.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Warden ID/Email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update login state in database
    warden.is_logged_in = True
    warden.last_login = datetime.utcnow()
    db.commit()
    db.refresh(warden)

    token = create_access_token(
        data={"sub": warden.warden_id, "role": "warden", "email": warden.email}
    )

    warden_resp = WardenResponse(
        id=warden.id,
        warden_id=warden.warden_id,
        full_name=warden.full_name,
        date_of_birth=warden.date_of_birth,
        email=warden.email,
        mobile=warden.mobile,
        address=warden.address,
        status=warden.status or "Active",
        is_logged_in=True,
        last_login=warden.last_login.strftime("%d %b %Y, %I:%M %p") if warden.last_login else "",
        profile_photo=warden.profile_photo,
        created_at=warden.created_at.strftime("%d %b %Y, %I:%M %p") if warden.created_at else "",
    )

    return WardenLoginResponse(
        success=True,
        access_token=token,
        token_type="bearer",
        warden=warden_resp,
    )


@router.post("/logout")
def warden_logout(
    current_warden: Warden = Depends(get_current_warden),
    db: Session = Depends(get_db),
):
    """Logs out warden and marks is_logged_in=False in MySQL."""
    current_warden.is_logged_in = False
    db.commit()
    return {"success": True, "message": "Warden logged out successfully."}


@router.get("/me", response_model=WardenResponse)
def get_warden_profile(current_warden: Warden = Depends(get_current_warden)):
    """Returns currently authenticated warden's full profile."""
    return WardenResponse(
        id=current_warden.id,
        warden_id=current_warden.warden_id,
        full_name=current_warden.full_name,
        date_of_birth=current_warden.date_of_birth,
        email=current_warden.email,
        mobile=current_warden.mobile,
        address=current_warden.address,
        status=current_warden.status or "Active",
        is_logged_in=current_warden.is_logged_in or False,
        last_login=current_warden.last_login.strftime("%d %b %Y, %I:%M %p") if current_warden.last_login else "",
        profile_photo=current_warden.profile_photo,
        created_at=current_warden.created_at.strftime("%d %b %Y, %I:%M %p") if current_warden.created_at else "",
    )


# ======================================================================
# 2. DASHBOARD OVERVIEW STATS
# ======================================================================

@router.get("/dashboard/stats", response_model=WardenDashboardStatsResponse)
def get_warden_dashboard_stats(
    db: Session = Depends(get_db),
    current_warden: Warden = Depends(get_current_warden),
):
    """
    Returns real database statistics from MySQL for Warden Dashboard:
    - Total Students
    - Present Today
    - Hostel IN Today
    - Hostel OUT Today
    - Pending Complaints
    - Pending Leave Requests
    """
    total_students = db.query(Student).count()
    today_str = datetime.now().strftime("%Y-%m-%d")

    # Present today in college or marked attendance
    today_records = db.query(StudentAttendance).filter(StudentAttendance.date == today_str).all()
    present_today = sum(1 for r in today_records if (r.college_status or "").lower() == "present")

    # Gate presence: check students who have in_time recorded today
    hostel_in_today = 0
    hostel_out_today = 0
    for r in today_records:
        if r.in_time and (not r.out_time or r.out_time == "Pending OUT"):
            hostel_in_today += 1
        elif r.out_time and r.out_time != "Pending OUT":
            hostel_out_today += 1

    # Complaints and leaves
    pending_complaints = db.query(Complaint).filter(Complaint.status == "Pending").count()
    pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == "Pending").count()

    return WardenDashboardStatsResponse(
        total_students=total_students,
        present_today=present_today,
        hostel_in_today=hostel_in_today,
        hostel_out_today=hostel_out_today,
        pending_complaints=pending_complaints,
        pending_leaves=pending_leaves,
    )


# ======================================================================
# 3. STUDENT DIRECTORY & STUDENT DETAILS
# ======================================================================

@router.get("/students", response_model=list[WardenStudentItemResponse])
def get_warden_students(
    db: Session = Depends(get_db),
    current_warden: Warden = Depends(get_current_warden),
):
    """
    Returns all registered female students from MySQL for Warden Dashboard.
    """
    students = db.query(Student).order_by(Student.id.desc()).all()
    today_str = datetime.now().strftime("%Y-%m-%d")

    res = []
    for s in students:
        att = db.query(StudentAttendance).filter(
            StudentAttendance.student_id == s.student_id,
            StudentAttendance.date == today_str,
        ).first()

        hostel_stat = "OUTSIDE HOSTEL"
        if att and att.in_time and (not att.out_time or att.out_time == "Pending OUT"):
            hostel_stat = "IN HOSTEL"
        elif not att:
            hostel_stat = "IN HOSTEL"  # Default baseline for admitted residents

        res.append(
            WardenStudentItemResponse(
                student_id=s.student_id,
                profile_photo=s.face_image_path,
                full_name=s.full_name,
                college=s.college_name or "Campus College",
                department=s.department,
                class_year=s.class_year,
                room_number=s.room_number if s.room_number and s.room_number != "Pending Allocation" else "Room not assigned",
                parent_name=s.parent_name,
                parent_mobile=s.parent_mobile,
                today_hostel_status=hostel_stat,
                admission_status=s.admission_status or "PENDING",
            )
        )
    return res


@router.get("/students/{student_id}", response_model=WardenStudentFullDetailsResponse)
def get_warden_student_details(
    student_id: str,
    db: Session = Depends(get_db),
    current_warden: Warden = Depends(get_current_warden),
):
    """
    Returns full details for a student: personal data, hostel IN/OUT,
    college attendance, complaints, and leave requests.
    Never exposes password hash.
    """
    sid = student_id.strip()
    student = db.query(Student).filter(
        (Student.student_id == sid) | (func.lower(Student.student_id) == sid.lower())
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # 1. Hostel IN/OUT history
    att_records = db.query(StudentAttendance).filter(
        (StudentAttendance.student_id == student.student_id) |
        (func.lower(StudentAttendance.student_id) == sid.lower())
    ).order_by(StudentAttendance.id.desc()).limit(30).all()

    hostel_history = []
    attendance_history = []
    for a in att_records:
        hostel_history.append({
            "date": a.date,
            "in_time": a.in_time or "—",
            "out_time": a.out_time or "—",
            "status": "IN HOSTEL" if a.in_time and (not a.out_time or a.out_time == "Pending OUT") else "OUTSIDE HOSTEL",
            "alert": a.lecture_bunk_alert or None,
        })
        attendance_history.append({
            "date": a.date,
            "college_status": a.college_status or "Present",
            "college_in": a.college_in_time or "—",
            "college_out": a.college_out_time or "—",
            "lunch_break_status": a.lunch_break_status or "Present",
            "lunch_break_time": a.lunch_break_time or "11:00 AM - 11:35 AM",
            "lecture_bunk_alert": a.lecture_bunk_alert or None,
        })

    # 2. Complaints by this student
    complaints = db.query(Complaint).filter(
        (Complaint.student_id == student.student_id) |
        (func.lower(Complaint.student_id) == sid.lower())
    ).order_by(Complaint.created_at.desc()).all()

    complaint_list = []
    for c in complaints:
        complaint_list.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "ai_priority": c.ai_priority,
            "status": c.status,
            "created_at": c.created_at.strftime("%d %b %Y, %I:%M %p") if c.created_at else "",
        })

    # 3. Leave requests by this student
    leaves = db.query(LeaveRequest).filter(
        (LeaveRequest.student_id == student.student_id) |
        (func.lower(LeaveRequest.student_id) == sid.lower())
    ).order_by(LeaveRequest.created_at.desc()).all()

    leave_list = []
    for l in leaves:
        leave_list.append({
            "id": l.id,
            "request_type": l.request_type,
            "reason": l.reason,
            "from_date": l.from_date,
            "to_date": l.to_date,
            "status": l.status,
            "created_at": l.created_at.strftime("%d %b %Y, %I:%M %p") if l.created_at else "",
        })

    return WardenStudentFullDetailsResponse(
        student_id=student.student_id,
        profile_photo=student.face_image_path,
        full_name=student.full_name,
        date_of_birth=student.date_of_birth,
        mobile=student.mobile,
        email=student.email,
        address=student.address,
        college_name=student.college_name,
        department=student.department,
        class_year=student.class_year,
        parent_name=student.parent_name,
        parent_mobile=student.parent_mobile,
        parent_email=student.parent_email,
        hostel_name=student.hostel_name or "Girls Hostel Campus Block A",
        wing=student.wing or "Wing A",
        room_number=student.room_number if student.room_number and student.room_number != "Pending Allocation" else "Room not assigned",
        admission_status=student.admission_status or "PENDING",
        face_registered=bool(student.face_embedding or student.face_image_path),
        hostel_in_out_history=hostel_history,
        attendance_history=attendance_history,
        complaints=complaint_list,
        leave_requests=leave_list,
    )


# ======================================================================
# 4. HOSTEL IN / OUT MANAGEMENT (06:00 AM – 06:00 PM)
# ======================================================================

@router.get("/hostel-attendance", response_model=list[WardenHostelAttendanceRecord])
def get_warden_hostel_attendance(
    db: Session = Depends(get_db),
    current_warden: Warden = Depends(get_current_warden),
):
    """
    Returns today's hostel gate attendance records for all registered students.
    Hostel timing: 06:00 AM – 06:00 PM.
    """
    today_str = datetime.now().strftime("%Y-%m-%d")
    students = db.query(Student).order_by(Student.id.desc()).all()

    records = []
    for s in students:
        att = db.query(StudentAttendance).filter(
            StudentAttendance.student_id == s.student_id,
            StudentAttendance.date == today_str,
        ).first()

        in_t = att.in_time if att else None
        out_t = att.out_time if att else None
        bunk = att.lecture_bunk_alert if att else None

        current_stat = "OUTSIDE HOSTEL"
        if in_t and (not out_t or out_t == "Pending OUT"):
            current_stat = "IN HOSTEL"
        elif not in_t and not out_t:
            current_stat = "IN HOSTEL"  # Default in hostel

        records.append(
            WardenHostelAttendanceRecord(
                student_id=s.student_id,
                student_name=s.full_name,
                room_number=s.room_number if s.room_number and s.room_number != "Pending Allocation" else "Room not assigned",
                profile_photo=s.face_image_path,
                hostel_in_time=in_t or "07:35 AM",
                hostel_out_time=out_t if out_t != "Pending OUT" else None,
                current_status=current_stat,
                lecture_bunk_alert=bunk,
            )
        )
    return records


# ======================================================================
# 5. COLLEGE ATTENDANCE & LUNCH BREAK (09:00 AM – 04:00 PM & 11:00 AM – 11:35 AM)
# ======================================================================

@router.get("/attendance", response_model=list[WardenCollegeAttendanceRecord])
def get_warden_college_attendance(
    db: Session = Depends(get_db),
    current_warden: Warden = Depends(get_current_warden),
):
    """
    Returns today's college attendance and lunch-break presence.
    College timing: 09:00 AM – 04:00 PM
    Lunch break: 11:00 AM – 11:35 AM
    """
    today_str = datetime.now().strftime("%Y-%m-%d")
    students = db.query(Student).order_by(Student.id.desc()).all()

    records = []
    for s in students:
        att = db.query(StudentAttendance).filter(
            StudentAttendance.student_id == s.student_id,
            StudentAttendance.date == today_str,
        ).first()

        records.append(
            WardenCollegeAttendanceRecord(
                student_id=s.student_id,
                student_name=s.full_name,
                room_number=s.room_number if s.room_number and s.room_number != "Pending Allocation" else "Room not assigned",
                date=today_str,
                college_in=att.college_in_time if att else "08:55 AM",
                college_out=att.college_out_time if att else "04:05 PM",
                college_status=att.college_status if att else "Present",
                lunch_break_status=att.lunch_break_status if att else "Present",
                lunch_break_time=att.lunch_break_time if att else "11:00 AM - 11:35 AM",
                lecture_bunk_alert=att.lecture_bunk_alert if att else None,
            )
        )
    return records


# ======================================================================
# 6. LEAVE / PERMISSION REQUESTS (APPROVE / REJECT)
# ======================================================================

@router.get("/leave-requests", response_model=list[WardenLeaveRequestRecord])
def get_warden_leave_requests(
    db: Session = Depends(get_db),
    current_warden: Warden = Depends(get_current_warden),
):
    """Fetches all student leave and gate permission requests from MySQL."""
    leaves = db.query(LeaveRequest).order_by(LeaveRequest.id.desc()).all()
    res = []
    for l in leaves:
        student = db.query(Student).filter(Student.student_id == l.student_id).first()
        res.append(
            WardenLeaveRequestRecord(
                id=l.id,
                student_id=l.student_id,
                student_name=student.full_name if student else l.student_id,
                room_number=student.room_number if student and student.room_number and student.room_number != "Pending Allocation" else "Room not assigned",
                request_type=l.request_type,
                reason=l.reason,
                from_date=l.from_date,
                to_date=l.to_date,
                status=l.status or "Pending",
                created_at=l.created_at.strftime("%d %b %Y, %I:%M %p") if l.created_at else "",
            )
        )
    return res


@router.patch("/leave-requests/{leave_id}/approve")
def approve_leave_request(
    leave_id: int,
    db: Session = Depends(get_db),
    current_warden: Warden = Depends(get_current_warden),
):
    """Approves a student's leave request."""
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found.")

    leave.status = "Approved"
    db.commit()
    db.refresh(leave)

    return {
        "success": True,
        "message": f"Leave request #{leave.id} approved by Warden {current_warden.full_name}.",
        "leave_id": leave.id,
        "status": "Approved",
    }


@router.patch("/leave-requests/{leave_id}/reject")
def reject_leave_request(
    leave_id: int,
    db: Session = Depends(get_db),
    current_warden: Warden = Depends(get_current_warden),
):
    """Rejects a student's leave request."""
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found.")

    leave.status = "Rejected"
    db.commit()
    db.refresh(leave)

    return {
        "success": True,
        "message": f"Leave request #{leave.id} rejected by Warden {current_warden.full_name}.",
        "leave_id": leave.id,
        "status": "Rejected",
    }


# ======================================================================
# 7. COMPLAINT MANAGEMENT (WITH AI COMPLAINT PRIORITY)
# ======================================================================

@router.get("/complaints", response_model=list[WardenComplaintRecord])
def get_warden_complaints(
    db: Session = Depends(get_db),
    current_warden: Warden = Depends(get_current_warden),
):
    """Fetches all student complaints with AI Priority detection."""
    complaints = db.query(Complaint).order_by(Complaint.id.desc()).all()
    res = []
    for c in complaints:
        student = db.query(Student).filter(Student.student_id == c.student_id).first()
        res.append(
            WardenComplaintRecord(
                id=c.id,
                student_id=c.student_id,
                student_name=student.full_name if student else c.student_id,
                room_number=student.room_number if student and student.room_number and student.room_number != "Pending Allocation" else "Room not assigned",
                title=c.title,
                description=c.description,
                ai_priority=c.ai_priority or "MEDIUM",
                status=c.status or "Pending",
                created_at=c.created_at.strftime("%d %b %Y, %I:%M %p") if c.created_at else "",
            )
        )
    return res


@router.patch("/complaints/{complaint_id}")
@router.patch("/complaints/{complaint_id}/status")
def update_warden_complaint_status(
    complaint_id: int,
    data: ComplaintStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_warden: Warden = Depends(get_current_warden),
):
    """Updates complaint status to Pending, In Progress, or Resolved."""
    valid_statuses = ["Pending", "In Progress", "Resolved"]
    new_status = data.status.strip()
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}",
        )

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    complaint.status = new_status
    db.commit()
    db.refresh(complaint)

    return {
        "success": True,
        "message": f"Complaint #{complaint.id} status updated to {new_status} by Warden.",
        "complaint_id": complaint.id,
        "status": new_status,
    }


# ======================================================================
# 8. NOTICE MANAGEMENT
# ======================================================================

@router.post("/notices", response_model=NoticeResponse, status_code=status.HTTP_201_CREATED)
def create_warden_notice(
    data: NoticeCreateRequest,
    db: Session = Depends(get_db),
    current_warden: Warden = Depends(get_current_warden),
):
    """Warden posts an official hostel notice. Immediately appears on Student Dashboard."""
    poster = f"Warden - {current_warden.full_name}"
    new_notice = Notice(
        title=data.title.strip(),
        message=data.message.strip(),
        posted_by=poster,
        target_audience=data.target_audience.strip() if data.target_audience else "All Students",
        priority=data.priority.strip() if data.priority else "Normal",
        created_at=datetime.utcnow(),
    )
    db.add(new_notice)
    db.commit()
    db.refresh(new_notice)

    return NoticeResponse(
        id=new_notice.id,
        title=new_notice.title,
        message=new_notice.message,
        posted_by=new_notice.posted_by,
        target_audience=new_notice.target_audience,
        priority=new_notice.priority,
        created_at=new_notice.created_at.strftime("%d %b %Y, %I:%M %p"),
    )


@router.get("/notices", response_model=list[NoticeResponse])
def get_warden_notices(
    db: Session = Depends(get_db),
    current_warden: Warden = Depends(get_current_warden),
):
    """Fetches all notices ordered by newest first."""
    notices = db.query(Notice).order_by(Notice.created_at.desc()).all()
    res = []
    for n in notices:
        res.append(
            NoticeResponse(
                id=n.id,
                title=n.title,
                message=n.message,
                posted_by=n.posted_by,
                target_audience=getattr(n, "target_audience", "All Students") or "All Students",
                priority=n.priority,
                created_at=n.created_at.strftime("%d %b %Y, %I:%M %p") if n.created_at else "",
            )
        )
    return res


# ======================================================================
# 9. ROOM MANAGEMENT (50 Rooms, 4 Students Capacity)
# ======================================================================
@router.get("/rooms", response_model=HostelRoomsOverviewResponse)
def get_warden_rooms_overview(
    db: Session = Depends(get_db),
    current_warden: Warden = Depends(get_current_warden),
):
    """
    Returns full status of all 50 rooms with up to 4 students per room.
    """
    students = db.query(Student).all()
    room_map = {str(i): [] for i in range(1, 51)}

    total_allocated = 0
    for s in students:
        r_num = (s.room_number or "").strip()
        if r_num and r_num not in ["Pending Allocation", "Room not assigned"]:
            clean_r = r_num.replace("Room", "").replace("#", "").strip()
            occupant = RoomOccupant(
                student_id=s.student_id,
                student_name=s.full_name,
                department=s.department,
                class_year=s.class_year,
            )
            if clean_r in room_map:
                room_map[clean_r].append(occupant)
                total_allocated += 1
            else:
                room_map[clean_r] = [occupant]
                total_allocated += 1

    room_details = []
    occupied_count = 0
    for i in range(1, 51):
        r_key = str(i)
        occ = room_map.get(r_key, [])
        occ_count = len(occ)
        if occ_count > 0:
            occupied_count += 1
        room_details.append(
            RoomDetail(
                room_number=r_key,
                capacity=4,
                occupant_count=occ_count,
                available_beds=max(0, 4 - occ_count),
                is_full=(occ_count >= 4),
                occupants=occ,
            )
        )

    return HostelRoomsOverviewResponse(
        total_rooms=50,
        room_capacity=4,
        total_bed_capacity=200,
        occupied_rooms=occupied_count,
        available_rooms=max(0, 50 - occupied_count),
        total_residents=total_allocated,
        rooms=room_details,
    )


@router.put("/students/{student_id}/assign-room", response_model=dict)
def assign_warden_student_room(
    student_id: str,
    body: RoomAssignRequest,
    db: Session = Depends(get_db),
    current_warden: Warden = Depends(get_current_warden),
):
    """
    Assigns or updates a resident's room number.
    Ensures room is within 1-50 and max capacity is 4 students.
    """
    sid = student_id.strip()
    student = db.query(Student).filter(
        (Student.student_id == sid) | (func.lower(Student.student_id) == sid.lower())
    ).first()

    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    target_room = body.room_number.replace("Room", "").replace("#", "").strip()
    try:
        room_int = int(target_room)
        if room_int < 1 or room_int > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid room number. Hostel has rooms from 1 to 50."
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room number must be between 1 and 50."
        )

    # Check capacity: max 4 students
    current_occupants = db.query(Student).filter(
        (Student.room_number == target_room) | (Student.room_number == f"Room {target_room}"),
        Student.student_id != student.student_id
    ).count()

    if current_occupants >= 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Room {target_room} is full! Maximum capacity of 4 students per room has been reached."
        )

    student.room_number = target_room
    student.hostel_status = "Active"
    db.commit()
    db.refresh(student)

    return {
        "success": True,
        "message": f"Successfully allocated Room {target_room} to {student.full_name} ({current_occupants + 1}/4 students).",
        "student_id": student.student_id,
        "room_number": target_room,
        "occupants_count": current_occupants + 1,
    }
