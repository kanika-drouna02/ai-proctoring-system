import cv2
import time

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

cap = cv2.VideoCapture(0)
prev_time = time.time()

# Alert logic variables
prev_face_count = 1
last_alert_time = 0
events = []

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    face_count = len(faces)

    # Draw boxes around faces
    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

    # Alert logic with 2 second debounce
    current_time = time.time()
    alert_message = ""

    if face_count != prev_face_count and current_time - last_alert_time > 2:
        if face_count == 0:
            alert_type = "NO_FACE"
            alert_message = "ALERT: No face detected!"
            color = (0, 0, 255)
        elif face_count > 1:
            alert_type = "MULTIPLE_FACES"
            alert_message = "ALERT: Multiple faces!"
            color = (0, 0, 255)
        else:
            alert_type = "FACE_RETURNED"
            alert_message = "Face returned"
            color = (0, 255, 0)

        # Log the event
        event = {
            'type': alert_type,
            'time': time.strftime('%H:%M:%S'),
            'count': face_count
        }
        events.append(event)
        print(f"[{event['time']}] {alert_type} - Faces: {face_count}")
        last_alert_time = current_time

    prev_face_count = face_count

    # FPS
    curr_time = time.time()
    fps = 1 / (curr_time - prev_time)
    prev_time = curr_time

    # Display info
    cv2.putText(frame, f'FPS: {fps:.1f}', (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.putText(frame, f'Faces: {face_count}', (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.putText(frame, f'Events logged: {len(events)}', (10, 90),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)

    # Show alert banner on screen
    if face_count == 0 or face_count > 1:
        cv2.rectangle(frame, (0, 0), (frame.shape[1], 40), (0, 0, 255), -1)
        label = "NO FACE DETECTED" if face_count == 0 else "MULTIPLE FACES DETECTED"
        cv2.putText(frame, label, (10, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    cv2.imshow('Face Detection', frame)

    if cv2.waitKey(1) == ord('q'):
        # Print all events when quitting
        print("\n--- SESSION SUMMARY ---")
        for e in events:
            print(f"[{e['time']}] {e['type']} - Faces: {e['count']}")
        print(f"Total events: {len(events)}")
        break

cap.release()
cv2.destroyAllWindows()