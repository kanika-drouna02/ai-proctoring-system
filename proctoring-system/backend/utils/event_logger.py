import json
import uuid
import time
import os
from datetime import datetime

class EventLogger:
    def __init__(self):
        # Unique ID for this exam session
        self.session_id = str(uuid.uuid4())
        self.start_time = time.time()
        
        # Create logs directory if it doesn't exist
        os.makedirs('data/logs', exist_ok=True)
        
        # Log file path
        self.log_path = f'data/logs/{self.session_id}.jsonl'
        
        # Save session start
        self._write_session_start()
        
        print(f"📋 Session started: {self.session_id[:8]}...")
        print(f"📁 Logging to: {self.log_path}\n")

    def _write_session_start(self):
        session_info = {
            'type': 'SESSION_START',
            'session_id': self.session_id,
            'start_time': self.start_time,
            'start_time_human': datetime.now().isoformat()
        }
        with open(self.log_path, 'a') as f:
            f.write(json.dumps(session_info) + '\n')

    def log_event(self, event_type, severity='MEDIUM', metadata={}):
        event = {
            'id': str(uuid.uuid4()),
            'session_id': self.session_id,
            'type': event_type,
            'severity': severity,
            'timestamp': time.time(),
            'timestamp_human': datetime.now().strftime('%H:%M:%S'),
            'metadata': metadata
        }
        # Write to file immediately
        with open(self.log_path, 'a') as f:
            f.write(json.dumps(event) + '\n')

        return event

    def end_session(self):
        duration = time.time() - self.start_time
        mins = int(duration // 60)
        secs = int(duration % 60)

        # Read all events
        events = self.get_all_events()

        # Count by type
        counts = {}
        for e in events:
            t = e.get('type', 'UNKNOWN')
            counts[t] = counts.get(t, 0) + 1

        summary = {
            'type': 'SESSION_END',
            'session_id': self.session_id,
            'duration_seconds': duration,
            'duration_human': f'{mins:02d}:{secs:02d}',
            'total_events': len(events),
            'counts_by_type': counts,
            'end_time_human': datetime.now().isoformat()
        }

        with open(self.log_path, 'a') as f:
            f.write(json.dumps(summary) + '\n')

        return summary

    def get_all_events(self):
        events = []
        try:
            with open(self.log_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        event = json.loads(line)
                        if event.get('type') not in ['SESSION_START', 'SESSION_END']:
                            events.append(event)
        except FileNotFoundError:
            pass
        return events

    def get_summary(self):
        events = self.get_all_events()
        counts = {}
        for e in events:
            t = e.get('type', 'UNKNOWN')
            counts[t] = counts.get(t, 0) + 1
        return {
            'session_id': self.session_id,
            'total_events': len(events),
            'counts_by_type': counts,
            'duration': time.time() - self.start_time
        }


# ── TEST IT ──
if __name__ == '__main__':
    print("Testing EventLogger...\n")

    logger = EventLogger()

    # Simulate some events
    time.sleep(1)
    logger.log_event('NO_FACE', severity='HIGH')
    print("Logged: NO_FACE")

    time.sleep(1)
    logger.log_event('LOOKING_AWAY', severity='MEDIUM')
    print("Logged: LOOKING_AWAY")

    time.sleep(1)
    logger.log_event('PHONE_DETECTED', severity='HIGH', metadata={'confidence': 0.92})
    print("Logged: PHONE_DETECTED")

    time.sleep(1)
    logger.log_event('SPEECH_DETECTED', severity='MEDIUM', metadata={'volume': 28})
    print("Logged: SPEECH_DETECTED")

    # End session
    summary = logger.end_session()

    print(f"\n--- SESSION SUMMARY ---")
    print(f"Session ID : {summary['session_id'][:8]}...")
    print(f"Duration   : {summary['duration_human']}")
    print(f"Total alerts: {summary['total_events']}")
    print(f"By type    : {summary['counts_by_type']}")
    print(f"\n✅ Check data/logs/ folder for your .jsonl file!")