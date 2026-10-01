import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TierMark } from '@/components/RaceBits'
import { Select } from '@/components/ui/select'
import { useRaces } from '@/lib/useRaces'
import {
  Race, TYPE_LABELS, cn, formatDateBr, formatPace, parseDuration, parseKm, parseRank, pluralize, spDay, todaySp,
} from '@/lib/utils'

function bestTime(rows: Race[], minKm: number, maxKm: number, officialKm: number) {
  let best: { race: Race; seconds: number; km: number } | null = null
  for (const r of rows) {
    if (r.status !== 'COMPLETED') continue
    const km = parseKm(r.myDistance)
    const seconds = parseDuration(r.resultTime)
    if (km === null || seconds === null || km < minKm || km > maxKm) continue
    if (!best || seconds < best.seconds) best = { race: r, seconds, km: officialKm }
  }
  return best
}

export default function Results() {
  const { data: races = [], isLoading } = useRaces()

  const finished = useMemo(
    () =>
      races
        .filter((r) => r.status === 'COMPLETED' || r.status === 'DNF')
        .sort((a, b) => b.date.localeCompare(a.date)),
    [races]
  )

  const years = useMemo(() => {
    const set = new Set(finished.map((r) => spDay(r.date).slice(0, 4)))
    set.add(todaySp().slice(0, 4))
    return Array.from(set).sort().reverse()
  }, [finished])

  const [year, setYear] = useState(todaySp().slice(0, 4))
  const rows = finished.filter((r) => spDay(r.date).startsWith(year))

  const completed = rows.filter((r) => r.status === 'COMPLETED')
  const dnf = rows.length - completed.length
  const marathon = bestTime(rows, 41.5, 43, 42.195)
  const half = bestTime(rows, 20.5, 22, 21.0975)

  let bestCat: { rank: number; race: Race } | null = null
  for (const r of completed) {
    const rank = parseRank(r.resultCategory)
    if (rank !== null && (!bestCat || rank < bestCat.rank)) bestCat = { rank, race: r }
  }

  const headline =
    `${pluralize(completed.length, 'prova concluída', 'provas concluídas')} em ${year}` +
    (marathon ? ` · maratona em ${marathon.race.resultTime}` : '')

  const kpis = [
    {
      label: 'Concluídas',
      value: String(completed.length),
      note: `${dnf} DNF no ano`,
    },
    {
      label: 'Melhor na categoria',
      value: bestCat ? `${bestCat.rank}º` : '·',
      note: bestCat ? bestCat.race.name : 'Sem colocação registrada',
    },
    {
      label: 'Maratona',
      value: marathon ? marathon.race.resultTime! : '·',
      note: marathon ? `Pace ${formatPace(marathon.seconds, marathon.km)}` : 'Sem tempo registrado',
    },
    {
      label: 'Meia maratona',
      value: half ? half.race.resultTime! : '·',
      note: half ? `Pace ${formatPace(half.seconds, half.km)}` : 'Sem tempo registrado',
    },
  ]

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 space-y-5 max-w-[1280px]">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="eyebrow text-navy-350">Resultados · {year}</div>
          <h1 className="text-xl md:text-2xl font-light tracking-tight">{isLoading ? 'Carregando' : headline}</h1>
        </div>
        <Select
          wrapperClassName="w-[110px] shrink-0"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          aria-label="Ano"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border border-ink-100 bg-white px-4 py-4 md:px-5 shadow-xs flex flex-col gap-1 min-w-0">
            <span className="eyebrow text-ink-500">{k.label}</span>
            <span className="text-2xl font-semibold tracking-tight tabular">{k.value}</span>
            <span className="text-xs text-ink-500 truncate">{k.note}</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-ink-100 bg-white overflow-x-auto">
        <div className="min-w-[960px]">
          <div className={cn(GRID, 'h-10 bg-navy-800 text-white eyebrow')}>
            <span>Data</span>
            <span />
            <span>Prova</span>
            <span>Distância</span>
            <span className="text-right">Tempo</span>
            <span className="text-right">Geral</span>
            <span className="text-right">Categoria</span>
            <span className="text-right">Oficial</span>
          </div>
          {rows.length === 0 && !isLoading && (
            <div className="py-12 text-center text-sm text-ink-500 border-t border-ink-100">
              Nenhuma prova concluída em {year}. Marque uma prova como concluída no calendário para registrar o resultado.
            </div>
          )}
          {rows.map((r) => (
            <div key={r.id} className={cn(GRID, 'min-h-[52px] border-t border-ink-100 text-sm hover:bg-hover transition-colors duration-[120ms]')}>
              <span className="text-ink-700 tabular">{formatDateBr(r.date)}</span>
              <TierMark tier={r.tier} />
              <div className="min-w-0 flex flex-col gap-0.5">
                <Link to={`/?p=${r.id}`} className="font-medium text-ink-900 truncate hover:text-signal-700">
                  {r.name}
                </Link>
                <span className="text-xs text-ink-500 truncate">
                  {r.city}, {r.state} · {TYPE_LABELS[r.type]}
                </span>
              </div>
              <span className="text-ink-700 truncate">{r.myDistance || r.distances}</span>
              <span className={cn('text-right font-semibold tabular', r.status === 'DNF' && 'text-bordeaux')}>
                {r.resultTime || '·'}
                {r.status === 'DNF' && <span className="ml-1 text-xs font-medium">DNF</span>}
              </span>
              <span className="text-right tabular">{r.resultOverall || '·'}</span>
              <span className="text-right tabular">
                {r.resultCategory || '·'}
                {r.resultCategoryName && (
                  <span className="block text-xs text-ink-500">{r.resultCategoryName}</span>
                )}
              </span>
              <span className="text-right">
                {r.resultUrl && (
                  <a href={r.resultUrl} target="_blank" rel="noreferrer">Ver resultado →</a>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const GRID =
  'grid grid-cols-[110px_28px_minmax(0,1fr)_140px_120px_130px_130px_140px] items-center gap-3 px-4'
