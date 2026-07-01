import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line
} from "recharts"

export default function AlertSummary({ alerts }) {
  // Count by type
  const counts = alerts.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(counts).map(([type, count]) => ({
    type: type.replace(/_/g, " ").slice(0, 10),
    count
  }))

  // Severity counts
  const highCount = alerts.filter(a => a.severity === "HIGH").length
  const mediumCount = alerts.filter(a => a.severity === "MEDIUM").length
  const lowCount = alerts.filter(a => a.severity === "LOW").length

  // Severity score
  const severityScore = (highCount * 3) + (mediumCount * 2) + (lowCount * 1)
  const maxScore = alerts.length * 3 || 1
  const riskPercent = Math.min((severityScore / maxScore) * 100, 100)
  const riskColor = riskPercent > 60 ? "#FF4444" : riskPercent > 30 ? "#FF6B35" : "#00FFB2"
  const riskLabel = riskPercent > 60 ? "HIGH RISK" : riskPercent > 30 ? "MEDIUM RISK" : "LOW RISK"

  // Pie chart data
  const pieData = [
    { name: "HIGH", value: highCount || 0, color: "#FF4444" },
    { name: "MEDIUM", value: mediumCount || 0, color: "#FF6B35" },
    { name: "LOW", value: lowCount || 0, color: "#FFD700" }
  ].filter(d => d.value > 0)

  // Timeline — alerts per minute
  const timelineData = alerts.reduce((acc, alert) => {
    const minute = alert.timestamp_human?.slice(0, 5) || "00:00"
    const existing = acc.find(d => d.time === minute)
    if (existing) existing.count++
    else acc.push({ time: minute, count: 1 })
    return acc
  }, []).slice(-10)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Risk Meter */}
      <div style={{
        background: "#0D0D1A",
        border: `1px solid ${riskColor}30`,
        borderRadius: 12,
        padding: 20
      }}>
        <div style={{
          fontSize: 11, color: "#555",
          letterSpacing: 3, textTransform: "uppercase", marginBottom: 12
        }}>
          Exam Integrity Score
        </div>

        {/* Risk bar */}
        <div style={{
          background: "#1E1E2E",
          borderRadius: 8,
          height: 12,
          marginBottom: 10,
          overflow: "hidden"
        }}>
          <div style={{
            width: `${riskPercent}%`,
            height: "100%",
            background: riskColor,
            borderRadius: 8,
            transition: "all 0.5s ease"
          }} />
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span style={{ fontSize: 13, color: riskColor, fontWeight: 700 }}>
            {riskLabel}
          </span>
          <span style={{ fontSize: 20, fontWeight: 700, color: riskColor }}>
            {Math.round(riskPercent)}%
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        background: "#0D0D1A",
        border: "1px solid #1E1E2E",
        borderRadius: 12,
        padding: 20
      }}>
        <div style={{
          fontSize: 11, color: "#555",
          letterSpacing: 3, textTransform: "uppercase", marginBottom: 12
        }}>
          Alert Breakdown
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 10
        }}>
          {[
            { label: "Total", value: alerts.length, color: "#E8E8F0" },
            { label: "High", value: highCount, color: "#FF4444" },
            { label: "Medium", value: mediumCount, color: "#FF6B35" },
            { label: "Score", value: severityScore, color: riskColor },
          ].map((item, i) => (
            <div key={i} style={{
              background: "#13131F",
              borderRadius: 8,
              padding: "10px 8px",
              textAlign: "center"
            }}>
              <div style={{
                fontSize: 22, fontWeight: 700,
                color: item.color
              }}>
                {item.value}
              </div>
              <div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{
        background: "#0D0D1A",
        border: "1px solid #1E1E2E",
        borderRadius: 12,
        padding: 20
      }}>
        <div style={{
          fontSize: 11, color: "#555",
          letterSpacing: 3, textTransform: "uppercase", marginBottom: 12
        }}>
          Alerts by Type
        </div>

        {chartData.length === 0 ? (
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", height: 150,
            color: "#333", fontSize: 14
          }}>
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <XAxis dataKey="type" tick={{ fill: "#555", fontSize: 9 }} />
              <YAxis tick={{ fill: "#555", fontSize: 9 }} />
              <Tooltip contentStyle={{
                background: "#13131F",
                border: "1px solid #1E1E2E",
                borderRadius: 8, color: "#E8E8F0"
              }} />
              <Bar dataKey="count" fill="#00FFB2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Timeline Chart */}
      {timelineData.length > 1 && (
        <div style={{
          background: "#0D0D1A",
          border: "1px solid #1E1E2E",
          borderRadius: 12,
          padding: 20
        }}>
          <div style={{
            fontSize: 11, color: "#555",
            letterSpacing: 3, textTransform: "uppercase", marginBottom: 12
          }}>
            Alert Timeline
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={timelineData}>
              <XAxis dataKey="time" tick={{ fill: "#555", fontSize: 9 }} />
              <YAxis tick={{ fill: "#555", fontSize: 9 }} />
              <Tooltip contentStyle={{
                background: "#13131F",
                border: "1px solid #1E1E2E",
                borderRadius: 8, color: "#E8E8F0"
              }} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#FF6B35"
                strokeWidth={2}
                dot={{ fill: "#FF6B35", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  )
}