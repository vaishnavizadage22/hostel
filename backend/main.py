import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import engine, Base, get_db
from models import Admin, Student, StudentAttendance, HostelConfig
from schemas import (
    AdminRegisterRequest,
    AdminLoginRequest,
    AdminStatusResponse,
    TokenResponse,
    AdminResponse,
)
from auth import hash_password, verify_password, create_access_token, get_current_admin
from routers.students import router as students_router
from routers.attendance import router as attendance_router
from routers.wardens import router as wardens_router
from routers.dashboard_features import router as dashboard_router
from routers.admin import router as admin_router
from routers.warden import router as warden_router
from routers.staff import router as staff_router, staff_login
from routers.gate import router as gate_router
from routers.parent import router as parent_router

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(os.path.join(UPLOAD_DIR, "faces"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "wardens"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "staff"), exist_ok=True)

# Automatically create all tables (Admin, Student, Attendance, Config, Warden, Notice, Complaint, LeaveRequest) in MySQL database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Girls Hostel Management System - API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware for local frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for captured face photos and warden profile photos
from fastapi.responses import FileResponse

@app.get("//uploads/{file_path:path}")
def serve_double_slash_uploads(file_path: str):
    file_on_disk = os.path.join(UPLOAD_DIR, file_path)
    if os.path.exists(file_on_disk) and os.path.isfile(file_on_disk):
        return FileResponse(file_on_disk)
    raise HTTPException(status_code=404, detail="File not found")

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(students_router)
app.include_router(attendance_router)
app.include_router(wardens_router)
app.include_router(dashboard_router)
app.include_router(admin_router)
app.include_router(warden_router)
app.include_router(staff_router)
app.include_router(gate_router)
app.include_router(parent_router)

# Auth alias for staff login
app.add_api_route("/api/auth/staff-login", staff_login, methods=["POST"], response_model=None)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Girls Hostel Management System API", "version": "2.0.0"}

# --- ADMIN ENDPOINTS ---
@app.get("/api/auth/admin-status", response_model=AdminStatusResponse)
def get_admin_status(db: Session = Depends(get_db)):
    admin_count = db.query(Admin).count()
    if admin_count > 0:
        return AdminStatusResponse(
            exists=True,
            message="Admin account already exists. Only one Admin account is allowed in this system."
        )
    return AdminStatusResponse(
        exists=False,
        message="No Admin account exists. Registration is available."
    )

@app.post("/api/auth/admin-register", status_code=status.HTTP_201_CREATED)
def register_admin(data: AdminRegisterRequest, db: Session = Depends(get_db)):
    existing_count = db.query(Admin).count()
    if existing_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "success": False,
                "message": "An Admin account already exists. Only one Admin is allowed."
            }
        )

    existing_email = db.query(Admin).filter(Admin.email == data.email.lower().strip()).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "success": False,
                "message": "An account with this email address already exists."
            }
        )

    hashed_pwd = hash_password(data.password)
    new_admin = Admin(
        admin_slot=1,
        full_name=data.full_name.strip(),
        email=data.email.lower().strip(),
        phone=data.phone.strip(),
        password_hash=hashed_pwd,
        profile_photo=data.profile_photo,
    )

    try:
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "success": False,
                "message": "An Admin account already exists. Only one Admin is allowed."
            }
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create admin account: {str(e)}"
        )

    return {
        "success": True,
        "message": "Admin account registered successfully."
    }

@app.post("/api/auth/admin-login", response_model=TokenResponse)
def login_admin(credentials: AdminLoginRequest, db: Session = Depends(get_db)):
    user_query = credentials.username.strip().lower()
    admin = db.query(Admin).filter(
        (Admin.email == user_query) | (Admin.full_name.ilike(user_query))
    ).first()

    if not admin or not verify_password(credentials.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/admin ID or password."
        )

    token_payload = {
        "sub": admin.email,
        "admin_id": admin.id,
        "role": "admin",
        "full_name": admin.full_name
    }
    access_token = create_access_token(data=token_payload)

    return TokenResponse(
        success=True,
        token=access_token,
        token_type="bearer",
        admin=AdminResponse(
            id=admin.id,
            full_name=admin.full_name,
            email=admin.email,
            phone=admin.phone,
            profile_photo=admin.profile_photo,
        )
    )

@app.get("/api/auth/admin-me", response_model=AdminResponse)
def get_current_admin_profile(current_admin: Admin = Depends(get_current_admin)):
    return AdminResponse(
        id=current_admin.id,
        full_name=current_admin.full_name,
        email=current_admin.email,
        phone=current_admin.phone,
        profile_photo=current_admin.profile_photo,
    )

@app.post("/api/auth/logout")
def logout_admin():
    return {"success": True, "message": "Logged out successfully."}
