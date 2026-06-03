export default function StatusBar({ sessionActive, alerts }) {
  const lastAlert = alerts[0]

  return (
    <div style={{
      background: "#0D0D1A",
      border: "1px solid #1E1E2E",
      borderRadius: 12,
      padding: "14px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20
    }}>
      <div style={{ fontSize: 13, color: "#555" }}>
        Last Alert:
        <span style={{ color: "#E8E8F0", marginLeft: 8 }}>
          {lastAlert ? `${lastAlert.type} at ${lastAlert.timestamp_human}` : "None"}
        </span>
      </div>
      <div style={{
        fontSize: 12,
        color: sessionActive ? "#00FFB2" : "#444",
        display: "flex",
        alignItems: "center",
        gap: 6
      }}>
        <div style={{
          width: 8, height: 8,
          borderRadius: "50%",
          background: sessionActive ? "#00FFB2" : "#444"
        }} />
        {sessionActive ? "Monitoring Active" : "Session Ended"}
      </div>
    </div>
  )
}