import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, ExternalLink, Trash2, Pencil } from 'lucide-react'
import { useState } from 'react'
import { racesApi } from '@/lib/api'
import { cn, TIER_BADGE, TIER_COLORS, TIER_LABELS, STATUS_BADGE, STATUS_LABELS, TYPE_LABELS, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { RaceForm } from '@/components/RaceForm'

export default function RaceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const { data: race, isLoading } = useQuery({
    queryKey: ['race', id],
    queryFn: () => racesApi.get(id!).then((r) => r.data),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => racesApi.delete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['races'] })
      toast.success('Prova deletada')
      navigate('/')
    },
    onError: () => toast.error('Erro ao deletar'),
  })

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-card border border-border rounded-lg animate-pulse" />
      </div>
    )
  }

  if (!race) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Prova não encontrada</p>
        <Button variant="ghost" onClick={() => navigate('/')} className="mt-4">
          Voltar ao calendário
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      {/* Card */}
      <div className={cn('bg-card border-l-4 rounded-r-lg rounded-l-none border border-l-0 border-border', TIER_COLORS[race.tier])}>
        <div className="p-5 space-y-4">
          {/* Title + badges */}
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', TIER_BADGE[race.tier])}>
                {TIER_LABELS[race.tier]}
              </span>
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_BADGE[race.status])}>
                {STATUS_LABELS[race.status]}
              </span>
              <Badge variant="outline" className="text-xs">
                {TYPE_LABELS[race.type]}
              </Badge>
              {race.terrain && (
                <Badge variant="outline" className="text-xs">{race.terrain}</Badge>
              )}
            </div>
            <h1 className={cn(
              'text-2xl font-bold leading-tight',
              race.tier === 'PRIMARY' && 'text-red-400',
              race.tier === 'SECONDARY' && 'text-amber-300',
            )}>
              {race.name}
            </h1>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Data" value={formatDate(race.date, { dateStyle: 'full', timeZone: 'America/Sao_Paulo' })} />
            {race.dateEnd && (
              <Field label="Data fim" value={formatDate(race.dateEnd, { dateStyle: 'long', timeZone: 'America/Sao_Paulo' })} />
            )}
            <Field label="Local" value={`${race.city} – ${race.state}`} />
            <Field label="Distâncias" value={race.distances} />
            {race.myDistance && (
              <Field label="Minha distância" value={race.myDistance} highlight />
            )}
            {race.elevation && (
              <Field label="Altimetria" value={race.elevation} />
            )}
            {race.organizer && (
              <Field label="Organizador" value={race.organizer} />
            )}
            {race.source && (
              <Field label="Fonte" value={race.source} />
            )}
          </div>

          {/* Notes */}
          {race.notes && (
            <div className="bg-muted/30 border border-border rounded p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground mb-1">Notas</p>
              <p className="text-foreground leading-relaxed">{race.notes}</p>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-2">
            {race.website && (
              <a
                href={race.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Site oficial
              </a>
            )}
            {race.sourceUrl && (
              <a
                href={race.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Fonte original
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              className="gap-1"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setConfirming(true)}
              className="gap-1 ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Deletar
            </Button>
          </div>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editing} onClose={() => setEditing(false)} title="Editar prova" className="max-w-2xl">
        <div className="max-h-[70vh] overflow-y-auto">
          <RaceForm
            race={race}
            onSuccess={() => {
              setEditing(false)
              qc.invalidateQueries({ queryKey: ['race', id] })
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={confirming} onClose={() => setConfirming(false)} title="Deletar prova">
        <p className="text-sm text-muted-foreground mb-4">
          Tem certeza que deseja deletar <strong className="text-foreground">{race.name}</strong>?
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirming(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deletando...' : 'Deletar'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={cn('font-medium', highlight && 'text-blue-300')}>{value}</p>
    </div>
  )
}
