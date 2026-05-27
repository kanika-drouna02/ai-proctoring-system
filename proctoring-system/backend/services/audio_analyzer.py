from queue import Queue 
import sounddevice as sd
import numpy as np
import time

# Audio settings
SAMPLE_RATE = 16000
CHUNK_SIZE = 1024

# VAD settings
SPEECH_THRESHOLD = 15      # volume level considered speech
SPEECH_FRAMES_TRIGGER = 8  # consecutive frames before alert
COOLDOWN = 3               # seconds between alerts

# State
speech_frames = 0
last_alert_time = 0
events = []
start_time = time.time()

print("🎤 Voice Activity Detection started!")
print("Press Ctrl+C to stop\n")

def audio_callback(indata, frames, time_info, status):
    global speech_frames, last_alert_time, events

    # Calculate volume
    volume = np.sqrt(np.mean(indata**2))
    level = int(volume * 200)

    current_time = time.time()
    session_time = int(current_time - start_time)
    mins = session_time // 60
    secs = session_time % 60

    # VAD logic
    if level > SPEECH_THRESHOLD:
        speech_frames += 1
    else:
        speech_frames = max(0, speech_frames - 1)

    # Fire alert if sustained speech detected
    if speech_frames >= SPEECH_FRAMES_TRIGGER:
        if current_time - last_alert_time > COOLDOWN:

            # Determine severity
            if level > 35:
                alert_type = 'LOUD_SPEECH'
                severity = 'HIGH'
                icon = '🚨'
            else:
                alert_type = 'SPEECH_DETECTED'
                severity = 'MEDIUM'
                icon = '⚠️'

            events.append({
                'type': alert_type,
                'time': time.strftime('%H:%M:%S'),
                'severity': severity,
                'volume': level
            })

            print(f"\n[{time.strftime('%H:%M:%S')}] {icon} {alert_type} — {severity} (vol: {level})")
            last_alert_time = current_time
            speech_frames = 0

    # Visual display
    bar_len = min(level, 40)
    bar = '█' * bar_len + '░' * (40 - bar_len)

    if level > SPEECH_THRESHOLD:
        vad_status = '🗣️  SPEECH'
        color_bar = bar
    else:
        vad_status = '🔇 SILENCE'
        color_bar = bar

    print(f'[{mins:02d}:{secs:02d}] {color_bar} {level:3d} | {vad_status} | Alerts: {len(events)}', end='\r')

# Open mic stream
with sd.InputStream(samplerate=SAMPLE_RATE,
                    channels=1,
                    dtype='float32',
                    blocksize=CHUNK_SIZE,
                    callback=audio_callback):
    try:
        while True:
            time.sleep(0.1)
    except KeyboardInterrupt:
        print("\n\n--- SESSION SUMMARY ---")
        for e in events:
            print(f"[{e['time']}] {e['type']} — {e['severity']} (vol: {e['volume']})")
        print(f"Total alerts: {len(events)}")