import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useRaces } from '@/lib/useRaces'
import {
  BR_STATES, PRIORITY_STATES, Race, SEASON_TIERS, TYPE_LABELS, pluralize, spDay, todaySp,
} from '@/lib/utils'
import { RacePanel, PanelMode } from '@/components/RacePanel'
import { RaceMonth } from '@/components/RaceMonth'
import { RaceTimeline } from '@/components/RaceTimeline'
import { SeasonStrip } from '@/components/SeasonStrip'
import { MultiFilter, FilterOption } from '@/components/MultiFilter'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { Switch } from '@/components/ui/switch'

type View = 'timeline' | 'month'
const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: 'timeline', label: 'Timeline' },
  { value: 'month', label: 'Mês' },
]

const TIER_OPTIONS: FilterOption[] = [
  { value: 'PRIMARY', label: 'Prova A' },
  { value: 'SECONDARY', label: 'Prova B' },
  { value: 'TERTIARY', label: 'Prova C' },
  { value: 'SUGGESTION', label: 'Sugestão' },
  { value: 'NONE', label: 'Sem prioridade' },
]

const TYPE_OPTIONS: FilterOption[] = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))

const STATE_OPTIONS: FilterOption[] = [
  ...PRIORITY_STATES,
  ...BR_STATES.filter((s) => !PRIORITY_STATES.includes(s)),
].map((s) => ({ value: s, label: s }))

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export default function Calendar() {
  const { data: races = [], isLoading, isError } = useRaces()
  const [params, setParams] = useSearchParams()

  const [view, setView] = useState<View>('timeline')
  const [tiers, setTiers] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [sources, setSources] = useState<string[]>([])
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

  const sourceOptions = useMemo(
    (): FilterOption[] =>
      Array.from(new Set(races.map((r) => r.source || 'manual')))
        .sort((a, b) => a.localeCompare(b))
        .map((v) => ({ value: v, label: v === 'manual' ? 'Manual' : v })),
    [races]
  )

  // Filtros comuns; "incluir anteriores" só vale para a timeline.
  const matching = useMemo(() => {
    const term = normalize(q.trim())
    return races.filter((r) => {
      if (tiers.length > 0 && !tiers.includes(r.tier)) return false
      if (types.length > 0 && !types.includes(r.type)) return false
      if (states.length > 0 && !states.includes(r.state)) return false
      if (sources.length > 0 && !sources.includes(r.source || 'manual')) return false
      if (term && !normalize(`${r.name} ${r.city}`).includes(term)) return false
      return true
    })
  }, [races, tiers, types, states, sources, q])

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
          <MultiFilter
            title="Prioridade"
            allLabel="Todas as prioridades"
            pluralLabel="prioridades"
            options={TIER_OPTIONS}
            value={tiers}
            onChange={setTiers}
            className="w-full md:w-[180px]"
          />
          <MultiFilter
            title="Tipo"
            allLabel="Todos os tipos"
            pluralLabel="tipos"
            options={TYPE_OPTIONS}
            value={types}
            onChange={setTypes}
            className="w-full md:w-[160px]"
          />
          <MultiFilter
            title="Estado"
            allLabel="Todos os estados"
            pluralLabel="estados"
            options={STATE_OPTIONS}
            highlight={PRIORITY_STATES}
            value={states}
            onChange={setStates}
            className="w-full md:w-[150px]"
          />
          {sourceOptions.length > 0 && (
            <MultiFilter
              title="Fonte"
              allLabel="Todas as fontes"
              pluralLabel="fontes"
              options={sourceOptions}
              value={sources}
              onChange={setSources}
              className="w-full md:w-[160px]"
            />
          )}
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
