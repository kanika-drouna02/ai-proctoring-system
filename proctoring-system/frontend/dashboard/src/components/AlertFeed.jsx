export default function AlertFeed({ alerts, colors, isDark }) {
  const getColor = (severity) => {
    if (severity === "HIGH") return "#EF4444"
    if (severity === "MEDIUM") return "#F59E0B"
    return "#EAB308"
  }

  const getIcon = (type) => {
    if (type?.includes("PHONE")) return "📱"
    if (type?.includes("FACE")) return "👥"
    if (type?.includes("GAZE") || type?.includes("LOOKING")) return "👁️"
    if (type?.includes("SPEECH") || type?.includes("AUDIO")) return "🎤"
    if (type?.includes("TAB")) return "🔄"    // ← ADD THIS
    return "⚠️"
  }

  return (
    <div
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: 20,
        height: 500,
        overflowY: "auto",
        boxShadow: colors.shadow,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: colors.primary,
          letterSpacing: 3,
          textTransform: "uppercase",
          marginBottom: 18,
          fontWeight: 800,
        }}
      >
        Live Alert Feed
      </div>

      {alerts.length === 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "80%",
            color: colors.textMuted,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          No alerts yet — session is clean ✅
        </div>
      ) : (
        alerts.map((alert, i) => (
          <div
            key={i}
            style={{
              background: colors.inputBg,
              border: `1px solid ${getColor(alert.severity)}30`,
              borderLeft: `4px solid ${getColor(alert.severity)}`,
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 14,
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: "50%",
              }}
            >
              {getIcon(alert.type)}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: colors.textMain,
                }}
              >
                {alert.type}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                  marginTop: 4,
                }}
              >
                {alert.timestamp_human || "Just now"}
              </div>
            </div>

            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: getColor(alert.severity),
                background: `${getColor(alert.severity)}15`,
                border: `1px solid ${getColor(alert.severity)}40`,
                padding: "5px 10px",
                borderRadius: 8,
              }}
            >
              {alert.severity}
            </div>
          </div>
        ))
      )}
    </div>
  )
}