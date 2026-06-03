import { useState, useEffect } from "react"
import AlertFeed from "./components/AlertFeed"
import StatusBar from "./components/StatusBar"
import AlertSummary from "./components/AlertSummary"

const API_URL = "http://localhost:8000"

export default function App() {
  const [sessionId, setSessionId] = useState(null)
  const [studentName, setStudentName] = useState("")
  const [alerts, setAlerts] = useState([])
  const [sessionActive, setSessionActive] = useState(false)
  const [ws, setWs] = useState(null)

  // Start session
  const startSession = async () => {
    if (!studentName.trim()) {
      alert("Please enter student name!")
      return
    }
    try {
      const res = await fetch(`${API_URL}/session/start?student_name=${studentName}`, {
        method: "POST"
      })
      const data = await res.json()
      setSessionId(data.session_id)
      setSessionActive(true)
      setAlerts([])
      connectWebSocket(data.session_id)
    } catch (err) {
      alert("Could not connect to backend!")
    }
  }

  // Stop session
  const stopSession = async () => {
    if (!sessionId) return
    await fetch(`${API_URL}/session/${sessionId}/stop`, { method: "POST" })
    setSessionActive(false)
    if (ws) ws.close()
  }

  // Connect WebSocket
  const connectWebSocket = (sid) => {
    const socket = new WebSocket(`ws://localhost:8000/ws/${sid}`)
    socket.onopen = () => console.log("WebSocket connected!")
    socket.onmessage = (e) => {
      const alert = JSON.parse(e.data)
      setAlerts(prev => [alert, ...prev].slice(0, 100))
    }
    socket.onclose = () => console.log("WebSocket disconnected!")
    setWs(socket)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F" }}>
      
      {/* Header */}
      <div style={{
        background: "#0D0D1A",
        borderBottom: "1px solid #1E1E2E",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, textTransform: "uppercase" }}>
            NIT Patna · CSE Department
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#00FFB2" }}>
            🎓 AI Proctoring System
          </div>
        </div>

        {/* Status dot */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: sessionActive ? "#00FFB2" : "#444",
            boxShadow: sessionActive ? "0 0 8px #00FFB2" : "none"
          }} />
          <span style={{ fontSize: 12, color: sessionActive ? "#00FFB2" : "#444" }}>
            {sessionActive ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Session Controls */}
      {!sessionActive ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
          gap: 16
        }}>
          <div style={{ fontSize: 24, color: "#E8E8F0", marginBottom: 8 }}>
            Start a Proctoring Session
          </div>
          <input
            value={studentName}
            onChange={e => setStudentName(e.target.value)}
            placeholder="Enter student name..."
            style={{
              background: "#13131F",
              border: "1px solid #1E1E2E",
              borderRadius: 8,
              padding: "12px 20px",
              color: "#E8E8F0",
              fontSize: 16,
              width: 300,
              outline: "none",
              fontFamily: "inherit"
            }}
          />
          <button
            onClick={startSession}
            style={{
              background: "#00FFB2",
              color: "#000",
              border: "none",
              borderRadius: 8,
              padding: "12px 32px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit"
            }}
          >
            Start Session
          </button>
        </div>
      ) : (
        <div style={{ padding: 24 }}>
          
          {/* Session info + stop button */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24
          }}>
            <div>
              <div style={{ fontSize: 13, color: "#555" }}>Active Session</div>
              <div style={{ fontSize: 16, color: "#E8E8F0", fontWeight: 600 }}>
                👤 {studentName}
              </div>
              <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>
                {sessionId?.slice(0, 8)}...
              </div>
            </div>
            <button
              onClick={stopSession}
              style={{
                background: "#FF4444",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit"
              }}
            >
              Stop Session
            </button>
          </div>

          {/* Dashboard Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20
          }}>
            <AlertFeed alerts={alerts} />
            <AlertSummary alerts={alerts} />
          </div>
        </div>
      )}
    </div>
  )
}