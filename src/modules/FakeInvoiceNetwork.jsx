import { useEffect, useMemo, useRef, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { RiskBadge, Pill, HumanReviewBadge } from '../components/ui/RiskBadge.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { NETWORK_CLUSTERS, taxpayerById } from '../data/mockData.js'
import { RISK_COLORS } from '../data/risk.js'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'
import { Network, Users, MapPinned, IndianRupee, ShieldAlert, ArrowRight, X } from 'lucide-react'

// Fast no-op path: when every header filter is at its default value, every cluster matches.
function isDefaultFilters(filters) {
  return (
    !filters.search?.trim() &&
    filters.district === 'All Districts' &&
    filters.division === 'All Divisions' &&
    filters.sector === 'All Sectors' &&
    filters.taxpayerType === 'All Types' &&
    filters.riskLevel === 'All Risk Levels'
  )
}

// A cluster matches the active header filters if any of its member taxpayers do.
// Cluster nodes only carry an `id` — resolve to the full taxpayer record via taxpayerById
// before applying the shared filter predicate; skip node ids that don't resolve.
function clusterMatchesFilters(cluster, filters) {
  if (isDefaultFilters(filters)) return true
  return cluster.nodes.some(node => {
    const taxpayer = taxpayerById(node.id)
    if (!taxpayer) return false
    return applyGlobalFilters(taxpayer, filters)
  })
}

const DORMANT_COLOR = '#94a3b8'
const VIEWBOX_W = 520
const VIEWBOX_H = 360
const CENTER = { x: VIEWBOX_W / 2, y: VIEWBOX_H / 2 }
const RADIUS = 128
const NODE_R = 24

function nodeColor(node) {
  if (node.dormant) return DORMANT_COLOR
  return RISK_COLORS[node.risk]?.solid || RISK_COLORS.Low.solid
}

function nodePositions(nodes) {
  const n = nodes.length
  return nodes.map((node, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    return {
      ...node,
      x: CENTER.x + RADIUS * Math.cos(angle),
      y: CENTER.y + RADIUS * Math.sin(angle)
    }
  })
}

function ClusterGraph({ cluster, onNodeClick }) {
  const positioned = useMemo(() => nodePositions(cluster.nodes), [cluster])
  const byId = useMemo(() => Object.fromEntries(positioned.map(n => [n.id, n])), [positioned])

  return (
    <div className="w-full h-[380px] bg-steel-50 rounded-xl border border-steel-200 overflow-hidden">
      <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} width="100%" height="100%">
        <defs>
          <marker id="fin-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#5c6785" />
          </marker>
        </defs>

        {cluster.edges.map((edge, i) => {
          const from = byId[edge.from]
          const to = byId[edge.to]
          if (!from || !to) return null
          const dx = to.x - from.x
          const dy = to.y - from.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const ux = dx / dist
          const uy = dy / dist
          const startX = from.x + ux * (NODE_R + 4)
          const startY = from.y + uy * (NODE_R + 4)
          const endX = to.x - ux * (NODE_R + 8)
          const endY = to.y - uy * (NODE_R + 8)
          const midX = (startX + endX) / 2
          const midY = (startY + endY) / 2
          // perpendicular offset to give the flow a slight curve, alternating direction
          const perpX = -uy
          const perpY = ux
          const bend = (i % 2 === 0 ? 1 : -1) * 18
          const ctrlX = midX + perpX * bend
          const ctrlY = midY + perpY * bend
          const path = `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`
          const labelX = ctrlX
          const labelY = ctrlY

          return (
            <g key={i}>
              <path d={path} fill="none" stroke="#a8b0c2" strokeWidth="1.5" markerEnd="url(#fin-arrow)" />
              <rect x={labelX - 22} y={labelY - 9} width="44" height="14" rx="4" fill="white" stroke="#d3d7de" />
              <text x={labelX} y={labelY + 1} textAnchor="middle" fontSize="9" fill="#5c6785" fontWeight="600">
                ₹{edge.valueLakh}L
              </text>
            </g>
          )
        })}

        {positioned.map(node => (
          <g
            key={node.id}
            transform={`translate(${node.x},${node.y})`}
            className="cursor-pointer"
            onClick={() => onNodeClick(node)}
          >
            <circle r={NODE_R} fill="white" stroke={nodeColor(node)} strokeWidth="3.5" />
            <circle r={5} fill={nodeColor(node)} />
            <text y={NODE_R + 14} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#0f2340">
              {node.label.length > 16 ? `${node.label.slice(0, 15)}…` : node.label}
            </text>
            <text y={NODE_R + 26} textAnchor="middle" fontSize="9" fill="#697289">
              {node.role}{node.dormant ? ` · ${t('Dormant')}` : ''}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export default function FakeInvoiceNetwork() {
  const { filters, logAction } = useApp()
  const [selectedClusterId, setSelectedClusterId] = useState(NETWORK_CLUSTERS[0]?.id ?? null)
  const [selectedTaxpayer, setSelectedTaxpayer] = useState(null)
  const [filterNoteDismissed, setFilterNoteDismissed] = useState(false)
  const graphRef = useRef(null)

  const selectedCluster = useMemo(
    () => NETWORK_CLUSTERS.find(c => c.id === selectedClusterId) || NETWORK_CLUSTERS[0],
    [selectedClusterId]
  )

  const filteredClusters = useMemo(
    () => NETWORK_CLUSTERS.filter(c => clusterMatchesFilters(c, filters)),
    [filters]
  )

  const selectedClusterMatchesFilters = selectedCluster ? clusterMatchesFilters(selectedCluster, filters) : true
  const noClusterMatchesFilters = filteredClusters.length === 0

  // Re-show the note when the user picks a different cluster, so a dismissal doesn't
  // silently carry over and hide a mismatch on the newly selected cluster.
  useEffect(() => setFilterNoteDismissed(false), [selectedClusterId])

  function selectCluster(id) {
    if (id !== selectedClusterId) logAction('Viewed Network Cluster', 'Fake Invoice Network', id)
    setSelectedClusterId(id)
  }

  const kpis = useMemo(() => {
    const totalClusters = filteredClusters.length
    const totalEntities = filteredClusters.reduce((s, c) => s + c.nodes.length, 0)
    const sharedIndicatorClusters = filteredClusters.filter(c => c.sharedAddress || c.sharedContact).length
    const totalFlowValue = filteredClusters.reduce((s, c) => s + c.edges.reduce((es, e) => es + e.valueLakh, 0), 0)
    return { totalClusters, totalEntities, sharedIndicatorClusters, totalFlowValue }
  }, [filteredClusters])

  const clusterTableColumns = [
    { key: 'id', label: t('Cluster ID'), sortValue: r => r.id },
    { key: 'entities', label: t('Entities'), align: 'right', sortValue: r => r.nodes.length, render: r => r.nodes.length },
    {
      key: 'sharedAddress', label: t('Shared Address?'), align: 'center',
      sortValue: r => (r.sharedAddress ? 1 : 0),
      render: r => r.sharedAddress ? <Pill tone="red">{t('Yes')}</Pill> : <Pill tone="steel">{t('No')}</Pill>
    },
    {
      key: 'sharedContact', label: t('Shared Contact?'), align: 'center',
      sortValue: r => (r.sharedContact ? 1 : 0),
      render: r => r.sharedContact ? <Pill tone="red">{t('Yes')}</Pill> : <Pill tone="steel">{t('No')}</Pill>
    },
    { key: 'shortLifeEntities', label: t('Short-Life Entities'), align: 'right', sortValue: r => r.shortLifeEntities },
    {
      key: 'flowValue', label: t('Total Flow Value'), align: 'right',
      sortValue: r => r.edges.reduce((s, e) => s + e.valueLakh, 0),
      render: r => `₹${r.edges.reduce((s, e) => s + e.valueLakh, 0)} L`
    },
    {
      key: 'action', label: '', align: 'center', sortable: false,
      render: r => (
        <button
          onClick={() => { selectCluster(r.id); graphRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-navy-200 bg-navy-50 text-navy-700 hover:bg-navy-100"
        >
          {t('View Network')} <ArrowRight className="w-3 h-3" />
        </button>
      )
    }
  ]

  if (!selectedCluster) {
    return (
      <div>
        <SectionHeader eyebrow={t('Fraud & Risk · Network Intelligence')} title={t('Fake Invoice Network')} description={t('No network clusters detected in the current dataset.')} actions={<ExportBar moduleLabel="Fake Invoice Network" />} />
        <Card><div className="text-sm text-steel-500 py-6 text-center">{t('No circular-trading network clusters found.')}</div></Card>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader
        eyebrow={t('Fraud & Risk · Network Intelligence')}
        title={t('Fake Invoice Network')}
        description={t('Graph-based detection of circular invoice trading and linked-entity networks — shared address/contact indicators, short-life entities and estimated flow value between counterparties.')}
        actions={<ExportBar moduleLabel="Fake Invoice Network" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={t('Clusters Detected')} value={kpis.totalClusters.toLocaleString('en-IN')} tone="navy" icon={Network} />
        <KpiCard label={t('Entities Involved')} value={kpis.totalEntities.toLocaleString('en-IN')} tone="steel" icon={Users} />
        <KpiCard label={t('Clusters w/ Shared Address / Contact')} value={kpis.sharedIndicatorClusters.toLocaleString('en-IN')} tone="red" icon={MapPinned} />
        <KpiCard label={t('Total Estimated Flow Value')} value={`₹${kpis.totalFlowValue.toLocaleString('en-IN')}`} unit={t('Lakh')} tone="saffron" icon={IndianRupee} />
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-saffron-200 bg-saffron-50 px-3 py-2.5 text-[11px] text-saffron-900 mb-6">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>{t('Network intelligence is a statistical signal derived from invoice flow, ITC pass-through and linked-entity patterns. It is')} <strong>{t('not a finding of fraud')}</strong>{t(' — every cluster listed here requires verification by the Investigation Team before any enforcement action.')}</span>
      </div>

      <div ref={graphRef} className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 mb-6">
        <Card title={t('Detected Clusters')} subtitle={t('Select a cluster to view its network.')} padded={false}>
          <div className="max-h-[460px] overflow-y-auto divide-y divide-steel-100">
            {filteredClusters.map(c => {
              const active = c.id === selectedCluster.id
              const flow = c.edges.reduce((s, e) => s + e.valueLakh, 0)
              return (
                <button
                  key={c.id}
                  onClick={() => selectCluster(c.id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${active ? 'bg-navy-50 border-l-4 border-navy-700' : 'hover:bg-steel-50 border-l-4 border-transparent'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-900">{c.id}</span>
                    <span className="text-[10.5px] text-steel-500">{t('{0} entities', c.nodes.length)}</span>
                  </div>
                  <div className="text-[11px] text-steel-500 mt-1">{t('₹{0} L estimated flow', flow)}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {c.sharedAddress && <Pill tone="red">{t('Shared Addr.')}</Pill>}
                    {c.sharedContact && <Pill tone="amber">{t('Shared Contact')}</Pill>}
                    {c.shortLifeEntities > 0 && <Pill tone="steel">{t('{0} short-life', c.shortLifeEntities)}</Pill>}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        <Card
          title={t('Network Graph — {0}', selectedCluster.id)}
          subtitle={t("Arrows indicate direction of invoice flow. Click a node to open the taxpayer's full profile.")}
          actions={<HumanReviewBadge />}
        >
          <div className="rounded-lg border border-navy-200 bg-navy-50/60 px-4 py-3 mb-4">
            <div className="text-xs font-bold text-navy-900 mb-1">{t('Intelligence Brief')}</div>
            <p className="text-xs text-navy-800 leading-relaxed">{t(selectedCluster.explanation)}</p>
            <div className="flex flex-wrap gap-2 mt-2.5">
              {selectedCluster.sharedAddress && <Pill tone="red">{t('Shared Registered Address')}</Pill>}
              {selectedCluster.sharedContact && <Pill tone="amber">{t('Shared Contact Details')}</Pill>}
              <Pill tone="steel">{t(selectedCluster.shortLifeEntities === 1 ? '{0} Short-Life Entity' : '{0} Short-Life Entities', selectedCluster.shortLifeEntities)}</Pill>
            </div>
          </div>

          {!selectedClusterMatchesFilters && (
            noClusterMatchesFilters ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-saffron-300 bg-saffron-50 px-3 py-2.5 mb-4">
                <Pill tone="amber">{t('No clusters match your current header filters')}</Pill>
                <span className="text-[11px] text-saffron-900">{t('Showing the full unfiltered cluster list below — adjust or clear the header filters to narrow results.')}</span>
              </div>
            ) : !filterNoteDismissed && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-steel-200 bg-steel-50 px-3 py-2 mb-4">
                <Pill tone="amber">{t("This cluster doesn't match your current header filters")}</Pill>
                <button
                  onClick={() => setFilterNoteDismissed(true)}
                  className="text-steel-400 hover:text-steel-600 shrink-0"
                  aria-label={t('Dismiss filter mismatch note')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          )}

          <ClusterGraph cluster={selectedCluster} onNodeClick={node => setSelectedTaxpayer(taxpayerById(node.id))} />

          <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-steel-500">
            <LegendDot color={RISK_COLORS.Low.solid} label={t('Low Risk')} />
            <LegendDot color={RISK_COLORS.Medium.solid} label={t('Medium Risk')} />
            <LegendDot color={RISK_COLORS.High.solid} label={t('High Risk')} />
            <LegendDot color={RISK_COLORS.Critical.solid} label={t('Critical Risk')} />
            <LegendDot color={DORMANT_COLOR} label={t('Dormant / Inactive')} />
          </div>

          <div className="mt-5">
            <div className="text-xs font-semibold text-navy-800 mb-2">{t('Invoice Flow — Edge Detail')}</div>
            <DataTable
              columns={[
                { key: 'from', label: t('From'), render: e => selectedCluster.nodes.find(n => n.id === e.from)?.label || e.from },
                { key: 'to', label: t('To'), render: e => selectedCluster.nodes.find(n => n.id === e.to)?.label || e.to },
                { key: 'valueLakh', label: t('Estimated Value'), align: 'right', sortValue: e => e.valueLakh, render: e => `₹${e.valueLakh} L` }
              ]}
              rows={selectedCluster.edges.map((e, i) => ({ id: `${selectedCluster.id}-e${i}`, ...e }))}
              searchable={false}
              pageSize={10}
            />
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold text-navy-800 mb-2">{t('Entities in this Cluster')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedCluster.nodes.map(n => (
                <button
                  key={n.id}
                  onClick={() => setSelectedTaxpayer(taxpayerById(n.id))}
                  className="flex items-center justify-between px-3 py-2 rounded-lg border border-steel-200 hover:border-navy-300 hover:bg-navy-50/50 text-left"
                >
                  <div>
                    <div className="text-xs font-semibold text-navy-900">{n.label}</div>
                    <div className="text-[10.5px] text-steel-500">{n.gstin} · {n.role}{n.dormant ? ` · ${t('Dormant')}` : ''}</div>
                  </div>
                  <RiskBadge category={n.risk} size="sm" />
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card title={t('All Detected Clusters')} subtitle={t('Consolidated summary across every network cluster in the current dataset.')}>
        <DataTable
          columns={clusterTableColumns}
          rows={filteredClusters}
          searchPlaceholder={t('Search clusters...')}
          pageSize={10}
        />
      </Card>

      <TaxpayerDrilldownModal taxpayer={selectedTaxpayer} open={!!selectedTaxpayer} onClose={() => setSelectedTaxpayer(null)} />
    </div>
  )
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}
