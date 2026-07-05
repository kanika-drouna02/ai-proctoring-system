import { useState, useEffect } from "react"
import AlertFeed from "./components/AlertFeed"
import StatusBar from "./components/StatusBar"
import AlertSummary from "./components/AlertSummary"
import BrowserDetector from "./components/BrowserDetector"

const API_URL = "https://ai-proctoring-system-qpmj.onrender.com"

export default function App() {
  const [sessionId, setSessionId] = useState(null)
  const [studentName, setStudentName] = useState("")
  const [alerts, setAlerts] = useState([])
  const [sessionActive, setSessionActive] = useState(false)
  const [ws, setWs] = useState(null)
  const [manualSessionId, setManualSessionId] = useState("")
  
  // Theme State
  const [theme, setTheme] = useState("dark") 
  const toggleTheme = () => setTheme(prev => (prev === "dark" ? "light" : "dark"))

  // Logic remains identical
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
          // Connect to detector session if provided, else own session
          const wsId = manualSessionId.trim() || data.session_id
          connectWebSocket(wsId)
      } catch (err) {
          alert("Could not connect to backend!")
      }
  }

  const stopSession = async () => {
    if (!sessionId) return
    await fetch(`${API_URL}/session/${sessionId}/stop`, { method: "POST" })
    setSessionActive(false)
    if (ws) ws.close()
  }

  const connectWebSocket = (sid) => {
      console.log("Connecting to WebSocket with session:", sid)
      const socket = new WebSocket(`wss://ai-proctoring-system-qpmj.onrender.com/ws/${sid}`)
      socket.onopen = () => console.log("✅ WebSocket connected!")
      socket.onmessage = (e) => {
          console.log("📨 Message received:", e.data)
          const alert = JSON.parse(e.data)
          setAlerts(prev => [alert, ...prev].slice(0, 100))
      }
      socket.onerror = (e) => console.log("❌ WebSocket error:", e)
      socket.onclose = () => console.log("WebSocket closed!")
      setWs(socket)
  }

  useEffect(() => {
    if (!sessionActive) return
    const handleVisibilityChange = () => {
        if (document.hidden) {
            console.log("Tab switched!")
            fetch(`${API_URL}/session/${sessionId}/broadcast?alert_type=TAB_SWITCH&severity=HIGH`, {
                method: "POST"
            })
        }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [sessionActive, sessionId])


  // Read session ID from URL automatically
  useEffect(() => {
      const params = new URLSearchParams(window.location.search)
      const sid = params.get("session")
      if (sid) setManualSessionId(sid)
  }, [])

  // --- COMPREHENSIVE THEME MAPPING ---
  const isDark = theme === "dark"
  const colors = {
    primary: isDark ? "#00FFB2" : "#10B981",       // Neon vs Forest Green
    primaryText: isDark ? "#000000" : "#FFFFFF",
    bg: isDark ? "#050509" : "#F8FAFC",            // Deep Navy vs Soft Slate
    bgGradient: isDark 
        ? "radial-gradient(circle at top, #1a1a3a 0%, #050509 100%)"
        : "radial-gradient(circle at top, #F1F5F9 0%, #F8FAFC 100%)",
    headerBg: isDark ? "rgba(5, 5, 9, 0.8)" : "rgba(255, 255, 255, 0.8)",
    cardBg: isDark ? "rgba(20, 20, 35, 0.7)" : "#FFFFFF",
    inputBg: isDark ? "#0A0A14" : "#FFFFFF",
    border: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
    textMain: isDark ? "#F1F1F1" : "#0F172A",
    textMuted: isDark ? "#88889B" : "#64748B",
    accentBg: isDark ? "rgba(0, 255, 178, 0.05)" : "rgba(16, 185, 129, 0.05)",
    accentBorder: isDark ? "rgba(0, 255, 178, 0.2)" : "rgba(16, 185, 129, 0.2)",
    shadow: isDark ? "0 20px 40px rgba(0,0,0,0.4)" : "0 10px 25px rgba(0,0,0,0.05)"
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: colors.bg,
      backgroundImage: colors.bgGradient,
      color: colors.textMain,
      fontFamily: "'Inter', sans-serif",
      transition: "background 0.3s ease, color 0.3s ease",
    }}>
      
      {/* Header */}
      <div style={{
        background: colors.headerBg,
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${colors.border}`,
        padding: "16px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 10px rgba(0,0,0,0.02)"
      }}>
        <div>
          <div style={{ fontSize: 10, color: colors.textMuted, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 }}>
            NIT Patna · CSE Department
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: colors.primary, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🎓</span> AI PROCTORING
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Theme Switcher Button */}
          <button 
            onClick={toggleTheme}
            style={{
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                color: colors.textMain,
                padding: "10px",
                borderRadius: "50%",
                width: 44, height: 44,
                cursor: "pointer",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: colors.shadow,
                transition: "transform 0.2s"
            }}
            onMouseOver={e => e.currentTarget.style.transform = "scale(1.1)"}
            onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {/* Status Indicator */}
          <div style={{ 
            display: "flex", alignItems: "center", gap: 10,
            background: colors.accentBg,
            padding: "8px 16px", borderRadius: 100, border: `1px solid ${colors.accentBorder}`
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: sessionActive ? colors.primary : colors.textMuted,
              boxShadow: sessionActive ? `0 0 10px ${colors.primary}` : "none",
            }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: sessionActive ? colors.primary : colors.textMuted }}>
              {sessionActive ? "LIVE" : "SYSTEM STANDBY"}
            </span>
          </div>
        </div>
      </div>

      {/* Landing / Login Section */}
      {!sessionActive ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          height: "calc(100vh - 120px)", gap: 32, animation: "fadeIn 0.6s ease"
        }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 8, letterSpacing: "-1.5px" }}>Secure Entry</h1>
            <p style={{ color: colors.textMuted, fontSize: 16, fontWeight: 500 }}>Student Authentication Portal</p>
          </div>

          <div style={{ 
            background: colors.cardBg, padding: 40, borderRadius: 32, 
            border: `1px solid ${colors.border}`, boxShadow: colors.shadow,
            width: 380, display: "flex", flexDirection: "column", gap: 28
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: colors.textMuted, textTransform: "uppercase", marginLeft: 4 }}>Full Name</label>
                <input
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    placeholder="Enter student name..."
                    style={{
                        background: colors.inputBg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 16, padding: "18px",
                        color: colors.textMain, fontSize: 16, outline: "none",
                        transition: "all 0.2s",
                        boxShadow: isDark ? "inset 0 2px 4px rgba(0,0,0,0.5)" : "none"
                    }}
                />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: colors.textMuted, textTransform: "uppercase", marginLeft: 4 }}>
                    Detector Session ID
                </label>
                <input
                    value={manualSessionId}
                    onChange={e => setManualSessionId(e.target.value)}
                    placeholder="Paste detector session ID..."
                    style={{
                        background: colors.inputBg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 16, padding: "18px",
                        color: colors.textMain, fontSize: 14, outline: "none",
                        width: "100%"
                    }}
                />
            </div>

            {/* Privacy Card - Now fully themed */}
            <div style={{
                background: colors.accentBg,
                border: `1px solid ${colors.accentBorder}`,
                borderRadius: 20, padding: "20px",
            }}>
                <div style={{ fontSize: 11, color: colors.primary, fontWeight: 900, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                   🛡️ PRIVACY PROTOCOL
                </div>
                <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6 }}>
                    This system processes metadata only. <span style={{ color: colors.textMain, fontWeight: 600 }}>Zero raw video recordings</span> are stored on servers.
                </div>
            </div>

            <button
                onClick={startSession}
                style={{
                    background: colors.primary,
                    color: colors.primaryText,
                    border: "none", borderRadius: 16, padding: "18px",
                    fontSize: 16, fontWeight: 800, cursor: "pointer",
                    boxShadow: `0 10px 20px ${colors.primary}44`,
                    transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onMouseOver={e => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 15px 30px ${colors.primary}66`;
                }}
                onMouseOut={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = `0 10px 20px ${colors.primary}44`;
                }}
            >
                Start Proctoring
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: "40px 48px", animation: "fadeIn 0.4s ease" }}>
          
          {/* Dashboard Top Header Bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 32, background: colors.cardBg, padding: "24px 32px",
            borderRadius: 24, border: `1px solid ${colors.border}`, boxShadow: colors.shadow
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ 
                    fontSize: 32, background: colors.inputBg, width: 64, height: 64, 
                    borderRadius: "50%", display: "flex", alignItems: "center", 
                    justifyContent: "center", border: `1px solid ${colors.border}`
                }}>
                    👤
                </div>
                <div>
                    <div style={{ fontSize: 11, color: colors.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>Monitoring Candidate</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: colors.textMain }}>{studentName}</div>
                    <div style={{ fontSize: 11, color: colors.primary, fontWeight: 700, fontFamily: "monospace" }}>SESSION ID: {sessionId?.slice(0,12)}...</div>
                </div>
            </div>

            <button
                onClick={stopSession}
                style={{
                    background: isDark ? "rgba(255, 77, 77, 0.1)" : "#FFF1F1", 
                    color: "#FF4D4D",
                    border: `1px solid ${isDark ? "rgba(255, 77, 77, 0.2)" : "#FFDADA"}`, 
                    borderRadius: 14,
                    padding: "12px 28px", fontSize: 14, fontWeight: 800, cursor: "pointer",
                    transition: "all 0.2s"
                }}
                onMouseOver={e => {
                    e.currentTarget.style.background = "#FF4D4D";
                    e.currentTarget.style.color = "#fff";
                }}
                onMouseOut={e => {
                    e.currentTarget.style.background = isDark ? "rgba(255, 77, 77, 0.1)" : "#FFF1F1";
                    e.currentTarget.style.color = "#FF4D4D";
                }}
            >
                End Session
            </button>
          </div>

          {/* Grid Layout - Components now sit in themed containers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
  
  {/* Camera Feed */}
  <BrowserDetector
    sessionId={manualSessionId || sessionId}
    apiUrl={API_URL}
    onAlert={(alert) => setAlerts(prev => [alert, ...prev].slice(0, 100))}
    colors={colors}
  />

  {/* Alert Feed */}
          <div style={{ 
              background: colors.cardBg, borderRadius: 28, padding: 28, 
              border: `1px solid ${colors.border}`, boxShadow: colors.shadow, minHeight: 600
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: colors.primary }}>●</span> Detection Feed
              </div>
              <AlertFeed alerts={alerts} colors={colors} isDark={isDark} />
            </div>
            
            {/* Summary */}
            <div style={{ 
              background: colors.cardBg, borderRadius: 28, padding: 28, 
              border: `1px solid ${colors.border}`, boxShadow: colors.shadow 
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>📊</span> Behavioral Summary
              </div>
              <AlertSummary alerts={alerts} colors={colors} isDark={isDark} />
            </div>
          </div>
        </div>
      )}

      {/* Global CSS Inject */}
      <style>{`
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        input:focus { 
          border-color: ${colors.primary} !important; 
          background: ${isDark ? colors.inputBg : "#fff"} !important;
          box-shadow: 0 0 0 4px ${colors.primary}22 !important;
        }
        ::placeholder { color: ${colors.textMuted}; opacity: 0.6; }
      `}</style>
    </div>
  )
}