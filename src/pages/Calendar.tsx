import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LayoutList, LayoutGrid, AlignJustify, CalendarDays, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { racesApi } from '@/lib/api'
import { Race, cn, TIER_BADGE, TIER_LABELS, STATUS_BADGE, STATUS_LABELS, TYPE_LABELS, formatDate, getDayOfWeek, TIER_COLORS } from '@/lib/utils'
import { Filters, FilterState, defaultFilters } from '@/components/Filters'
import { MonthTimeline } from '@/components/MonthTimeline'
import { RaceCard } from '@/components/RaceCard'
import { MonthCalendarView } from '@/components/MonthCalendarView'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type ViewMode = 'timeline' | 'calendar' | 'grid' | 'list'

export default function Calendar() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [view, setView] = useState<ViewMode>('timeline')
  const navigate = useNavigate()

  const queryParams = useMemo(() => ({
    state: filters.states.join(',') || undefined,
    type: filters.types.join(',') || undefined,
    tier: filters.tiers.join(',') || undefined,
    status: filters.statuses.join(',') || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    search: filters.search || undefined,
    sort: 'date' as const,
    limit: 200,
  }), [filters])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['races', queryParams],
    queryFn: async () => {
      const first = (await racesApi.list({ ...queryParams, page: 1 })).data
      const all = [...first.data]

      if (first.pagination.pages > 1) {
        for (let p = 2; p <= first.pagination.pages; p++) {
          const next = (await racesApi.list({ ...queryParams, page: p })).data
          all.push(...next.data)
        }
      }

      return {
        data: all,
        pagination: {
          ...first.pagination,
          total: all.length,
          page: 1,
          pages: 1,
        },
      }
    },
  })

  const races = data?.data ?? []
  const total = data?.pagination.total ?? 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Calendário de Provas</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Carregando...' : `${total} prova${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-muted/50 rounded p-1 border border-border">
            <ViewBtn icon={<LayoutList className="w-3.5 h-3.5" />} mode="timeline" active={view} set={setView} title="Timeline" />
            <ViewBtn icon={<CalendarDays className="w-3.5 h-3.5" />} mode="calendar" active={view} set={setView} title="Calendário" />
            <ViewBtn icon={<LayoutGrid className="w-3.5 h-3.5" />} mode="grid" active={view} set={setView} title="Grade" />
            <ViewBtn icon={<AlignJustify className="w-3.5 h-3.5" />} mode="list" active={view} set={setView} title="Lista" />
          </div>
          <Button size="sm" onClick={() => navigate('/admin')} className="gap-1">
            <Plus className="w-3.5 h-3.5" />
            Nova prova
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Filters filters={filters} onChange={(f) => { setFilters(f) }} />

      {/* Content */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-card border border-border rounded-r-lg animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-12 text-destructive">
          Erro ao carregar provas. Verifique se o servidor está rodando.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {view === 'timeline' && <MonthTimeline races={races} />}
          {view === 'calendar' && <MonthCalendarView races={races} />}
          {view === 'grid' && <GridView races={races} />}
          {view === 'list' && <ListView races={races} />}
        </>
      )}
    </div>
  )
}

function ViewBtn({
  icon, mode, active, set, title,
}: {
  icon: React.ReactNode
  mode: ViewMode
  active: ViewMode
  set: (m: ViewMode) => void
  title: string
}) {
  return (
    <button
      onClick={() => set(mode)}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        active === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {icon}
    </button>
  )
}

function GridView({ races }: { races: Race[] }) {
  if (races.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Nenhuma prova encontrada</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {races.map((race) => (
        <RaceCard key={race.id} race={race} />
      ))}
    </div>
  )
}

function ListView({ races }: { races: Race[] }) {
  const navigate = useNavigate()

  if (races.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Nenhuma prova encontrada</p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/40 text-muted-foreground text-xs">
            <th className="text-left px-3 py-2 font-medium">Data</th>
            <th className="text-left px-3 py-2 font-medium">Nome</th>
            <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Local</th>
            <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Distância</th>
            <th className="text-left px-3 py-2 font-medium hidden lg:table-cell">Tipo</th>
            <th className="text-left px-3 py-2 font-medium">Prioridade</th>
            <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Status</th>
          </tr>
        </thead>
        <tbody>
          {races.map((race, i) => (
            <tr
              key={race.id}
              onClick={() => navigate(`/race/${race.id}`)}
              className={cn(
                'border-t border-border cursor-pointer hover:bg-accent/50 transition-colors',
                i % 2 === 0 && 'bg-muted/10'
              )}
            >
              <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                <div className="font-medium text-foreground">
                  {formatDate(race.date, { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })}
                </div>
                <div className="text-xs capitalize">{getDayOfWeek(race.date)}</div>
              </td>
              <td className={cn(
                'px-3 py-2 font-medium max-w-xs truncate',
                race.tier === 'PRIMARY' && 'text-red-400',
                race.tier === 'SECONDARY' && 'text-amber-300',
              )}>
                {race.name}
              </td>
              <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                {race.city} – {race.state}
              </td>
              <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">
                {race.myDistance || race.distances}
              </td>
              <td className="px-3 py-2 hidden lg:table-cell">
                <Badge variant="outline" className="text-[10px]">
                  {TYPE_LABELS[race.type]}
                </Badge>
              </td>
              <td className="px-3 py-2">
                <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', TIER_BADGE[race.tier])}>
                  {TIER_LABELS[race.tier]}
                </span>
              </td>
              <td className="px-3 py-2 hidden md:table-cell">
                <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', STATUS_BADGE[race.status])}>
                  {STATUS_LABELS[race.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
