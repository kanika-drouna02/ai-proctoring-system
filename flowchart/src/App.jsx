import { useState } from "react";

const weeks = [
  {
    id: 1,
    title: "Week 1",
    subtitle: "Face Detection + Gaze",
    color: "#00FFB2",
    days: [
      {
        day: 1,
        title: "Project Setup",
        emoji: "🛠️",
        what: "Set up your entire project folder, Python virtual environment, and install all libraries you'll need.",
        why: "A clean folder structure from day 1 means you never lose track of files. Professional devs always do this first.",
        learn: [
          { term: "Virtual Environment (venv)", explain: "An isolated Python workspace so your project libraries don't clash with system Python. Like a separate room for each project." },
          { term: "pip", explain: "Python's package manager. It downloads and installs libraries from the internet, like an app store for Python code." },
          { term: "Folder structure", explain: "Organizing code into backend/, frontend/, data/ folders so your project scales cleanly." }
        ],
        tasks: [
          "Create folder: proctoring-system/",
          "Inside it: backend/, frontend/, data/, docker/, scripts/",
          "Inside backend/: models/, services/, api/, utils/",
          "Run: python -m venv venv",
          "Activate: source venv/bin/activate",
          "Run: pip install torch torchvision opencv-python mediapipe ultralytics fastapi uvicorn",
          "Create README.md with project title and description",
          "Initialize git: git init && git add . && git commit -m 'initial setup'"
        ],
        commands: [
          "mkdir -p proctoring-system/{backend/{models,services,api,utils},frontend,data/{raw,processed,models},docker,scripts}",
          "cd proctoring-system && python -m venv venv",
          "source venv/bin/activate",
          "pip install torch torchvision opencv-python mediapipe ultralytics fastapi uvicorn"
        ],
        deliverable: "Project folder exists. All libraries installed. Git initialized."
      },
      {
        day: 2,
        title: "OpenCV Basics",
        emoji: "📷",
        what: "Learn to open your webcam, read video frames, and display them in a window using OpenCV.",
        why: "OpenCV is the foundation of everything in computer vision. You need to understand frames before detecting anything in them.",
        learn: [
          { term: "Frame", explain: "A single image from your webcam. Video is just thousands of frames shown per second (FPS = frames per second)." },
          { term: "cv2.VideoCapture(0)", explain: "Tells OpenCV to open camera #0 (your default webcam). Returns a 'capture object' you read frames from." },
          { term: "BGR vs RGB", explain: "OpenCV stores colors as Blue-Green-Red, but most AI models expect Red-Green-Blue. You'll often convert between them." },
          { term: "waitKey(1)", explain: "Waits 1 millisecond for a keypress. If you press 'q', it breaks the loop and closes the window." }
        ],
        tasks: [
          "Create backend/services/camera.py",
          "Write code to open webcam with cv2.VideoCapture(0)",
          "Read frames in a while loop with cap.read()",
          "Display the frame in a window with cv2.imshow()",
          "Press 'q' to quit",
          "Add FPS counter: calculate time between frames, display on screen",
          "Try: flip the frame horizontally (mirror mode) — look up cv2.flip()"
        ],
        commands: [
          "# In camera.py:",
          "import cv2, time",
          "cap = cv2.VideoCapture(0)",
          "prev = time.time()",
          "while True:",
          "  ret, frame = cap.read()",
          "  fps = 1/(time.time()-prev); prev=time.time()",
          "  cv2.putText(frame, f'FPS: {fps:.1f}', (10,30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)",
          "  cv2.imshow('Camera', frame)",
          "  if cv2.waitKey(1) == ord('q'): break"
        ],
        deliverable: "Webcam opens, shows live feed with FPS counter in top-left corner."
      },
      {
        day: 3,
        title: "Face Detection",
        emoji: "🧑",
        what: "Use Google's MediaPipe library to detect faces in real-time. Draw a green box around every detected face.",
        why: "MediaPipe gives you a pre-trained face detection model in 5 lines of code. This is the core of your proctoring system.",
        learn: [
          { term: "MediaPipe", explain: "Google's library of pre-trained AI models for face, hand, pose detection. It runs fast on CPU — no GPU needed." },
          { term: "Bounding Box", explain: "A rectangle drawn around a detected object. Defined by x, y (top-left corner), width, and height." },
          { term: "Confidence Score", explain: "A number from 0 to 1 that says how sure the model is. 0.9 = 90% sure it's a face. You set a threshold (e.g., 0.5)." },
          { term: "Pre-trained model", explain: "A model someone else already trained on millions of images. You use it directly — no training required." }
        ],
        tasks: [
          "Create backend/services/face_detector.py",
          "Import mediapipe, initialize FaceDetection with confidence=0.5",
          "Convert each frame BGR→RGB before passing to MediaPipe",
          "Loop through results.detections, extract bounding box",
          "Draw rectangle on frame using cv2.rectangle()",
          "Print number of faces detected to terminal",
          "Test: cover camera → 0 faces. Show face → 1 face. Ask friend to appear → 2 faces."
        ],
        commands: [
          "import mediapipe as mp",
          "mp_face = mp.solutions.face_detection",
          "detector = mp_face.FaceDetection(min_detection_confidence=0.5)",
          "# In frame loop:",
          "rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)",
          "results = detector.process(rgb)",
          "if results.detections:",
          "  for det in results.detections:",
          "    bbox = det.location_data.relative_bounding_box",
          "    # Convert relative coords to pixel coords, draw rectangle"
        ],
        deliverable: "Green box appears around your face. Terminal prints face count each second."
      },
      {
        day: 4,
        title: "Multi-Face Alert",
        emoji: "👥",
        what: "Build logic to flag when more than 1 face appears, when 0 faces appear (person left), and log these as 'events'.",
        why: "This is your first real proctoring feature. You're not just detecting — you're making decisions based on what you detect.",
        learn: [
          { term: "Event-driven logic", explain: "Instead of reacting every frame, you detect *state changes* — face count going from 1 to 2. This avoids spamming alerts." },
          { term: "State variable", explain: "A variable that remembers the previous frame's condition (e.g., prev_face_count). You compare current vs previous to detect changes." },
          { term: "Logging", explain: "Saving events with timestamps to a file or list. Later, these logs become your dashboard data." },
          { term: "Debouncing", explain: "Waiting a short time before triggering an alert, to avoid false alarms from a single bad frame." }
        ],
        tasks: [
          "Add prev_face_count = 1 variable before the loop",
          "If face_count != prev_face_count, log an event",
          "Events: 'MULTIPLE_FACES' (count > 1), 'NO_FACE' (count == 0), 'FACE_RETURNED' (back to 1)",
          "Create a log list: events = [] and append dicts: {type, timestamp, count}",
          "At end of session, print all events",
          "Add colored text on frame: red 'ALERT: Multiple faces' when triggered",
          "Add 2-second debounce so rapid flickering doesn't spam alerts"
        ],
        commands: [
          "import time",
          "events = []",
          "prev_count = 1",
          "last_alert_time = 0",
          "# In loop after detection:",
          "if face_count != prev_count and time.time() - last_alert_time > 2:",
          "  alert_type = 'MULTIPLE_FACES' if face_count > 1 else 'NO_FACE'",
          "  events.append({'type': alert_type, 'time': time.time(), 'count': face_count})",
          "  last_alert_time = time.time()",
          "prev_count = face_count"
        ],
        deliverable: "When you bring a friend into frame, terminal shows ALERT: MULTIPLE_FACES with timestamp."
      },
      {
        day: 5,
        title: "Face Mesh Setup",
        emoji: "🕸️",
        what: "Switch to MediaPipe Face Mesh, which gives you 468 landmark points on your face (eyes, nose, mouth corners, etc.).",
        why: "The bounding box tells you WHERE a face is. Face Mesh tells you HOW the face is oriented — which lets you calculate gaze direction.",
        learn: [
          { term: "Face Mesh", explain: "A 3D mesh of 468 points mapped onto your face. Each point has an x, y, z coordinate. Used for gaze, expression, head pose." },
          { term: "Landmark", explain: "A specific point on the face (e.g., left eye corner = landmark #33). MediaPipe defines these consistently." },
          { term: "Normalized coordinates", explain: "Coordinates given as fractions (0 to 1) of frame size, not pixels. Multiply by frame width/height to get pixel position." },
          { term: "3D vs 2D", explain: "MediaPipe gives z (depth) too, which helps estimate head rotation even from a flat camera." }
        ],
        tasks: [
          "Create backend/services/gaze_detector.py",
          "Replace FaceDetection with mp.solutions.face_mesh.FaceMesh",
          "Set max_num_faces=1, refine_landmarks=True",
          "Draw all 468 landmarks as small dots using mp.solutions.drawing_utils",
          "Print coordinates of landmark #1 (nose tip) to see what values look like",
          "Study MediaPipe landmark map — Google 'mediapipe face mesh landmark indices image'",
          "Identify eye landmarks: left eye corners are ~33, 133. Right eye corners are ~362, 263"
        ],
        commands: [
          "mp_mesh = mp.solutions.face_mesh",
          "mesh = mp_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True)",
          "mp_draw = mp.solutions.drawing_utils",
          "# In loop:",
          "results = mesh.process(rgb_frame)",
          "if results.multi_face_landmarks:",
          "  lms = results.multi_face_landmarks[0].landmark",
          "  mp_draw.draw_landmarks(frame, results.multi_face_landmarks[0], mp_mesh.FACEMESH_CONTOURS)"
        ],
        deliverable: "Your face has 468 green dots overlaid on it in real-time."
      },
      {
        day: 6,
        title: "Eye Gaze Detection",
        emoji: "👁️",
        what: "Calculate Eye Aspect Ratio (EAR) to detect if eyes are open/closed, and use head pose to detect if person is looking away.",
        why: "EAR is a simple math formula from a research paper that works surprisingly well. If EAR is low + head is turned, person is looking away.",
        learn: [
          { term: "Eye Aspect Ratio (EAR)", explain: "Formula: EAR = (vertical eye height) / (2 × horizontal eye width). When eye is open, EAR ≈ 0.3. When closed/squinting, EAR < 0.2." },
          { term: "Head Pose Estimation", explain: "Using 3D face landmarks + camera matrix to calculate Euler angles: pitch (nod), yaw (shake), roll (tilt). Yaw tells you if looking left/right." },
          { term: "solvePnP", explain: "OpenCV function. You give it 2D image points + 3D world points of the same face landmarks, it gives back rotation/translation vectors." },
          { term: "Euler angles", explain: "Three rotation angles that describe head orientation. Yaw > 20° = looking to the side. Pitch > 15° = looking down." }
        ],
        tasks: [
          "Extract eye landmarks for both eyes (6 points each)",
          "Implement EAR formula using Euclidean distances between landmarks",
          "If EAR < 0.2 for 10 frames, log EYES_CLOSED event",
          "Implement head pose using cv2.solvePnP with 6 key landmarks",
          "Extract yaw angle from rotation vector",
          "If abs(yaw) > 25 degrees, log LOOKING_AWAY event",
          "Draw yaw value on screen so you can calibrate the threshold"
        ],
        commands: [
          "import numpy as np",
          "def ear(eye_points):",
          "  A = np.linalg.norm(eye_points[1]-eye_points[5])",
          "  B = np.linalg.norm(eye_points[2]-eye_points[4])",
          "  C = np.linalg.norm(eye_points[0]-eye_points[3])",
          "  return (A + B) / (2.0 * C)",
          "# EAR < 0.2 → eyes closed / squinting away"
        ],
        deliverable: "Terminal logs LOOKING_AWAY when you turn your head. EYES_CLOSED when you close them."
      },
      {
        day: 7,
        title: "Consolidate Week 1",
        emoji: "🔗",
        what: "Combine face detection + multi-face alert + gaze detection into ONE unified script. Record your first demo video.",
        why: "Integration is harder than building parts separately. Merging threads, handling conflicts, and making it smooth is real engineering.",
        learn: [
          { term: "Python threading", explain: "Running multiple tasks at once. You want face detection AND gaze running in parallel, not one after another." },
          { term: "Shared state", explain: "Multiple parts of your code reading/writing the same data (e.g., current alert status). Need to handle carefully." },
          { term: "OOP (Classes)", explain: "Wrap each detector in a class with a process(frame) method. Makes combining them clean and reusable." }
        ],
        tasks: [
          "Create backend/services/detector_manager.py",
          "Create a DetectorManager class that holds FaceDetector and GazeDetector",
          "Single process(frame) method that runs both and returns combined results",
          "Display all info on frame: face count, gaze status, EAR value",
          "Use colored overlays: green = normal, red = alert",
          "Run at 25+ FPS (check FPS counter)",
          "Record 1-minute screen capture demo: show normal, then trigger each alert type"
        ],
        commands: [
          "class DetectorManager:",
          "  def __init__(self):",
          "    self.face_det = FaceDetector()",
          "    self.gaze_det = GazeDetector()",
          "    self.alerts = []",
          "  def process(self, frame):",
          "    face_result = self.face_det.detect(frame)",
          "    gaze_result = self.gaze_det.detect(frame)",
          "    return {'faces': face_result, 'gaze': gaze_result}"
        ],
        deliverable: "One script. All alerts working. 1-min demo video recorded and saved."
      }
    ]
  },
  {
    id: 2,
    title: "Week 2",
    subtitle: "Phone Detection + Audio",
    color: "#FF6B35",
    days: [
      {
        day: 8,
        title: "YOLOv8 Setup",
        emoji: "📱",
        what: "Install and run YOLOv8, a state-of-the-art object detection model, on your webcam to detect objects in real-time.",
        why: "YOLOv8 already knows what a 'cell phone' looks like — trained on 80 object types. No training needed. You just filter for phones.",
        learn: [
          { term: "YOLO (You Only Look Once)", explain: "A family of fast object detection models. Instead of scanning image in patches, it looks at the whole image once and predicts all objects." },
          { term: "COCO Dataset", explain: "Common Objects in Context — 80 object types including 'cell phone'. YOLOv8 is pre-trained on this. Class ID 67 = cell phone." },
          { term: "Inference", explain: "Running a trained model on new data. You're not training — you're using someone else's trained model to make predictions." },
          { term: "Confidence threshold", explain: "Only show detections above e.g. 0.5 confidence. Below = probably wrong, ignore it." }
        ],
        tasks: [
          "Run: yolo predict model=yolov8n.pt source=0 — watch it detect everything",
          "Create backend/services/phone_detector.py",
          "Load model: model = YOLO('yolov8n.pt')",
          "Run model on each frame: results = model(frame, verbose=False)",
          "Filter results for class 67 (cell phone) only",
          "Draw red bounding box when phone detected",
          "Log PHONE_DETECTED event with timestamp"
        ],
        commands: [
          "from ultralytics import YOLO",
          "model = YOLO('yolov8n.pt')  # downloads automatically",
          "results = model(frame, verbose=False)[0]",
          "for box in results.boxes:",
          "  if int(box.cls) == 67 and float(box.conf) > 0.5:  # class 67 = cell phone",
          "    x1,y1,x2,y2 = map(int, box.xyxy[0])",
          "    cv2.rectangle(frame, (x1,y1), (x2,y2), (0,0,255), 2)",
          "    cv2.putText(frame, 'PHONE DETECTED', (x1,y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,255), 2)"
        ],
        deliverable: "Hold your phone up to webcam → red box appears + PHONE_DETECTED logged."
      },
      {
        day: 9,
        title: "Phone Alert Logic",
        emoji: "🚨",
        what: "Add smart alert logic: only alert when phone appears, not every single frame. Add a visual alert banner on screen.",
        why: "Without debouncing, you'd get 30 alerts per second while phone is in frame. Smart alerting = professional system.",
        learn: [
          { term: "Debouncing", explain: "Technique to prevent an event from firing too many times. Set a cooldown period (e.g., 5 seconds) between alerts." },
          { term: "Alert severity", explain: "Categorize alerts: LOW (brief phone), MEDIUM (phone >5s), HIGH (phone >15s). Helps proctors triage." },
          { term: "Persistence tracking", explain: "Track how long an object has been in frame. frame_count × (1/FPS) = seconds in frame." }
        ],
        tasks: [
          "Track consecutive frames where phone is detected",
          "Alert levels: 3+ frames = PHONE_SEEN, 30+ frames = PHONE_SUSTAINED",
          "Add 5-second cooldown between alerts (same as Day 4 debounce)",
          "Show red banner across top of screen when alert fires",
          "After phone disappears for 10 frames, reset counter",
          "Add alert to shared events list from DetectorManager",
          "Test: quickly flash phone vs hold phone — different alerts"
        ],
        commands: [
          "phone_frame_count = 0",
          "phone_alert_sent = False",
          "# In loop:",
          "if phone_detected:",
          "  phone_frame_count += 1",
          "  if phone_frame_count > 30 and not phone_alert_sent:",
          "    log_event('PHONE_SUSTAINED')",
          "    phone_alert_sent = True",
          "else:",
          "  if phone_frame_count > 0: phone_frame_count -= 1",
          "  if phone_frame_count == 0: phone_alert_sent = False"
        ],
        deliverable: "Two distinct alert types based on phone duration. Banner visible on screen."
      },
      {
        day: 10,
        title: "Audio Capture",
        emoji: "🎤",
        what: "Set up microphone input using PyAudio. Capture audio in real-time chunks and visualize the volume level.",
        why: "Audio is the second modality of your system. Capturing it correctly is step 1 before any analysis.",
        learn: [
          { term: "Sample Rate", explain: "How many audio samples per second. Standard is 16000 Hz (16kHz) for speech processing. More samples = better quality." },
          { term: "Chunk size", explain: "How many samples you read at once. 1024 samples at 16kHz = 64ms of audio. Smaller chunks = lower latency." },
          { term: "PCM audio", explain: "Raw audio as a list of numbers (amplitudes). What PyAudio gives you. Like pixels for images but for sound." },
          { term: "RMS (Root Mean Square)", explain: "A measure of audio 'loudness'. Calculate it from PCM data to know if environment is loud or quiet." }
        ],
        tasks: [
          "pip install pyaudio sounddevice",
          "Create backend/services/audio_capture.py",
          "Open mic stream: 16kHz, mono channel, chunk=1024",
          "Read chunks in loop, calculate RMS loudness",
          "Print RMS value — speak loudly, watch it go up",
          "Draw a simple volume bar in terminal using print (optional: ASCII bar)",
          "Handle keyboard interrupt to close stream cleanly"
        ],
        commands: [
          "import pyaudio, numpy as np",
          "pa = pyaudio.PyAudio()",
          "stream = pa.open(format=pyaudio.paInt16, channels=1, rate=16000, input=True, frames_per_buffer=1024)",
          "while True:",
          "  data = stream.read(1024)",
          "  samples = np.frombuffer(data, dtype=np.int16)",
          "  rms = np.sqrt(np.mean(samples**2))",
          "  print(f'Volume: {rms:.1f}', end='\\r')"
        ],
        deliverable: "Terminal shows live volume number. Clap → number spikes. Silence → number near 0."
      },
      {
        day: 11,
        title: "Voice Activity Detection",
        emoji: "🗣️",
        what: "Use WebRTC VAD (Voice Activity Detector) to detect if someone is speaking. Log SPEECH_DETECTED events.",
        why: "Simple volume threshold misses a lot. WebRTC VAD is used in Google Meet, Discord, Zoom — it's production-grade and free.",
        learn: [
          { term: "VAD (Voice Activity Detection)", explain: "Distinguishing speech from background noise. Not 'what is being said' — just 'is someone talking?' Smart enough to ignore AC hum, keyboard sounds." },
          { term: "WebRTC", explain: "Web Real-Time Communication — Google's open-source stack for video/audio. Their VAD is battle-tested on billions of calls." },
          { term: "Frame size for VAD", explain: "WebRTC VAD needs 10ms, 20ms, or 30ms audio chunks at 8kHz/16kHz/32kHz. You have to match exactly." },
          { term: "Aggressiveness", explain: "VAD mode 0-3: 0 = permissive (catches more speech, more false positives). 3 = strict (only catches clear speech)." }
        ],
        tasks: [
          "pip install webrtcvad",
          "Create backend/services/audio_analyzer.py",
          "Initialize webrtcvad.Vad(2) — mode 2 is good balance",
          "Feed 30ms chunks (480 samples at 16kHz) to vad.is_speech()",
          "If 5+ consecutive speech frames → log SPEECH_DETECTED",
          "If 20+ consecutive speech frames → log SUSTAINED_SPEECH",
          "Test: talk normally → alert. Type on keyboard → no alert."
        ],
        commands: [
          "import webrtcvad",
          "vad = webrtcvad.Vad(2)  # aggressiveness 0-3",
          "# Feed exactly 480 samples (30ms at 16kHz) as bytes:",
          "chunk_bytes = samples[:480].tobytes()",
          "is_speech = vad.is_speech(chunk_bytes, 16000)",
          "# Track consecutive speech frames:",
          "speech_frames = 0",
          "if is_speech: speech_frames += 1",
          "else: speech_frames = max(0, speech_frames - 1)"
        ],
        deliverable: "Terminal logs SPEECH_DETECTED when you talk. Silent typing does NOT trigger it."
      },
      {
        day: 12,
        title: "Combine All Streams",
        emoji: "🔀",
        what: "Run face detection, gaze, phone detection, and audio analysis ALL at the same time using Python threads.",
        why: "In production, everything runs in parallel. This is the hardest engineering day — multithreading is tricky but essential.",
        learn: [
          { term: "Threading", explain: "Running multiple code paths at once. Camera loop runs in main thread. Audio runs in a background thread. They share data via a queue." },
          { term: "Queue", explain: "Thread-safe data structure. Audio thread puts events IN. Main thread takes events OUT. Prevents race conditions." },
          { term: "Race condition", explain: "When two threads read/write the same variable at the same time and corrupt it. Queues and locks prevent this." },
          { term: "Daemon thread", explain: "A background thread that auto-stops when main program exits. Set thread.daemon = True for audio thread." }
        ],
        tasks: [
          "Create backend/services/alert_queue.py with a thread-safe Queue",
          "Move audio analysis to a separate thread that puts alerts in queue",
          "Main loop reads camera frames + checks queue for audio alerts",
          "All alerts go into unified events list with type, timestamp, severity",
          "Display unified status on screen: face ✓, gaze ✓, phone ✗, audio ✓",
          "Print live alert feed to terminal every 2 seconds",
          "Test all 4 alerts work simultaneously"
        ],
        commands: [
          "from queue import Queue",
          "from threading import Thread",
          "alert_queue = Queue()",
          "def audio_thread(queue):",
          "  # audio capture + VAD loop",
          "  if speech_detected: queue.put({'type': 'SPEECH', 'time': time.time()})",
          "t = Thread(target=audio_thread, args=(alert_queue,), daemon=True)",
          "t.start()",
          "# In main loop:",
          "while not alert_queue.empty():",
          "  alert = alert_queue.get()"
        ],
        deliverable: "All 4 detection streams running. Unified alert feed in terminal. No crashes."
      },
      {
        day: 13,
        title: "Event Logger",
        emoji: "📋",
        what: "Build a proper event logging system that saves alerts to a JSON file. This becomes the data your dashboard reads.",
        why: "Right now alerts disappear when session ends. Persistent logging means you can review what happened after the exam.",
        learn: [
          { term: "JSON", explain: "JavaScript Object Notation. A text format for structured data: {key: value}. Python dicts serialize to/from JSON easily." },
          { term: "Session ID", explain: "A unique identifier for each exam session. Generated at start: import uuid; session_id = str(uuid.uuid4())" },
          { term: "JSONL (JSON Lines)", explain: "One JSON object per line. Better than one big array for logging because you can append without reading entire file." },
          { term: "Schema", explain: "The structure/format of your data. Define it early: every event has: id, session_id, type, timestamp, severity, metadata." }
        ],
        tasks: [
          "Create backend/utils/event_logger.py",
          "EventLogger class with session_id = uuid.uuid4()",
          "log_event(type, severity, metadata={}) method",
          "Each event: {id, session_id, type, severity, timestamp_unix, timestamp_human, metadata}",
          "Save to data/logs/{session_id}.jsonl — one event per line",
          "get_session_summary() method: count by type, start time, duration",
          "Test: run 2-minute session, open JSONL file, verify all events are there"
        ],
        commands: [
          "import json, uuid, time",
          "from datetime import datetime",
          "class EventLogger:",
          "  def __init__(self):",
          "    self.session_id = str(uuid.uuid4())",
          "    self.log_path = f'data/logs/{self.session_id}.jsonl'",
          "  def log_event(self, type, severity='medium', metadata={}):",
          "    event = {'id': str(uuid.uuid4()), 'session_id': self.session_id,",
          "             'type': type, 'severity': severity, 'ts': time.time(),",
          "             'ts_human': datetime.now().isoformat(), 'metadata': metadata}",
          "    with open(self.log_path, 'a') as f: f.write(json.dumps(event)+'\\n')"
        ],
        deliverable: "JSONL log file exists after session. Open it and read your events."
      },
      {
        day: 14,
        title: "Week 2 Demo",
        emoji: "🎬",
        what: "Polish all Week 1+2 code. Clean up messy parts. Record Demo Video #2 showing all 6 alert types working.",
        why: "Cleaning code every week prevents technical debt. Your demo video is portfolio evidence — make it look great.",
        learn: [
          { term: "Refactoring", explain: "Improving code structure without changing behavior. Rename bad variable names, extract repeated code into functions." },
          { term: "Code comments", explain: "Brief explanations above non-obvious code. # Debounce: prevent alerts firing more than once per 5 seconds" },
          { term: "README", explain: "The first file anyone reads in your repo. Describe: what it does, how to install, how to run, screenshots/GIFs." }
        ],
        tasks: [
          "Review all files — rename confusing variables",
          "Add comments to every function",
          "Make sure all classes have docstrings",
          "Update README with: what's working, what's coming, how to run",
          "Record 2-min demo video: start session, trigger all 6 alerts one by one",
          "Commit everything: git add . && git commit -m 'Week 2: all detectors working'",
          "Push to GitHub: git remote add origin <your-repo> && git push"
        ],
        commands: [
          "git add .",
          "git commit -m 'feat: complete all detection modules - face, gaze, phone, audio'",
          "git push origin main"
        ],
        deliverable: "GitHub has your Week 1+2 code. Demo video #2 shows all 6 alert types."
      }
    ]
  },
  {
    id: 3,
    title: "Week 3",
    subtitle: "Backend API + Database",
    color: "#A855F7",
    days: [
      {
        day: 15,
        title: "FastAPI Basics",
        emoji: "⚡",
        what: "Build a REST API with FastAPI. Create endpoints to start/stop exam sessions and retrieve alert logs.",
        why: "Your detectors currently only work via terminal. An API lets any frontend (web, mobile) talk to your system.",
        learn: [
          { term: "REST API", explain: "A way for programs to talk over HTTP. Your frontend sends GET /session/123/alerts, backend responds with JSON data." },
          { term: "FastAPI", explain: "Python's fastest API framework. Auto-generates documentation, validates inputs, handles async — all with minimal code." },
          { term: "Endpoint", explain: "A URL that does something. POST /session/start starts an exam. GET /session/{id}/alerts returns events." },
          { term: "Pydantic", explain: "Data validation library. Define what your API inputs/outputs look like as Python classes. FastAPI uses it automatically." }
        ],
        tasks: [
          "Create backend/api/main.py",
          "Initialize FastAPI app",
          "POST /session/start → creates session ID, starts detectors, returns session_id",
          "POST /session/{id}/stop → stops detectors, saves final log",
          "GET /session/{id}/alerts → returns all events for that session as JSON",
          "GET /sessions → list all past sessions",
          "Run: uvicorn backend.api.main:app --reload",
          "Visit http://localhost:8000/docs → explore auto-generated API docs"
        ],
        commands: [
          "from fastapi import FastAPI",
          "from pydantic import BaseModel",
          "app = FastAPI()",
          "@app.post('/session/start')",
          "def start_session():",
          "  session_id = str(uuid.uuid4())",
          "  # start detectors here",
          "  return {'session_id': session_id, 'status': 'started'}",
          "@app.get('/session/{session_id}/alerts')",
          "def get_alerts(session_id: str):",
          "  # read JSONL file for this session",
          "  return {'events': events_list}"
        ],
        deliverable: "FastAPI running. Docs at /docs. Can start/stop session via HTTP POST."
      },
      {
        day: 16,
        title: "WebSockets",
        emoji: "🔌",
        what: "Add a WebSocket endpoint that streams live alerts to any connected client in real-time.",
        why: "HTTP is request-response (ask → answer). WebSocket is persistent (connection stays open, server pushes data whenever). Essential for live alerts.",
        learn: [
          { term: "WebSocket", explain: "A two-way persistent connection between client and server. Server can push data any time without client asking. Used in chat apps, live dashboards, stock tickers." },
          { term: "ws:// protocol", explain: "WebSocket URLs start with ws:// (or wss:// for secure). Your frontend connects to ws://localhost:8000/ws/{session_id}." },
          { term: "Broadcasting", explain: "Sending a message to all connected WebSocket clients at once. One alert → all proctor dashboards see it." },
          { term: "Connection manager", explain: "A class that keeps track of all active WebSocket connections. add(), remove(), broadcast() methods." }
        ],
        tasks: [
          "Create backend/api/websocket.py",
          "ConnectionManager class with: connect(), disconnect(), broadcast()",
          "WS endpoint: /ws/{session_id}",
          "When detection system logs an event, also broadcast it via WebSocket",
          "Test with browser console: new WebSocket('ws://localhost:8000/ws/test')",
          "Trigger an alert → watch browser console receive the JSON message",
          "Handle disconnection gracefully (client closes browser)"
        ],
        commands: [
          "from fastapi import WebSocket",
          "class ConnectionManager:",
          "  def __init__(self): self.active = []",
          "  async def connect(self, ws): await ws.accept(); self.active.append(ws)",
          "  def disconnect(self, ws): self.active.remove(ws)",
          "  async def broadcast(self, msg):",
          "    for conn in self.active:",
          "      await conn.send_json(msg)",
          "@app.websocket('/ws/{session_id}')",
          "async def ws_endpoint(websocket: WebSocket, session_id: str):",
          "  await manager.connect(websocket)",
          "  try:",
          "    while True: await websocket.receive_text()",
          "  except: manager.disconnect(websocket)"
        ],
        deliverable: "Open browser console. Run test. Trigger alert. See JSON appear in console instantly."
      },
      {
        day: 17,
        title: "SQLite Database",
        emoji: "🗄️",
        what: "Replace JSONL file logging with a proper SQLite database. Store sessions and events in structured tables.",
        why: "JSONL is fine for MVP but you can't query it efficiently. SQL lets you ask: 'Show all PHONE alerts from last week sorted by severity.'",
        learn: [
          { term: "SQLite", explain: "A database that lives in a single file. No server needed. Perfect for development and small-scale production." },
          { term: "SQLAlchemy", explain: "Python ORM (Object Relational Mapper). Write Python classes instead of SQL. session.add(event) instead of INSERT INTO..." },
          { term: "ORM", explain: "Object Relational Mapper. Maps Python objects to database rows. Your Event class = events table in database." },
          { term: "Schema migration", explain: "Changing database structure (adding columns, tables). Use Alembic with SQLAlchemy to do this safely." }
        ],
        tasks: [
          "pip install sqlalchemy",
          "Create backend/utils/database.py",
          "Define Session table: id, start_time, end_time, student_id",
          "Define Event table: id, session_id (FK), type, severity, timestamp, metadata_json",
          "Create engine: sqlite:///data/proctoring.db",
          "Replace JSONL logging with DB inserts",
          "Test: run session, open data/proctoring.db with DB Browser for SQLite (download it), see your tables"
        ],
        commands: [
          "from sqlalchemy import create_engine, Column, String, Float, Integer, ForeignKey",
          "from sqlalchemy.orm import DeclarativeBase, Session",
          "class Base(DeclarativeBase): pass",
          "class EventModel(Base):",
          "  __tablename__ = 'events'",
          "  id = Column(String, primary_key=True)",
          "  session_id = Column(String, ForeignKey('sessions.id'))",
          "  type = Column(String)",
          "  severity = Column(String)",
          "  timestamp = Column(Float)",
          "engine = create_engine('sqlite:///data/proctoring.db')",
          "Base.metadata.create_all(engine)"
        ],
        deliverable: "Events saved to SQLite DB. Visible in DB Browser. API reads from DB."
      },
      {
        day: 18,
        title: "React Frontend Setup",
        emoji: "⚛️",
        what: "Create a React app using Vite. Build the basic layout of your proctor dashboard.",
        why: "Your backend is done. Now you need a visual interface that proctors actually use. React is the industry standard for dashboards.",
        learn: [
          { term: "React", explain: "JavaScript library for building UIs. You define components (reusable UI pieces) and React handles updating the DOM efficiently." },
          { term: "Vite", explain: "Super-fast build tool for React. Replaces Create React App. Start in seconds, hot-reload on save." },
          { term: "Component", explain: "A reusable UI piece. <AlertCard /> is a component. <Dashboard /> uses many components. Think LEGO bricks." },
          { term: "useState", explain: "React hook to store data that changes. When state changes, React re-renders only the affected parts of UI." }
        ],
        tasks: [
          "npm create vite@latest frontend -- --template react",
          "cd frontend && npm install && npm run dev",
          "Install: npm install recharts axios",
          "Create components/: AlertCard.jsx, SessionHeader.jsx, AlertFeed.jsx, StatusBar.jsx",
          "Build Dashboard.jsx with: top status bar, left alert feed, right summary stats",
          "Use CSS Grid/Flexbox for layout — no UI library needed",
          "Hard-code fake data first: const fakeAlerts = [{type:'PHONE', time:'10:23'}]"
        ],
        commands: [
          "npm create vite@latest frontend -- --template react",
          "cd frontend && npm install",
          "npm install recharts axios",
          "npm run dev  # visit http://localhost:5173"
        ],
        deliverable: "React app running at localhost:5173. Dashboard layout visible with fake data."
      },
      {
        day: 19,
        title: "Live Alert Feed",
        emoji: "📡",
        what: "Connect React frontend to your FastAPI WebSocket. Real alerts from the backend appear live on dashboard.",
        why: "This is the moment everything connects. Detection → WebSocket → Dashboard. This is what you demo to interviewers.",
        learn: [
          { term: "useEffect", explain: "React hook that runs code when component mounts/unmounts. Perfect for opening WebSocket connection when dashboard loads." },
          { term: "WebSocket in JS", explain: "new WebSocket('ws://localhost:8000/ws/session1'). Then: ws.onmessage = (e) => { const data = JSON.parse(e.data) }" },
          { term: "State update from WS", explain: "When WS message arrives, call setAlerts(prev => [newAlert, ...prev]) to prepend to list." },
          { term: "Cleanup", explain: "When component unmounts, close WS: return () => ws.close() inside useEffect." }
        ],
        tasks: [
          "In Dashboard.jsx, open WebSocket in useEffect",
          "On message: parse JSON, prepend to alerts state array",
          "AlertFeed component: map over alerts, render AlertCard for each",
          "AlertCard: shows type (colored badge), timestamp, severity",
          "Color code: PHONE = red, GAZE = yellow, FACE = orange, AUDIO = blue",
          "Test: dashboard open. Trigger alert by showing phone to webcam. Watch card appear instantly.",
          "Add animation: new alerts slide in from top"
        ],
        commands: [
          "// In Dashboard.jsx:",
          "const [alerts, setAlerts] = useState([])",
          "useEffect(() => {",
          "  const ws = new WebSocket('ws://localhost:8000/ws/session1')",
          "  ws.onmessage = (e) => {",
          "    const alert = JSON.parse(e.data)",
          "    setAlerts(prev => [alert, ...prev].slice(0, 100))",
          "  }",
          "  return () => ws.close()",
          "}, [])"
        ],
        deliverable: "Alert appears on dashboard within 1 second of detection. No page refresh needed."
      },
      {
        day: 20,
        title: "Stats + Charts",
        emoji: "📊",
        what: "Add a summary panel showing alert counts by type, and a timeline chart of alerts over the session.",
        why: "Raw alerts are hard to interpret. Charts let proctors see at a glance: 'this student had 5 phone detections in the last 10 minutes.'",
        learn: [
          { term: "Recharts", explain: "React charting library. BarChart, LineChart, PieChart — all as React components. Data is just an array of objects." },
          { term: "Derived state", explain: "Data computed FROM state. Don't store alertCounts in state — derive it: const counts = alerts.reduce(...)." },
          { term: "useMemo", explain: "React hook that memoizes (caches) expensive computations. Only re-runs when dependencies change." }
        ],
        tasks: [
          "Create components/AlertSummary.jsx",
          "Count alerts by type: {PHONE: 3, GAZE: 7, AUDIO: 2, FACE: 1}",
          "Render BarChart from Recharts showing these counts",
          "Create components/AlertTimeline.jsx",
          "Timeline: x-axis = time (minutes into session), y-axis = alert count per minute",
          "Bin alerts into 1-minute buckets",
          "Add 'Severity Score': weighted sum (PHONE × 3 + GAZE × 1 + AUDIO × 2 + FACE × 5)"
        ],
        commands: [
          "import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'",
          "const counts = alerts.reduce((acc, a) => {",
          "  acc[a.type] = (acc[a.type] || 0) + 1",
          "  return acc",
          "}, {})",
          "const chartData = Object.entries(counts).map(([type, count]) => ({type, count}))",
          "<BarChart data={chartData}>",
          "  <XAxis dataKey='type' /> <YAxis />",
          "  <Tooltip /> <Bar dataKey='count' fill='#FF6B35' />",
          "</BarChart>"
        ],
        deliverable: "Dashboard shows live bar chart. Colors change as alerts accumulate. Severity score visible."
      },
      {
        day: 21,
        title: "Privacy Layer + Week 3 Demo",
        emoji: "🔒",
        what: "Implement the privacy-first principle: delete raw frames after processing. Add privacy policy text to dashboard. Record Demo #3.",
        why: "This is your differentiator. 'Privacy-preserving proctoring' is a real selling point — most proctoring tools store everything.",
        learn: [
          { term: "Privacy by design", explain: "Building privacy in from the start, not as an afterthought. Only collect minimum needed data." },
          { term: "Data minimization", explain: "GDPR principle: collect only what you need. You need event timestamps, not raw video." },
          { term: "Embeddings vs raw data", explain: "You store a face embedding (a list of 128 numbers) not a photo. Can't reconstruct the face from numbers alone." }
        ],
        tasks: [
          "In detection pipeline: explicitly del frame after processing (Python garbage collection)",
          "Verify: no raw video saved anywhere in data/ folder",
          "Log message: 'Session: X events captured. Zero raw frames stored.'",
          "Add footer to dashboard: 'Privacy-first: no video is stored. Only behavioral metadata.'",
          "Add GDPR-style session consent message on start",
          "Record Demo Video #3: full dashboard in action, narrate privacy features",
          "Commit everything: git commit -m 'Week 3: full backend + dashboard + privacy'"
        ],
        commands: [
          "# After processing each frame:",
          "results = manager.process(frame)",
          "del frame  # explicit deletion",
          "# Only metadata (events) persisted to DB",
          "# Verify by checking folder size: du -sh data/"
        ],
        deliverable: "Confirmed: no video stored. Dashboard shows privacy badge. Demo video #3 recorded."
      }
    ]
  },
  {
    id: 4,
    title: "Week 4",
    subtitle: "Deploy + Portfolio",
    color: "#FFD700",
    days: [
      {
        day: 22,
        title: "Docker Setup",
        emoji: "🐳",
        what: "Containerize your backend using Docker so it runs identically on any machine or cloud server.",
        why: "Without Docker, your app might work on your laptop but fail on the server. Docker packages code + dependencies together.",
        learn: [
          { term: "Docker", explain: "A tool to package your app into a 'container' — like a self-contained box with your code, Python version, and all libraries. Run anywhere." },
          { term: "Dockerfile", explain: "Instructions for building your container: start from Python 3.11, copy code, install dependencies, run the app." },
          { term: "docker-compose", explain: "Run multiple containers together. backend + database + redis, all starting with one command: docker-compose up" },
          { term: "Image vs Container", explain: "Image = the blueprint. Container = a running instance of the image. Like Class vs Object in Python." }
        ],
        tasks: [
          "Create docker/Dockerfile for backend",
          "Base image: python:3.11-slim",
          "COPY backend/ and requirements.txt",
          "RUN pip install -r requirements.txt",
          "CMD uvicorn backend.api.main:app --host 0.0.0.0 --port 8000",
          "Create requirements.txt: pip freeze > requirements.txt",
          "Build: docker build -t proctoring-backend .",
          "Run: docker run -p 8000:8000 proctoring-backend",
          "Verify /docs still works at localhost:8000/docs"
        ],
        commands: [
          "# Dockerfile:",
          "FROM python:3.11-slim",
          "WORKDIR /app",
          "COPY requirements.txt .",
          "RUN pip install --no-cache-dir -r requirements.txt",
          "COPY backend/ ./backend/",
          "CMD ['uvicorn', 'backend.api.main:app', '--host', '0.0.0.0', '--port', '8000']",
          "# Build and run:",
          "docker build -t proctoring-backend .",
          "docker run -p 8000:8000 proctoring-backend"
        ],
        deliverable: "Backend runs inside Docker container. API accessible at localhost:8000."
      },
      {
        day: 23,
        title: "Deploy Backend",
        emoji: "☁️",
        what: "Deploy your Dockerized backend to Render.com (free tier). Your API becomes accessible from anywhere on the internet.",
        why: "A live URL transforms your project from 'local demo' to 'deployed product'. This is what you put on your resume.",
        learn: [
          { term: "Render.com", explain: "Cloud platform with a generous free tier. Connects to GitHub, auto-deploys when you push. No credit card needed for basic use." },
          { term: "Environment variables", explain: "Config values set outside your code (API keys, secrets). Never hardcode secrets. Render lets you set these in their dashboard." },
          { term: "CORS", explain: "Cross-Origin Resource Sharing. Your frontend at vercel.app can't talk to your backend at render.com without CORS headers. Must configure this." },
          { term: "Health check", explain: "An endpoint like GET /health that returns {status: ok}. Cloud platforms ping this to know your app is alive." }
        ],
        tasks: [
          "Add GET /health endpoint to FastAPI",
          "Add CORS middleware to FastAPI: allow your Vercel frontend URL",
          "Push latest code to GitHub",
          "Go to render.com → New Web Service → connect GitHub repo",
          "Select Docker environment, set start command",
          "Deploy. Wait 3-5 minutes.",
          "Test: visit https://your-app.onrender.com/docs",
          "Update frontend to use Render URL instead of localhost"
        ],
        commands: [
          "from fastapi.middleware.cors import CORSMiddleware",
          "app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])",
          "@app.get('/health')",
          "def health(): return {'status': 'ok', 'version': '1.0'}"
        ],
        deliverable: "Backend live at https://your-project.onrender.com. /docs accessible from phone."
      },
      {
        day: 24,
        title: "Deploy Frontend",
        emoji: "🌐",
        what: "Deploy your React dashboard to Vercel. Your complete system is now live on the internet.",
        why: "Vercel is the fastest way to deploy React apps. Free, custom domain support, automatic HTTPS, global CDN.",
        learn: [
          { term: "Vercel", explain: "Deploy frontend apps in seconds. Connect GitHub repo, it auto-deploys every time you push. Perfect for React/Next.js." },
          { term: "Environment variables in React", explain: "Vite uses VITE_ prefix: VITE_API_URL=https://your-backend.onrender.com. Access in code: import.meta.env.VITE_API_URL" },
          { term: "Build process", explain: "npm run build converts React JSX to plain HTML/CSS/JS that browsers understand. Output goes to dist/ folder." },
          { term: "CDN", explain: "Content Delivery Network. Your frontend files are served from servers close to the user. Global, fast, reliable." }
        ],
        tasks: [
          "Replace all localhost:8000 with import.meta.env.VITE_API_URL",
          "npm run build — fix any build errors",
          "Install Vercel CLI: npm i -g vercel",
          "Run: vercel (follow prompts)",
          "Or: go to vercel.com → Import Project → GitHub",
          "Set environment variable VITE_API_URL in Vercel dashboard",
          "Redeploy. Visit your-project.vercel.app",
          "Test: dashboard loads, WebSocket connects to Render backend"
        ],
        commands: [
          "npm run build",
          "npx vercel --prod",
          "# Set in Vercel dashboard > Settings > Environment Variables:",
          "VITE_API_URL = https://your-project.onrender.com",
          "VITE_WS_URL = wss://your-project.onrender.com"
        ],
        deliverable: "Frontend live at https://your-project.vercel.app. Full system working end-to-end on internet."
      },
      {
        day: 25,
        title: "Architecture Diagram + README",
        emoji: "📝",
        what: "Draw a professional system architecture diagram and write a comprehensive README that anyone can understand.",
        why: "Interviewers and recruiters READ your README before looking at code. A great README can get you an interview.",
        learn: [
          { term: "System architecture diagram", explain: "A visual showing how components connect: Webcam → CV Pipeline → FastAPI → WebSocket → React Dashboard. Use boxes and arrows." },
          { term: "Excalidraw", explain: "Free browser-based diagramming tool. Sketch boxes, arrows, labels. Export as PNG. Use at excalidraw.com." },
          { term: "Badges", explain: "Small status icons at top of README: Python 3.11 | FastAPI | React | Docker | Live Demo. Look professional, add context fast." }
        ],
        tasks: [
          "Go to excalidraw.com — draw your system architecture",
          "Boxes: Webcam, MediaPipe, YOLOv8, VAD, FastAPI, SQLite, WebSocket, React",
          "Arrows showing data flow between each component",
          "Export as PNG, save to docs/architecture.png",
          "Write README.md sections: What it does, Architecture (embed diagram), Tech stack, Features, How to run locally, Live demo link, Screenshots",
          "Add 3 badges at top using shields.io",
          "Embed Demo Video #3 thumbnail linking to YouTube"
        ],
        commands: [
          "# README structure:",
          "# 🎓 AI Proctoring System",
          "[![Python](badge)] [![FastAPI](badge)] [![React](badge)]",
          "## What it does",
          "## Architecture ![diagram](docs/architecture.png)",
          "## Features",
          "## Quick Start",
          "## Live Demo",
          "## Tech Stack"
        ],
        deliverable: "README.md looks stunning. Architecture diagram embedded. Live links working."
      },
      {
        day: 26,
        title: "Demo Video",
        emoji: "🎥",
        what: "Record a professional 2-minute demo video showing your complete system. Narrate what's happening and why it matters.",
        why: "A demo video is the most powerful portfolio piece. Recruiters watch it in 2 minutes instead of reading code for 30.",
        learn: [
          { term: "Screen recording", explain: "Use OBS Studio (free) or Loom (easy). Capture your screen + voice. Show the dashboard + webcam side by side." },
          { term: "Narration script", explain: "Write what you'll say before recording. 30 seconds intro, 60 seconds demo, 30 seconds summary of tech used." },
          { term: "Thumbnail", explain: "The image shown before video plays. Make it show your dashboard with a bold title. Use Canva (free)." }
        ],
        tasks: [
          "Write a 2-minute narration script first",
          "Script: 'This is an AI proctoring system... it detects... using MediaPipe for... YOLOv8 for... WebRTC VAD for...'",
          "Download OBS Studio or use Loom",
          "Set up: browser with dashboard on left, webcam preview on right",
          "Record: trigger each alert type while narrating",
          "Edit: trim silence, add title card at start",
          "Upload to YouTube (unlisted is fine)",
          "Add YouTube link to README and LinkedIn"
        ],
        commands: [
          "# Script outline:",
          "0:00 - 'Hi, I built an AI-powered proctoring system...'",
          "0:20 - Show dashboard loading, explain privacy approach",
          "0:40 - Demo face detection + multi-face alert",
          "1:00 - Demo gaze detection (look away)",
          "1:15 - Demo phone detection",
          "1:30 - Demo audio detection (speak)",
          "1:45 - Show charts updating in real-time",
          "1:55 - 'Built with MediaPipe, YOLOv8, FastAPI, React. Live at...'"
        ],
        deliverable: "2-minute demo video on YouTube. Thumbnail looks professional. Link in README."
      },
      {
        day: 27,
        title: "Blog Post",
        emoji: "✍️",
        what: "Write a technical blog post: 'How I Built an AI Proctoring System in 30 Days.' Publish on Hashnode or Dev.to.",
        why: "Blog posts get you Google-indexed. When a recruiter searches 'AI proctoring system Python', your post might appear. It's passive job hunting.",
        learn: [
          { term: "Hashnode", explain: "Free developer blogging platform. Your blog at yourname.hashnode.dev. Good SEO. Dev community reads it." },
          { term: "Technical writing", explain: "Explain what you built, why each technology choice, what challenges you faced, what you learned." },
          { term: "SEO", explain: "Search Engine Optimization. Use keywords naturally: 'AI proctoring', 'real-time face detection Python', 'FastAPI WebSocket' in your post." }
        ],
        tasks: [
          "Create account on hashnode.com",
          "Write post structure: Intro (why this problem), System Overview (architecture diagram), Key challenges (threading, WebSocket, privacy), Results, What I learned",
          "Include code snippets for the most interesting parts (VAD, WebSocket, EAR formula)",
          "Embed architecture diagram",
          "Link to GitHub repo and live demo",
          "Minimum 800 words",
          "Publish and share link on LinkedIn"
        ],
        commands: [
          "# Post sections:",
          "1. The Problem: Why proctoring needs AI",
          "2. System Architecture: [embed diagram]",
          "3. Building Face Detection with MediaPipe",
          "4. Real-time Audio Analysis with WebRTC VAD",
          "5. The Privacy Layer: Why we don't store video",
          "6. WebSocket: Making it real-time",
          "7. Deployment: Render + Vercel",
          "8. What I learned + GitHub link"
        ],
        deliverable: "Blog post published. Shared on LinkedIn. URL added to README."
      },
      {
        day: 28,
        title: "LinkedIn + GitHub Polish",
        emoji: "💼",
        what: "Update your LinkedIn with this project. Polish your GitHub profile. Prepare your interview talking points.",
        why: "Your technical work means nothing if recruiters can't find it. Distribution is as important as building.",
        learn: [
          { term: "GitHub pinned repos", explain: "Pin your 3 best repos to your profile. Proctoring system should be one of them. Visitors see it first." },
          { term: "LinkedIn featured section", explain: "Add your demo video, blog post, and GitHub link as featured items. Shows up prominently on your profile." },
          { term: "STAR format", explain: "Situation, Task, Action, Result. Format for describing your project in interviews: 'I built X because Y, using Z, which resulted in W.'" }
        ],
        tasks: [
          "GitHub: pin proctoring-system repo",
          "GitHub: add topics to repo: python, computer-vision, fastapi, react, mediapipe, yolov8, real-time",
          "GitHub profile README: add proctoring system with live link",
          "LinkedIn: add project under Experience or Projects section",
          "LinkedIn: add demo video to Featured section",
          "Write your STAR story for this project (practice out loud)",
          "Prepare 5 technical questions you'd ask about the system",
          "Prepare answers to: 'What was the hardest part?' 'What would you improve?' 'How does it scale?'"
        ],
        commands: [
          "# Your LinkedIn project description:",
          "AI Proctoring System | Computer Vision + NLP",
          "Built a real-time behavioral analysis system using MediaPipe, YOLOv8, and WebRTC VAD.",
          "Detects: gaze deviation, phone use, multiple faces, audio events.",
          "Privacy-first: zero raw video storage. Alerts via WebSocket to React dashboard.",
          "Deployed: FastAPI backend (Render) + React frontend (Vercel).",
          "Live demo: [link] | GitHub: [link]"
        ],
        deliverable: "LinkedIn updated. GitHub pinned. 5 interview talking points written and practiced."
      },
      {
        day: 29,
        title: "Final Polish",
        emoji: "✨",
        what: "Bug fixes, edge case handling, performance improvements. Make your system as robust as possible.",
        why: "The gap between a portfolio project and a production system is edge case handling. Show you think like an engineer, not just a student.",
        learn: [
          { term: "Edge cases", explain: "Unusual inputs that break your system: what if camera disconnects? What if no mic? What if WebSocket drops?" },
          { term: "Error handling", explain: "try/except around operations that can fail. Graceful degradation: if phone detector fails, rest of system keeps running." },
          { term: "Logging", explain: "Use Python's logging module instead of print. Levels: DEBUG, INFO, WARNING, ERROR. Production code always uses logging." }
        ],
        tasks: [
          "Add try/except around all detector processes — if one fails, others continue",
          "Handle camera disconnect: attempt reconnect 3 times, then log error",
          "Handle WebSocket disconnect: clean up connections, don't crash server",
          "Add Python logging module throughout (remove print statements)",
          "Test: unplug camera. Talk while face is away. Cover camera then talk. Each should work.",
          "Performance check: measure CPU usage. Should be under 70% on laptop.",
          "Final git commit with clean message"
        ],
        commands: [
          "import logging",
          "logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')",
          "logger = logging.getLogger(__name__)",
          "try:",
          "  results = face_detector.process(frame)",
          "except Exception as e:",
          "  logger.error(f'Face detection failed: {e}')",
          "  results = None  # graceful degradation"
        ],
        deliverable: "System handles 5 different error conditions without crashing."
      },
      {
        day: 30,
        title: "🎉 Launch Day",
        emoji: "🚀",
        what: "Final review, apply to jobs, celebrate. You built a real AI system in 30 days.",
        why: "You shipped. That puts you in the top 5% of CS students who actually complete projects.",
        learn: [
          { term: "What you learned", explain: "Computer vision, real-time systems, REST APIs, WebSockets, databases, Docker, React, cloud deployment, technical writing. That's an entire backend/ML engineer's toolkit." },
          { term: "What to say", explain: "'I built a full-stack AI system with 4 detection modalities, WebSocket real-time streaming, privacy-first architecture, and deployed on cloud infrastructure.'" }
        ],
        tasks: [
          "Final end-to-end test: run full 5-minute session, verify all alerts work",
          "Check all links: GitHub, live demo, blog post, YouTube",
          "Apply to 5 companies today with your project linked",
          "Post on LinkedIn: 'I just shipped an AI proctoring system in 30 days. Here's what I built...'",
          "DM 3 people in your network with the demo link",
          "Write down 3 features you'd add next (for interview question: 'what would you improve?')",
          "Rest. You earned it."
        ],
        commands: [
          "# Checklist:",
          "✅ GitHub repo: public, pinned, has README with demo link",
          "✅ Live backend: https://your-project.onrender.com/docs",
          "✅ Live frontend: https://your-project.vercel.app",
          "✅ Blog post: published on Hashnode",
          "✅ Demo video: on YouTube",
          "✅ LinkedIn: project added, featured section updated",
          "✅ Applied to 5 companies today"
        ],
        deliverable: "🎓 You are now a developer who ships AI systems. Go get that job."
      }
    ]
  }
];

const severityColor = { HIGH: "#FF4444", MEDIUM: "#FF6B35", LOW: "#FFD700" };

export default function App() {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [activeTab, setActiveTab] = useState("what");

  const week = weeks[selectedWeek];
  const day = selectedDay !== null ? week.days[selectedDay] : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0F",
      color: "#E8E8F0",
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1E1E2E",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#0D0D1A",
      }}>
        <div>
          <div style={{ fontSize: 11, color: "#666", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
            NIT Patna · CSE Project
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#E8E8F0", letterSpacing: -0.5 }}>
            AI Proctoring System · 30-Day Roadmap
          </div>
        </div>
        <div style={{
          background: "#00FFB220",
          border: "1px solid #00FFB240",
          borderRadius: 6,
          padding: "6px 14px",
          fontSize: 12,
          color: "#00FFB2",
        }}>
          30 days · 4 weeks · 120+ tasks
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 70px)" }}>
        {/* Left sidebar: week + day selector */}
        <div style={{
          width: 280,
          borderRight: "1px solid #1E1E2E",
          overflowY: "auto",
          background: "#0D0D1A",
          flexShrink: 0,
        }}>
          {weeks.map((w, wi) => (
            <div key={w.id}>
              {/* Week header */}
              <div
                onClick={() => { setSelectedWeek(wi); setSelectedDay(null); }}
                style={{
                  padding: "14px 20px",
                  cursor: "pointer",
                  borderLeft: selectedWeek === wi && selectedDay === null
                    ? `3px solid ${w.color}` : "3px solid transparent",
                  background: selectedWeek === wi ? "#13131F" : "transparent",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: w.color, flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: w.color }}>
                      {w.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 1 }}>
                      {w.subtitle}
                    </div>
                  </div>
                </div>
              </div>

              {/* Day list */}
              {selectedWeek === wi && w.days.map((d, di) => (
                <div
                  key={d.day}
                  onClick={() => setSelectedDay(di)}
                  style={{
                    padding: "10px 20px 10px 36px",
                    cursor: "pointer",
                    borderLeft: selectedDay === di
                      ? `3px solid ${w.color}` : "3px solid transparent",
                    background: selectedDay === di ? "#1A1A2E" : "transparent",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 4,
                    background: selectedDay === di ? w.color + "30" : "#1E1E2E",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                    color: selectedDay === di ? w.color : "#555",
                    flexShrink: 0,
                  }}>
                    {d.day}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: selectedDay === di ? "#E8E8F0" : "#888" }}>
                      {d.emoji} {d.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 0 }}>
          {!day ? (
            // Week overview
            <div style={{ padding: 32 }}>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
                  {week.title} · {week.subtitle}
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: week.color, marginBottom: 8 }}>
                  {week.days.length} Days · {week.days.length * 15}+ Tasks
                </div>
                <div style={{ fontSize: 14, color: "#666", maxWidth: 500 }}>
                  Click any day in the sidebar to see the full breakdown: what to build, what to study, and commands to run.
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {week.days.map((d, di) => (
                  <div
                    key={d.day}
                    onClick={() => setSelectedDay(di)}
                    style={{
                      background: "#13131F",
                      border: `1px solid ${week.color}20`,
                      borderRadius: 10,
                      padding: 18,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = week.color + "60"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = week.color + "20"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: week.color + "20",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: week.color,
                      }}>
                        {d.day}
                      </div>
                      <div style={{ fontSize: 16 }}>{d.emoji}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#E8E8F0" }}>{d.title}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>
                      {d.what.slice(0, 80)}...
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: week.color + "90" }}>
                      {d.tasks.length} tasks · {d.learn.length} concepts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Day detail
            <div>
              {/* Day header */}
              <div style={{
                padding: "24px 32px",
                borderBottom: "1px solid #1E1E2E",
                background: "#0D0D1A",
                position: "sticky", top: 0, zIndex: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    background: week.color + "20",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24,
                  }}>
                    {day.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase" }}>
                      Day {day.day} · {week.title}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#E8E8F0", marginTop: 2 }}>
                      {day.title}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
                  {["what", "learn", "tasks", "commands", "deliverable"].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: "inherit",
                        background: activeTab === tab ? week.color : "#1E1E2E",
                        color: activeTab === tab ? "#000" : "#666",
                        fontWeight: activeTab === tab ? 700 : 400,
                        transition: "all 0.15s",
                        textTransform: "capitalize",
                      }}
                    >
                      {tab === "what" ? "📋 Overview" :
                       tab === "learn" ? "🧠 Study" :
                       tab === "tasks" ? "✅ Tasks" :
                       tab === "commands" ? "💻 Commands" : "🏆 Goal"}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: 32 }}>
                {activeTab === "what" && (
                  <div>
                    <div style={{
                      background: "#13131F",
                      border: `1px solid ${week.color}30`,
                      borderRadius: 10,
                      padding: 24,
                      marginBottom: 20,
                    }}>
                      <div style={{ fontSize: 12, color: week.color, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                        What you're building today
                      </div>
                      <div style={{ fontSize: 15, color: "#E8E8F0", lineHeight: 1.7 }}>
                        {day.what}
                      </div>
                    </div>
                    <div style={{
                      background: "#13131F",
                      border: "1px solid #1E1E2E",
                      borderRadius: 10,
                      padding: 24,
                    }}>
                      <div style={{ fontSize: 12, color: "#A855F7", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                        Why this matters
                      </div>
                      <div style={{ fontSize: 15, color: "#E8E8F0", lineHeight: 1.7 }}>
                        {day.why}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "learn" && (
                  <div>
                    <div style={{ fontSize: 12, color: "#666", letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>
                      Study these concepts before/while coding today
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {day.learn.map((item, i) => (
                        <div key={i} style={{
                          background: "#13131F",
                          border: "1px solid #1E1E2E",
                          borderRadius: 10,
                          padding: 20,
                          display: "flex",
                          gap: 16,
                        }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: week.color + "20",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 14, fontWeight: 700, color: week.color,
                            flexShrink: 0,
                          }}>
                            {i + 1}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: week.color, marginBottom: 6 }}>
                              {item.term}
                            </div>
                            <div style={{ fontSize: 13, color: "#999", lineHeight: 1.6 }}>
                              {item.explain}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "tasks" && (
                  <div>
                    <div style={{ fontSize: 12, color: "#666", letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>
                      Complete these in order today
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {day.tasks.map((task, i) => (
                        <div key={i} style={{
                          background: "#13131F",
                          border: "1px solid #1E1E2E",
                          borderRadius: 8,
                          padding: "14px 18px",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 14,
                        }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: 5,
                            border: `1.5px solid ${week.color}60`,
                            flexShrink: 0,
                            marginTop: 1,
                          }} />
                          <div style={{ fontSize: 13, color: "#C8C8D8", lineHeight: 1.5 }}>
                            {task}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "commands" && (
                  <div>
                    <div style={{ fontSize: 12, color: "#666", letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>
                      Commands & code to run
                    </div>
                    <div style={{
                      background: "#080810",
                      border: "1px solid #1E1E2E",
                      borderRadius: 10,
                      padding: 24,
                      fontFamily: "inherit",
                    }}>
                      {day.commands.map((cmd, i) => (
                        <div key={i} style={{
                          fontSize: 12,
                          lineHeight: 2,
                          color: cmd.startsWith("#") ? "#555" :
                                 cmd.startsWith("import") || cmd.startsWith("from") || cmd.startsWith("class") || cmd.startsWith("def") || cmd.startsWith("async") ? "#A855F7" :
                                 cmd.includes("=") ? "#00FFB2" : "#E8E8F0",
                          whiteSpace: "pre",
                        }}>
                          {cmd}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: "#444", marginTop: 12 }}>
                      Purple = Python keywords/imports · Green = assignments · White = logic · Gray = comments
                    </div>
                  </div>
                )}

                {activeTab === "deliverable" && (
                  <div>
                    <div style={{
                      background: "#0A1F0A",
                      border: `1px solid ${week.color}40`,
                      borderRadius: 14,
                      padding: 32,
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: 40, marginBottom: 16 }}>🏆</div>
                      <div style={{ fontSize: 12, color: week.color, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>
                        Day {day.day} Complete When...
                      </div>
                      <div style={{ fontSize: 17, color: "#E8E8F0", lineHeight: 1.7, fontWeight: 600 }}>
                        {day.deliverable}
                      </div>
                    </div>

                    {selectedDay < week.days.length - 1 && (
                      <div
                        onClick={() => setSelectedDay(selectedDay + 1)}
                        style={{
                          marginTop: 20,
                          background: week.color + "15",
                          border: `1px solid ${week.color}30`,
                          borderRadius: 10,
                          padding: "16px 24px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = week.color + "25"}
                        onMouseLeave={e => e.currentTarget.style.background = week.color + "15"}
                      >
                        <div>
                          <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Up next →</div>
                          <div style={{ fontSize: 14, color: week.color, fontWeight: 600 }}>
                            Day {week.days[selectedDay + 1].day}: {week.days[selectedDay + 1].emoji} {week.days[selectedDay + 1].title}
                          </div>
                        </div>
                        <div style={{ fontSize: 20, color: week.color }}>→</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
