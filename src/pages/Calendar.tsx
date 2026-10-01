import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useRaces } from '@/lib/useRaces'
import {
  Race, RaceType, SEASON_TIERS, TYPE_LABELS, pluralize, spDay, todaySp,
} from '@/lib/utils'
import { RacePanel, PanelMode } from '@/components/RacePanel'
import { RaceMonth } from '@/components/RaceMonth'
import { RaceTimeline } from '@/components/RaceTimeline'
import { SeasonStrip } from '@/components/SeasonStrip'
import { StateFilter } from '@/components/StateFilter'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

type View = 'timeline' | 'month'
type TierFilter = 'all' | 'mine' | 'PRIMARY' | 'SECONDARY' | 'TERTIARY' | 'SUGGESTION'

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: 'timeline', label: 'Timeline' },
  { value: 'month', label: 'Mês' },
]

const TIER_FILTER_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'mine', label: 'Temporada' },
  { value: 'PRIMARY', label: 'A' },
  { value: 'SECONDARY', label: 'B' },
  { value: 'TERTIARY', label: 'C' },
  { value: 'SUGGESTION', label: 'Sugestões' },
]

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function Calendar() {
  const { data: races = [], isLoading, isError } = useRaces()
  const [params, setParams] = useSearchParams()

  const [view, setView] = useState<View>('timeline')
  const [tier, setTier] = useState<TierFilter>('all')
  const [type, setType] = useState<'all' | RaceType>('all')
  const [states, setStates] = useState<string[]>([])
  const [q, setQ] = useState('')
  const [includePast, setIncludePast] = useState(false)
  const [month, setMonth] = useState(todaySp().slice(0, 7))
  const [mode, setMode] = useState<PanelMode>('view')

  const selectedId = params.get('p')
  const isNew = params.get('nova') === '1'
  const selected = races.find((r) => r.id === selectedId)
  const panelOpen = isNew || !!selected

  // "Nova prova" vem da navegação (?nova=1); selecionar uma prova volta ao modo leitura.
  useEffect(() => {
    if (isNew) setMode('new')
  }, [isNew])

  const openRace = (race: Race) => {
    setMode('view')
    setParams({ p: race.id })
    if (view === 'month') setMonth(spDay(race.date).slice(0, 7))
  }
  const closePanel = () => {
    setParams({})
    setMode('view')
  }

  const today = todaySp()

  // Filtros comuns; "incluir anteriores" só vale para a timeline.
  const matching = useMemo(() => {
    const term = normalize(q.trim())
    return races.filter((r) => {
      if (tier === 'mine' ? !SEASON_TIERS.includes(r.tier) : tier !== 'all' && r.tier !== tier) return false
      if (type !== 'all' && r.type !== type) return false
      if (states.length > 0 && !states.includes(r.state)) return false
      if (term && !normalize(`${r.name} ${r.city}`).includes(term)) return false
      return true
    })
  }, [races, tier, type, states, q])

  const timelineRaces = useMemo(
    () => (includePast ? matching : matching.filter((r) => spDay(r.date) >= today)),
    [matching, includePast, today]
  )
  const seasonCount = timelineRaces.filter((r) => SEASON_TIERS.includes(r.tier)).length

  const goToNextA = (race: Race) => {
    openRace(race)
    setMonth(spDay(race.date).slice(0, 7))
  }

  return (
    <div className="flex items-start">
      <div className="min-w-0 flex-1 px-4 py-4 md:px-8 md:py-6 space-y-5">
        <div className="flex items-baseline justify-between md:hidden">
          <h1 className="text-xl font-light tracking-tight">Calendário</h1>
          <span className="text-xs text-ink-500">
            {pluralize(timelineRaces.length, 'prova', 'provas')} · {seasonCount} na temporada
          </span>
        </div>

        <SeasonStrip races={races} onOpen={goToNextA} />

        <div className="flex flex-wrap items-center gap-3">
          <Segmented label="Visão" value={view} options={VIEW_OPTIONS} onChange={setView} className="max-md:hidden" />
          <div className="relative w-full md:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300 pointer-events-none" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar prova ou cidade"
              aria-label="Buscar prova ou cidade"
              className="pl-8"
            />
          </div>
          <Segmented
            label="Prioridade"
            value={tier}
            options={TIER_FILTER_OPTIONS}
            onChange={setTier}
            className="max-w-full overflow-x-auto no-scrollbar"
          />
          <Select
            wrapperClassName="w-full md:w-[150px]"
            value={type}
            onChange={(e) => setType(e.target.value as 'all' | RaceType)}
            aria-label="Tipo"
          >
            <option value="all">Todos os tipos</option>
            {(['CORRIDA', 'TRAIL', 'ULTRA', 'TRIATHLON', 'DUATHLON', 'REVEZAMENTO'] as RaceType[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </Select>
          <StateFilter value={states} onChange={setStates} className="w-full md:w-[150px]" />
          <Switch checked={includePast} onChange={setIncludePast} label="Incluir anteriores" />
          <span className="ml-auto hidden md:inline text-xs text-ink-500">
            {pluralize(timelineRaces.length, 'prova', 'provas')} · {seasonCount} na temporada
          </span>
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-lg border border-ink-100 bg-white animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <div className="py-12 text-center text-bordeaux">
            Erro ao carregar provas. Verifique se o servidor está rodando.
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {/* No celular a visão Mês continua disponível pelo mesmo seletor. */}
            <Segmented label="Visão" value={view} options={VIEW_OPTIONS} onChange={setView} className="md:hidden" />
            {view === 'timeline' ? (
              <RaceTimeline races={timelineRaces} selectedId={selectedId} onSelect={openRace} />
            ) : (
              <RaceMonth
                races={matching}
                month={month}
                onMonthChange={setMonth}
                selectedId={selectedId}
                onSelect={openRace}
              />
            )}
          </>
        )}
      </div>

      {panelOpen && (
        <aside className="fixed inset-0 z-50 bg-white md:sticky md:top-14 md:z-auto md:inset-auto md:h-[calc(100vh-56px)] md:w-[380px] md:shrink-0 md:border-l md:border-ink-100">
          <RacePanel
            race={selected}
            mode={isNew ? 'new' : mode}
            onModeChange={setMode}
            onClose={closePanel}
            onSaved={(r) => {
              setMode('view')
              setParams({ p: r.id })
            }}
          />
        </aside>
      )}
    </div>
  )
}
