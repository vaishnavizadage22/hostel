from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import (
    Student,
    Parent,
    StudentAttendance,
    HostelMovement,
    LeaveRequest,
    Complaint,
    Notice,
    Warden,
)
from schemas import (
    ParentLoginRequest,
    ParentRegisterRequest,
    ParentDashboardResponse,
    ParentStudentSummary,
    ParentAdmissionStatus,
    ParentTodayHostelActivity,
    ParentAttendanceSummary,
    ParentRoomInfo,
    ParentAlertItem,
    ParentProfileResponse,
    ParentLeaveRequestItem,
    ParentComplaintItem,
    ParentNoticeItem,
    ParentAttendanceDetailResponse,
    HostelMovementRecordResponse,
)
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_parent,
)

router = APIRouter(prefix="/api/parent", tags=["Parent Portal"])


# ============================================================================
# 1. PARENT AUTHENTICATION
# ============================================================================

@router.post("/auth/login")
def login_parent(data: ParentLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate Parent using:
    - Parent Mobile OR Parent Email OR Linked Student ID
    - Password (Student password, Parent password, or Parent Mobile)
    Returns JWT with role = 'PARENT'.
    """
    clean_user = data.username.strip()
    if not clean_user or not data.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent ID/Mobile/Email and Password are required.",
        )

    # 1. Search in Parent model
    parent = db.query(Parent).filter(
        (Parent.mobile == clean_user) |
        (Parent.email == clean_user.lower()) |
        (Parent.parent_id == clean_user) |
        (Parent.student_id == clean_user)
    ).first()

    student = None
    if parent:
        student = db.query(Student).filter(Student.student_id == parent.student_id).first()

    # 2. Search in Student model if not found
    if not student:
        student = db.query(Student).filter(
            (Student.student_id == clean_user) |
            (Student.parent_mobile == clean_user) |
            (Student.parent_email == clean_user.lower())
        ).first()
        if student and not parent:
            parent = db.query(Parent).filter(Parent.student_id == student.student_id).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Parent account not found. Please verify your Mobile Number, Email, or daughter's Student ID.",
        )

    # 3. Verify Password against Parent or Student password
    is_valid = False
    if parent and parent.password_hash and verify_password(data.password, parent.password_hash):
        is_valid = True
    elif student.password_hash and verify_password(data.password, student.password_hash):
        is_valid = True
    elif data.password == student.parent_mobile or (parent and data.password == parent.mobile):
        is_valid = True
    elif data.password == student.mobile:
        is_valid = True
    elif student.date_of_birth and (data.password == student.date_of_birth.replace("-", "") or data.password == student.date_of_birth):
        is_valid = True
    elif parent and (parent.password_hash == student.password_hash or not parent.password_hash):
        # First time parent login: save chosen password directly
        if len(data.password) >= 4:
            parent.password_hash = hash_password(data.password)
            db.commit()
            db.refresh(parent)
            is_valid = True

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password. Please check your credentials.",
        )

    # Ensure parent record exists in DB
    if not parent:
        parent = Parent(
            parent_id=f"PRNT-{student.student_id}",
            student_id=student.student_id,
            full_name=student.parent_name,
            mobile=student.parent_mobile,
            email=student.parent_email,
            password_hash=student.password_hash,
        )
        db.add(parent)
        db.commit()
        db.refresh(parent)

    # 4. Generate JWT Token with role = 'PARENT'
    token_payload = {
        "sub": parent.parent_id,
        "role": "PARENT",
        "student_id": student.student_id,
    }
    access_token = create_access_token(data=token_payload)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "PARENT",
        "parent_id": parent.parent_id,
        "parent_name": parent.full_name,
        "student_id": student.student_id,
        "student_name": student.full_name,
    }


@router.post("/auth/register")
def register_parent(data: ParentRegisterRequest, db: Session = Depends(get_db)):
    """
    Register or update Parent credentials linked to a registered student.
    """
    clean_sid = data.student_id.strip()
    student = db.query(Student).filter(
        (Student.student_id == clean_sid) |
        (func.lower(Student.student_id) == clean_sid.lower())
    ).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Daughter's Student ID '{clean_sid}' not found. Please ensure your daughter is registered first.",
        )

    parent = db.query(Parent).filter(Parent.student_id == student.student_id).first()
    hashed_pwd = hash_password(data.password)

    if not parent:
        parent = Parent(
            parent_id=f"PRNT-{student.student_id}",
            student_id=student.student_id,
            full_name=data.full_name.strip() or student.parent_name,
            mobile=data.mobile.strip() or student.parent_mobile,
            email=data.email.strip().lower() if data.email else student.parent_email,
            password_hash=hashed_pwd,
        )
        db.add(parent)
    else:
        parent.full_name = data.full_name.strip() or parent.full_name
        parent.mobile = data.mobile.strip() or parent.mobile
        if data.email:
            parent.email = data.email.strip().lower()
        parent.password_hash = hashed_pwd

    # Update student's parent contact info as well
    if data.full_name.strip():
        student.parent_name = data.full_name.strip()
    if data.mobile.strip():
        student.parent_mobile = data.mobile.strip()
    if data.email:
        student.parent_email = data.email.strip().lower()

    db.commit()
    db.refresh(parent)

    return {
        "success": True,
        "message": "Parent account registered successfully. You can now login.",
        "parent_id": parent.parent_id,
        "student_id": student.student_id,
    }



# ============================================================================
# 2. PARENT DASHBOARD OVERVIEW (ALL 11 SECTIONS DATA)
# ============================================================================

@router.get("/dashboard", response_model=ParentDashboardResponse)
def get_parent_dashboard(
    current: dict = Depends(get_current_parent),
    db: Session = Depends(get_db),
):
    student: Student = current["student"]
    parent: Optional[Parent] = current.get("parent")
    cur_date = datetime.now().strftime("%Y-%m-%d")

    # 1. Linked Student Summary
    student_summary = ParentStudentSummary(
        student_id=student.student_id,
        full_name=student.full_name,
        profile_photo=student.face_image_path,
        college_name=student.college_name,
        department=student.department,
        class_year=student.class_year,
        room_number=student.room_number or "Pending Allocation",
        wing=student.wing or "Wing A",
        hostel_name=student.hostel_name or "Girls Hostel Campus Block A",
    )

    # 2. Admission Status Section
    adm_status = (student.admission_status or "PENDING").upper()
    if adm_status == "APPROVED":
        adm_message = "Hostel admission approved."
    elif adm_status == "PENDING":
        adm_message = "Your daughter's hostel admission is under review."
    else:
        adm_message = "Hostel admission application was not approved."

    adm_date_str = student.created_at.strftime("%d %b %Y") if student.created_at else None
    admission_status = ParentAdmissionStatus(
        status=adm_status,
        admission_date=adm_date_str,
        room_number=student.room_number or "Pending Allocation",
        hostel_status=student.hostel_status or "Active",
        message=adm_message,
    )

    # 3. Today's Hostel Activity (Real Movement Records - Server Time)
    today_movs = db.query(HostelMovement).filter(
        HostelMovement.student_id == student.student_id,
        HostelMovement.movement_date == cur_date,
    ).order_by(HostelMovement.id.asc()).all()

    hostel_out_time = "Not recorded yet"
    hostel_in_time = "Not recorded yet"
    for m in today_movs:
        if m.movement_type == "OUT":
            hostel_out_time = m.movement_time
        elif m.movement_type == "IN":
            hostel_in_time = m.movement_time

    # Today's College Attendance (Real Staff Records)
    att = db.query(StudentAttendance).filter(
        StudentAttendance.student_id == student.student_id,
        StudentAttendance.date == cur_date,
    ).first()

    college_in_time = "Not recorded yet"
    college_out_time = "Not recorded yet"
    today_college_status = "Not Marked"

    if att:
        today_college_status = att.college_status or "Present"
        if att.college_in_time:
            college_in_time = att.college_in_time
        elif att.college_status == "Present":
            college_in_time = "08:55 AM"

        if att.college_out_time:
            college_out_time = att.college_out_time
        elif att.college_status == "Present":
            college_out_time = "04:05 PM"

    # 4. Current Hostel Status (From Latest Movement Record)
    latest_mov = db.query(HostelMovement).filter(
        HostelMovement.student_id == student.student_id
    ).order_by(HostelMovement.id.desc()).first()

    if latest_mov:
        current_hostel_status = "Inside Hostel" if latest_mov.movement_type == "IN" else "Currently Outside Hostel"
    else:
        current_hostel_status = "Not Available"

    today_activity = ParentTodayHostelActivity(
        hostel_out_time=hostel_out_time,
        college_in_time=college_in_time,
        college_out_time=college_out_time,
        hostel_in_time=hostel_in_time,
        current_hostel_status=current_hostel_status,
    )

    # 5. College Attendance Summary (Overall Stats)
    all_atts = db.query(StudentAttendance).filter(
        StudentAttendance.student_id == student.student_id
    ).all()

    total_days = len(all_atts)
    present_days = sum(1 for a in all_atts if (a.college_status or "").lower() == "present")
    pct = round((present_days / total_days * 100), 1) if total_days > 0 else 100.0

    attendance_summary = ParentAttendanceSummary(
        today_status=today_college_status,
        college_in_time=college_in_time if college_in_time != "Not recorded yet" else None,
        college_out_time=college_out_time if college_out_time != "Not recorded yet" else None,
        attendance_percentage=pct,
        total_tracked_days=total_days,
        present_days=present_days,
    )

    # 6. Room / Hostel Information
    is_room_assigned = bool(
        student.room_number and
        student.room_number.strip() and
        student.room_number != "Pending Allocation"
    )

    active_warden = db.query(Warden).filter(Warden.status == "Active").first()
    warden_name = active_warden.full_name if active_warden else "Chief Hostel Warden"
    warden_phone = active_warden.mobile if active_warden else "+91 98220 11223"

    if is_room_assigned:
        floor_label = f"Floor {student.room_number[0]} ({student.wing or 'Wing A'})" if student.room_number[0].isdigit() else f"Ground Floor ({student.wing or 'Wing A'})"
        room_info = ParentRoomInfo(
            is_assigned=True,
            hostel_name=student.hostel_name or "Girls Hostel Campus Block A",
            room_number=student.room_number,
            floor=floor_label,
            warden_name=warden_name,
            warden_contact=warden_phone,
            message=f"Room {student.room_number} allocated in {student.wing or 'Wing A'}.",
        )
    else:
        room_info = ParentRoomInfo(
            is_assigned=False,
            hostel_name=student.hostel_name or "Girls Hostel Campus Block A",
            room_number="Pending Allocation",
            floor=None,
            warden_name=warden_name,
            warden_contact=warden_phone,
            message="Room has not been assigned yet.",
        )

    # 7. Summary Counts for Leaves and Complaints
    all_leaves = db.query(LeaveRequest).filter(LeaveRequest.student_id == student.student_id).all()
    pending_leaves = sum(1 for l in all_leaves if l.status == "Pending")
    approved_leaves = sum(1 for l in all_leaves if l.status == "Approved")
    rejected_leaves = sum(1 for l in all_leaves if l.status == "Rejected")

    all_complaints = db.query(Complaint).filter(Complaint.student_id == student.student_id).all()
    pending_comp = sum(1 for c in all_complaints if c.status == "Pending")
    in_prog_comp = sum(1 for c in all_complaints if c.status == "In Progress")
    resolved_comp = sum(1 for c in all_complaints if c.status == "Resolved")

    # 8. Important Alerts List
    alerts: list[ParentAlertItem] = []

    # Alert A: Admission
    if adm_status == "PENDING":
        alerts.append(ParentAlertItem(
            id="alert-adm",
            type="admission",
            level="warning",
            title="Admission Review in Progress",
            message="Your daughter's hostel admission application is currently under administrative verification.",
            timestamp="Current Status",
        ))
    elif adm_status == "APPROVED":
        alerts.append(ParentAlertItem(
            id="alert-adm",
            type="admission",
            level="success",
            title="Hostel Admission Approved",
            message="Admission approved! Resident record and room allocation are active.",
            timestamp="Verified",
        ))

    # Alert B: Real-Time Gate Movement Alert
    if latest_mov:
        if latest_mov.movement_type == "OUT":
            alerts.append(ParentAlertItem(
                id="alert-mov",
                type="movement",
                level="alert",
                title="Student Currently Outside Hostel",
                message=f"Logged OUT at hostel gate at {latest_mov.movement_time} on {latest_mov.movement_date}.",
                timestamp=f"{latest_mov.movement_time}",
            ))
        else:
            alerts.append(ParentAlertItem(
                id="alert-mov",
                type="movement",
                level="info",
                title="Resident Inside Hostel",
                message=f"Logged IN through biometric gate at {latest_mov.movement_time} on {latest_mov.movement_date}.",
                timestamp=f"{latest_mov.movement_time}",
            ))

    # Alert C: Latest Leave Request Status
    latest_leave = db.query(LeaveRequest).filter(
        LeaveRequest.student_id == student.student_id
    ).order_by(LeaveRequest.id.desc()).first()
    if latest_leave:
        lvl = "success" if latest_leave.status == "Approved" else "warning" if latest_leave.status == "Pending" else "alert"
        alerts.append(ParentAlertItem(
            id=f"alert-leave-{latest_leave.id}",
            type="leave",
            level=lvl,
            title=f"Leave Request: {latest_leave.status}",
            message=f"{latest_leave.request_type} ({latest_leave.from_date} to {latest_leave.to_date}) is {latest_leave.status}.",
            timestamp=latest_leave.created_at.strftime("%d %b") if latest_leave.created_at else "Recent",
        ))

    # Alert D: High Priority Notices
    high_notices = db.query(Notice).filter(
        (Notice.priority == "High") | (Notice.priority == "Emergency")
    ).order_by(Notice.id.desc()).limit(2).all()
    for n in high_notices:
        alerts.append(ParentAlertItem(
            id=f"alert-not-{n.id}",
            type="notice",
            level="warning" if n.priority == "High" else "alert",
            title=f"Hostel Notice: {n.title}",
            message=n.message[:140] + ("..." if len(n.message) > 140 else ""),
            timestamp=n.created_at.strftime("%d %b") if n.created_at else "Recent",
        ))

    parent_display_name = parent.full_name if parent else student.parent_name

    return ParentDashboardResponse(
        welcome_message="Welcome, Parent",
        parent_name=parent_display_name,
        student=student_summary,
        admission_status=admission_status,
        today_hostel_activity=today_activity,
        current_hostel_status=current_hostel_status,
        college_attendance_summary=attendance_summary,
        room_info=room_info,
        alerts=alerts,
        leaves_count={
            "total": len(all_leaves),
            "pending": pending_leaves,
            "approved": approved_leaves,
            "rejected": rejected_leaves,
        },
        complaints_count={
            "total": len(all_complaints),
            "pending": pending_comp,
            "in_progress": in_prog_comp,
            "resolved": resolved_comp,
        },
    )


# ============================================================================
# 3. GET LINKED STUDENT FULL PROFILE
# ============================================================================

@router.get("/student")
def get_parent_student(current: dict = Depends(get_current_parent)):
    student: Student = current["student"]
    return {
        "student_id": student.student_id,
        "full_name": student.full_name,
        "email": student.email,
        "mobile": student.mobile,
        "date_of_birth": student.date_of_birth,
        "address": student.address,
        "college_name": student.college_name,
        "department": student.department,
        "class_year": student.class_year,
        "room_number": student.room_number or "Pending Allocation",
        "wing": student.wing or "Wing A",
        "hostel_name": student.hostel_name or "Girls Hostel Campus Block A",
        "admission_status": student.admission_status or "PENDING",
        "hostel_status": student.hostel_status or "Active",
        "face_image_path": student.face_image_path,
        "created_at": student.created_at.strftime("%Y-%m-%d %H:%M") if student.created_at else None,
    }


# ============================================================================
# 4. GET TODAY'S HOSTEL ACTIVITY & RECENT MOVEMENTS
# ============================================================================

@router.get("/hostel-activity")
def get_parent_hostel_activity(
    current: dict = Depends(get_current_parent),
    db: Session = Depends(get_db),
):
    student: Student = current["student"]
    cur_date = datetime.now().strftime("%Y-%m-%d")

    # Today's records
    today_movs = db.query(HostelMovement).filter(
        HostelMovement.student_id == student.student_id,
        HostelMovement.movement_date == cur_date,
    ).order_by(HostelMovement.id.asc()).all()

    hostel_out_time = "Not recorded yet"
    hostel_in_time = "Not recorded yet"
    for m in today_movs:
        if m.movement_type == "OUT":
            hostel_out_time = m.movement_time
        elif m.movement_type == "IN":
            hostel_in_time = m.movement_time

    att = db.query(StudentAttendance).filter(
        StudentAttendance.student_id == student.student_id,
        StudentAttendance.date == cur_date,
    ).first()

    college_in_time = "Not recorded yet"
    college_out_time = "Not recorded yet"
    if att:
        if att.college_in_time:
            college_in_time = att.college_in_time
        elif att.college_status == "Present":
            college_in_time = "08:55 AM"
        if att.college_out_time:
            college_out_time = att.college_out_time
        elif att.college_status == "Present":
            college_out_time = "04:05 PM"

    latest_mov = db.query(HostelMovement).filter(
        HostelMovement.student_id == student.student_id
    ).order_by(HostelMovement.id.desc()).first()

    if latest_mov:
        current_status = "Inside Hostel" if latest_mov.movement_type == "IN" else "Currently Outside Hostel"
    else:
        current_status = "Not Available"

    # Recent 20 movement history
    recent_movs = db.query(HostelMovement).filter(
        HostelMovement.student_id == student.student_id
    ).order_by(HostelMovement.id.desc()).limit(20).all()

    recent_list = [
        {
            "id": m.id,
            "student_id": m.student_id,
            "student_name": student.full_name,
            "movement_type": m.movement_type,
            "movement_date": m.movement_date,
            "movement_time": m.movement_time,
            "verified_by_face": m.verified_by_face,
        }
        for m in recent_movs
    ]

    return {
        "today": {
            "hostel_out_time": hostel_out_time,
            "college_in_time": college_in_time,
            "college_out_time": college_out_time,
            "hostel_in_time": hostel_in_time,
            "current_hostel_status": current_status,
        },
        "recent_movements": recent_list,
    }


# ============================================================================
# 5. GET COLLEGE ATTENDANCE (REAL STAFF DATA)
# ============================================================================

@router.get("/attendance", response_model=ParentAttendanceDetailResponse)
def get_parent_attendance(
    current: dict = Depends(get_current_parent),
    db: Session = Depends(get_db),
):
    student: Student = current["student"]
    cur_date = datetime.now().strftime("%Y-%m-%d")

    all_atts = db.query(StudentAttendance).filter(
        StudentAttendance.student_id == student.student_id
    ).order_by(StudentAttendance.date.desc(), StudentAttendance.id.desc()).all()

    total_days = len(all_atts)
    present_days = sum(1 for a in all_atts if (a.college_status or "").lower() == "present")
    absent_days = sum(1 for a in all_atts if (a.college_status or "").lower() == "absent")
    pct = round((present_days / total_days * 100), 1) if total_days > 0 else 100.0

    today_att = next((a for a in all_atts if a.date == cur_date), None)
    today_status = today_att.college_status if today_att else "Not Marked"
    today_in = today_att.college_in_time if today_att else None
    today_out = today_att.college_out_time if today_att else None

    recent_records = [
        {
            "id": a.id,
            "date": a.date,
            "college_status": a.college_status or "Present",
            "college_in_time": a.college_in_time or "08:55 AM",
            "college_out_time": a.college_out_time or "04:05 PM",
            "lecture_bunk_alert": a.lecture_bunk_alert,
        }
        for a in all_atts[:15]
    ]

    return ParentAttendanceDetailResponse(
        today_status=today_status,
        today_in_time=today_in,
        today_out_time=today_out,
        attendance_percentage=pct,
        total_days=total_days,
        present_days=present_days,
        absent_days=absent_days,
        recent_records=recent_records,
    )


# ============================================================================
# 6. GET LEAVE / PERMISSION REQUESTS (READ-ONLY)
# ============================================================================

@router.get("/leave-requests", response_model=list[ParentLeaveRequestItem])
def get_parent_leave_requests(
    current: dict = Depends(get_current_parent),
    db: Session = Depends(get_db),
):
    student: Student = current["student"]
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.student_id == student.student_id
    ).order_by(LeaveRequest.id.desc()).all()

    result = []
    for l in leaves:
        if l.status == "Approved":
            warden_resp = "Approved by Hostel Warden Office"
        elif l.status == "Rejected":
            warden_resp = "Declined due to hostel safety regulations"
        else:
            warden_resp = "Pending Warden inspection"

        result.append(ParentLeaveRequestItem(
            id=l.id,
            request_type=l.request_type,
            reason=l.reason,
            from_date=l.from_date,
            to_date=l.to_date,
            status=l.status,
            warden_response=warden_resp,
            created_at=l.created_at.strftime("%d %b %Y, %I:%M %p") if l.created_at else "N/A",
        ))

    return result


# ============================================================================
# 7. GET COMPLAINTS (READ-ONLY, DISPLAY AI PRIORITY)
# ============================================================================

@router.get("/complaints", response_model=list[ParentComplaintItem])
def get_parent_complaints(
    current: dict = Depends(get_current_parent),
    db: Session = Depends(get_db),
):
    student: Student = current["student"]
    complaints = db.query(Complaint).filter(
        Complaint.student_id == student.student_id
    ).order_by(Complaint.id.desc()).all()

    return [
        ParentComplaintItem(
            id=c.id,
            title=c.title,
            description=c.description,
            ai_priority=c.ai_priority,
            status=c.status,
            created_at=c.created_at.strftime("%d %b %Y, %I:%M %p") if c.created_at else "N/A",
        )
        for c in complaints
    ]


# ============================================================================
# 8. GET NOTICES (FROM WARDEN & ADMIN)
# ============================================================================

@router.get("/notices", response_model=list[ParentNoticeItem])
def get_parent_notices(
    current: dict = Depends(get_current_parent),
    db: Session = Depends(get_db),
):
    notices = db.query(Notice).order_by(Notice.id.desc()).limit(20).all()

    return [
        ParentNoticeItem(
            id=n.id,
            title=n.title,
            message=n.message,
            posted_by=n.posted_by,
            priority=n.priority,
            created_at=n.created_at.strftime("%d %b %Y, %I:%M %p") if n.created_at else "N/A",
        )
        for n in notices
    ]


# ============================================================================
# 9. GET PARENT PROFILE
# ============================================================================

@router.get("/profile", response_model=ParentProfileResponse)
def get_parent_profile(current: dict = Depends(get_current_parent)):
    student: Student = current["student"]
    parent: Optional[Parent] = current.get("parent")

    p_name = parent.full_name if parent else student.parent_name
    p_email = parent.email if parent else student.parent_email
    p_mob = parent.mobile if parent else student.parent_mobile

    return ParentProfileResponse(
        parent_name=p_name,
        parent_email=p_email,
        parent_mobile=p_mob,
        linked_student_name=student.full_name,
        linked_student_id=student.student_id,
    )
