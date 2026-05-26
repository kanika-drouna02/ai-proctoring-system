import sounddevice as sd
import numpy as np
import time

# Audio settings
SAMPLE_RATE = 16000
CHUNK_SIZE = 1024

print("🎤 Audio capture started... Speak into your mic!")
print("Press Ctrl+C to stop\n")

start_time = time.time()

def audio_callback(indata, frames, time_info, status):
    # Calculate volume (RMS)
    volume = np.sqrt(np.mean(indata**2))
    
    # Scale it up for visibility
    level = int(volume * 200)
    
    # Session timer
    session_time = int(time.time() - start_time)
    mins = session_time // 60
    secs = session_time % 60
    
    # Visual volume bar in terminal
    bar = '█' * min(level, 40)
    empty = '░' * (40 - min(level, 40))
    
    # Color coding
    if level > 25:
        status_text = '🔴 LOUD'
    elif level > 10:
        status_text = '🟡 MEDIUM'
    else:
        status_text = '🟢 QUIET'
    
    print(f'[{mins:02d}:{secs:02d}] {bar}{empty} {level:3d} {status_text}', end='\r')

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
        print("\n\n✅ Audio capture stopped!")