from datetime import datetime, time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import StudentAttendance, HostelConfig, Student
from schemas import (
    AttendanceRecordRequest,
    AttendanceStatusResponse,
    AttendanceDetailResponse,
    AttendanceRiskResponse,
)
from services.ai_service import predict_attendance_risk

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

def get_hostel_timing(db: Session) -> str:
    """Retrieves configurable hostel timing from database, defaulting to 6:00 AM – 6:00 PM."""
    timing = db.query(HostelConfig).filter(HostelConfig.config_key == "hostel_timing").first()
    if timing:
        return timing.config_value
    return "6:00 AM – 6:00 PM"

def check_lecture_bunk(now_time: datetime) -> tuple[bool, str]:
    """
    SMART/RULE-BASED (NOT AI): Lecture Bunk Detection.
    College timing: 09:00 AM to 04:00 PM.
    Lunch break: 11:00 AM to 11:35 AM.
    If student enters hostel during college hours outside lunch break, flags an alert.
    """
    t = now_time.time()
    college_start = time(9, 0)
    college_end = time(16, 0)
    lunch_start = time(11, 0)
    lunch_end = time(11, 35)

    if college_start <= t <= college_end:
        # Check if inside permissible lunch break
        if lunch_start <= t <= lunch_end:
            return False, "Hostel entry during permitted Lunch Break (11:00 AM - 11:35 AM)."
        else:
            return True, f"Possible lecture absence detected: Student entered hostel at {now_time.strftime('%I:%M %p')} during active college hours."
    return False, ""

@router.post("/hostel-in", response_model=AttendanceStatusResponse)
def record_hostel_in(data: AttendanceRecordRequest, db: Session = Depends(get_db)):
    """
    Records student entry into the hostel using actual server time.
    Executes smart rule-based lecture bunk detection.
    """
    sid = data.student_id.strip()
    student = db.query(Student).filter(
        (Student.student_id == sid) | (func.lower(Student.student_id) == sid.lower())
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student ID not found.")

    actual_sid = student.student_id
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    current_time_str = now.strftime("%I:%M %p")

    # Smart Rule-Based Lecture Bunk check
    is_bunk, bunk_msg = check_lecture_bunk(now)

    record = db.query(StudentAttendance).filter(
        (StudentAttendance.student_id == actual_sid) | (func.lower(StudentAttendance.student_id) == sid.lower()),
        StudentAttendance.date == today_str
    ).first()

    # Determine lunch break status
    t = now.time()
    lunch_status = "Present"
    if time(11, 0) <= t <= time(11, 35):
        lunch_status = "Present in Hostel"

    if not record:
        record = StudentAttendance(
            student_id=actual_sid,
            date=today_str,
            college_present_time="08:55 AM",
            college_in_time="08:55 AM",
            college_out_time="04:05 PM",
            college_status="Present",
            lunch_break_status=lunch_status,
            lunch_break_time="11:00 AM - 11:35 AM",
            in_time=current_time_str,
            out_time=None,
            lecture_bunk_alert=bunk_msg if is_bunk else None,
        )
        db.add(record)
    else:
        record.in_time = current_time_str
        if is_bunk:
            record.lecture_bunk_alert = bunk_msg
        if time(11, 0) <= t <= time(11, 35):
            record.lunch_break_status = "Present in Hostel"

    db.commit()
    db.refresh(record)

    msg = f"Hostel IN time recorded at {current_time_str}"
    if is_bunk:
        msg += f" (Smart Alert: {bunk_msg})"

    return AttendanceStatusResponse(
        success=True,
        message=msg,
        date=today_str,
        time=current_time_str,
        type="IN"
    )

@router.post("/hostel-out", response_model=AttendanceStatusResponse)
def record_hostel_out(data: AttendanceRecordRequest, db: Session = Depends(get_db)):
    """
    Records student exit from the hostel using actual server time.
    """
    sid = data.student_id.strip()
    student = db.query(Student).filter(
        (Student.student_id == sid) | (func.lower(Student.student_id) == sid.lower())
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student ID not found.")

    actual_sid = student.student_id
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    current_time_str = now.strftime("%I:%M %p")

    record = db.query(StudentAttendance).filter(
        (StudentAttendance.student_id == actual_sid) | (func.lower(StudentAttendance.student_id) == sid.lower()),
        StudentAttendance.date == today_str
    ).first()

    if not record:
        record = StudentAttendance(
            student_id=actual_sid,
            date=today_str,
            college_present_time="08:55 AM",
            college_in_time="08:55 AM",
            college_out_time="04:05 PM",
            college_status="Present",
            lunch_break_status="Present",
            lunch_break_time="11:00 AM - 11:35 AM",
            in_time=None,
            out_time=current_time_str,
            lecture_bunk_alert=None,
        )
        db.add(record)
    else:
        record.out_time = current_time_str

    db.commit()
    db.refresh(record)

    return AttendanceStatusResponse(
        success=True,
        message=f"Hostel OUT time recorded at {current_time_str}",
        date=today_str,
        time=current_time_str,
        type="OUT"
    )

@router.get("/student/{student_id}", response_model=AttendanceDetailResponse)
@router.get("/today/{student_id}")
def get_student_attendance(student_id: str, db: Session = Depends(get_db)):
    """Returns today's comprehensive attendance, lunch break, and gate records."""
    sid = student_id.strip()
    student = db.query(Student).filter(
        (Student.student_id == sid) | (func.lower(Student.student_id) == sid.lower())
    ).first()
    actual_sid = student.student_id if student else sid

    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    formatted_date = now.strftime("%A, %d %B %Y")

    record = db.query(StudentAttendance).filter(
        (StudentAttendance.student_id == actual_sid) | (func.lower(StudentAttendance.student_id) == sid.lower()),
        StudentAttendance.date == today_str
    ).first()

    # Ensure baseline record exists for today if student exists
    if student and not record:
        record = StudentAttendance(
            student_id=actual_sid,
            date=today_str,
            college_present_time="08:55 AM",
            college_in_time="08:55 AM",
            college_out_time="04:05 PM",
            college_status="Present",
            lunch_break_status="Present",
            lunch_break_time="11:00 AM - 11:35 AM",
            in_time="07:35 AM",
            out_time="Pending OUT",
            lecture_bunk_alert=None,
        )
        db.add(record)
        db.commit()
        db.refresh(record)

    return AttendanceDetailResponse(
        student_id=actual_sid,
        date_formatted=formatted_date,
        date_iso=today_str,
        college_status=record.college_status if record and record.college_status else "Present",
        college_in_time=record.college_in_time if record and record.college_in_time else "08:55 AM",
        college_out_time=record.college_out_time if record and record.college_out_time else "04:05 PM",
        lunch_break_status=record.lunch_break_status if record and record.lunch_break_status else "Present",
        lunch_break_time=record.lunch_break_time if record and record.lunch_break_time else "11:00 AM - 11:35 AM",
        in_time=record.in_time if record and record.in_time else "Pending IN",
        out_time=record.out_time if record and record.out_time else "Pending OUT",
        hostel_timing=get_hostel_timing(db),
        lecture_bunk_alert=record.lecture_bunk_alert if record else None,
    )

@router.get("/risk/{student_id}", response_model=AttendanceRiskResponse)
def get_attendance_risk(student_id: str, db: Session = Depends(get_db)):
    """
    AI FEATURE 2: AI Attendance Risk Prediction.
    Evaluates real attendance records from MySQL and predicts risk level.
    """
    sid = student_id.strip()
    records = db.query(StudentAttendance).filter(
        (StudentAttendance.student_id == sid) | (func.lower(StudentAttendance.student_id) == sid.lower())
    ).all()

    record_dicts = []
    for r in records:
        record_dicts.append({
            "date": r.date,
            "college_status": r.college_status,
            "in_time": r.in_time,
            "out_time": r.out_time,
            "lecture_bunk_alert": r.lecture_bunk_alert,
        })

    prediction = predict_attendance_risk(record_dicts)
    return AttendanceRiskResponse(**prediction)
