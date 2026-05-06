import datetime
import os
import uuid
import logging
import json
import math
import cv2
import random
import string
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from deepface import DeepFace

# ─── Flask Setup ─────────────────────────────────────────────────────────────
app = Flask(__name__)
app.secret_key = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(32))

# ALLOWED_ORIGINS env var: comma-separated list (e.g. "https://myapp.vercel.app")
# Leave unset for local dev — defaults to wildcard.
_origins_env = os.environ.get('ALLOWED_ORIGINS', '*')
_allowed_origins = [o.strip() for o in _origins_env.split(',')] if _origins_env != '*' else '*'
CORS(app, origins=_allowed_origins)

# ─── Directories ─────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REGISTERED_FOLDER = os.path.join(BASE_DIR, "registered_faces")
CAPTURED_FOLDER   = os.path.join(BASE_DIR, "captured_faces")
os.makedirs(REGISTERED_FOLDER, exist_ok=True)
os.makedirs(CAPTURED_FOLDER,   exist_ok=True)

# ─── Database Files ───────────────────────────────────────────────────────────
FACE_DB_PATH      = os.path.join(BASE_DIR, "face_db.json")
STUDENT_DB_PATH   = os.path.join(BASE_DIR, "student_db.json")
ATTENDANCE_LOG_PATH = os.path.join(BASE_DIR, "attendance_log.json")

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[logging.FileHandler(os.path.join(BASE_DIR, "app.log")), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# ─── DeepFace Config ──────────────────────────────────────────────────────────
# ArcFace is considered the state-of-the-art model for face recognition; retinaface is the most accurate detector backend
MODEL_NAME = "ArcFace"
DETECTOR   = "retinaface"
METRIC     = "cosine"
# Cosine threshold: faces with distance <= threshold are the same person
# ArcFace cosine threshold from DeepFace defaults is 0.68
SIMILARITY_THRESHOLD = 0.68

# ─── In-memory embedding cache: { faceId: np.ndarray } ──────────────────────
_embedding_cache: dict = {}

# ─── DB Helpers ──────────────────────────────────────────────────────────────
def load_json(path: str) -> dict:
    try:
        if os.path.exists(path):
            with open(path, 'r') as f:
                return json.load(f)
    except Exception:
        pass
    return {}

def save_json(path: str, data: dict):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)

def initialize_dbs():
    for path in [FACE_DB_PATH, STUDENT_DB_PATH, ATTENDANCE_LOG_PATH]:
        if not os.path.exists(path):
            save_json(path, {})

initialize_dbs()

# ─── Warm-up: force full TF graph compilation at startup ─────────────────────
logger.info(f"Warming up DeepFace model ({MODEL_NAME}) — first request will be instant…")
try:
    # Create a tiny blank image and run a real represent() call.
    # This forces TensorFlow to JIT-compile the full graph NOW,
    # so every subsequent API call takes ~1s instead of 20-40s.
    _warmup_img = np.ones((160, 160, 3), dtype=np.uint8) * 128
    _warmup_path = os.path.join(BASE_DIR, "_warmup.jpg")
    import cv2 as _cv2
    _cv2.imwrite(_warmup_path, _warmup_img)
    try:
        DeepFace.represent(
            img_path=_warmup_path,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR,
            enforce_detection=False,  # blank image has no face — that's fine
        )
    except Exception:
        pass  # warmup errors are expected (no face in blank image)
    finally:
        if os.path.exists(_warmup_path):
            os.remove(_warmup_path)
    logger.info("Model warm-up complete — ready to serve requests.")
except Exception as e:
    logger.error(f"Failed to warm up model: {e}")

# ─── Warm Embedding Cache from Registered Students ───────────────────────────
def warm_embedding_cache():
    """Load stored embeddings from face_db.json into memory on startup."""
    face_db = load_json(FACE_DB_PATH)
    loaded = 0
    for face_id, record in face_db.items():
        emb = record.get("embedding")
        if emb:
            _embedding_cache[face_id] = np.array(emb, dtype=np.float32)
            loaded += 1
    logger.info(f"Warmed embedding cache with {loaded} entries.")

warm_embedding_cache()

# ─── Embedding Helpers ────────────────────────────────────────────────────────
def get_embedding(img_path: str) -> np.ndarray:
    """Extract a face embedding from an image file path."""
    result = DeepFace.represent(
        img_path=img_path,
        model_name=MODEL_NAME,
        detector_backend=DETECTOR,
        enforce_detection=True,
    )
    emb = result[0]["embedding"]
    return np.array(emb, dtype=np.float32)

def cosine_distance(a: np.ndarray, b: np.ndarray) -> float:
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 1.0
    return float(1.0 - np.dot(a, b) / (norm_a * norm_b))

def resolve_image_path(face_id: str) -> str | None:
    """Map a faceId string to an absolute image path."""
    if face_id.startswith("file:"):
        filename = face_id[len("file:"):]
        for folder in [REGISTERED_FOLDER, CAPTURED_FOLDER]:
            candidate = os.path.join(folder, filename)
            if os.path.exists(candidate):
                return candidate
    return None

# ─── API: Detect Face ─────────────────────────────────────────────────────────
@app.route('/api/detect-face', methods=['POST'])
def detect_face():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files['image']
    filename = f"captured_{uuid.uuid4()}.jpg"
    path = os.path.join(CAPTURED_FOLDER, filename)
    file.save(path)

    try:
        logger.info(f"Detecting face in {filename}")
        # extract_faces raises ValueError if no face; use that to validate
        DeepFace.extract_faces(
            img_path=path,
            detector_backend=DETECTOR,
            enforce_detection=True
        )
        face_id = f"file:{filename}"
        return jsonify([{"faceId": face_id}]), 200

    except ValueError:
        logger.warning("No face found in uploaded image")
        os.remove(path)
        return jsonify([]), 200
    except Exception as e:
        logger.error(f"detect_face error: {e}")
        os.remove(path)
        return jsonify({"error": str(e)}), 500

# ─── API: Register Student ────────────────────────────────────────────────────
@app.route('/api/register-student', methods=['POST'])
def register_student():
    student_id = request.form.get('studentId')
    if not student_id or 'image' not in request.files:
        return jsonify({"error": "studentId and image are required"}), 400

    file = request.files['image']
    filename = f"registered_{student_id}_{uuid.uuid4()}.jpg"
    path = os.path.join(REGISTERED_FOLDER, filename)
    file.save(path)

    try:
        logger.info(f"Registering student {student_id}")

        # Extract and cache embedding immediately at registration
        emb = get_embedding(path)
        face_id = f"file:{filename}"

        # Cache in memory
        _embedding_cache[face_id] = emb

        # Persist embedding in face_db.json
        face_db = load_json(FACE_DB_PATH)
        face_db[face_id] = {
            "student_id": student_id,
            "embedding": emb.tolist(),
            "registered_at": str(datetime.datetime.now()),
        }
        save_json(FACE_DB_PATH, face_db)

        # Update student_db.json
        student_db = load_json(STUDENT_DB_PATH)
        student_db[student_id] = {
            "face_id": face_id,
            "registered_at": str(datetime.datetime.now()),
        }
        save_json(STUDENT_DB_PATH, student_db)

        logger.info(f"Registered {student_id} with faceId={face_id}")
        return jsonify({"success": True, "faceId": face_id, "message": "Student registered successfully"}), 200

    except ValueError as e:
        logger.warning(f"No face detected during registration: {e}")
        os.remove(path)
        return jsonify({"error": "No clear face detected in the image. Please try again in better lighting."}), 400
    except Exception as e:
        logger.error(f"register_student error: {e}")
        if os.path.exists(path):
            os.remove(path)
        return jsonify({"error": str(e)}), 500

# ─── API: Verify Face ─────────────────────────────────────────────────────────
@app.route('/api/verify-face', methods=['POST'])
def verify_face():
    data       = request.json or {}
    face_id1   = data.get('faceId1')   # registered face (reference)
    face_id2   = data.get('faceId2')   # captured face   (probe)
    student_id = data.get('studentId')

    if not face_id1 or not face_id2:
        return jsonify({"error": "faceId1 and faceId2 are required"}), 400

    try:
        logger.info(f"Verifying {student_id}: ref={face_id1} probe={face_id2}")

        # ── Step 1: Get reference embedding (from cache if possible) ──────────
        ref_emb = _embedding_cache.get(face_id1)
        if ref_emb is None:
            ref_path = resolve_image_path(face_id1)
            if not ref_path:
                return jsonify({"error": "Registered face image not found. Please re-register.", "reason": "REFERENCE_MISSING"}), 404
            ref_emb = get_embedding(ref_path)
            _embedding_cache[face_id1] = ref_emb

        # ── Step 2: Get probe embedding (compute fresh; cache it too) ─────────
        probe_emb = _embedding_cache.get(face_id2)
        if probe_emb is None:
            probe_path = resolve_image_path(face_id2)
            if not probe_path:
                return jsonify({"error": "Captured face image not found.", "reason": "PROBE_MISSING"}), 404
            probe_emb = get_embedding(probe_path)
            _embedding_cache[face_id2] = probe_emb

        # ── Step 3: Cosine distance comparison ────────────────────────────────
        distance   = cosine_distance(ref_emb, probe_emb)
        confidence = round((1.0 - distance) * 100, 2)   # 0-100%
        is_match   = distance <= SIMILARITY_THRESHOLD

        logger.info(f"Distance={distance:.4f} confidence={confidence}% match={is_match}")

        # ── Step 4: Log attendance if matched ─────────────────────────────────
        if is_match and student_id:
            attendance_log = load_json(ATTENDANCE_LOG_PATH)
            today = str(datetime.date.today())
            if today not in attendance_log:
                attendance_log[today] = {}
            attendance_log[today][student_id] = {
                "timestamp": str(datetime.datetime.now()),
                "confidence": confidence,
            }
            save_json(ATTENDANCE_LOG_PATH, attendance_log)

        return jsonify({
            "isIdentical": is_match,
            "confidence": confidence,
            "distance": round(distance, 4),
            "message": (
                f"Identity confirmed ({confidence:.1f}% confidence)" if is_match
                else "Face didn't match"
            ),
            "reason": "MATCH_SUCCESSFUL" if is_match else "LOW_SIMILARITY"
        }), 200

    except ValueError as e:
        logger.warning(f"verify_face face extraction failed: {e}")
        return jsonify({
            "isIdentical": False,
            "confidence": 0,
            "message": "Could not extract face from image. Ensure your face is clearly visible.",
            "reason": "NO_FACE_DETECTED"
        }), 200
    except Exception as e:
        logger.error(f"verify_face error: {e}")
        return jsonify({"error": str(e)}), 500

# ─── API: Reset All Data ──────────────────────────────────────────────────────
@app.route('/api/reset-data', methods=['POST'])
def reset_data():
    """Deletes all registered faces, captured faces, and database files."""
    try:
        global _embedding_cache
        _embedding_cache = {}

        for folder in [REGISTERED_FOLDER, CAPTURED_FOLDER]:
            for f in os.listdir(folder):
                os.remove(os.path.join(folder, f))

        for path in [FACE_DB_PATH, STUDENT_DB_PATH, ATTENDANCE_LOG_PATH]:
            save_json(path, {})

        logger.info("All data reset successfully.")
        return jsonify({"success": True, "message": "All data cleared."}), 200
    except Exception as e:
        logger.error(f"reset_data error: {e}")
        return jsonify({"error": str(e)}), 500
# ─── API: Get Student Details ───────────────────────────────────────────────────
@app.route('/api/student/<student_id>/details', methods=['GET'])
def get_student_details(student_id):
    # Dummy details
    return jsonify({
        "program": "B.Tech Computer Science",
        "batch": "2022-2026",
        "semester": 6,
        "cgpa": "8.5"
    }), 200

# ─── API: Get Timetable ───────────────────────────────────────────────────────
@app.route('/api/student/<student_id>/timetable', methods=['GET'])
def get_timetable(student_id):
    dummy_timetable = {
        "Monday": [
            {"subject": "Advanced Mathematics", "time": "09:00 AM - 10:30 AM", "location": "Room 301"},
            {"subject": "Computer Science 101", "time": "11:00 AM - 12:30 PM", "location": "Lab 4"}
        ],
        "Tuesday": [
            {"subject": "Physics", "time": "10:00 AM - 11:30 AM", "location": "Room 205"},
            {"subject": "Database Management", "time": "01:00 PM - 02:30 PM", "location": "Lab 2"}
        ],
        "Wednesday": [
            {"subject": "Advanced Mathematics", "time": "09:00 AM - 10:30 AM", "location": "Room 301"},
            {"subject": "Artificial Intelligence", "time": "02:00 PM - 03:30 PM", "location": "Room 410"}
        ],
        "Thursday": [
            {"subject": "Computer Science 101", "time": "11:00 AM - 12:30 PM", "location": "Lab 4"},
            {"subject": "Software Engineering", "time": "03:00 PM - 04:30 PM", "location": "Room 201"}
        ],
        "Friday": [
            {"subject": "Physics Lab", "time": "09:00 AM - 12:00 PM", "location": "Lab 1"},
            {"subject": "Seminar", "time": "02:00 PM - 04:00 PM", "location": "Auditorium"}
        ]
    }
    return jsonify(dummy_timetable), 200

# ─── API: Get Attendance ──────────────────────────────────────────────────────
@app.route('/api/attendance', methods=['GET'])
def get_attendance():
    attendance_log = load_json(ATTENDANCE_LOG_PATH)
    return jsonify(attendance_log), 200

# ─── API: Health Check ────────────────────────────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": MODEL_NAME, "cached_embeddings": len(_embedding_cache)}), 200

# ─── Run ──────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)