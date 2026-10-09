import base64
import io
import sys
from PIL import Image

from database import SessionLocal
import models
from schemas import (
    StaffRegisterRequest,
    StaffLoginRequest,
    StaffAttendanceUpdateRequest,
)
from routers.staff import (
    register_staff,
    staff_login,
    get_staff_profile,
    get_staff_dashboard_stats,
    get_staff_students,
    get_student_academic_details,
    get_staff_attendance,
    update_or_mark_attendance,
    get_possible_lecture_alerts,
    get_attendance_reports,
    get_staff_notices,
    staff_logout,
)

def get_valid_photo_base64():
    img = Image.new("RGB", (100, 100), color=(109, 72, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

def run_tests():
    print("=" * 60)
    print("DIRECT PYTHON & MYSQL VERIFICATION FOR COLLEGE STAFF")
    print("=" * 60)

    db = SessionLocal()
    photo_b64 = get_valid_photo_base64()

    # 1. Staff Registration
    reg_req = StaffRegisterRequest(
        full_name="Prof. Shradha Patil",
        date_of_birth="1988-07-15",
        email="shradha.patil@engineering.edu",
        mobile="9822345678",
        address="Faculty Quarters Block B, Campus Area",
        password="FacultyPassword@123",
        profile_photo=photo_b64,
    )

    print("\n[TEST 1] Registering College Staff...")
    existing = db.query(models.Staff).filter(models.Staff.email == "shradha.patil@engineering.edu").first()
    if existing:
        print(f"  Staff already exists in MySQL (ID: {existing.staff_id}), deleting for clean test...")
        db.delete(existing)
        db.commit()

    reg_resp = register_staff(reg_req, db=db)
    assert reg_resp.success is True
    staff_id = reg_resp.staff_id
    print(f"  SUCCESS! Staff ID generated: {staff_id}, Email: {reg_resp.email}")

    # 2. Staff Login
    print("\n[TEST 2] Testing Staff Login...")
    login_req = StaffLoginRequest(
        username="shradha.patil@engineering.edu",
        password="FacultyPassword@123",
    )
    login_resp = staff_login(login_req, db=db)
    assert login_resp.success is True
    assert login_resp.access_token is not None
    current_staff = db.query(models.Staff).filter(models.Staff.staff_id == staff_id).first()
    assert current_staff.is_logged_in is True
    print(f"  SUCCESS! Authenticated. Staff ID: {staff_id}, Name: {current_staff.full_name}")

    # 3. Staff Profile
    print("\n[TEST 3] Fetching Staff Profile...")
    profile_resp = get_staff_profile(current_staff=current_staff)
    assert profile_resp.staff_id == staff_id
    print(f"  SUCCESS! Profile verified. Address: {profile_resp.address}, Mobile: {profile_resp.mobile}")

    # 4. Dashboard Stats
    print("\n[TEST 4] Testing Dashboard Statistics from MySQL...")
    stats_resp = get_staff_dashboard_stats(current_staff=current_staff, db=db)
    print("  SUCCESS! Real MySQL Stats:")
    print(f"    - Total Students: {stats_resp.total_students}")
    print(f"    - Present Today:  {stats_resp.present_today}")
    print(f"    - Absent Today:   {stats_resp.absent_today}")
    print(f"    - Late Today:     {stats_resp.late_today}")
    print(f"    - Possible Lecture Alerts: {stats_resp.possible_lecture_alerts}")

    # 5. Student Academic Directory
    print("\n[TEST 5] Fetching Student Roster...")
    students_resp = get_staff_students(search=None, department=None, class_year=None, current_staff=current_staff, db=db)
    assert len(students_resp) > 0, "No students found"
    first_st = students_resp[0]
    print(f"  SUCCESS! Found {len(students_resp)} students in roster.")
    print(f"    First Student: {first_st.full_name} ({first_st.student_id})")
    print(f"    Dept: {first_st.department}, Attendance %: {first_st.attendance_percentage}%")

    # 6. Student Academic Dossier
    print(f"\n[TEST 6] Fetching Student Academic Dossier for {first_st.student_id}...")
    dossier_resp = get_student_academic_details(student_id=first_st.student_id, current_staff=current_staff, db=db)
    assert dossier_resp.student_id == first_st.student_id
    print(f"  SUCCESS! Dossier retrieved for {dossier_resp.full_name}.")
    print(f"    College: {dossier_resp.college_name}, Parent: {dossier_resp.parent_name} ({dossier_resp.parent_mobile})")
    print(f"    Days Tracked: {dossier_resp.total_days_tracked}, History Log Count: {len(dossier_resp.attendance_history)}")

    # 7. Attendance Sheet & Filtering
    print("\n[TEST 7] Testing Attendance Sheet & Department Filters...")
    att_resp = get_staff_attendance(target_date=None, department=None, class_year=None, search=None, current_staff=current_staff, db=db)
    assert len(att_resp) > 0
    print(f"  SUCCESS! Retrieved {len(att_resp)} attendance rows for today.")

    # 8. Attendance Marking
    print(f"\n[TEST 8] Marking Attendance for {first_st.student_id} as 'Late'...")
    update_req = StaffAttendanceUpdateRequest(
        student_id=first_st.student_id,
        college_status="Late",
    )
    marked_resp = update_or_mark_attendance(payload=update_req, current_staff=current_staff, db=db)
    assert marked_resp.college_status == "Late"
    print(f"  SUCCESS! Status in MySQL updated to: {marked_resp.college_status} (In: {marked_resp.college_in})")

    # Mark back to Present
    update_req.college_status = "Present"
    update_or_mark_attendance(payload=update_req, current_staff=current_staff, db=db)

    # 9. Rule-Based Lecture Alerts
    print("\n[TEST 9] Testing Rule-Based (NOT AI) Lecture Bunk Alerts...")
    alerts_resp = get_possible_lecture_alerts(current_staff=current_staff, db=db)
    print(f"  SUCCESS! Retrieved {len(alerts_resp)} Rule-Based Lecture Bunk alerts.")
    for al in alerts_resp[:2]:
        print(f"    - Alert for {al.student_name}: {al.alert_reason} (Hostel: {al.hostel_status})")

    # 10. Attendance Reports
    print("\n[TEST 10] Testing Attendance Analytics & Reports...")
    reports_resp = get_attendance_reports(current_staff=current_staff, db=db)
    print("  SUCCESS! Report generated:")
    print(f"    Daily: Present={reports_resp.daily_summary['present']}, Rate={reports_resp.daily_summary['present_pct']}%")
    print(f"    Weekly Days Count: {len(reports_resp.weekly_summary['days'])}, Avg Rate: {reports_resp.weekly_summary['average_attendance_pct']}%")
    print(f"    Monthly Grade: {reports_resp.monthly_summary['attendance_grade']}")
    print(f"    Departments Analyzed: {len(reports_resp.department_stats)}")

    # 11. Notices (Read-Only)
    print("\n[TEST 11] Testing Notices Read-Only View...")
    notices_resp = get_staff_notices(current_staff=current_staff, db=db)
    print(f"  SUCCESS! Loaded {len(notices_resp)} campus notices for faculty.")

    # 12. Staff Logout
    print("\n[TEST 12] Testing Staff Logout...")
    logout_resp = staff_logout(current_staff=current_staff, db=db)
    assert logout_resp["success"] is True
    assert current_staff.is_logged_in is False
    print(f"  SUCCESS! Staff session logged out successfully: {logout_resp['message']}")

    print("\n" + "=" * 60)
    print("ALL 12 COLLEGE STAFF VERIFICATION TESTS PASSED 100%!")
    print("=" * 60)

    db.close()

if __name__ == "__main__":
    run_tests()
