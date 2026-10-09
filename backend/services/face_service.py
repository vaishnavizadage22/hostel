import io
import os
import json
import logging
import cv2
import numpy as np

logger = logging.getLogger("face_service")

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FACES_DIR = os.path.join(BACKEND_DIR, "uploads", "faces")
MODELS_DIR = os.path.join(BACKEND_DIR, "models")
os.makedirs(FACES_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

YUNET_MODEL_PATH = os.path.join(MODELS_DIR, "face_detection_yunet_2023mar.onnx")
SFACE_MODEL_PATH = os.path.join(MODELS_DIR, "face_recognition_sface_2021dec.onnx")

_detector = None
_recognizer = None

def get_face_match_threshold() -> float:
    """Reads configurable threshold from environment (.env), defaults to 0.40."""
    raw = os.getenv("FACE_MATCH_THRESHOLD", "0.40")
    try:
        return float(raw)
    except (ValueError, TypeError):
        return 0.40

def get_detector():
    """Returns singleton YuNet face detector model."""
    global _detector
    if _detector is None:
        if os.path.exists(YUNET_MODEL_PATH):
            _detector = cv2.FaceDetectorYN.create(
                YUNET_MODEL_PATH,
                "",
                (320, 320),
                score_threshold=0.6,
                nms_threshold=0.3,
                top_k=5000,
            )
            logger.info("YuNet face detector initialized.")
        else:
            logger.error(f"YuNet model not found at {YUNET_MODEL_PATH}")
    return _detector

def get_recognizer():
    """Returns singleton SFace face recognizer model."""
    global _recognizer
    if _recognizer is None:
        if os.path.exists(SFACE_MODEL_PATH):
            _recognizer = cv2.FaceRecognizerSF.create(SFACE_MODEL_PATH, "")
            logger.info("SFace face recognizer initialized.")
        else:
            logger.error(f"SFace model not found at {SFACE_MODEL_PATH}")
    return _recognizer

def decode_image_to_cv2(image_bytes: bytes):
    """Safely decodes raw image bytes to BGR numpy array for OpenCV."""
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return img

def detect_face_in_image(image_bytes: bytes) -> dict:
    """
    Real Face Detection using OpenCV YuNet Neural Network.
    Verifies human face presence, bounding box, and landmark clarity.
    """
    try:
        img = decode_image_to_cv2(image_bytes)
        if img is None:
            return {"face_detected": False, "face_count": 0, "message": "Invalid image data"}

        h, w, _ = img.shape
        if w < 60 or h < 60:
            return {"face_detected": False, "face_count": 0, "message": "Image resolution too low"}

        detector = get_detector()
        if detector is not None:
            detector.setInputSize((w, h))
            _, faces = detector.detect(img)
            if faces is not None and len(faces) > 0:
                conf = float(faces[0][-1])
                return {
                    "face_detected": True,
                    "face_count": len(faces),
                    "confidence": round(conf, 4),
                    "message": "Face Detected",
                }
            else:
                return {
                    "face_detected": False,
                    "face_count": 0,
                    "message": "No clear human face detected in frame. Please face the camera directly.",
                }

        return {"face_detected": False, "face_count": 0, "message": "Face detector model unavailable"}

    except Exception as e:
        logger.error(f"Error in detect_face_in_image: {e}")
        return {"face_detected": False, "face_count": 0, "message": str(e)}

def extract_face_embedding(image_bytes: bytes) -> list[float]:
    """
    Extracts deep 128-dimensional biometric face embedding using OpenCV SFace.
    Aligns and crops face using 5 facial landmarks (eyes, nose, mouth corners)
    before neural feature extraction.
    """
    img = decode_image_to_cv2(image_bytes)
    if img is None:
        raise ValueError("Cannot decode image for face embedding")

    h, w, _ = img.shape
    detector = get_detector()
    recognizer = get_recognizer()

    if detector is None or recognizer is None:
        raise RuntimeError("Face recognition models are not loaded")

    detector.setInputSize((w, h))
    _, faces = detector.detect(img)
    if faces is None or len(faces) == 0:
        raise ValueError("No human face detected to extract biometrics")

    # Pick the highest confidence face
    best_face = faces[0]
    aligned_face = recognizer.alignCrop(img, best_face)
    feature = recognizer.feature(aligned_face)

    # 128-dim normalized embedding
    feat_vec = feature[0].tolist()
    return [round(float(val), 6) for val in feat_vec]

def compare_face_embeddings(emb1: list[float], emb2: list[float], threshold: float = None) -> dict:
    """
    Compares two face embeddings using OpenCV SFace Cosine Matching.
    Real matching score:
    - Same person: similarity >= 0.40 (up to 1.0) -> is_match: True
    - Different person: similarity < 0.35 (typically 0.15 - 0.28) -> is_match: False
    """
    if threshold is None:
        threshold = get_face_match_threshold()

    if not emb1 or not emb2 or len(emb1) != len(emb2):
        return {
            "is_match": False,
            "similarity": 0.0,
            "threshold": round(threshold, 4),
        }

    recognizer = get_recognizer()
    v1 = np.array([emb1], dtype=np.float32)
    v2 = np.array([emb2], dtype=np.float32)

    if recognizer is not None:
        cosine_sim = float(recognizer.match(v1, v2, cv2.FaceRecognizerSF_FR_COSINE))
    else:
        dot = np.dot(np.array(emb1), np.array(emb2))
        n1 = np.linalg.norm(emb1)
        n2 = np.linalg.norm(emb2)
        cosine_sim = float(dot / (n1 * n2 + 1e-7))

    display_sim = max(0.0, min(1.0, cosine_sim))
    is_match = cosine_sim >= threshold

    return {
        "is_match": is_match,
        "similarity": round(display_sim, 4),
        "threshold": round(threshold, 4),
    }

def save_face_image(student_id: str, image_bytes: bytes) -> str:
    """Saves student's registered face image to disk and returns relative file path."""
    filename = f"{student_id}_face.jpg"
    filepath = os.path.join(FACES_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(image_bytes)
    return f"/uploads/faces/{filename}"
