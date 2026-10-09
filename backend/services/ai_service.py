"""
AI Services for Girls Hostel Management System:
Contains ONLY the 3 designated AI features:
1. AI Complaint Priority Detection
2. AI Attendance Risk Prediction
3. AI Hostel Chatbot
"""

import re
from typing import Optional

# ======================================================================
# AI FEATURE 1: AI COMPLAINT PRIORITY DETECTION
# ======================================================================

def classify_complaint_priority(title: str, description: str) -> str:
    """
    NLP-based classifier to categorize student complaints into:
    - EMERGENCY
    - HIGH
    - MEDIUM
    - LOW
    """
    text = f"{title} {description}".lower()

    # Emergency triggers: physical safety, medical emergency, fire, intruder, life danger
    emergency_patterns = [
        r"\b(unsafe|harass|stalk|intruder|thief|theft|robbery|attack|violence|threat|molest)\b",
        r"\b(emergency|fire|smoke|faint|unconscious|bleeding|injury|ambulance|hospital|breath|severe pain)\b",
        r"\b(electric shock|short circuit|gas leak|cylinder leak)\b",
    ]

    for pat in emergency_patterns:
        if re.search(pat, text):
            return "EMERGENCY"

    # High priority triggers: broken locks, complete power outage, water cut, security breach
    high_patterns = [
        r"\b(broken lock|door lock|cannot lock|window broken|window open|grill broken)\b",
        r"\b(no water|water supply stopped|drinking water contaminated|food poison|spoiled food)\b",
        r"\b(power outage|no electricity|blackout|sparks|wire burning)\b",
        r"\b(urgent|immediate|danger|critical|severe)\b",
    ]

    for pat in high_patterns:
        if re.search(pat, text):
            return "HIGH"

    # Medium priority triggers: maintenance, appliance repair, wifi, plumbing leak
    medium_patterns = [
        r"\b(leak|leaking|tap|faucet|drain|clog|plumbing|toilet|flush)\b",
        r"\b(fan|light|tube light|bulb|switch|plug|socket|geyser|cooler)\b",
        r"\b(wifi|internet|network|router|connection)\b",
        r"\b(mess food|mess quality|water filter|cooler)\b",
    ]

    for pat in medium_patterns:
        if re.search(pat, text):
            return "MEDIUM"

    # Default to LOW for minor / general requests
    return "LOW"


# ======================================================================
# AI FEATURE 2: AI ATTENDANCE RISK PREDICTION
# ======================================================================

def predict_attendance_risk(attendance_records: list[dict]) -> dict:
    """
    Evaluates student attendance history from MySQL and computes a predictive risk level:
    - LOW RISK
    - MEDIUM RISK
    - HIGH RISK
    """
    if not attendance_records:
        # Default baseline for newly registered student
        return {
            "risk_level": "LOW RISK",
            "risk_score": 10,
            "attendance_percentage": 100.0,
            "total_days": 1,
            "present_days": 1,
            "bunk_alerts_count": 0,
            "explanation": "Newly registered resident with clean record and verified attendance.",
        }

    total_days = len(attendance_records)
    present_days = 0
    bunk_alerts_count = 0

    for rec in attendance_records:
        status = rec.get("college_status", "Present")
        if status and status.lower() == "present":
            present_days += 1
        if rec.get("lecture_bunk_alert"):
            bunk_alerts_count += 1

    attendance_pct = round((present_days / total_days) * 100, 1)

    # Compute risk score (0 to 100)
    # Lower attendance and higher bunks increase risk
    base_risk = 100 - attendance_pct
    bunk_penalty = bunk_alerts_count * 20
    calculated_risk = min(100, max(5, int(base_risk + bunk_penalty)))

    if attendance_pct < 70 or bunk_alerts_count >= 2 or calculated_risk >= 70:
        level = "HIGH RISK"
        explanation = f"Critical attendance deficit ({attendance_pct}%). Irregular lecture presence requires Warden counseling."
    elif attendance_pct < 85 or bunk_alerts_count == 1 or calculated_risk >= 40:
        level = "MEDIUM RISK"
        explanation = f"Moderate attendance risk ({attendance_pct}%). Potential lecture conflict or irregular gate entries noted."
    else:
        level = "LOW RISK"
        explanation = f"Excellent attendance consistency ({attendance_pct}%). Regular compliance with hostel and college hours."

    return {
        "risk_level": level,
        "risk_score": calculated_risk,
        "attendance_percentage": attendance_pct,
        "total_days": total_days,
        "present_days": present_days,
        "bunk_alerts_count": bunk_alerts_count,
        "explanation": explanation,
    }


# ======================================================================
# AI FEATURE 3: AI HOSTEL CHATBOT
# ======================================================================

def process_chatbot_query(user_message: str, student_info: Optional[dict] = None) -> str:
    """
    Interactive AI Hostel Assistant designed for Girls Hostel residents.
    Answers inquiries regarding:
    - Hostel & Curfew timings
    - College & Lunch timings
    - Mess & Dining schedule
    - Grievance / Complaint submission
    - Leave & Night out permissions
    - Warden & Security Contacts
    - Facilities & Rules
    """
    msg = user_message.lower().strip()
    student_name = student_info.get("full_name", "Resident") if student_info else "Resident"

    # 1. Greetings
    if re.search(r"\b(hi|hello|hey|namaste|good morning|good afternoon|good evening)\b", msg):
        return (
            f"Hello {student_name}! 👋 I am your Girls Hostel AI Assistant. "
            "How can I assist you today? You can ask me about hostel timings, mess meals, complaints, leave permissions, or safety rules."
        )

    # 2. Hostel Hours & Gate Curfew
    if re.search(r"\b(hostel timing|gate timing|curfew|closing time|open time|gate hours|gate close|in time|entry)\b", msg):
        return (
            "🕒 **Hostel Gate Hours:**\n"
            "• **Opening Time:** 06:00 AM\n"
            "• **Closing / Curfew Time:** 06:00 PM Sharp\n"
            "• **Biometric Entry:** Real-time facial scan is mandatory at the gate.\n"
            "• Late entries require prior permission from the Senior Warden."
        )

    # 3. College Hours & Lunch Break
    if re.search(r"\b(college timing|college hours|lecture time|class time|lunch break|lunch time)\b", msg):
        return (
            "🎓 **College & Break Timings:**\n"
            "• **College Hours:** 09:00 AM to 04:00 PM\n"
            "• **Lunch Break:** 11:00 AM to 11:35 AM\n"
            "• Note: Entering the hostel during 09:00 AM - 04:00 PM outside of lunch break automatically flags a Lecture Bunk Alert."
        )

    # 4. Mess & Meal Schedule
    if re.search(r"\b(mess|food|breakfast|lunch|dinner|meal|snack|dining)\b", msg):
        return (
            "🍽️ **Hostel Mess Schedule:**\n"
            "• **Breakfast:** 07:30 AM – 09:00 AM\n"
            "• **Lunch:** 11:00 AM – 01:00 PM\n"
            "• **Evening Snacks & Tea:** 04:30 PM – 05:30 PM\n"
            "• **Dinner:** 07:30 PM – 09:30 PM\n"
            "Food is hygienic, nutritious, and strictly vegetarian with special Sunday desserts."
        )

    # 5. Complaints
    if re.search(r"\b(complaint|report|broken|repair|plumbing|water tap|wifi|leak|light|issue|problem)\b", msg):
        return (
            "📝 **Submitting a Hostel Complaint:**\n"
            "1. Navigate to the **Complaints** section on your dashboard.\n"
            "2. Click **+ Submit Complaint** and describe the issue.\n"
            "3. Our **AI Complaint Priority System** will automatically assess the severity (LOW, MEDIUM, HIGH, or EMERGENCY).\n"
            "4. Warden office resolves emergency issues within 2 hours, and standard repairs within 24 hours."
        )

    # 6. Leave & Night-Out Permissions
    if re.search(r"\b(leave|permission|night out|home visit|weekend|holiday|gate pass)\b", msg):
        return (
            "📋 **Leave & Permission Procedure:**\n"
            "• Click **+ Request Leave / Permission** on your dashboard.\n"
            "• Choose leave type (Weekend Home Visit, Emergency Leave, or Night Out) and date range.\n"
            "• Provide parental consent.\n"
            "• Once approved by the Warden, your gate pass status will update to **Approved**."
        )

    # 7. Warden & Emergency Contacts
    if re.search(r"\b(warden|contact|phone|emergency|help|security|doctor|helpline)\b", msg):
        return (
            "🚨 **Hostel Safety & Staff Contacts:**\n"
            "• **Senior Warden:** Dr. Anita Sharma (Office: Wing A, Ground Floor)\n"
            "• **Emergency Phone:** +91 98220 11223\n"
            "• **Campus Security Desk:** Ext. 104\n"
            "• **Women's Helpline (24x7):** 1091\n"
            "• **Campus Medical Room:** Wing B, Ground Floor (Ext. 108)"
        )

    # 8. Wi-Fi & Internet
    if re.search(r"\b(wifi|internet|network|password)\b", msg):
        return (
            "📶 **Hostel Wi-Fi Information:**\n"
            "• SSID: `GirlsHostel_BlockA_Secure`\n"
            "• Login using your Student ID as username.\n"
            "• Speed: 100 Mbps with campus firewall protection."
        )

    # 9. Rules & Regulations
    if re.search(r"\b(rule|regulation|visitors|guest|fine|discipline)\b", msg):
        return (
            "⚖️ **Key Hostel Regulations:**\n"
            "1. Respect 06:00 PM curfew time.\n"
            "2. Male visitors are not permitted in residential wings.\n"
            "3. Parents may meet in the Visitors Lounge between 04:00 PM – 06:00 PM.\n"
            "4. Quiet study hours from 10:00 PM to 06:00 AM."
        )

    # Fallback
    return (
        f"Thank you for reaching out, {student_name}. I can help with hostel timings (6 AM - 6 PM), "
        "mess schedules, filing maintenance complaints, requesting leave permissions, or contacting the Warden (+91 98220 11223). "
        "Feel free to ask your question!"
    )
