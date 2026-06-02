from sqlalchemy import create_engine, Column, String, Float, Integer, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Session
import uuid
import time
from datetime import datetime
import os

# Create data directory if it doesn't exist
os.makedirs('data', exist_ok=True)

# Database file location
DATABASE_URL = "sqlite:///data/proctoring.db"
engine = create_engine(DATABASE_URL, echo=False)

# Base class for all tables
class Base(DeclarativeBase):
    pass

# ── SESSIONS TABLE ──
class SessionModel(Base):
    __tablename__ = 'sessions'

    id = Column(String, primary_key=True)
    student_name = Column(String, default='Student')
    start_time = Column(Float)
    end_time = Column(Float, nullable=True)
    status = Column(String, default='active')

# ── EVENTS TABLE ──
class EventModel(Base):
    __tablename__ = 'events'

    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey('sessions.id'))
    type = Column(String)
    severity = Column(String)
    timestamp = Column(Float)
    timestamp_human = Column(String)

# Create all tables
Base.metadata.create_all(engine)
print("✅ Database tables created!")

# ── DATABASE FUNCTIONS ──
def create_session(student_name: str = "Student"):
    session_id = str(uuid.uuid4())
    with Session(engine) as db:
        session = SessionModel(
            id=session_id,
            student_name=student_name,
            start_time=time.time(),
            status='active'
        )
        db.add(session)
        db.commit()
    return session_id

def end_session(session_id: str):
    with Session(engine) as db:
        session = db.get(SessionModel, session_id)
        if session:
            session.end_time = time.time()
            session.status = 'completed'
            db.commit()
            return True
    return False

def log_event(session_id: str, event_type: str, severity: str = "MEDIUM"):
    event_id = str(uuid.uuid4())
    with Session(engine) as db:
        event = EventModel(
            id=event_id,
            session_id=session_id,
            type=event_type,
            severity=severity,
            timestamp=time.time(),
            timestamp_human=datetime.now().strftime("%H:%M:%S")
        )
        db.add(event)
        db.commit()
    return event_id

def get_events(session_id: str):
    with Session(engine) as db:
        events = db.query(EventModel).filter(
            EventModel.session_id == session_id
        ).all()
        return [
            {
                "id": e.id,
                "session_id": e.session_id,
                "type": e.type,
                "severity": e.severity,
                "timestamp": e.timestamp,
                "timestamp_human": e.timestamp_human
            }
            for e in events
        ]

def get_all_sessions():
    with Session(engine) as db:
        sessions = db.query(SessionModel).all()
        return [
            {
                "id": s.id,
                "student_name": s.student_name,
                "start_time": s.start_time,
                "end_time": s.end_time,
                "status": s.status
            }
            for s in sessions
        ]

def get_session_summary(session_id: str):
    events = get_events(session_id)
    counts = {}
    for e in events:
        counts[e['type']] = counts.get(e['type'], 0) + 1
    return {
        "session_id": session_id,
        "total_events": len(events),
        "counts_by_type": counts
    }

# ── TEST IT ──
if __name__ == '__main__':
    print("\nTesting database...\n")

    # Create session
    session_id = create_session("Kanika")
    print(f"Created session: {session_id[:8]}...")

    # Log some events
    log_event(session_id, "PHONE_DETECTED", "HIGH")
    log_event(session_id, "LOOKING_AWAY", "MEDIUM")
    log_event(session_id, "SPEECH_DETECTED", "MEDIUM")
    print("Logged 3 events!")

    # Get events
    events = get_events(session_id)
    print(f"Retrieved {len(events)} events from database!")

    # Summary
    summary = get_session_summary(session_id)
    print(f"Summary: {summary}")

    # End session
    end_session(session_id)
    print("Session ended!")

    # Get all sessions
    all_sessions = get_all_sessions()
    print(f"\nTotal sessions in DB: {len(all_sessions)}")
    print("\n✅ Database working perfectly!")