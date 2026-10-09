import os
import io
import base64
from datetime import datetime
from PIL import Image
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db
from models import Warden
from schemas import WardenRegisterRequest, WardenRegisterResponse, WardenResponse
from auth import hash_password

router = APIRouter(prefix="/api/wardens", tags=["Wardens"])

WARDENS_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "wardens")
os.makedirs(WARDENS_UPLOAD_DIR, exist_ok=True)

def generate_warden_id(db: Session) -> str:
    """Dynamically generates unique Warden ID in format WRD<Year><4-digit-seq>."""
    year = datetime.utcnow().strftime("%Y")
    count = db.query(Warden).count() + 1
    candidate_id = f"WRD{year}{1000 + count}"

    while db.query(Warden).filter(Warden.warden_id == candidate_id).first():
        count += 1
        candidate_id = f"WRD{year}{1000 + count}"
    return candidate_id

def decode_image_bytes(base64_str: str) -> bytes:
    """Decodes base64 string or data URL to raw bytes."""
    if "," in base64_str:
        base64_str = base64_str.split(",", 1)[1]
    return base64.b64decode(base64_str)

@router.post("/register", response_model=WardenRegisterResponse, status_code=status.HTTP_201_CREATED)
def register_warden(data: WardenRegisterRequest, db: Session = Depends(get_db)):
    """
    Registers a new Warden into MySQL with hashed password and saved profile photo.
    Generates a unique Warden ID.
    """
    # 1. Check existing email
    clean_email = data.email.strip().lower()
    existing_warden = db.query(Warden).filter(Warden.email == clean_email).first()
    if existing_warden:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A warden with this email address is already registered."
        )

    # 2. Validate and decode profile photo
    if not data.profile_photo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile photo is required."
        )

    try:
        photo_bytes = decode_image_bytes(data.profile_photo)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid profile photo format."
        )

    # Check 2MB limit
    if len(photo_bytes) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile photo must be less than 2MB."
        )

    # Validate image data with PIL
    try:
        img = Image.open(io.BytesIO(photo_bytes))
        if img.mode != "RGB":
            img = img.convert("RGB")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image file. Please upload a valid PNG or JPG photo."
        )

    # 3. Generate unique Warden ID
    new_warden_id = generate_warden_id(db)

    # 4. Save profile photo to disk
    photo_filename = f"{new_warden_id}_photo.jpg"
    photo_file_path = os.path.join(WARDENS_UPLOAD_DIR, photo_filename)
    img.save(photo_file_path, "JPEG", quality=90)
    relative_photo_path = f"/uploads/wardens/{photo_filename}"

    # 5. Hash password securely
    hashed_pwd = hash_password(data.password)

    # 6. Create database record
    new_warden = Warden(
        warden_id=new_warden_id,
        full_name=data.full_name.strip(),
        date_of_birth=data.date_of_birth.strip(),
        email=clean_email,
        mobile=data.mobile.strip(),
        address=data.address.strip(),
        password_hash=hashed_pwd,
        profile_photo=relative_photo_path,
        created_at=datetime.utcnow(),
    )

    try:
        db.add(new_warden)
        db.commit()
        db.refresh(new_warden)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Warden ID or Email already exists."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register warden: {str(e)}"
        )

    return WardenRegisterResponse(
        success=True,
        message="Registration Successful! Warden ID and temporary password have been generated.",
        warden_id=new_warden_id,
        password=data.password,
        full_name=new_warden.full_name,
    )

@router.get("", response_model=list[WardenResponse])
@router.get("/", response_model=list[WardenResponse])
def get_all_wardens(db: Session = Depends(get_db)):
    """Fetches all registered wardens from MySQL database."""
    wardens = db.query(Warden).order_by(Warden.id.desc()).all()
    res = []
    for w in wardens:
        res.append(
            WardenResponse(
                id=w.id,
                warden_id=w.warden_id,
                full_name=w.full_name,
                date_of_birth=w.date_of_birth,
                email=w.email,
                mobile=w.mobile,
                address=w.address,
                status=getattr(w, "status", "Active") or "Active",
                profile_photo=w.profile_photo,
                created_at=w.created_at.strftime("%d %b %Y, %I:%M %p") if w.created_at else "",
            )
        )
    return res

from routers.warden import warden_login
router.add_api_route("/login", warden_login, methods=["POST"], response_model=None)
