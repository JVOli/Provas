import { useMemo } from 'react'
import { StatusBadge, TierMark } from '@/components/RaceBits'
import {
  MONTHS_LONG, Race, SEASON_TIERS, TIER_NAME_STYLE, TYPE_LABELS, cn, pluralize, spDay, weekdayLong,
} from '@/lib/utils'

interface RaceTimelineProps {
  races: Race[]
  selectedId: string | null
  onSelect: (race: Race) => void
}

export function RaceTimeline({ races, selectedId, onSelect }: RaceTimelineProps) {
  const groups = useMemo(() => {
    const map = new Map<string, Race[]>()
    for (const r of races) {
      const key = spDay(r.date).slice(0, 7)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }
    return Array.from(map.entries())
  }, [races])

  if (races.length === 0) {
    return (
      <div className="rounded-lg border border-ink-100 bg-white py-14 text-center">
        <p className="text-base font-semibold text-ink-900">Nenhuma prova com este filtro</p>
        <p className="text-sm text-ink-500 mt-1">Ajuste a prioridade, o tipo ou inclua provas anteriores.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map(([key, list]) => {
        const inSeason = list.filter((r) => SEASON_TIERS.includes(r.tier)).length
        return (
          <section key={key}>
            <div className="flex items-baseline gap-3 mb-2">
              <h2 className="text-md font-semibold">{MONTHS_LONG[+key.slice(5) - 1]} {key.slice(0, 4)}</h2>
              <span className="text-xs text-ink-500">
                {pluralize(list.length, 'prova', 'provas')} · {inSeason} na temporada
              </span>
            </div>
            <div className="rounded-lg border border-ink-100 bg-white shadow-xs overflow-hidden">
              {list.map((race, i) => (
                <Row
                  key={race.id}
                  race={race}
                  first={i === 0}
                  selected={race.id === selectedId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function Row({
  race, first, selected, onSelect,
}: {
  race: Race
  first: boolean
  selected: boolean
  onSelect: (r: Race) => void
}) {
  const day = spDay(race.date).slice(8, 10)
  return (
    <button
      type="button"
      onClick={() => onSelect(race)}
      className={cn(
        'w-full text-left grid items-center gap-3 px-4 min-h-[60px] md:min-h-[56px] transition-colors duration-[120ms]',
        'grid-cols-[40px_minmax(0,1fr)_auto] md:grid-cols-[56px_28px_minmax(0,1fr)_170px_96px_120px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        !first && 'border-t border-ink-100',
        selected ? 'bg-signal-100' : 'hover:bg-hover'
      )}
    >
      <div className="flex flex-col">
        <span className="text-xl font-light leading-none tabular">{day}</span>
        <span className="text-2xs uppercase text-ink-500 mt-1">{weekdayLong(race.date).slice(0, 3)}</span>
      </div>
      <TierMark tier={race.tier} className="hidden md:inline-flex" />
      <div className="min-w-0">
        <div className={cn('text-md truncate', TIER_NAME_STYLE[race.tier])}>{race.name}</div>
        <div className="text-xs text-ink-500 truncate">
          <span className="md:hidden">{race.myDistance || race.distances} · </span>
          {race.city}, {race.state}
        </div>
      </div>
      <span className="hidden md:block text-sm text-ink-700 truncate">{race.myDistance || race.distances}</span>
      <span className="hidden md:block text-xs text-ink-500 truncate">{TYPE_LABELS[race.type]}</span>
      <span className="hidden md:flex justify-end">
        <StatusBadge status={race.status} />
      </span>
      <TierMark tier={race.tier} className="md:hidden" />
    </button>
  )
}
