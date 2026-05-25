import cv2
import time

# Load cascades
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

cap = cv2.VideoCapture(0)
prev_time = time.time()

# Alert variables
prev_face_count = 1
last_face_alert_time = 0
last_gaze_alert_time = 0
looking_away_frames = 0
LOOKING_AWAY_THRESHOLD = 20
events = []

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # ── FACE DETECTION ──
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    face_count = len(faces)
    eyes_detected = False
    current_time = time.time()

    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

        # ── EYE DETECTION inside face ──
        face_region = gray[y:y+h, x:x+w]
        face_color = frame[y:y+h, x:x+w]
        eyes = eye_cascade.detectMultiScale(face_region, 1.1, 4)
        for (ex, ey, ew, eh) in eyes:
            cv2.rectangle(face_color, (ex, ey), (ex+ew, ey+eh), (255, 0, 0), 2)
            eyes_detected = True

    # ── FACE COUNT ALERT ──
    if face_count != prev_face_count and current_time - last_face_alert_time > 2:
        if face_count == 0:
            alert_type = "NO_FACE"
        elif face_count > 1:
            alert_type = "MULTIPLE_FACES"
        else:
            alert_type = "FACE_RETURNED"

        events.append({'type': alert_type, 'time': time.strftime('%H:%M:%S')})
        print(f"[{time.strftime('%H:%M:%S')}] {alert_type}")
        last_face_alert_time = current_time

    prev_face_count = face_count

    # ── GAZE ALERT ──
    if face_count > 0 and not eyes_detected:
        looking_away_frames += 1
    else:
        looking_away_frames = max(0, looking_away_frames - 1)

    if looking_away_frames >= LOOKING_AWAY_THRESHOLD:
        if current_time - last_gaze_alert_time > 2:
            events.append({'type': 'LOOKING_AWAY', 'time': time.strftime('%H:%M:%S')})
            print(f"[{time.strftime('%H:%M:%S')}] LOOKING_AWAY")
            last_gaze_alert_time = current_time

    # ── FPS ──
    curr_time = time.time()
    fps = 1 / (curr_time - prev_time)
    prev_time = curr_time

    # ── STATUS DISPLAY ──
    gaze_status = "Looking Away!" if looking_away_frames >= LOOKING_AWAY_THRESHOLD else "OK"
    gaze_color = (0, 0, 255) if looking_away_frames >= LOOKING_AWAY_THRESHOLD else (0, 255, 0)
    face_color_text = (0, 0, 255) if face_count != 1 else (0, 255, 0)

    cv2.putText(frame, f'FPS: {fps:.1f}', (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.putText(frame, f'Faces: {face_count}', (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, face_color_text, 2)
    cv2.putText(frame, f'Gaze: {gaze_status}', (10, 90),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, gaze_color, 2)
    cv2.putText(frame, f'Events: {len(events)}', (10, 120),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)

    # ── ALERT BANNERS ──
    if face_count == 0:
        cv2.rectangle(frame, (0, 0), (frame.shape[1], 40), (0, 0, 255), -1)
        cv2.putText(frame, "ALERT: NO FACE DETECTED", (10, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    elif face_count > 1:
        cv2.rectangle(frame, (0, 0), (frame.shape[1], 40), (0, 0, 255), -1)
        cv2.putText(frame, "ALERT: MULTIPLE FACES", (10, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    elif looking_away_frames >= LOOKING_AWAY_THRESHOLD:
        cv2.rectangle(frame, (0, 0), (frame.shape[1], 40), (0, 165, 255), -1)
        cv2.putText(frame, "ALERT: LOOKING AWAY", (10, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    cv2.imshow('AI Proctoring System', frame)

    if cv2.waitKey(1) == ord('q'):
        print("\n--- SESSION SUMMARY ---")
        for e in events:
            print(f"[{e['time']}] {e['type']}")
        print(f"Total events: {len(events)}")
        break

cap.release()
cv2.destroyAllWindows()