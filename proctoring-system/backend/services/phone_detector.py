import cv2
import time
from ultralytics import YOLO

model = YOLO('yolov8n.pt')
cap = cv2.VideoCapture(0)
prev_time = time.time()
start_time = time.time()

# Alert variables
phone_frame_count = 0
last_alert_time = 0
events = []
current_alert_level = None  # None, 'SEEN', 'SUSTAINED'

# UI Colors
GREEN = (0, 255, 0)
RED = (0, 0, 255)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
YELLOW = (0, 255, 255)
ORANGE = (0, 165, 255)

def draw_status_panel(frame, fps, phone_frame_count, events, alert_level):
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (230, 180), BLACK, -1)
    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
    cv2.rectangle(frame, (0, 0), (230, 180), (50, 50, 50), 1)

    # Title
    cv2.putText(frame, 'PROCTORING AI', (10, 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 200, 255), 2)
    cv2.line(frame, (10, 32), (220, 32), (50, 50, 50), 1)

    # FPS
    fps_color = GREEN if fps > 20 else ORANGE
    cv2.putText(frame, f'FPS      {fps:.1f}', (10, 55),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, fps_color, 1)

    # Phone presence bar
    bar_width = int((min(phone_frame_count, 90) / 90) * 150)
    bar_color = RED if phone_frame_count > 30 else ORANGE if phone_frame_count > 10 else GREEN
    cv2.putText(frame, 'PHONE', (10, 78),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, WHITE, 1)
    cv2.rectangle(frame, (70, 65), (220, 80), (50, 50, 50), -1)
    cv2.rectangle(frame, (70, 65), (70+bar_width, 80), bar_color, -1)

    # Alert level
    alert_color = RED if alert_level == 'SUSTAINED' else ORANGE if alert_level == 'SEEN' else GREEN
    alert_text = alert_level if alert_level else 'CLEAR'
    cv2.putText(frame, f'LEVEL    {alert_text}', (10, 105),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, alert_color, 1)

    # Total alerts
    cv2.putText(frame, f'ALERTS   {len(events)}', (10, 130),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, YELLOW, 1)

    # Session timer
    session_time = int(time.time() - start_time)
    mins = session_time // 60
    secs = session_time % 60
    cv2.putText(frame, f'TIME     {mins:02d}:{secs:02d}', (10, 155),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, WHITE, 1)

    # Status dot
    dot_color = RED if alert_level == 'SUSTAINED' else ORANGE if alert_level == 'SEEN' else GREEN
    cv2.circle(frame, (215, 15), 8, dot_color, -1)
    cv2.circle(frame, (215, 15), 8, WHITE, 1)

def draw_alert_banner(frame, text, color):
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, frame.shape[0]-55),
                  (frame.shape[1], frame.shape[0]), color, -1)
    cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)
    cv2.putText(frame, text, (10, frame.shape[0]-18),
                cv2.FONT_HERSHEY_SIMPLEX, 0.75, WHITE, 2)

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

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    current_time = time.time()

    # YOLO detection
    results = model(frame, verbose=False)[0]
    phone_detected = False

    for box in results.boxes:
        if int(box.cls) == 67 and float(box.conf) > 0.5:
            phone_detected = True
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf)

            # Draw phone box
            cv2.rectangle(frame, (x1, y1), (x2, y2), RED, 2)
            label = f'PHONE {conf:.0%}'
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            cv2.rectangle(frame, (x1, y1-25),
                         (x1+label_size[0]+10, y1), RED, -1)
            cv2.putText(frame, label, (x1+5, y1-8),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, WHITE, 2)

    # Smart alert logic
    if phone_detected:
        phone_frame_count += 1

        if phone_frame_count >= 45 and current_alert_level != 'SUSTAINED':
            if current_time - last_alert_time > 3:
                current_alert_level = 'SUSTAINED'
                events.append({
                    'type': 'PHONE_SUSTAINED',
                    'time': time.strftime('%H:%M:%S'),
                    'severity': 'HIGH'
                })
                print(f"[{time.strftime('%H:%M:%S')}] 🚨 PHONE_SUSTAINED — High severity")
                last_alert_time = current_time

        elif phone_frame_count >= 10 and current_alert_level is None:
            if current_time - last_alert_time > 3:
                current_alert_level = 'SEEN'
                events.append({
                    'type': 'PHONE_SEEN',
                    'time': time.strftime('%H:%M:%S'),
                    'severity': 'MEDIUM'
                })
                print(f"[{time.strftime('%H:%M:%S')}] ⚠️  PHONE_SEEN — Medium severity")
                last_alert_time = current_time

    else:
        phone_frame_count = max(0, phone_frame_count - 2)
        if phone_frame_count == 0:
            current_alert_level = None

    # FPS
    curr_time = time.time()
    fps = 1 / (curr_time - prev_time)
    prev_time = curr_time

    # Draw UI
    draw_status_panel(frame, fps, phone_frame_count, events, current_alert_level)

    # Corner color based on alert level
    corner_color = RED if current_alert_level == 'SUSTAINED' else ORANGE if current_alert_level == 'SEEN' else GREEN
    draw_corners(frame, corner_color)

    # Alert banner
    if current_alert_level == 'SUSTAINED':
        draw_alert_banner(frame, '🚨  HIGH ALERT: Phone sustained in frame!', RED)
    elif current_alert_level == 'SEEN':
        draw_alert_banner(frame, '⚠️   WARNING: Phone detected briefly', ORANGE)

    cv2.imshow('AI Proctoring System', frame)

    if cv2.waitKey(1) == ord('q'):
        print("\n--- SESSION SUMMARY ---")
        for e in events:
            print(f"[{e['time']}] {e['type']} — {e['severity']}")
        print(f"Total alerts: {len(events)}")
        break

cap.release()
cv2.destroyAllWindows()