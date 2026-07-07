import { useEffect, useRef, useState } from "react"
import * as faceapi from "face-api.js"

export default function BrowserDetector({ sessionId, apiUrl, onAlert, colors }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [status, setStatus] = useState("Loading models...")
  const [cocoModel, setCocoModel] = useState(null)
  const [stats, setStats] = useState({
    faces: 0,
    gaze: "OK",
    alerts: 0
  })

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
        try {
            await tf.ready() 
            setStatus("Loading AI models...")
            
            // Load COCO-SSD FIRST
            setStatus("Loading object detection model...")
            const coco = await cocoSsd.load()
            setCocoModel(coco)
            
            // Then load face-api models
            setStatus("Loading face detection model...")
            await faceapi.nets.tinyFaceDetector.loadFromUri("/models")
            await faceapi.nets.faceLandmark68Net.loadFromUri("/models")
            
            setModelsLoaded(true)
            setStatus("Models loaded! Starting camera...")
            startCamera()
        } catch (err) {
            setStatus("Error loading models: " + err.message)
            console.error(err)
        }
    }
    loadModels()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setStatus("Camera active — monitoring started!")
      }
    } catch (err) {
      setStatus("Camera error: " + err.message)
    }
  }

  // Detection loop
  useEffect(() => {
    if (!modelsLoaded) return

    let lastFaceAlert = 0
    let lastGazeAlert = 0
    let lookingAwayFrames = 0
    let lastPhoneAlert = 0
    const COOLDOWN = 3000

    const detect = async () => {
      if (!videoRef.current || !canvasRef.current) return
      if (videoRef.current.readyState !== 4) return

      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const faceCount = detections.length
      const now = Date.now()

      // Draw detections
      detections.forEach(det => {
        const box = det.detection.box
        
        // Face box
        ctx.strokeStyle = faceCount === 1 ? "#00FFB2" : "#FF4444"
        ctx.lineWidth = 2
        ctx.strokeRect(box.x, box.y, box.width, box.height)

        // Eye landmarks
        const landmarks = det.landmarks
        const leftEye = landmarks.getLeftEye()
        const rightEye = landmarks.getRightEye()

        ctx.fillStyle = "#00BFFF"
        ;[...leftEye, ...rightEye].forEach(pt => {
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI)
          ctx.fill()
        })

        // Gaze detection using eye position
        const nose = landmarks.getNose()
        const noseTip = nose[3]
        const faceCenter = box.x + box.width / 2
        const deviation = Math.abs(noseTip.x - faceCenter)
        const deviationPercent = deviation / (box.width / 2)

        if (deviationPercent > 0.3) {
          lookingAwayFrames++
        } else {
          lookingAwayFrames = Math.max(0, lookingAwayFrames - 1)
        }
      })

      // ── FACE ALERTS ──
      if (faceCount === 0 && now - lastFaceAlert > COOLDOWN) {
        const alert = {
          type: "NO_FACE",
          severity: "HIGH",
          timestamp_human: new Date().toLocaleTimeString()
        }
        onAlert(alert)
        sendAlert("NO_FACE", "HIGH")
        lastFaceAlert = now
      } else if (faceCount > 1 && now - lastFaceAlert > COOLDOWN) {
        const alert = {
          type: "MULTIPLE_FACES",
          severity: "HIGH",
          timestamp_human: new Date().toLocaleTimeString()
        }
        onAlert(alert)
        sendAlert("MULTIPLE_FACES", "HIGH")
        lastFaceAlert = now
      }

      // ── GAZE ALERT ──
      if (lookingAwayFrames > 20 && now - lastGazeAlert > COOLDOWN) {
        const alert = {
          type: "LOOKING_AWAY",
          severity: "MEDIUM",
          timestamp_human: new Date().toLocaleTimeString()
        }
        onAlert(alert)
        sendAlert("LOOKING_AWAY", "MEDIUM")
        lastGazeAlert = now
        lookingAwayFrames = 0
      }


      // ── PHONE DETECTION ──
      if (cocoModel && videoRef.current) {
          const predictions = await cocoModel.detect(videoRef.current)
          const phones = predictions.filter(p => 
              p.class === "cell phone" && p.score > 0.5
          )

          if (phones.length > 0) {
              // Draw phone boxes
              phones.forEach(phone => {
                  const [x, y, width, height] = phone.bbox
                  ctx.strokeStyle = "#FF4444"
                  ctx.lineWidth = 2
                  ctx.strokeRect(x, y, width, height)

                  // Label
                  ctx.fillStyle = "#FF4444"
                  ctx.fillRect(x, y - 25, 140, 25)
                  ctx.fillStyle = "#FFFFFF"
                  ctx.font = "14px monospace"
                  ctx.fillText(`PHONE ${Math.round(phone.score * 100)}%`, x + 5, y - 7)
              })

              // Alert
              if (now - lastPhoneAlert > COOLDOWN) {
                  const alert = {
                      type: "PHONE_DETECTED",
                      severity: "HIGH",
                      timestamp_human: new Date().toLocaleTimeString()
                  }
                  onAlert(alert)
                  sendAlert("PHONE_DETECTED", "HIGH")
                  lastPhoneAlert = now
              }
          }
      }

      // Update stats
      setStats({
        faces: faceCount,
        gaze: lookingAwayFrames > 15 ? "Away" : "OK",
        alerts: 0
      })
    }

    const interval = setInterval(detect, 300)
    return () => clearInterval(interval)
  }, [modelsLoaded, cocoModel])

  const sendAlert = async (alertType, severity) => {
    if (!sessionId) return
    try {
      await fetch(`${apiUrl}/session/${sessionId}/broadcast?alert_type=${alertType}&severity=${severity}`, {
        method: "POST"
      })
    } catch (err) {
      console.error("Alert send failed:", err)
    }
  }

  return (
    <div style={{
      background: colors.cardBg,
      border: `1px solid ${colors.border}`,
      borderRadius: 16,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 16
    }}>
      {/* Status bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{
          fontSize: 11,
          color: colors.primary,
          letterSpacing: 2,
          textTransform: "uppercase",
          fontWeight: 800
        }}>
          🎥 Live Camera Feed
        </div>
        <div style={{
          fontSize: 11,
          color: modelsLoaded ? colors.primary : colors.textMuted,
          background: modelsLoaded ? `${colors.primary}20` : "transparent",
          padding: "4px 10px",
          borderRadius: 6
        }}>
          {status}
        </div>
      </div>

      {/* Camera + Canvas overlay */}
      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: "100%",
            borderRadius: 12,
            display: "block",
            transform: "scaleX(-1)"
          }}
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{
            position: "absolute",
            top: 0, left: 0,
            width: "100%", height: "100%",
            transform: "scaleX(-1)"
          }}
        />
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 10
      }}>
        {[
          { label: "Faces", value: stats.faces, color: stats.faces === 1 ? colors.primary : "#FF4444" },
          { label: "Gaze", value: stats.gaze, color: stats.gaze === "OK" ? colors.primary : "#FF6B35" },
          { label: "Status", value: modelsLoaded ? "LIVE" : "LOADING", color: modelsLoaded ? colors.primary : colors.textMuted }
        ].map((s, i) => (
          <div key={i} style={{
            background: colors.inputBg,
            borderRadius: 10,
            padding: "10px",
            textAlign: "center",
            border: `1px solid ${colors.border}`
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}