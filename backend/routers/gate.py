import os
import json
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Student, HostelMovement, StudentAttendance
from schemas import (
    HostelMovementRequest,
    HostelMovementResponse,
    HostelMovementRecordResponse,
    HostelStudentTodayActivity,
    HostelWardenMovementSummary,
)
from services.face_service import (
    detect_face_in_image,
    extract_face_embedding,
    compare_face_embeddings,
    FACES_DIR,
    get_face_match_threshold,
)
from routers.students import decode_base64_image

logger = logging.getLogger("hostel_gate")

router = APIRouter(prefix="/api/hostel", tags=["Hostel Gate Scanner"])

@router.post("/movement", response_model=HostelMovementResponse)
def record_hostel_movement(
    data: HostelMovementRequest,
    db: Session = Depends(get_db),
):
    """
    Hostel Gate Biometric Face Scanner Movement Endpoint.
    1. Verifies student identity via face biometrics using the standardized recognition pipeline.
    2. Validates movement logic: prevents duplicate IN-after-IN or OUT-after-OUT.
    3. Records movement using SERVER TIME.
    4. Synchronizes today's status in MySQL.
    """
    mov_type = data.movement_type.strip().upper()
    if mov_type not in ["IN", "OUT"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid movement type. Must be either 'IN' or 'OUT'."
        )

    matched_student = None

    # Step 1: Real Biometric Face Verification (if face image provided)
    if data.face_image_base64:
        try:
            live_bytes = decode_base64_image(data.face_image_base64)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid face image format."
            )

        # Detect face
        detection = detect_face_in_image(live_bytes)
        if not detection.get("face_detected"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Live face detection failed: Please position your face clearly in the camera view."
            )

        # Extract live face embedding
        live_emb = extract_face_embedding(live_bytes)
        threshold = get_face_match_threshold()

        # If student_id was provided, verify against this student (1:1 verification)
        if data.student_id:
            sid = data.student_id.strip()
            student = db.query(Student).filter(
                (Student.student_id == sid) | (func.lower(Student.student_id) == sid.lower())
            ).first()

            if not student:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Student ID '{sid}' not found."
                )

            # Retrieve registered embedding
            registered_emb = None
            if student.face_image_path:
                filename = os.path.basename(student.face_image_path)
                p = os.path.join(FACES_DIR, filename)
                if os.path.exists(p):
                    try:
                        registered_emb = extract_face_embedding(open(p, "rb").read())
                        student.face_embedding = json.dumps(registered_emb)
                        db.commit()
                    except Exception as e:
                        logger.warning(f"Could not load image for {sid}: {e}")

            if registered_emb is None and student.face_embedding:
                try:
                    registered_emb = json.loads(student.face_embedding)
                except Exception:
                    pass

            if not registered_emb:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Face verification data not available. Please contact administrator."
                )

            comp = compare_face_embeddings(registered_emb, live_emb, threshold=threshold)
            logger.info(
                f"[Gate Scanner] Student: {student.student_id} | Type: {mov_type} | "
                f"Sim: {comp['similarity']:.4f} | Thresh: {comp['threshold']:.4f} | Match: {comp['is_match']}"
            )

            if not comp["is_match"]:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Face verification failed. Access denied. (Similarity: {comp['similarity'] * 100:.1f}%)"
                )

            matched_student = student

        else:
            # 1:N Identification: compare live face against all registered female students
            students = db.query(Student).all()
            best_match = None
            best_sim = -1.0

            for s in students:
                reg_emb = None
                if s.face_image_path:
                    fn = os.path.basename(s.face_image_path)
                    p = os.path.join(FACES_DIR, fn)
                    if os.path.exists(p):
                        try:
                            reg_emb = extract_face_embedding(open(p, "rb").read())
                        except Exception:
                            pass
                if reg_emb is None and s.face_embedding:
                    try:
                        reg_emb = json.loads(s.face_embedding)
                    except Exception:
                        pass

                if reg_emb:
                    comp = compare_face_embeddings(reg_emb, live_emb, threshold=threshold)
                    if comp["similarity"] > best_sim:
                        best_sim = comp["similarity"]
                        if comp["is_match"]:
                            best_match = s

            if not best_match:
                logger.info(f"[Gate Scanner] 1:N search failed. Best sim: {best_sim:.4f} < {threshold:.4f}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Face verification failed. Access denied. (Similarity: {max(0.0, best_sim) * 100:.1f}%)"
                )

            matched_student = best_match
            logger.info(f"[Gate Scanner] 1:N identified student: {best_match.student_id} ({best_sim:.4f})")

    elif data.student_id:
        # Fallback if student_id provided without direct face (e.g. from authenticated gate test)
        sid = data.student_id.strip()
        matched_student = db.query(Student).filter(
            (Student.student_id == sid) | (func.lower(Student.student_id) == sid.lower())
        ).first()
        if not matched_student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student ID '{sid}' not found."
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Face image or Student ID is required to record hostel movement."
        )

    # Step 2: Validate Duplicate / Invalid Movement State (Requirement 9)
    # If latest movement is OUT -> next valid movement must be IN
    # If latest movement is IN -> next valid movement must be OUT
    latest_mov = db.query(HostelMovement).filter(
        HostelMovement.student_id == matched_student.student_id
    ).order_by(HostelMovement.id.desc()).first()

    if latest_mov:
        if latest_mov.movement_type == "OUT" and mov_type == "OUT":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid movement! {matched_student.full_name} is already OUT "
                    f"(recorded at {latest_mov.movement_time} on {latest_mov.movement_date}). "
                    f"Next valid action must be 'Hostel IN'."
                )
            )
        elif latest_mov.movement_type == "IN" and mov_type == "IN":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid movement! {matched_student.full_name} is already IN hostel "
                    f"(recorded at {latest_mov.movement_time} on {latest_mov.movement_date}). "
                    f"Next valid action must be 'Hostel OUT'."
                )
            )

    # Step 3: Record Movement using SERVER TIME (Requirement 7)
    server_now = datetime.now()
    cur_date = server_now.strftime("%Y-%m-%d")
    cur_time = server_now.strftime("%I:%M %p")

    movement = HostelMovement(
        student_id=matched_student.student_id,
        movement_type=mov_type,
        movement_date=cur_date,
        movement_time=cur_time,
        verified_by_face=True,
        created_at=server_now,
    )
    db.add(movement)

    # Update student's real-time hostel status
    matched_student.hostel_status = "In Hostel" if mov_type == "IN" else "Out of Hostel"

    # Also synchronize today's StudentAttendance record for Warden & Admin
    att = db.query(StudentAttendance).filter(
        StudentAttendance.student_id == matched_student.student_id,
        StudentAttendance.date == cur_date,
    ).first()

    if not att:
        att = StudentAttendance(
            student_id=matched_student.student_id,
            date=cur_date,
            in_time=cur_time if mov_type == "IN" else None,
            out_time=cur_time if mov_type == "OUT" else None,
            college_status="Present",
        )
        db.add(att)
    else:
        if mov_type == "IN":
            att.in_time = cur_time
        else:
            att.out_time = cur_time

    db.commit()
    db.refresh(movement)

    logger.info(
        f"[Hostel Gate] Saved movement: {matched_student.student_id} -> {mov_type} at {cur_time} ({cur_date})"
    )

    return HostelMovementResponse(
        success=True,
        message=f"Hostel {mov_type} recorded successfully",
        student_name=matched_student.full_name,
        student_id=matched_student.student_id,
        movement_type=mov_type,
        movement_date=cur_date,
        movement_time=cur_time,
        status="Face Verified Successfully",
        movement_id=movement.id,
    )

@router.get("/movements/today", response_model=list[dict])
def get_today_movements(db: Session = Depends(get_db)):
    """
    Returns today's movement records:
    - student name
    - student ID
    - movement type
    - date
    - time
    """
    cur_date = datetime.now().strftime("%Y-%m-%d")
    records = db.query(HostelMovement).filter(
        HostelMovement.movement_date == cur_date
    ).order_by(HostelMovement.id.desc()).all()

    student_map = {
        s.student_id: s.full_name for s in db.query(Student).all()
    }

    result = []
    for r in records:
        result.append({
            "id": r.id,
            "student_id": r.student_id,
            "student_name": student_map.get(r.student_id, r.student_id),
            "movement_type": r.movement_type,
            "date": r.movement_date,
            "time": r.movement_time,
            "verified_by_face": r.verified_by_face,
        })
    return result

@router.get("/movements/student/{student_id}", response_model=HostelStudentTodayActivity)
def get_student_today_activity(student_id: str, db: Session = Depends(get_db)):
    """
    Returns today's Hostel Activity for Student Dashboard:
    - Hostel OUT - time
    - Hostel IN - time
    - Current Status
    """
    sid = student_id.strip()
    student = db.query(Student).filter(
        (Student.student_id == sid) | (func.lower(Student.student_id) == sid.lower())
    ).first()

    cur_date = datetime.now().strftime("%Y-%m-%d")
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    # Get today's movements for this student
    movements = db.query(HostelMovement).filter(
        HostelMovement.student_id == student.student_id,
        HostelMovement.movement_date == cur_date
    ).order_by(HostelMovement.id.asc()).all()

    out_time = None
    in_time = None

    for m in movements:
        if m.movement_type == "OUT":
            out_time = m.movement_time
        elif m.movement_type == "IN":
            in_time = m.movement_time

    # Determine current status based on latest overall movement
    latest = db.query(HostelMovement).filter(
        HostelMovement.student_id == student.student_id
    ).order_by(HostelMovement.id.desc()).first()

    if latest:
        current_status = "IN Hostel" if latest.movement_type == "IN" else "OUT of Hostel"
    else:
        current_status = "Not recorded yet"

    return HostelStudentTodayActivity(
        student_id=student.student_id,
        student_name=student.full_name,
        date=cur_date,
        hostel_out_time=out_time,
        hostel_in_time=in_time,
        current_status=current_status,
        movements_count=len(movements),
    )

@router.get("/movements/warden/summary", response_model=list[HostelWardenMovementSummary])
def get_warden_movements_summary(db: Session = Depends(get_db)):
    """
    Returns Hostel Movement section data for Warden Dashboard:
    Student Name | Student ID | Room Number | Hostel OUT | Hostel IN | Current Status
    """
    cur_date = datetime.now().strftime("%Y-%m-%d")
    students = db.query(Student).order_by(Student.id.desc()).all()

    result = []
    for s in students:
        today_movs = db.query(HostelMovement).filter(
            HostelMovement.student_id == s.student_id,
            HostelMovement.movement_date == cur_date
        ).order_by(HostelMovement.id.asc()).all()

        out_time = None
        in_time = None
        for m in today_movs:
            if m.movement_type == "OUT":
                out_time = m.movement_time
            elif m.movement_type == "IN":
                in_time = m.movement_time

        latest = db.query(HostelMovement).filter(
            HostelMovement.student_id == s.student_id
        ).order_by(HostelMovement.id.desc()).first()

        if latest:
            current_status = "IN Hostel" if latest.movement_type == "IN" else "OUT of Hostel"
            last_time = f"{latest.movement_time} ({latest.movement_date})"
        else:
            current_status = "Not recorded yet"
            last_time = None

        result.append(HostelWardenMovementSummary(
            student_id=s.student_id,
            student_name=s.full_name,
            room_number=s.room_number or "Wing A",
            hostel_out_time=out_time,
            hostel_in_time=in_time,
            current_status=current_status,
            last_movement_time=last_time,
        ))

    return result
