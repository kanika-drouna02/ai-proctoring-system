import sys
sys.path.append('.')
from backend.utils.event_logger import EventLogger

import cv2
import time
import numpy as np
import sounddevice as sd
from ultralytics import YOLO
from queue import Queue
from threading import Thread


# ── SETTINGS ──
SAMPLE_RATE = 16000
CHUNK_SIZE = 1024
SPEECH_THRESHOLD = 15
SPEECH_FRAMES_TRIGGER = 8
LOOKING_AWAY_THRESHOLD = 20
COOLDOWN = 3

# ── COLORS ──
GREEN = (0, 255, 0)
RED = (0, 0, 255)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
YELLOW = (0, 255, 255)
ORANGE = (0, 165, 255)
CYAN = (255, 255, 0)

# ── SHARED STATE ──
alert_queue = Queue()
logger = EventLogger()
events = []
start_time = time.time()

# ── AUDIO THREAD ──
speech_frames = 0
last_audio_alert = 0

def audio_callback(indata, frames, time_info, status):
    global speech_frames, last_audio_alert

    volume = np.sqrt(np.mean(indata**2))
    level = int(volume * 200)
    current_time = time.time()

    if level > SPEECH_THRESHOLD:
        speech_frames += 1
    else:
        speech_frames = max(0, speech_frames - 1)

    if speech_frames >= SPEECH_FRAMES_TRIGGER:
        if current_time - last_audio_alert > COOLDOWN:
            severity = 'HIGH' if level > 35 else 'MEDIUM'
            alert_type = 'LOUD_SPEECH' if level > 35 else 'SPEECH_DETECTED'
            alert_queue.put({
                'type': alert_type,
                'time': time.strftime('%H:%M:%S'),
                'severity': severity,
                'source': 'AUDIO'
            })
            last_audio_alert = current_time
            speech_frames = 0

def start_audio_thread():
    with sd.InputStream(samplerate=SAMPLE_RATE,
                        channels=1,
                        dtype='float32',
                        blocksize=CHUNK_SIZE,
                        callback=audio_callback):
        while True:
            time.sleep(0.1)

# ── UI FUNCTIONS ──
def draw_status_panel(frame, fps, face_count, gaze_ok, phone_level, audio_alert):
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (240, 220), BLACK, -1)
    cv2.addWeighted(overlay, 0.65, frame, 0.35, 0, frame)
    cv2.rectangle(frame, (0, 0), (240, 220), (60, 60, 60), 1)

    # Title
    cv2.putText(frame, 'PROCTORING AI', (10, 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, CYAN, 2)
    cv2.line(frame, (10, 33), (230, 33), (60, 60, 60), 1)

    # FPS
    fps_color = GREEN if fps > 20 else ORANGE
    cv2.putText(frame, f'FPS       {fps:.1f}', (10, 55),
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, fps_color, 1)

    # Face
    face_color = GREEN if face_count == 1 else RED
    face_text = 'OK' if face_count == 1 else f'{face_count} FACES' if face_count > 1 else 'MISSING'
    cv2.putText(frame, f'FACE      {face_text}', (10, 78),
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, face_color, 1)

    # Gaze
    gaze_color = GREEN if gaze_ok else ORANGE
    gaze_text = 'OK' if gaze_ok else 'AWAY'
    cv2.putText(frame, f'GAZE      {gaze_text}', (10, 101),
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, gaze_color, 1)

    # Phone
    phone_color = GREEN if phone_level == 'CLEAR' else ORANGE if phone_level == 'SEEN' else RED
    cv2.putText(frame, f'PHONE     {phone_level}', (10, 124),
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, phone_color, 1)

    # Audio
    audio_color = GREEN if not audio_alert else RED
    audio_text = 'CLEAR' if not audio_alert else 'SPEECH!'
    cv2.putText(frame, f'AUDIO     {audio_text}', (10, 147),
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, audio_color, 1)

    # Total alerts
    cv2.putText(frame, f'ALERTS    {len(events)}', (10, 170),
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, YELLOW, 1)

    # Timer
    session_time = int(time.time() - start_time)
    mins = session_time // 60
    secs = session_time % 60
    cv2.putText(frame, f'TIME      {mins:02d}:{secs:02d}', (10, 193),
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, WHITE, 1)

    # Status dot
    any_alert = face_count != 1 or not gaze_ok or phone_level != 'CLEAR' or audio_alert
    dot_color = RED if any_alert else GREEN
    cv2.circle(frame, (225, 15), 8, dot_color, -1)
    cv2.circle(frame, (225, 15), 8, WHITE, 1)

def draw_corners(frame, color):
    h, w = frame.shape[:2]
    length, thickness = 30, 3
    cv2.line(frame, (5, 5), (5+length, 5), color, thickness)
    cv2.line(frame, (5, 5), (5, 5+length), color, thickness)
    cv2.line(frame, (w-5, 5), (w-5-length, 5), color, thickness)
    cv2.line(frame, (w-5, 5), (w-5, 5+length), color, thickness)
    cv2.line(frame, (5, h-5), (5+length, h-5), color, thickness)
    cv2.line(frame, (5, h-5), (5, h-5-length), color, thickness)
    cv2.line(frame, (w-5, h-5), (w-5-length, h-5), color, thickness)
    cv2.line(frame, (w-5, h-5), (w-5, h-5-length), color, thickness)

def draw_alert_banner(frame, text, color):
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, frame.shape[0]-55),
                  (frame.shape[1], frame.shape[0]), color, -1)
    cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)
    cv2.putText(frame, text, (10, frame.shape[0]-18),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, WHITE, 2)

# ── LOAD MODELS ──
print("Loading models...")
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
yolo_model = YOLO('yolov8n.pt')
print("✅ Models loaded!")

# ── START AUDIO THREAD ──
audio_thread = Thread(target=start_audio_thread, daemon=True)
audio_thread.start()
print("✅ Audio thread started!")

# ── MAIN VARIABLES ──
cap = cv2.VideoCapture(0)
prev_time = time.time()
prev_face_count = 1
last_face_alert = 0
last_gaze_alert = 0
last_phone_alert = 0
looking_away_frames = 0
phone_frame_count = 0
phone_alert_level = 'CLEAR'
audio_alert_active = False
audio_alert_timer = 0

print("✅ Camera started! Press Q to quit\n")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    current_time = time.time()

    # ── FACE DETECTION ──
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    face_count = len(faces)
    eyes_detected = False

    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x+w, y+h), GREEN, 2)
        face_region = gray[y:y+h, x:x+w]
        face_color_region = frame[y:y+h, x:x+w]
        eyes = eye_cascade.detectMultiScale(face_region, 1.1, 4)
        for (ex, ey, ew, eh) in eyes:
            cv2.rectangle(face_color_region, (ex, ey),
                         (ex+ew, ey+eh), CYAN, 2)
            eyes_detected = True

    # Face alert
    if face_count != prev_face_count and current_time - last_face_alert > COOLDOWN:
        if face_count == 0:
            alert_type = 'NO_FACE'
            severity = 'HIGH'
        elif face_count > 1:
            alert_type = 'MULTIPLE_FACES'
            severity = 'HIGH'
        else:
            alert_type = 'FACE_RETURNED'
            severity = 'LOW'
        events.append({'type': alert_type, 'time': time.strftime('%H:%M:%S'), 'severity': severity})
        logger.log_event(alert_type, severity=severity)
        print(f"[{time.strftime('%H:%M:%S')}] {alert_type}")
        last_face_alert = current_time
    prev_face_count = face_count

    # ── GAZE DETECTION ──
    if face_count > 0 and not eyes_detected:
        looking_away_frames += 1
    else:
        looking_away_frames = max(0, looking_away_frames - 1)

    gaze_ok = looking_away_frames < LOOKING_AWAY_THRESHOLD

    if not gaze_ok and current_time - last_gaze_alert > COOLDOWN:
        events.append({'type': 'LOOKING_AWAY', 'time': time.strftime('%H:%M:%S'), 'severity': 'MEDIUM'})
        print(f"[{time.strftime('%H:%M:%S')}] LOOKING_AWAY")
        last_gaze_alert = current_time

    # ── PHONE DETECTION ──
    yolo_results = yolo_model(frame, verbose=False)[0]
    phone_detected = False

    for box in yolo_results.boxes:
        if int(box.cls) == 67 and float(box.conf) > 0.5:
            phone_detected = True
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf)
            cv2.rectangle(frame, (x1, y1), (x2, y2), RED, 2)
            label = f'PHONE {conf:.0%}'
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            cv2.rectangle(frame, (x1, y1-25),
                         (x1+label_size[0]+10, y1), RED, -1)
            cv2.putText(frame, label, (x1+5, y1-8),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, WHITE, 2)

    if phone_detected:
        phone_frame_count += 1
        if phone_frame_count >= 45 and phone_alert_level != 'SUSTAINED':
            if current_time - last_phone_alert > COOLDOWN:
                phone_alert_level = 'SUSTAINED'
                events.append({'type': 'PHONE_SUSTAINED', 'time': time.strftime('%H:%M:%S'), 'severity': 'HIGH'})
                print(f"[{time.strftime('%H:%M:%S')}] PHONE_SUSTAINED")
                last_phone_alert = current_time
        elif phone_frame_count >= 10 and phone_alert_level is None:
            if current_time - last_phone_alert > COOLDOWN:
                phone_alert_level = 'SEEN'
                events.append({'type': 'PHONE_SEEN', 'time': time.strftime('%H:%M:%S'), 'severity': 'MEDIUM'})
                print(f"[{time.strftime('%H:%M:%S')}] PHONE_SEEN")
                last_phone_alert = current_time
    else:
        phone_frame_count = max(0, phone_frame_count - 2)
        if phone_frame_count == 0:
            phone_alert_level = 'CLEAR'

    # ── AUDIO ALERTS FROM QUEUE ──
    while not alert_queue.empty():
        audio_event = alert_queue.get()
        events.append(audio_event)
        print(f"[{audio_event['time']}] {audio_event['type']}")
        audio_alert_active = True
        audio_alert_timer = current_time

    # Reset audio alert display after 3 seconds
    if audio_alert_active and current_time - audio_alert_timer > 3:
        audio_alert_active = False

    # ── FPS ──
    curr_time = time.time()
    fps = 1 / (curr_time - prev_time)
    prev_time = curr_time

    # ── DRAW UI ──
    draw_status_panel(frame, fps, face_count, gaze_ok, phone_alert_level, audio_alert_active)

    # Corner color
    any_alert = face_count != 1 or not gaze_ok or phone_alert_level != 'CLEAR' or audio_alert_active
    corner_color = RED if any_alert else GREEN
    draw_corners(frame, corner_color)

    # Alert banners (priority order)
    if face_count == 0:
        draw_alert_banner(frame, 'HIGH ALERT: No face detected!', RED)
    elif face_count > 1:
        draw_alert_banner(frame, 'HIGH ALERT: Multiple faces detected!', RED)
    elif phone_alert_level == 'SUSTAINED':
        draw_alert_banner(frame, 'HIGH ALERT: Phone sustained in frame!', RED)
    elif audio_alert_active:
        draw_alert_banner(frame, 'WARNING: Speech detected!', ORANGE)
    elif not gaze_ok:
        draw_alert_banner(frame, 'WARNING: Looking away from screen!', ORANGE)
    elif phone_alert_level == 'SEEN':
        draw_alert_banner(frame, 'WARNING: Phone briefly detected!', ORANGE)

    cv2.imshow('AI Proctoring System', frame)

    summary = logger.end_session()
    print(f"Session duration: {summary['duration_human']}")
    print(f"Total alerts: {summary['total_events']}")

    if cv2.waitKey(1) == ord('q'):
        print("\n\n--- FINAL SESSION SUMMARY ---")
        for e in events:
            print(f"[{e['time']}] {e['type']} — {e['severity']}")
        print(f"\nTotal alerts: {len(events)}")
        break

cap.release()
cv2.destroyAllWindows()