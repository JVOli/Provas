import { useMemo } from 'react'
import {
  Race, RaceTier, SEASON_TIERS, TIER_MARK, cn, diffDays, formatDateBr, pluralize, spDay, todaySp,
} from '@/lib/utils'

const MONTHS_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const RANGE_DAYS = 365

export function nextPrimary(races: Race[], today = todaySp()): Race | undefined {
  return races.find((r) => r.tier === 'PRIMARY' && spDay(r.date) >= today && r.status !== 'CANCELLED')
}

export function useSeason(races: Race[]) {
  return useMemo(() => {
    const today = todaySp()
    const nextA = nextPrimary(races, today)
    const upcoming = races.filter((r) => spDay(r.date) >= today && r.status !== 'CANCELLED')
    const registered = upcoming.filter((r) => r.status === 'REGISTERED')
    const nextStart = registered[0]
    const before = nextA
      ? registered.filter((r) => spDay(r.date) < spDay(nextA.date)).length
      : 0
    const inRange = upcoming.filter(
      (r) => SEASON_TIERS.includes(r.tier) && diffDays(today, spDay(r.date)) <= RANGE_DAYS
    )
    const count = (t: RaceTier) => inRange.filter((r) => r.tier === t).length
    return { today, nextA, nextStart, before, inRange, a: count('PRIMARY'), b: count('SECONDARY'), c: count('TERTIARY') }
  }, [races])
}

interface SeasonStripProps {
  races: Race[]
  onOpen: (race: Race) => void
}

export function SeasonStrip({ races, onOpen }: SeasonStripProps) {
  const { today, nextA, nextStart, before, inRange, a, b, c } = useSeason(races)

  const ticks = useMemo(() => {
    const [y, m] = [+today.slice(0, 4), +today.slice(5, 7) - 1]
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Date.UTC(y, m + i, 1))
      const iso = d.toISOString().slice(0, 10)
      const offset = Math.max(0, diffDays(today, iso))
      return { label: MONTHS_ABBR[d.getUTCMonth()], pct: (offset / RANGE_DAYS) * 100 }
    })
  }, [today])

  const days = nextA ? diffDays(today, spDay(nextA.date)) : null

  return (
    <section className="rounded-lg bg-navy-800 text-white p-4 md:px-6 md:py-5 grid gap-4 md:gap-8 md:grid-cols-[300px_1fr]">
      <button
        type="button"
        disabled={!nextA}
        onClick={() => nextA && onOpen(nextA)}
        className="text-left flex md:block items-end justify-between gap-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <div className="min-w-0 md:contents">
          <div className="eyebrow text-navy-200">Próxima prova A</div>
          {nextA ? (
            <>
              <div className="hidden md:flex items-baseline gap-2 mt-2">
                <span className="text-[44px] font-light leading-none tabular">{days}</span>
                <span className="text-base font-light">{days === 1 ? 'dia' : 'dias'}</span>
              </div>
              <div className="text-sm font-medium mt-1 md:mt-2 truncate">{nextA.name}</div>
              <div className="text-xs text-navy-200 mt-0.5 truncate">
                {formatDateBr(nextA.date)} · {nextA.city}, {nextA.state}
              </div>
            </>
          ) : (
            <div className="text-sm mt-2 text-navy-200">Nenhuma prova A marcada</div>
          )}
        </div>
        {nextA && (
          <div className="md:hidden text-right shrink-0">
            <span className="text-[34px] font-light leading-none tabular">{days}</span>
            <span className="text-xs font-light ml-1">{days === 1 ? 'dia' : 'dias'}</span>
          </div>
        )}
      </button>

      <div className="hidden md:flex flex-col justify-between gap-5 min-w-0">
        <div className="grid grid-cols-3 gap-6">
          <Stat label="Antes dela">
            {nextA ? pluralize(before, 'prova inscrita', 'provas inscritas') : 'Sem prova A'}
          </Stat>
          <Stat label="Próxima largada">
            {nextStart ? (
              <>
                <span className="truncate block">{nextStart.name}</span>
                <span className="text-navy-200">em {pluralize(diffDays(today, spDay(nextStart.date)), 'dia', 'dias')}</span>
              </>
            ) : (
              'Nenhuma inscrição'
            )}
          </Stat>
          <Stat label="Temporada">{a} A · {b} B · {c} C</Stat>
        </div>

        <div className="relative h-9" aria-label="Linha do tempo dos próximos 12 meses">
          <div className="absolute left-0 right-0 top-[10px] h-px bg-white/[0.14]" />
          {inRange.map((r) => {
            const pct = (diffDays(today, spDay(r.date)) / RANGE_DAYS) * 100
            const size = r.tier === 'PRIMARY' ? 14 : r.tier === 'SECONDARY' ? 10 : 8
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onOpen(r)}
                title={`${TIER_MARK[r.tier]} · ${r.name} · ${formatDateBr(r.date)}`}
                style={{ left: `${pct}%`, width: size, height: size, top: 10 - size / 2, marginLeft: -size / 2 }}
                className={cn(
                  'absolute rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                  r.tier === 'TERTIARY' ? 'bg-navy-800 border-2 border-white' : 'bg-white'
                )}
              />
            )
          })}
          {ticks.map((t) => (
            <span
              key={t.label + t.pct}
              style={{ left: `${t.pct}%` }}
              className="absolute top-5 text-2xs text-navy-200 -translate-x-0"
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-navy-200">{label}</div>
      <div className="text-sm mt-1">{children}</div>
    </div>
  )
}
