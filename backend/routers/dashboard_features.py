from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Notice, Complaint, LeaveRequest, Student
from schemas import (
    NoticeCreateRequest,
    NoticeResponse,
    ComplaintCreateRequest,
    ComplaintResponse,
    LeaveRequestCreate,
    LeaveRequestResponse,
    ChatbotRequest,
    ChatbotResponse,
)
from services.ai_service import classify_complaint_priority, process_chatbot_query

router = APIRouter(prefix="/api", tags=["Dashboard Features"])

# ======================================================================
# 1. NOTICES
# ======================================================================

@router.get("/notices/student", response_model=list[NoticeResponse])
@router.get("/notices", response_model=list[NoticeResponse])
def get_notices(db: Session = Depends(get_db)):
    """Fetches all active notices ordered by newest first."""
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

@router.post("/notices", response_model=NoticeResponse, status_code=status.HTTP_201_CREATED)
def create_notice(data: NoticeCreateRequest, db: Session = Depends(get_db)):
    """Creates a new hostel notice."""
    new_notice = Notice(
        title=data.title.strip(),
        message=data.message.strip(),
        posted_by=data.posted_by.strip() if data.posted_by else "Hostel Administration",
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

# ======================================================================
# 2. COMPLAINTS (WITH AI FEATURE 1: AI COMPLAINT PRIORITY)
# ======================================================================

@router.post("/complaints", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def submit_complaint(data: ComplaintCreateRequest, db: Session = Depends(get_db)):
    """
    Submits a hostel complaint.
    AI FEATURE 1: Automatically classifies priority into LOW, MEDIUM, HIGH, EMERGENCY.
    """
    sid = data.student_id.strip()
    student = db.query(Student).filter(
        (Student.student_id == sid) | (func.lower(Student.student_id) == sid.lower())
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student ID not found.")

    actual_sid = student.student_id

    # AI Priority Classification
    detected_priority = classify_complaint_priority(data.title, data.description)

    new_complaint = Complaint(
        student_id=actual_sid,
        title=data.title.strip(),
        description=data.description.strip(),
        ai_priority=detected_priority,
        status="Pending",
        created_at=datetime.utcnow(),
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    return ComplaintResponse(
        id=new_complaint.id,
        student_id=new_complaint.student_id,
        title=new_complaint.title,
        description=new_complaint.description,
        ai_priority=new_complaint.ai_priority,
        status=new_complaint.status,
        created_at=new_complaint.created_at.strftime("%d %b %Y, %I:%M %p"),
    )

@router.get("/complaints/student/{student_id}", response_model=list[ComplaintResponse])
def get_student_complaints(student_id: str, db: Session = Depends(get_db)):
    """Fetches complaints filed by this specific student."""
    sid = student_id.strip()
    complaints = db.query(Complaint).filter(
        (Complaint.student_id == sid) | (func.lower(Complaint.student_id) == sid.lower())
    ).order_by(Complaint.created_at.desc()).all()
    res = []
    for c in complaints:
        res.append(
            ComplaintResponse(
                id=c.id,
                student_id=c.student_id,
                title=c.title,
                description=c.description,
                ai_priority=c.ai_priority,
                status=c.status,
                created_at=c.created_at.strftime("%d %b %Y, %I:%M %p") if c.created_at else "",
            )
        )
    return res

@router.get("/complaints", response_model=list[ComplaintResponse])
def get_all_complaints(db: Session = Depends(get_db)):
    """Fetches all complaints for Admin and Warden."""
    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    res = []
    for c in complaints:
        res.append(
            ComplaintResponse(
                id=c.id,
                student_id=c.student_id,
                title=c.title,
                description=c.description,
                ai_priority=c.ai_priority,
                status=c.status,
                created_at=c.created_at.strftime("%d %b %Y, %I:%M %p") if c.created_at else "",
            )
        )
    return res

# ======================================================================
# 3. LEAVE / PERMISSION REQUESTS
# ======================================================================

@router.post("/leave-requests", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
def submit_leave_request(data: LeaveRequestCreate, db: Session = Depends(get_db)):
    """Submits a student leave or permission request."""
    sid = data.student_id.strip()
    student = db.query(Student).filter(
        (Student.student_id == sid) | (func.lower(Student.student_id) == sid.lower())
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student ID not found.")

    actual_sid = student.student_id

    new_leave = LeaveRequest(
        student_id=actual_sid,
        request_type=data.request_type.strip(),
        reason=data.reason.strip(),
        from_date=data.from_date.strip(),
        to_date=data.to_date.strip(),
        status="Pending",
        created_at=datetime.utcnow(),
    )
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)

    return LeaveRequestResponse(
        id=new_leave.id,
        student_id=new_leave.student_id,
        request_type=new_leave.request_type,
        reason=new_leave.reason,
        from_date=new_leave.from_date,
        to_date=new_leave.to_date,
        status=new_leave.status,
        created_at=new_leave.created_at.strftime("%d %b %Y, %I:%M %p"),
    )

@router.get("/leave-requests/student/{student_id}", response_model=list[LeaveRequestResponse])
def get_student_leave_requests(student_id: str, db: Session = Depends(get_db)):
    """Fetches leave requests submitted by this student."""
    sid = student_id.strip()
    leaves = db.query(LeaveRequest).filter(
        (LeaveRequest.student_id == sid) | (func.lower(LeaveRequest.student_id) == sid.lower())
    ).order_by(LeaveRequest.created_at.desc()).all()
    res = []
    for l in leaves:
        res.append(
            LeaveRequestResponse(
                id=l.id,
                student_id=l.student_id,
                request_type=l.request_type,
                reason=l.reason,
                from_date=l.from_date,
                to_date=l.to_date,
                status=l.status,
                created_at=l.created_at.strftime("%d %b %Y, %I:%M %p") if l.created_at else "",
            )
        )
    return res

@router.get("/leave-requests", response_model=list[LeaveRequestResponse])
def get_all_leave_requests(db: Session = Depends(get_db)):
    """Fetches all leave requests for Warden."""
    leaves = db.query(LeaveRequest).order_by(LeaveRequest.created_at.desc()).all()
    res = []
    for l in leaves:
        res.append(
            LeaveRequestResponse(
                id=l.id,
                student_id=l.student_id,
                request_type=l.request_type,
                reason=l.reason,
                from_date=l.from_date,
                to_date=l.to_date,
                status=l.status,
                created_at=l.created_at.strftime("%d %b %Y, %I:%M %p") if l.created_at else "",
            )
        )
    return res

# ======================================================================
# 4. AI HOSTEL CHATBOT (AI FEATURE 3)
# ======================================================================

@router.post("/chatbot", response_model=ChatbotResponse)
def hostel_chatbot(data: ChatbotRequest, db: Session = Depends(get_db)):
    """
    AI FEATURE 3: AI Hostel Chatbot.
    Answers student questions regarding hostel rules, timings, complaints, leaves, and contacts.
    """
    student_info = None
    if data.student_id:
        student = db.query(Student).filter(Student.student_id == data.student_id.strip().upper()).first()
        if student:
            student_info = {
                "full_name": student.full_name,
                "student_id": student.student_id,
            }

    reply = process_chatbot_query(data.message, student_info)
    return ChatbotResponse(
        reply=reply,
        timestamp=datetime.now().strftime("%I:%M %p"),
    )
