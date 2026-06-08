import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Race, cn, TIER_COLORS } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

interface YearCalendarViewProps {
  races: Race[]
}

const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function buildMiniMonthGrid(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7 // segunda = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length < 42) cells.push(null)
  return cells
}

function getHighestTier(races: Race[]): string {
  const order = ['PRIMARY', 'SECONDARY', 'TERTIARY', 'NONE', 'SUGGESTION']
  for (const tier of order) {
    if (races.some(r => r.tier === tier)) return tier
  }
  return 'NONE'
}

function getDotColor(tier: string): string {
  switch (tier) {
    case 'PRIMARY': return 'bg-red-500'
    case 'SECONDARY': return 'bg-amber-500'
    case 'TERTIARY': return 'bg-blue-500'
    default: return 'bg-blue-400/60'
  }
}

export function YearCalendarView({ races }: YearCalendarViewProps) {
  const navigate = useNavigate()

  const initialYear = useMemo(() => {
    if (races.length > 0) return new Date(races[0].date).getFullYear()
    return new Date().getFullYear()
  }, [races])

  const [year, setYear] = useState(initialYear)

  const racesByDay = useMemo(() => {
    const map = new Map<string, Race[]>()
    for (const race of races) {
      const key = toDateKey(new Date(race.date))
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(race)
    }
    return map
  }, [races])

  const todayKey = toDateKey(new Date())

  if (races.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">Nenhuma prova encontrada</p>
        <p className="text-sm mt-1">Tente ajustar os filtros ou adicionar uma prova manualmente</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Year nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setYear(y => y - 1)}
          className="p-2 rounded border border-border hover:bg-accent/50 transition-colors"
          title="Ano anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-bold">{year}</h2>
        <button
          onClick={() => setYear(y => y + 1)}
          className="p-2 rounded border border-border hover:bg-accent/50 transition-colors"
          title="Próximo ano"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 12 mini months */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, month) => (
          <MiniMonth
            key={month}
            year={year}
            month={month}
            racesByDay={racesByDay}
            todayKey={todayKey}
            onRaceClick={(id) => navigate(`/race/${id}`)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground justify-center pt-2">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Prova A</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Prova B</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Prova C</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400/60" /> Outras</span>
      </div>
    </div>
  )
}

function MiniMonth({
  year,
  month,
  racesByDay,
  todayKey,
  onRaceClick,
}: {
  year: number
  month: number
  racesByDay: Map<string, Race[]>
  todayKey: string
  onRaceClick: (id: string) => void
}) {
  const grid = useMemo(() => buildMiniMonthGrid(year, month), [year, month])
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  // Count total races this month
  const monthRaceCount = useMemo(() => {
    let count = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      count += racesByDay.get(key)?.length ?? 0
    }
    return count
  }, [year, month, racesByDay])

  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {MONTH_NAMES[month]}
        </h3>
        {monthRaceCount > 0 && (
          <span className="text-[10px] bg-blue-500/20 text-blue-300 rounded-full px-1.5 py-0.5 font-medium">
            {monthRaceCount}
          </span>
        )}
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0 mb-0.5">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[9px] text-muted-foreground/60 font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0 relative">
        {grid.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />
          }

          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayRaces = racesByDay.get(dateKey) ?? []
          const hasRaces = dayRaces.length > 0
          const isToday = dateKey === todayKey
          const tier = hasRaces ? getHighestTier(dayRaces) : 'NONE'

          return (
            <div
              key={dateKey}
              className="relative"
              onMouseEnter={() => hasRaces && setHoveredDay(dateKey)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div
                className={cn(
                  'aspect-square flex flex-col items-center justify-center rounded-sm text-[10px] transition-colors cursor-default',
                  isToday && 'ring-1 ring-blue-500 ring-inset font-bold text-blue-400',
                  hasRaces && 'cursor-pointer hover:bg-accent/50 font-medium',
                  !hasRaces && !isToday && 'text-muted-foreground/70',
                )}
                onClick={() => {
                  if (dayRaces.length === 1) onRaceClick(dayRaces[0].id)
                }}
              >
                <span>{day}</span>
                {hasRaces && (
                  <div className="flex gap-0.5 mt-px">
                    {dayRaces.length <= 3
                      ? dayRaces.map((r, j) => (
                          <span key={j} className={cn('w-1 h-1 rounded-full', getDotColor(r.tier))} />
                        ))
                      : <>
                          <span className={cn('w-1 h-1 rounded-full', getDotColor(tier))} />
                          <span className="text-[7px] text-muted-foreground leading-none">+{dayRaces.length}</span>
                        </>
                    }
                  </div>
                )}
              </div>

              {/* Tooltip */}
              {hoveredDay === dateKey && hasRaces && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 bg-popover border border-border rounded-md shadow-lg p-2 space-y-1">
                  <div className="text-[10px] text-muted-foreground font-medium mb-1">
                    {day} de {MONTH_NAMES[month]}
                  </div>
                  {dayRaces.slice(0, 5).map((race) => (
                    <button
                      key={race.id}
                      onClick={(e) => { e.stopPropagation(); onRaceClick(race.id) }}
                      className={cn(
                        'w-full text-left text-[10px] leading-tight rounded px-1.5 py-1 truncate border-l-2 hover:bg-accent/50 transition-colors',
                        TIER_COLORS[race.tier] || 'border-border'
                      )}
                      title={race.name}
                    >
                      <div className="font-medium truncate">{race.name}</div>
                      <div className="text-muted-foreground truncate">{race.city} – {race.state}</div>
                    </button>
                  ))}
                  {dayRaces.length > 5 && (
                    <div className="text-[9px] text-muted-foreground text-center">
                      +{dayRaces.length - 5} mais
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
