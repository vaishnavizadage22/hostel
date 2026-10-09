import os
import logging
import base64
import json
import re
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from database import get_db
from models import Student, Parent
from schemas import (
    StudentRegisterRequest,
    StudentRegisterResponse,
    StudentLoginRequest,
    StudentLoginInitResponse,
    StudentFaceVerifyRequest,
    StudentAuthResponse,
    StudentProfileResponse,
)
from auth import hash_password, verify_password, create_access_token, security, SECRET_KEY, ALGORITHM
from services.face_service import (
    detect_face_in_image,
    extract_face_embedding,
    compare_face_embeddings,
    save_face_image,
    FACES_DIR,
    get_face_match_threshold,
)
from jose import jwt, JWTError

logger = logging.getLogger("face_verification")

router = APIRouter(prefix="/api", tags=["Students"])

def generate_student_credentials(db: Session, full_name: str) -> tuple[str, str]:
    """
    Generates Student ID and Password in format <name>@123.
    Both ID and Password are the exact same value.
    Example: 'Pooja Deshmukh' -> ID: 'pooja@123', Password: 'pooja@123'.
    Ensures uniqueness in database.
    """
    parts = full_name.strip().split()
    first_name = parts[0] if parts else "student"
    clean_name = re.sub(r"[^a-zA-Z0-9]", "", first_name).lower()
    if not clean_name:
        clean_name = "student"

    candidate = f"{clean_name}@123"

    # Ensure uniqueness in case multiple students have the same first name
    if db.query(Student).filter(func.lower(Student.student_id) == candidate.lower()).first():
        seq = 1
        while db.query(Student).filter(func.lower(Student.student_id) == f"{clean_name}{seq}@123".lower()).first():
            seq += 1
        candidate = f"{clean_name}{seq}@123"

    student_id = candidate
    password = candidate  # ID pan tech ani password pan toch!
    return student_id, password

def decode_base64_image(base64_str: str) -> bytes:
    """Strips data URL header if present and decodes base64 string to bytes."""
    if "," in base64_str:
        base64_str = base64_str.split(",", 1)[1]
    return base64.b64decode(base64_str)

@router.post("/students/register", response_model=StudentRegisterResponse, status_code=status.HTTP_201_CREATED)
def register_student(data: StudentRegisterRequest, db: Session = Depends(get_db)):
    """
    Registers student into MySQL with real camera-captured face detection and embedding.
    Generates dynamic Student ID (<name>@123) and identical Password (<name>@123).
    """
    # 1. Check if email already registered
    clean_email = data.email.strip().lower()
    existing_student = db.query(Student).filter(Student.email == clean_email).first()
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A student with this email address is already registered."
        )

    # 2. Process face image from live camera capture
    try:
        image_bytes = decode_base64_image(data.face_image_base64)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid face image format. Please capture a clear face photo."
        )

    # 3. Real face detection check
    detection = detect_face_in_image(image_bytes)
    if not detection["face_detected"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Face detection failed: {detection.get('message', 'No valid face detected inside frame')}"
        )

    # 4. Generate standardized biometric face embedding
    try:
        embedding = extract_face_embedding(image_bytes)
        embedding_json = json.dumps(embedding)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate face embedding: {str(e)}"
        )

    # 5. Generate Student ID and identical password in format <name>@123
    new_student_id, temp_password = generate_student_credentials(db, data.full_name)
    hashed_pwd = hash_password(temp_password)

    # 6. Save face image file to disk
    image_rel_path = save_face_image(new_student_id, image_bytes)


    # 7. Create database record
    new_student = Student(
        student_id=new_student_id,
        full_name=data.full_name.strip(),
        date_of_birth=data.date_of_birth.strip(),
        mobile=data.mobile.strip(),
        email=clean_email,
        address=data.address.strip(),
        college_name=data.college_name.strip(),
        department=data.department.strip(),
        class_year=data.class_year.strip(),
        parent_name=data.parent_name.strip(),
        parent_mobile=data.parent_mobile.strip(),
        parent_email=data.parent_email.strip() if data.parent_email else None,
        password_hash=hashed_pwd,
        face_image_path=image_rel_path,
        face_embedding=embedding_json,
    )

    try:
        db.add(new_student)
        clean_p_email = data.parent_email.strip().lower() if data.parent_email else None
        new_parent = Parent(
            parent_id=f"PRNT-{new_student_id}",
            student_id=new_student_id,
            full_name=data.parent_name.strip(),
            mobile=data.parent_mobile.strip(),
            email=clean_p_email,
            password_hash=hashed_pwd,
        )
        db.add(new_parent)
        db.commit()
        db.refresh(new_student)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student ID or Email already exists."
        )

    return StudentRegisterResponse(
        success=True,
        message="Student registration successful. Your account and face biometrics are securely registered.",
        student_id=new_student_id,
        temporary_password=temp_password,
    )

@router.post("/auth/student-login", response_model=StudentLoginInitResponse)
def login_student(data: StudentLoginRequest, db: Session = Depends(get_db)):
    """
    Step 1 of Student Login: Verify Student ID and Password.
    CRITICAL RULE: DO NOT directly open dashboard. Must require Live Face Verification!
    """
    sid = data.student_id.strip()
    student = db.query(Student).filter(
        (Student.student_id == sid) | (func.lower(Student.student_id) == sid.lower())
    ).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Student ID or Password."
        )

    if not verify_password(data.password, student.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Student ID or Password."
        )

    return StudentLoginInitResponse(
        success=True,
        message="Credentials verified. Live face verification required to proceed.",
        require_face_verification=True,
        student_id=student.student_id,
        full_name=student.full_name,
    )

@router.post("/auth/student-face-verify", response_model=StudentAuthResponse)
def verify_student_face(data: StudentFaceVerifyRequest, db: Session = Depends(get_db)):
    """
    Step 2 of Student Login: REAL FACE VERIFICATION.
    Compares registered student face biometrics against live camera frame.
    MATCH -> Issue JWT and grant access.
    NOT MATCH -> Block login (HTTP 401).
    """
    sid = data.student_id.strip()
    student = db.query(Student).filter(
        (Student.student_id == sid) | (func.lower(Student.student_id) == sid.lower())
    ).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student record not found."
        )

    # 1. Retrieve registered face biometrics
    # Ensure registered embedding uses the exact same pipeline as live verification.
    # If the registered face image exists on disk, compute embedding using extract_face_embedding
    # without overwriting the disk image file, and cache in student.face_embedding.
    registered_emb = None
    if student.face_image_path:
        filename = os.path.basename(student.face_image_path)
        cand_path = os.path.join(FACES_DIR, filename)
        if not os.path.exists(cand_path):
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            cand2 = os.path.join(backend_dir, student.face_image_path.lstrip("/\\"))
            if os.path.exists(cand2):
                cand_path = cand2
            else:
                cand_path = None

        if cand_path and os.path.exists(cand_path):
            try:
                with open(cand_path, "rb") as f:
                    reg_img_bytes = f.read()
                # Use identical pipeline to generate embedding
                registered_emb = extract_face_embedding(reg_img_bytes)
                # Cache updated vector in DB without touching disk image file
                student.face_embedding = json.dumps(registered_emb)
                db.commit()
            except Exception as e:
                logger.warning(f"Could not re-extract embedding from disk image for {sid}: {e}")

    # Fallback to existing database face_embedding if disk file reading was not available
    if registered_emb is None and student.face_embedding:
        try:
            parsed = json.loads(student.face_embedding)
            if isinstance(parsed, list) and len(parsed) > 0:
                registered_emb = parsed
        except Exception:
            pass

    # If registered face image/embedding is missing or invalid:
    if not registered_emb:
        logger.warning(f"[Face Verification] Student ID: {sid} | Registered face data missing or invalid.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Face verification data not available. Please contact the administrator."
        )

    # 2. Decode live captured frame
    try:
        live_bytes = decode_base64_image(data.face_image_base64)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid live camera image format."
        )

    # 3. Detect face in live image using standardized pipeline
    detection = detect_face_in_image(live_bytes)
    if not detection["face_detected"]:
        logger.info(f"[Face Verification] Student ID: {sid} | Live face detection failed: {detection.get('message')}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Live face detection failed: Please position your face clearly in the frame."
        )

    # 4. Extract live face embedding using the SAME pipeline
    live_emb = extract_face_embedding(live_bytes)

    # If embedding dimensions do not match:
    if len(registered_emb) != len(live_emb):
        logger.warning(f"[Face Verification] Student ID: {sid} | Dimension mismatch: reg={len(registered_emb)}, live={len(live_emb)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Face verification data not available. Please contact the administrator."
        )

    # 5. Real Cosine Similarity Face Comparison against configurable threshold (.env)
    threshold = get_face_match_threshold()
    comparison = compare_face_embeddings(registered_emb, live_emb, threshold=threshold)
    similarity = comparison["similarity"]
    is_match = comparison["is_match"]

    # 6. Structured backend debugging logs (Student ID, Similarity, Threshold, Match Result. NO image data)
    logger.info(
        f"[Face Verification] Student ID: {student.student_id} | "
        f"Similarity: {similarity:.4f} ({similarity * 100:.1f}%) | "
        f"Threshold: {threshold:.4f} ({threshold * 100:.1f}%) | "
        f"Match Result: {'MATCH' if is_match else 'NO MATCH'}"
    )

    if not is_match:
        # Face verification failed -> Access denied
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Face verification failed. Access denied. (Similarity: {similarity * 100:.1f}%)"
        )

    # 7. Face Matched! Generate Authenticated JWT Token
    token_payload = {
        "sub": student.student_id,
        "email": student.email,
        "role": "student",
        "full_name": student.full_name,
    }
    token = create_access_token(token_payload)

    return StudentAuthResponse(
        success=True,
        token=token,
        token_type="bearer",
        student=StudentProfileResponse.from_orm(student),
    )

def get_current_student(
    credentials = Depends(security),
    db: Session = Depends(get_db),
) -> Student:
    """Dependency to retrieve authenticated student from JWT token."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in."
        )
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sid = payload.get("sub")
        role = payload.get("role")
        if not sid or role != "student":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid student token."
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token."
        )

    student = db.query(Student).filter(
        (Student.student_id == sid) | (func.lower(Student.student_id) == str(sid).lower())
    ).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )
    return student


@router.get("/students/me", response_model=StudentProfileResponse)
def get_my_profile(current_student: Student = Depends(get_current_student)):
    """Returns profile for currently authenticated student."""
    return StudentProfileResponse.from_orm(current_student)

@router.get("/students", response_model=list[StudentProfileResponse])
def get_all_students(db: Session = Depends(get_db)):
    """
    Returns all registered students from MySQL database for Admin/Warden dashboards.
    """
    students = db.query(Student).order_by(Student.id.desc()).all()
    return [StudentProfileResponse.from_orm(s) for s in students]

