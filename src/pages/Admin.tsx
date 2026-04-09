import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, BarChart2, Bot, List, Trash2 } from 'lucide-react'
import { statsApi, racesApi } from '@/lib/api'
import { TYPE_LABELS, TIER_LABELS, STATUS_LABELS } from '@/lib/utils'
import { RaceForm } from '@/components/RaceForm'
import { ScraperPanel } from '@/components/ScraperPanel'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

type Tab = 'create' | 'scraper' | 'stats'

export default function Admin() {
  const [tab, setTab] = useState<Tab>('create')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  const TabButton = ({ id, label, icon }: { id: Tab; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition-colors ${
        tab === id
          ? 'bg-accent text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Administração</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-0">
        <TabButton id="create" label="Nova Prova" icon={<Plus className="w-4 h-4" />} />
        <TabButton id="scraper" label="Scraping" icon={<Bot className="w-4 h-4" />} />
        <TabButton id="stats" label="Estatísticas" icon={<BarChart2 className="w-4 h-4" />} />
      </div>

      {/* Tab: Create */}
      {tab === 'create' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="font-semibold mb-4">Criar prova manualmente</h2>
          <RaceForm
            onSuccess={(race) => {
              toast.success(`Prova "${race.name}" criada!`)
              navigate(`/race/${race.id}`)
            }}
          />
        </div>
      )}

      {/* Tab: Scraper */}
      {tab === 'scraper' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="font-semibold mb-1">Painel de Scraping</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Execute os scrapers para importar provas dos calendários brasileiros.
            Provas duplicadas são ignoradas automaticamente.
          </p>
          <ScraperPanel />
        </div>
      )}

      {/* Tab: Stats */}
      {tab === 'stats' && <StatsPanel />}
    </div>
  )
}

function StatsPanel() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => statsApi.get().then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-card border border-border rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-4">
      {/* Total */}
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-muted-foreground text-sm">Total de provas cadastradas</p>
        <p className="text-4xl font-bold tabular-nums">{stats.totalRaces}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* By Tier */}
        <StatGroup
          title="Por Prioridade"
          items={stats.byTier.map((t) => ({
            label: TIER_LABELS[t.tier as keyof typeof TIER_LABELS] ?? t.tier,
            value: t.count,
          }))}
          total={stats.totalRaces}
        />

        {/* By Type */}
        <StatGroup
          title="Por Tipo"
          items={stats.byType.map((t) => ({
            label: TYPE_LABELS[t.type as keyof typeof TYPE_LABELS] ?? t.type,
            value: t.count,
          }))}
          total={stats.totalRaces}
        />

        {/* By Status */}
        <StatGroup
          title="Por Status"
          items={stats.byStatus.map((s) => ({
            label: STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] ?? s.status,
            value: s.count,
          }))}
          total={stats.totalRaces}
        />

        {/* By State (top 10) */}
        <StatGroup
          title="Por Estado (top 10)"
          items={stats.byState.slice(0, 10).map((s) => ({
            label: s.state,
            value: s.count,
          }))}
          total={stats.totalRaces}
        />
      </div>

      {/* By Month */}
      {stats.byMonth.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3">Provas por mês (próximos 24 meses)</h3>
          <div className="space-y-1.5">
            {stats.byMonth.map(({ month, count }) => {
              const pct = Math.round((count / Math.max(...stats.byMonth.map((m) => m.count))) * 100)
              const [y, m] = month.split('-')
              const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('pt-BR', {
                month: 'short', year: '2-digit',
              })
              return (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-14 text-right capitalize">{label}</span>
                  <div className="flex-1 bg-muted/40 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-6 tabular-nums">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatGroup({
  title,
  items,
  total,
}: {
  title: string
  items: { label: string; value: number }[]
  total: number
}) {
  if (items.length === 0) return null
  const max = Math.max(...items.map((i) => i.value), 1)

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-28 truncate" title={label}>
              {label}
            </span>
            <div className="flex-1 bg-muted/40 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-blue-500/70 rounded-full"
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
            <span className="text-xs tabular-nums w-6 text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
