from fastapi import FastAPI
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import uuid
import time
from datetime import datetime
from backend.utils.database import (
    create_session as db_create_session,
    end_session as db_end_session,
    log_event as db_log_event,
    get_events as db_get_events,
    get_all_sessions as db_get_all_sessions,
    get_session_summary as db_get_session_summary
)


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"✅ Client connected! Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"❌ Client disconnected! Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()


app = FastAPI(
    title="AI Proctoring System",
    description="Real-time behavioral analysis API",
    version="1.0.0"
)

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# In-memory session storage for now
sessions = {}

# ── HEALTH CHECK ──
@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "time": datetime.now().isoformat()
    }

# ── START SESSION ──
@app.post("/session/start")
def start_session(student_name: str = "Student"):
    session_id = db_create_session(student_name)
    sessions[session_id] = {
        "session_id": session_id,
        "student_name": student_name,
        "start_time": time.time(),
        "status": "active",
        "events": []
    }
    return {
        "session_id": session_id,
        "student_name": student_name,
        "status": "started"
    }

# ── STOP SESSION ──
@app.post("/session/{session_id}/stop")
def stop_session(session_id: str):
    if session_id not in sessions:
        return {"error": "Session not found"}

    session = sessions[session_id]
    session["status"] = "completed"
    session["end_time"] = time.time()

    duration = session["end_time"] - session["start_time"]
    mins = int(duration // 60)
    secs = int(duration % 60)

    return {
        "session_id": session_id,
        "status": "completed",
        "duration": f"{mins:02d}:{secs:02d}",
        "total_alerts": len(session["events"])
    }

# ── LOG AN ALERT ──
@app.post("/session/{session_id}/alert")
def log_alert(session_id: str, alert_type: str, severity: str = "MEDIUM"):
    db_log_event(session_id, alert_type, severity)
    event = {
        "id": str(uuid.uuid4()),
        "type": alert_type,
        "severity": severity,
        "timestamp": time.time(),
        "timestamp_human": datetime.now().strftime("%H:%M:%S")
    }
    if session_id in sessions:
        sessions[session_id]["events"].append(event)
    return {"status": "logged", "event": event}

# ── GET ALL ALERTS ──
@app.get("/session/{session_id}/alerts")
def get_alerts(session_id: str):
    events = db_get_events(session_id)
    return {
        "session_id": session_id,
        "total": len(events),
        "events": events
    }

# ── GET ALL SESSIONS ──
@app.get("/sessions")
def get_sessions():
    return {
        "total": len(sessions),
        "sessions": [
            {
                "session_id": s["session_id"],
                "student_name": s["student_name"],
                "status": s["status"],
                "total_alerts": len(s["events"])
            }
            for s in sessions.values()
        ]
    }

# ── SESSION SUMMARY ──
@app.get("/session/{session_id}/summary")
def get_summary(session_id: str):
    if session_id not in sessions:
        return {"error": "Session not found"}

    session = sessions[session_id]
    events = session["events"]

    # Count by type
    counts = {}
    for e in events:
        t = e["type"]
        counts[t] = counts.get(t, 0) + 1

    # Count by severity
    severity_counts = {}
    for e in events:
        s = e["severity"]
        severity_counts[s] = severity_counts.get(s, 0) + 1

    return {
        "session_id": session_id,
        "student_name": session["student_name"],
        "status": session["status"],
        "total_alerts": len(events),
        "counts_by_type": counts,
        "counts_by_severity": severity_counts
    }

# ── WEBSOCKET ──
@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket)
    try:
        # Keep connection alive
        while True:
            # Wait for any message from client
            data = await websocket.receive_text()
            # Echo back as confirmation
            await websocket.send_json({
                "status": "received",
                "data": data
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ── BROADCAST ALERT VIA WEBSOCKET ──
@app.post("/session/{session_id}/broadcast")
async def broadcast_alert(session_id: str, alert_type: str, severity: str = "MEDIUM"):
    if session_id not in sessions:
        sessions[session_id] = {
            "session_id": session_id,
            "student_name": "Test",
            "start_time": time.time(),
            "start_time_human": datetime.now().isoformat(),
            "status": "active",
            "events": []
        }

    event = {
        "id": str(uuid.uuid4()),
        "type": alert_type,
        "severity": severity,
        "timestamp": time.time(),
        "timestamp_human": datetime.now().strftime("%H:%M:%S"),
        "session_id": session_id
    }


    # Save to session
    sessions[session_id]["events"].append(event)

    # Broadcast to all connected clients
    await manager.broadcast(event)

    return {"status": "broadcasted", "event": event}
# ── PRIVACY INFO ──
@app.get("/privacy")
async def privacy_info():
    return {
        "policy": "Privacy First",
        "raw_video_stored": False,
        "raw_audio_stored": False,
        "data_collected": [
            "Alert type",
            "Alert timestamp",
            "Alert severity",
            "Session duration"
        ],
        "data_NOT_collected": [
            "Raw video frames",
            "Raw audio recordings",
            "Facial images",
            "Voice recordings"
        ],
        "message": "Only behavioral metadata is stored. Zero raw biometric data."
    }