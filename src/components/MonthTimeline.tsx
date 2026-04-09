import { Race, getMonthYear } from '@/lib/utils'
import { RaceCard } from './RaceCard'
import { motion } from 'framer-motion'

interface MonthTimelineProps {
  races: Race[]
}

export function MonthTimeline({ races }: MonthTimelineProps) {
  // Group by month
  const byMonth = new Map<string, Race[]>()

  for (const race of races) {
    const key = getMonthYear(race.date)
    if (!byMonth.has(key)) byMonth.set(key, [])
    byMonth.get(key)!.push(race)
  }

  if (races.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">Nenhuma prova encontrada</p>
        <p className="text-sm mt-1">Tente ajustar os filtros ou adicionar uma prova manualmente</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {Array.from(byMonth.entries()).map(([month, monthRaces]) => (
        <motion.section
          key={month}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider capitalize">
              {month}
            </h2>
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">{monthRaces.length} provas</span>
          </div>
          <div className="space-y-2">
            {monthRaces.map((race) => (
              <RaceCard key={race.id} race={race} />
            ))}
          </div>
        </motion.section>
      ))}
    </div>
  )
}
