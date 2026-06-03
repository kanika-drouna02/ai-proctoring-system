export default function AlertFeed({ alerts }) {
  const getColor = (severity) => {
    if (severity === "HIGH") return "#FF4444"
    if (severity === "MEDIUM") return "#FF6B35"
    return "#FFD700"
  }

  const getIcon = (type) => {
    if (type?.includes("PHONE")) return "📱"
    if (type?.includes("FACE")) return "👥"
    if (type?.includes("GAZE") || type?.includes("LOOKING")) return "👁️"
    if (type?.includes("SPEECH") || type?.includes("AUDIO")) return "🎤"
    return "⚠️"
  }

  return (
    <div style={{
      background: "#0D0D1A",
      border: "1px solid #1E1E2E",
      borderRadius: 12,
      padding: 20,
      height: 500,
      overflowY: "auto"
    }}>
      <div style={{
        fontSize: 11,
        color: "#555",
        letterSpacing: 3,
        textTransform: "uppercase",
        marginBottom: 16
      }}>
        Live Alert Feed
      </div>

      {alerts.length === 0 ? (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "80%",
          color: "#333",
          fontSize: 14
        }}>
          No alerts yet — session is clean ✅
        </div>
      ) : (
        alerts.map((alert, i) => (
          <div key={i} style={{
            background: "#13131F",
            border: `1px solid ${getColor(alert.severity)}30`,
            borderLeft: `3px solid ${getColor(alert.severity)}`,
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 12,
            animation: "fadeIn 0.3s ease"
          }}>
            <div style={{ fontSize: 20 }}>{getIcon(alert.type)}</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: getColor(alert.severity)
              }}>
                {alert.type}
              </div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                {alert.timestamp_human || "Just now"}
              </div>
            </div>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color: getColor(alert.severity),
              background: `${getColor(alert.severity)}20`,
              padding: "3px 8px",
              borderRadius: 4
            }}>
              {alert.severity}
            </div>
          </div>
        ))
      )}
    </div>
  )
}