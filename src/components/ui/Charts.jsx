import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart
} from 'recharts'
import { useApp } from '../../context/AppContext.jsx'

/* ---------------------------------------------------------------------------
 * Recharts renders colours as SVG presentation attributes, which the browser
 * will not resolve a `var()` against — so unlike the rest of the app, charts
 * can't ride on the CSS theme variables and have to be handed literal hex.
 * Everything below is therefore a two-column table: the light value, and the
 * dark value that carries the same meaning on a dark ground.
 * ------------------------------------------------------------------------- */

export const CHART_COLORS = ['#204575', '#f78c0a', '#1f8a4c', '#697289', '#d9631c', '#7e9cc6', '#c41e3a', '#ffc04f']
const CHART_COLORS_DARK = ['#8ab4f8', '#fdd663', '#81c995', '#a3adbd', '#fcad70', '#b3ccef', '#f28b82', '#ffd88a']

// Series and risk-band colours are also passed in directly by callers — a
// module asking for a green refund line, a bar coloured by risk band. Rather
// than thread the theme through every call site, the light value each of them
// already passes is looked up here and swapped for its dark counterpart.
const DARK_EQUIVALENT = {
  ...Object.fromEntries(CHART_COLORS.map((c, i) => [c, CHART_COLORS_DARK[i]])),
  // maharisk band solids (see data/risk.js)
  '#d99a15': '#f0c04a',
  '#1f8a4c': '#5bd18b',
  '#d9631c': '#f6a06a',
  '#c41e3a': '#f58a99'
}

const LIGHT_TOKENS = {
  grid: '#e8eaee',
  axisLine: '#d3d7de',
  tick: '#8791a3',
  radarGrid: '#e0e4ea',
  radarTick: '#4b5568',
  radarRadiusTick: '#b0b7c3',
  tooltipBg: '#ffffff',
  tooltipBorder: '#d3d7de',
  tooltipShadow: '0 4px 16px rgba(15,35,64,0.12)',
  tooltipLabel: '#0f2340',
  legend: '#454b5c'
}

const DARK_TOKENS = {
  grid: '#2a323f',
  axisLine: '#3d4756',
  tick: '#8b95a6',
  radarGrid: '#2a323f',
  radarTick: '#b9c2d0',
  radarRadiusTick: '#6b7688',
  tooltipBg: '#171c26',
  tooltipBorder: '#2a323f',
  tooltipShadow: '0 4px 16px rgba(0,0,0,0.55)',
  tooltipLabel: '#f0f5fb',
  legend: '#ccd4e0'
}

// Charts consume AppContext, so a theme change re-renders them along with
// everything else that reads it.
function useChartTheme() {
  const { theme } = useApp()
  const dark = theme === 'dark'
  const tokens = dark ? DARK_TOKENS : LIGHT_TOKENS
  const palette = dark ? CHART_COLORS_DARK : CHART_COLORS
  // Leave anything not in the table alone — a caller passing a bespoke colour
  // gets it back untouched rather than silently blanked.
  const adapt = c => (dark && c ? DARK_EQUIVALENT[String(c).toLowerCase()] || c : c)
  return {
    tokens,
    palette,
    adapt,
    tooltip: {
      contentStyle: {
        fontSize: 12,
        borderRadius: 8,
        backgroundColor: tokens.tooltipBg,
        border: `1px solid ${tokens.tooltipBorder}`,
        boxShadow: tokens.tooltipShadow
      },
      labelStyle: { fontWeight: 600, color: tokens.tooltipLabel },
      itemStyle: { color: tokens.tooltipLabel }
    },
    legendStyle: { fontSize: 11, color: tokens.legend }
  }
}

// Exposed for modules that colour their own <Bar>/<Cell> elements directly.
export function useChartPalette() {
  return useChartTheme().palette
}

export function TrendLineChart({ data, xKey, series, height = 260 }) {
  const { tokens, palette, adapt, tooltip, legendStyle } = useChartTheme()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.grid} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: tokens.tick }} axisLine={{ stroke: tokens.axisLine }} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: tokens.tick }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltip} />
        {series.length > 1 && <Legend wrapperStyle={legendStyle} />}
        {series.map((s, i) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label || s.key} stroke={adapt(s.color) || palette[i % palette.length]} strokeWidth={2.25} dot={false} strokeDasharray={s.dashed ? '5 4' : undefined} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function TrendAreaChart({ data, xKey, dataKey, color, height = 220 }) {
  const { tokens, palette, adapt, tooltip } = useChartTheme()
  const fill = adapt(color) || palette[0]
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={fill} stopOpacity={0.35} />
            <stop offset="95%" stopColor={fill} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.grid} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: tokens.tick }} axisLine={{ stroke: tokens.axisLine }} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: tokens.tick }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltip} />
        <Area type="monotone" dataKey={dataKey} stroke={fill} fill="url(#areaFill)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function RiskBarChart({ data, xKey, barKey, height = 260, colorFn }) {
  const { tokens, adapt, tooltip } = useChartTheme()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.grid} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: tokens.tick }} axisLine={{ stroke: tokens.axisLine }} tickLine={false} interval={0} angle={-25} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 10, fill: tokens.tick }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltip} />
        <Bar dataKey={barKey} radius={[4, 4, 0, 0]}>
          {colorFn && data.map((d, i) => <Cell key={i} fill={adapt(colorFn(d))} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function RiskDonutChart({ data, height = 220, innerRadius = 55, outerRadius = 85, colors }) {
  const { palette, adapt, tooltip, legendStyle } = useChartTheme()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={2}>
          {data.map((d, i) => <Cell key={i} fill={colors ? adapt(colors[d.name]) || palette[i % palette.length] : palette[i % palette.length]} />)}
        </Pie>
        <Tooltip {...tooltip} />
        <Legend wrapperStyle={legendStyle} layout="vertical" verticalAlign="middle" align="right" />
      </PieChart>
    </ResponsiveContainer>
  )
}

// The recovery curve: recoverability (%) falling against days since a signal
// fired, with the exposure actually sitting at each point overlaid as bars.
// Two axes on purpose — the argument is the relationship between them, that
// the department's exposure is concentrated where the curve has already fallen.
export function RecoveryCurveChart({ data, height = 300 }) {
  const { tokens, adapt, tooltip, legendStyle } = useChartTheme()
  const curveColor = adapt('#c41e3a')
  const exposureColor = adapt('#204575')
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={tokens.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: tokens.tick }} axisLine={{ stroke: tokens.axisLine }} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 10, fill: tokens.tick }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: tokens.tick }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltip} />
        <Legend wrapperStyle={legendStyle} />
        <Bar yAxisId="right" dataKey="exposureCr" name="Exposure sitting here (₹ Cr)" fill={exposureColor} radius={[4, 4, 0, 0]} barSize={38} />
        <Line yAxisId="left" type="monotone" dataKey="recoverabilityPct" name="Recoverable (%)" stroke={curveColor} strokeWidth={2.75} dot={{ r: 3.5, fill: curveColor }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// Composite-index radar — each axis 0-100, e.g. weighted health-index components.
export function HealthRadarChart({ data, height = 260, color }) {
  const { tokens, palette, adapt, tooltip } = useChartTheme()
  const stroke = adapt(color) || palette[0]
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={tokens.radarGrid} />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: tokens.radarTick }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: tokens.radarRadiusTick }} tickCount={5} />
        <Radar dataKey="score" stroke={stroke} fill={stroke} fillOpacity={0.22} strokeWidth={2} />
        <Tooltip {...tooltip} formatter={v => `${v} / 100`} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
