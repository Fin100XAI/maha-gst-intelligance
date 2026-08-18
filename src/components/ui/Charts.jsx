import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'

export const CHART_COLORS = ['#204575', '#f78c0a', '#1f8a4c', '#697289', '#d9631c', '#7e9cc6', '#c41e3a', '#ffc04f']

const tooltipStyle = {
  contentStyle: { fontSize: 12, borderRadius: 8, border: '1px solid #d3d7de', boxShadow: '0 4px 16px rgba(15,35,64,0.12)' },
  labelStyle: { fontWeight: 600, color: '#0f2340' }
}

export function TrendLineChart({ data, xKey, series, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8eaee" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#8791a3' }} axisLine={{ stroke: '#d3d7de' }} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#8791a3' }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {series.map((s, i) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label || s.key} stroke={s.color || CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2.25} dot={false} strokeDasharray={s.dashed ? '5 4' : undefined} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function TrendAreaChart({ data, xKey, dataKey, color = '#204575', height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8eaee" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#8791a3' }} axisLine={{ stroke: '#d3d7de' }} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#8791a3' }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        <Area type="monotone" dataKey={dataKey} stroke={color} fill="url(#areaFill)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function RiskBarChart({ data, xKey, barKey, height = 260, colorFn }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8eaee" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#8791a3' }} axisLine={{ stroke: '#d3d7de' }} tickLine={false} interval={0} angle={-25} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 10, fill: '#8791a3' }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey={barKey} radius={[4, 4, 0, 0]}>
          {colorFn && data.map((d, i) => <Cell key={i} fill={colorFn(d)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function RiskDonutChart({ data, height = 220, innerRadius = 55, outerRadius = 85, colors }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={2}>
          {data.map((d, i) => <Cell key={i} fill={colors ? colors[d.name] || CHART_COLORS[i] : CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} layout="vertical" verticalAlign="middle" align="right" />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Composite-index radar — each axis 0-100, e.g. weighted health-index components.
export function HealthRadarChart({ data, height = 260, color = '#204575' }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#e0e4ea" />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: '#4b5568' }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#b0b7c3' }} tickCount={5} />
        <Radar dataKey="score" stroke={color} fill={color} fillOpacity={0.22} strokeWidth={2} />
        <Tooltip {...tooltipStyle} formatter={v => `${v} / 100`} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
