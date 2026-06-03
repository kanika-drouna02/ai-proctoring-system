import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

export default function AlertSummary({ alerts }) {
  // Count alerts by type
  const counts = alerts.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(counts).map(([type, count]) => ({
    type: type.replace("_", " ").slice(0, 12),
    count
  }))

  // Severity breakdown
  const highCount = alerts.filter(a => a.severity === "HIGH").length
  const mediumCount = alerts.filter(a => a.severity === "MEDIUM").length
  const lowCount = alerts.filter(a => a.severity === "LOW").length

  // Severity score
  const severityScore = (highCount * 3) + (mediumCount * 2) + (lowCount * 1)
  const scoreColor = severityScore > 20 ? "#FF4444" : severityScore > 10 ? "#FF6B35" : "#00FFB2"

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 16
    }}>
      {/* Score card */}
      <div style={{
        background: "#0D0D1A",
        border: "1px solid #1E1E2E",
        borderRadius: 12,
        padding: 20,
      }}>
        <div style={{
          fontSize: 11,
          color: "#555",
          letterSpacing: 3,
          textTransform: "uppercase",
          marginBottom: 16
        }}>
          Session Stats
        </div>

        {/* Total alerts */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16
        }}>
          {[
            { label: "Total Alerts", value: alerts.length, color: "#E8E8F0" },
            { label: "Severity Score", value: severityScore, color: scoreColor },
            { label: "HIGH", value: highCount, color: "#FF4444" },
            { label: "MEDIUM", value: mediumCount, color: "#FF6B35" },
          ].map((item, i) => (
            <div key={i} style={{
              background: "#13131F",
              borderRadius: 8,
              padding: "12px 16px",
              textAlign: "center"
            }}>
              <div style={{
                fontSize: 24,
                fontWeight: 700,
                color: item.color
              }}>
                {item.value}
              </div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{
        background: "#0D0D1A",
        border: "1px solid #1E1E2E",
        borderRadius: 12,
        padding: 20,
      }}>
        <div style={{
          fontSize: 11,
          color: "#555",
          letterSpacing: 3,
          textTransform: "uppercase",
          marginBottom: 16
        }}>
          Alerts by Type
        </div>

        {chartData.length === 0 ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 150,
            color: "#333",
            fontSize: 14
          }}>
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis
                dataKey="type"
                tick={{ fill: "#555", fontSize: 10 }}
              />
              <YAxis tick={{ fill: "#555", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "#13131F",
                  border: "1px solid #1E1E2E",
                  borderRadius: 8,
                  color: "#E8E8F0"
                }}
              />
              <Bar dataKey="count" fill="#00FFB2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}