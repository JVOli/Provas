import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Race, cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

interface MonthCalendarViewProps {
  races: Race[]
}

type DayCell = {
  date: Date
  inMonth: boolean
  key: string
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function buildMonthGrid(month: Date): DayCell[] {
  const first = startOfMonth(month)
  const start = new Date(first)
  const offset = (first.getDay() + 6) % 7 // segunda = 0
  start.setDate(first.getDate() - offset)

  const days: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push({
      date: d,
      inMonth: d.getMonth() === month.getMonth(),
      key: toDateKey(d),
    })
  }
  return days
}

export function MonthCalendarView({ races }: MonthCalendarViewProps) {
  const navigate = useNavigate()

  const initialMonth = useMemo(() => {
    if (races.length > 0) return startOfMonth(new Date(races[0].date))
    return startOfMonth(new Date())
  }, [races])

  const [currentMonth, setCurrentMonth] = useState(initialMonth)

  const racesByDay = useMemo(() => {
    const map = new Map<string, Race[]>()
    for (const race of races) {
      const key = toDateKey(new Date(race.date))
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(race)
    }
    return map
  }, [races])

  const grid = useMemo(() => buildMonthGrid(currentMonth), [currentMonth])
  const monthLabel = currentMonth.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  const hasAnyRace = races.length > 0

  if (!hasAnyRace) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">Nenhuma prova encontrada</p>
        <p className="text-sm mt-1">Tente ajustar os filtros ou adicionar uma prova manualmente</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
          className="p-2 rounded border border-border hover:bg-accent/50 transition-colors"
          title="Mês anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold capitalize">{monthLabel}</h2>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
          className="p-2 rounded border border-border hover:bg-accent/50 transition-colors"
          title="Próximo mês"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-xs text-muted-foreground border border-border rounded-t-lg overflow-hidden">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
          <div key={d} className="px-2 py-1.5 bg-muted/30 border-r border-border last:border-r-0 text-center">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-l border-b border-r border-border rounded-b-lg overflow-hidden">
        {grid.map((cell) => {
          const dayRaces = racesByDay.get(cell.key) ?? []
          const isToday = cell.key === toDateKey(new Date())
          return (
            <div
              key={cell.key}
              className={cn(
                'min-h-28 p-1.5 border-t border-border border-r last:border-r-0',
                !cell.inMonth && 'bg-muted/20 text-muted-foreground/70',
                cell.inMonth && 'bg-card',
                isToday && 'ring-1 ring-blue-500/50 ring-inset'
              )}
            >
              <div className="text-xs font-medium mb-1">{cell.date.getDate()}</div>
              <div className="space-y-1">
                {dayRaces.slice(0, 3).map((race) => (
                  <button
                    key={race.id}
                    onClick={() => navigate(`/race/${race.id}`)}
                    className="w-full text-left text-[11px] leading-tight bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded px-1 py-0.5 truncate"
                    title={race.name}
                  >
                    {race.name}
                  </button>
                ))}
                {dayRaces.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">+{dayRaces.length - 3} mais</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
