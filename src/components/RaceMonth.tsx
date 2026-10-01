import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  MONTHS_LONG, Race, TIER_CHIP_STYLE, TIER_LABELS, TIER_MARK, cn, spDay, todaySp,
} from '@/lib/utils'

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const LEGEND = ['PRIMARY', 'SECONDARY', 'TERTIARY', 'SUGGESTION', 'NONE'] as const

interface RaceMonthProps {
  races: Race[]
  month: string // YYYY-MM
  onMonthChange: (m: string) => void
  selectedId: string | null
  onSelect: (race: Race) => void
}

function shiftMonth(month: string, delta: number): string {
  const d = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7) - 1 + delta, 1))
  return d.toISOString().slice(0, 7)
}

export function RaceMonth({ races, month, onMonthChange, selectedId, onSelect }: RaceMonthProps) {
  const today = todaySp()

  const byDay = useMemo(() => {
    const map = new Map<string, Race[]>()
    for (const r of races) {
      const k = spDay(r.date)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(r)
    }
    return map
  }, [races])

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7) - 1, 1))
    const lead = first.getUTCDay()
    const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
    const total = Math.ceil((lead + daysInMonth) / 7) * 7
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1 - lead + i))
      const key = d.toISOString().slice(0, 10)
      return { key, day: d.getUTCDate(), inMonth: key.slice(0, 7) === month }
    })
  }, [month])

  const monthCount = cells.reduce((n, c) => n + (c.inMonth ? (byDay.get(c.key)?.length ?? 0) : 0), 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => onMonthChange(shiftMonth(month, -1))} aria-label="Mês anterior">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-md font-semibold min-w-[150px] text-center">
          {MONTHS_LONG[+month.slice(5) - 1]} {month.slice(0, 4)}
        </h2>
        <Button variant="outline" size="icon" onClick={() => onMonthChange(shiftMonth(month, 1))} aria-label="Próximo mês">
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onMonthChange(today.slice(0, 7))}>Hoje</Button>
        <span className="ml-auto text-xs text-ink-500">{monthCount} {monthCount === 1 ? 'prova' : 'provas'} no mês</span>
      </div>

      <div className="rounded-lg border border-ink-100 bg-white shadow-xs overflow-hidden">
        <div className="grid grid-cols-7 border-b border-ink-100">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-2 py-2 text-2xs uppercase text-ink-500 text-center md:text-left font-medium tracking-wide">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((c, i) => {
            const list = byDay.get(c.key) ?? []
            const isToday = c.key === today
            return (
              <div
                key={c.key}
                className={cn(
                  'min-w-0 min-h-[64px] md:min-h-[106px] p-1 md:p-1.5 border-ink-100',
                  i >= 7 && 'border-t',
                  i % 7 !== 0 && 'border-l',
                  c.inMonth ? 'bg-white' : 'bg-paper-2'
                )}
              >
                <div className="mb-1 flex">
                  <span
                    className={cn(
                      'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs tabular',
                      isToday ? 'bg-navy-800 text-white font-semibold' : c.inMonth ? 'text-ink-700' : 'text-ink-300'
                    )}
                  >
                    {c.day}
                  </span>
                </div>
                <div className="space-y-1">
                  {list.map((r) => {
                    const selected = r.id === selectedId
                    const letter = ['PRIMARY', 'SECONDARY', 'TERTIARY'].includes(r.tier) ? `${TIER_MARK[r.tier]} · ` : ''
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onSelect(r)}
                        title={r.name}
                        className={cn(
                          'block w-full truncate rounded-sm border px-1.5 py-1 text-left text-xs transition-colors duration-[120ms]',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          selected ? 'bg-signal-100 text-signal-700 border-signal' : TIER_CHIP_STYLE[r.tier]
                        )}
                      >
                        <span className="hidden md:inline">{letter}{r.name}</span>
                        <span className="md:hidden">{TIER_MARK[r.tier]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {LEGEND.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 text-xs text-ink-500">
            <span className={cn('h-3.5 w-3.5 rounded-sm border', TIER_CHIP_STYLE[t])} />
            {TIER_LABELS[t]}
          </span>
        ))}
      </div>
    </div>
  )
}
