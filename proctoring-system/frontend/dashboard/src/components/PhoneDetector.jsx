import { useEffect, useRef, useState } from "react"

export default function PhoneDetector({ onPhoneDetected, colors }) {
  const [model, setModel] = useState(null)
  const [status, setStatus] = useState("Loading phone detector...")
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const loadModel = async () => {
      try {
        // Dynamically import to avoid conflicts
        const tf = await import("@tensorflow/tfjs")
        await tf.ready()
        const cocoSsd = await import("@tensorflow-models/coco-ssd")
        const m = await cocoSsd.load()
        setModel(m)
        setStatus("Phone detector ready!")
      } catch (err) {
        setStatus("Phone detector error: " + err.message)
        console.error(err)
      }
    }
    loadModel()
  }, [])

  useEffect(() => {
    if (!model) return
    let lastAlert = 0

    const detect = async () => {
      if (!videoRef.current || !canvasRef.current) return
      if (videoRef.current.readyState !== 4) return

      try {
        const predictions = await model.detect(videoRef.current)
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const phones = predictions.filter(p =>
          p.class === "cell phone" && p.score > 0.5
        )

        phones.forEach(phone => {
          const [x, y, w, h] = phone.bbox
          ctx.strokeStyle = "#FF4444"
          ctx.lineWidth = 2
          ctx.strokeRect(x, y, w, h)
          ctx.fillStyle = "#FF4444"
          ctx.fillRect(x, y - 25, 140, 25)
          ctx.fillStyle = "#fff"
          ctx.font = "13px monospace"
          ctx.fillText(`PHONE ${Math.round(phone.score * 100)}%`, x + 5, y - 7)
        })

        if (phones.length > 0 && Date.now() - lastAlert > 3000) {
          onPhoneDetected()
          lastAlert = Date.now()
        }
      } catch (err) {
        console.error("Phone detection error:", err)
      }
    }

    const interval = setInterval(detect, 500)
    return () => clearInterval(interval)
  }, [model])

  return (
    <div style={{
      background: colors.cardBg,
      border: `1px solid ${colors.border}`,
      borderRadius: 12,
      padding: 16
    }}>
      <div style={{
        fontSize: 11, color: colors.primary,
        letterSpacing: 2, textTransform: "uppercase",
        fontWeight: 800, marginBottom: 12
      }}>
        📱 Phone Detection
      </div>
      <div style={{
        fontSize: 11, color: colors.textMuted,
        marginBottom: 10
      }}>
        {status}
      </div>
      <div style={{ position: "relative" }}>
        <video
          ref={videoRef}
          autoPlay muted playsInline
          style={{ width: "100%", borderRadius: 8, display: "block" }}
        />
        <canvas
          ref={canvasRef}
          width={640} height={480}
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%"
          }}
        />
      </div>
    </div>
  )
}