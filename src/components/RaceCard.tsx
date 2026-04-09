import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ExternalLink, MapPin, Ruler, Trophy, CheckCircle2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Race, cn, TIER_BADGE, TIER_COLORS, TIER_LABELS, STATUS_BADGE, STATUS_LABELS,
  TYPE_LABELS, formatDate, getDayOfWeek, RaceTier, RaceStatus,
} from '@/lib/utils'
import { racesApi } from '@/lib/api'
import { Badge } from './ui/badge'
import { Select } from './ui/select'

interface RaceCardProps {
  race: Race
}

export function RaceCard({ race }: RaceCardProps) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const tierMutation = useMutation({
    mutationFn: (tier: RaceTier) => racesApi.setTier(race.id, tier),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['races'] })
      toast.success('Classificação atualizada')
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: RaceStatus) => racesApi.setStatus(race.id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['races'] })
      toast.success('Status atualizado')
    },
  })

  const date = new Date(race.date)
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit', timeZone: 'America/Sao_Paulo' })
  const monthShort = date.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' })
  const weekday = getDayOfWeek(race.date)

  return (
    <motion.div
      layout
      className={cn(
        'bg-card border-l-4 rounded-r-lg rounded-l-none border border-l-0 border-border overflow-hidden',
        'transition-colors hover:border-border/80',
        TIER_COLORS[race.tier]
      )}
    >
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Date block */}
        <div className="flex-shrink-0 text-center w-12">
          <div className="text-2xl font-bold leading-none tabular-nums">{day}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">{monthShort}</div>
          <div className="text-xs text-muted-foreground capitalize">{weekday}</div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <span
              className={cn(
                'font-semibold text-sm leading-tight',
                race.tier === 'PRIMARY' && 'text-red-400',
                race.tier === 'SECONDARY' && 'text-amber-300'
              )}
            >
              {race.name}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {race.city} – {race.state}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Ruler className="w-3 h-3" />
              {race.myDistance || race.distances}
            </span>
          </div>
        </div>

        {/* Badges */}
        <div className="hidden sm:flex flex-wrap gap-1 items-center flex-shrink-0">
          <Badge variant="outline" className="text-[10px]">
            {TYPE_LABELS[race.type]}
          </Badge>
          <Badge className={cn('text-[10px]', TIER_BADGE[race.tier])}>
            {TIER_LABELS[race.tier]}
          </Badge>
          {race.status === 'REGISTERED' && (
            <Badge className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30">
              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
              Inscrito
            </Badge>
          )}
          {race.status === 'COMPLETED' && (
            <Badge className="text-[10px] bg-gray-500/20 text-gray-400 border border-gray-500/30">
              <Trophy className="w-2.5 h-2.5 mr-0.5" />
              Concluída
            </Badge>
          )}
        </div>

        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </div>

      {/* Expanded section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border/50 space-y-3">
              {/* Quick actions */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Prioridade:</span>
                  <Select
                    value={race.tier}
                    onChange={(e) => tierMutation.mutate(e.target.value as RaceTier)}
                    className="h-7 text-xs w-36"
                  >
                    {Object.entries(TIER_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <Select
                    value={race.status}
                    onChange={(e) => statusMutation.mutate(e.target.value as RaceStatus)}
                    className="h-7 text-xs w-36"
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs">
                {race.terrain && (
                  <Detail label="Terreno" value={race.terrain} />
                )}
                {race.organizer && (
                  <Detail label="Organizador" value={race.organizer} />
                )}
                {race.elevation && (
                  <Detail label="Altimetria" value={race.elevation} />
                )}
                {race.distances && (
                  <Detail label="Distâncias" value={race.distances} />
                )}
                {race.source && (
                  <Detail label="Fonte" value={race.source} />
                )}
              </div>

              {race.notes && (
                <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 border border-border/50">
                  {race.notes}
                </div>
              )}

              {/* Footer actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => navigate(`/race/${race.id}`)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Ver detalhes →
                </button>
                {race.website && (
                  <a
                    href={race.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Site oficial
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
