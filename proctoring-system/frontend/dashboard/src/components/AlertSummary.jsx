import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

export default function AlertSummary({ alerts, colors, isDark }) {
  // Count by type
  const counts = alerts.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(counts).map(([type, count]) => ({
    type: type.replace(/\_/g, " ").slice(0, 10),
    count,
  }))

  // Severity counts
  const highCount = alerts.filter((a) => a.severity === "HIGH").length
  const mediumCount = alerts.filter((a) => a.severity === "MEDIUM").length
  const lowCount = alerts.filter((a) => a.severity === "LOW").length

  // Severity score
  const severityScore = highCount * 3 + mediumCount * 2 + lowCount
  const maxScore = alerts.length * 3 || 1
  const riskPercent = Math.min((severityScore / maxScore) * 100, 100)

  const riskColor =
    riskPercent > 60
      ? "#EF4444"
      : riskPercent > 30
      ? "#F59E0B"
      : colors.primary

  const riskLabel =
    riskPercent > 60
      ? "HIGH RISK"
      : riskPercent > 30
      ? "MEDIUM RISK"
      : "LOW RISK"

  // Timeline — alerts per minute
  const timelineData = alerts
    .reduce((acc, alert) => {
      const minute = alert.timestamp_human?.slice(0, 5) || "00:00"

      const existing = acc.find((d) => d.time === minute)

      if (existing) existing.count++
      else acc.push({ time: minute, count: 1 })

      return acc
    }, [])
    .slice(-10)

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {/* Risk Meter */}
      <div
        style={{
          background: colors.accentBg,
          border: `1px solid ${colors.accentBorder}`,
          borderRadius: 16,
          padding: 20,
          boxShadow: colors.shadow,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: colors.primary,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 14,
            fontWeight: 700,
          }}
        >
          Exam Integrity Score
        </div>

        <div
          style={{
            background: isDark ? "#0A0A14" : "#D1FAE5",
            borderRadius: 10,
            height: 12,
            marginBottom: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${riskPercent}%`,
              height: "100%",
              background: riskColor,
              borderRadius: 10,
              transition: "0.5s",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: riskColor,
              fontWeight: 700,
            }}
          >
            {riskLabel}
          </span>

          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: riskColor,
            }}
          >
            {Math.round(riskPercent)}%
          </span>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          background: colors.accentBg,
          border: `1px solid ${colors.accentBorder}`,
          borderRadius: 16,
          padding: 20,
          boxShadow: colors.shadow,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: colors.primary,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 14,
            fontWeight: 700,
          }}
        >
          Alert Breakdown
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 10,
          }}
        >
          {[
            { label: "Total", value: alerts.length, color: colors.textMain },
            { label: "High", value: highCount, color: "#EF4444" },
            { label: "Medium", value: mediumCount, color: "#F59E0B" },
            { label: "Score", value: severityScore, color: riskColor },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: isDark ? "#1A1A2E" : "#FFFFFF",
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: "12px 8px",
                textAlign: "center",
                boxShadow: isDark
                  ? "none"
                  : "0 3px 12px rgba(16,185,129,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: item.color,
                }}
              >
                {item.value}
              </div>

              <div
                style={{
                  fontSize: 10,
                  color: colors.textMuted,
                  marginTop: 4,
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

            {/* Bar Chart */}
      <div
        style={{
          background: colors.accentBg,
          border: `1px solid ${colors.accentBorder}`,
          borderRadius: 16,
          padding: 20,
          boxShadow: colors.shadow,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: colors.primary,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 14,
            fontWeight: 700,
          }}
        >
          Alerts by Type
        </div>

        {chartData.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 150,
              color: colors.textMuted,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={chartData}>
              <XAxis
                dataKey="type"
                tick={{
                  fill: colors.textMuted,
                  fontSize: 10,
                }}
                axisLine={{ stroke: colors.border }}
                tickLine={{ stroke: colors.border }}
              />

              <YAxis
                tick={{
                  fill: colors.textMuted,
                  fontSize: 10,
                }}
                axisLine={{ stroke: colors.border }}
                tickLine={{ stroke: colors.border }}
              />

              <Tooltip
                contentStyle={{
                  background: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  color: colors.textMain,
                  boxShadow: colors.shadow,
                }}
                labelStyle={{
                  color: colors.textMain,
                  fontWeight: 700,
                }}
              />

              <Bar
                dataKey="count"
                fill={colors.primary}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Timeline */}
      {timelineData.length > 1 && (
        <div
          style={{
            background: colors.accentBg,
            border: `1px solid ${colors.accentBorder}`,
            borderRadius: 16,
            padding: 20,
            boxShadow: colors.shadow,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: colors.primary,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 14,
              fontWeight: 700,
            }}
          >
            Alert Timeline
          </div>

          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={timelineData}>
              <XAxis
                dataKey="time"
                tick={{
                  fill: colors.textMuted,
                  fontSize: 10,
                }}
                axisLine={{ stroke: colors.border }}
                tickLine={{ stroke: colors.border }}
              />

              <YAxis
                tick={{
                  fill: colors.textMuted,
                  fontSize: 10,
                }}
                axisLine={{ stroke: colors.border }}
                tickLine={{ stroke: colors.border }}
              />

              <Tooltip
                contentStyle={{
                  background: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  color: colors.textMain,
                  boxShadow: colors.shadow,
                }}
                labelStyle={{
                  color: colors.textMain,
                  fontWeight: 700,
                }}
              />

              <Line
                type="monotone"
                dataKey="count"
                stroke={colors.primary}
                strokeWidth={3}
                dot={{
                  fill: colors.primary,
                  stroke: colors.cardBg,
                  strokeWidth: 2,
                  r: 5,
                }}
                activeDot={{
                  r: 7,
                  fill: colors.primary,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}