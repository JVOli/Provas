import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Race, RaceType, RaceTier, RaceStatus, TYPE_LABELS, TIER_LABELS, STATUS_LABELS, BR_STATES } from '@/lib/utils'
import { racesApi } from '@/lib/api'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select } from './ui/select'
import { Label } from './ui/label'

interface RaceFormProps {
  race?: Partial<Race>
  onSuccess?: (race: Race) => void
  onCancel?: () => void
}

const defaultRace: Partial<Race> = {
  name: '',
  date: new Date().toISOString().substring(0, 10),
  city: '',
  state: 'RS',
  distances: '',
  type: 'CORRIDA',
  terrain: '',
  organizer: '',
  website: '',
  tier: 'NONE',
  status: 'NOT_REGISTERED',
  myDistance: '',
  notes: '',
  source: 'manual',
}

export function RaceForm({ race, onSuccess, onCancel }: RaceFormProps) {
  const [form, setForm] = useState<Partial<Race>>({ ...defaultRace, ...race })
  const qc = useQueryClient()

  const set = (field: keyof Race, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const isEdit = !!race?.id

  const mutation = useMutation({
    mutationFn: () =>
      isEdit
        ? racesApi.update(race!.id!, form)
        : racesApi.create(form),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['races'] })
      toast.success(isEdit ? 'Prova atualizada!' : 'Prova criada!')
      onSuccess?.(res.data)
    },
    onError: () => toast.error('Erro ao salvar prova'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.date || !form.city) {
      toast.error('Preencha nome, data e cidade')
      return
    }
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name — full width */}
        <div className="sm:col-span-2 space-y-1">
          <Label>Nome da prova *</Label>
          <Input
            value={form.name ?? ''}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ex: Maratona de Porto Alegre"
            required
          />
        </div>

        <div className="space-y-1">
          <Label>Data *</Label>
          <Input
            type="date"
            value={form.date ? new Date(form.date).toISOString().substring(0, 10) : ''}
            onChange={(e) => set('date', e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <Label>Data fim (opcional)</Label>
          <Input
            type="date"
            value={form.dateEnd ? new Date(form.dateEnd).toISOString().substring(0, 10) : ''}
            onChange={(e) => set('dateEnd', e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>Cidade *</Label>
          <Input
            value={form.city ?? ''}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Ex: Porto Alegre"
            required
          />
        </div>

        <div className="space-y-1">
          <Label>Estado</Label>
          <Select value={form.state ?? 'RS'} onChange={(e) => set('state', e.target.value)}>
            {BR_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Distâncias disponíveis</Label>
          <Input
            value={form.distances ?? ''}
            onChange={(e) => set('distances', e.target.value)}
            placeholder="Ex: 5km, 10km, 21km, 42km"
          />
        </div>

        <div className="space-y-1">
          <Label>Minha distância</Label>
          <Input
            value={form.myDistance ?? ''}
            onChange={(e) => set('myDistance', e.target.value)}
            placeholder="Ex: 80km"
          />
        </div>

        <div className="space-y-1">
          <Label>Tipo</Label>
          <Select value={form.type ?? 'CORRIDA'} onChange={(e) => set('type', e.target.value)}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Terreno</Label>
          <Input
            value={form.terrain ?? ''}
            onChange={(e) => set('terrain', e.target.value)}
            placeholder="Ex: asfalto, trail, praia, misto"
          />
        </div>

        <div className="space-y-1">
          <Label>Prioridade</Label>
          <Select value={form.tier ?? 'NONE'} onChange={(e) => set('tier', e.target.value)}>
            {Object.entries(TIER_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={form.status ?? 'NOT_REGISTERED'} onChange={(e) => set('status', e.target.value)}>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Organizador</Label>
          <Input
            value={form.organizer ?? ''}
            onChange={(e) => set('organizer', e.target.value)}
            placeholder="Ex: GPR Assessoria"
          />
        </div>

        <div className="space-y-1">
          <Label>Website</Label>
          <Input
            type="url"
            value={form.website ?? ''}
            onChange={(e) => set('website', e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-1">
          <Label>Altimetria</Label>
          <Input
            value={form.elevation ?? ''}
            onChange={(e) => set('elevation', e.target.value)}
            placeholder="Ex: 2400m D+"
          />
        </div>

        <div className="sm:col-span-2 space-y-1">
          <Label>Notas pessoais</Label>
          <Textarea
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Anotações sobre a prova, estratégia, etc."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar prova'}
        </Button>
      </div>
    </form>
  )
}
