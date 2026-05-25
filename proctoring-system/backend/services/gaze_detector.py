import cv2
import time

# Load face mesh detector
facemesh_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Eye detector
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

cap = cv2.VideoCapture(0)
prev_time = time.time()

# Gaze tracking variables
looking_away_frames = 0
LOOKING_AWAY_THRESHOLD = 20  # frames before alert
events = []
last_alert_time = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detect faces
    faces = facemesh_cascade.detectMultiScale(gray, 1.1, 4)

    eyes_detected = False

    for (x, y, w, h) in faces:
        # Draw face box
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

        # Look for eyes only inside the face region
        face_region = gray[y:y+h, x:x+w]
        face_color = frame[y:y+h, x:x+w]

        eyes = eye_cascade.detectMultiScale(face_region, 1.1, 4)

        for (ex, ey, ew, eh) in eyes:
            # Draw blue circles around eyes
            cv2.rectangle(face_color, (ex, ey), (ex+ew, ey+eh), (255, 0, 0), 2)
            eyes_detected = True

    # Gaze logic
    current_time = time.time()

    if len(faces) > 0 and not eyes_detected:
        looking_away_frames += 1
    else:
        looking_away_frames = max(0, looking_away_frames - 1)

    # Fire alert if looking away too long
    if looking_away_frames >= LOOKING_AWAY_THRESHOLD:
        if current_time - last_alert_time > 2:
            event = {
                'type': 'LOOKING_AWAY',
                'time': time.strftime('%H:%M:%S')
            }
            events.append(event)
            print(f"[{event['time']}] LOOKING_AWAY detected!")
            last_alert_time = current_time

    # FPS
    curr_time = time.time()
    fps = 1 / (curr_time - prev_time)
    prev_time = curr_time

    # Status text
    gaze_status = "Looking Away!" if looking_away_frames >= LOOKING_AWAY_THRESHOLD else "Looking at Screen"
    gaze_color = (0, 0, 255) if looking_away_frames >= LOOKING_AWAY_THRESHOLD else (0, 255, 0)

    cv2.putText(frame, f'FPS: {fps:.1f}', (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.putText(frame, f'Gaze: {gaze_status}', (10, 65),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, gaze_color, 2)
    cv2.putText(frame, f'Events: {len(events)}', (10, 100),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)

    # Alert banner
    if looking_away_frames >= LOOKING_AWAY_THRESHOLD:
        cv2.rectangle(frame, (0, 0), (frame.shape[1], 40), (0, 0, 255), -1)
        cv2.putText(frame, "ALERT: LOOKING AWAY!", (10, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    cv2.imshow('Gaze Detection', frame)

    if cv2.waitKey(1) == ord('q'):
        print("\n--- SESSION SUMMARY ---")
        for e in events:
            print(f"[{e['time']}] {e['type']}")
        print(f"Total events: {len(events)}")
        break

cap.release()
cv2.destroyAllWindows()