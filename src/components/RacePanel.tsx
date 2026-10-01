import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Save, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { racesApi } from '@/lib/api'
import {
  BR_STATES, Race, RaceStatus, RaceTier, STATUS_LABELS, TIER_LABELS, TYPE_LABELS,
  diffDays, formatDateBr, spDay, todaySp, weekdayLong, cn,
} from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export type PanelMode = 'view' | 'edit' | 'new'

interface RacePanelProps {
  race?: Race
  mode: PanelMode
  onModeChange: (m: PanelMode) => void
  onClose: () => void
  onSaved: (race: Race) => void
}

const TIER_OPTIONS: { value: RaceTier; label: string }[] = [
  { value: 'PRIMARY', label: 'A' },
  { value: 'SECONDARY', label: 'B' },
  { value: 'TERTIARY', label: 'C' },
  { value: 'SUGGESTION', label: 'Sugestão' },
  { value: 'NONE', label: 'Nenhuma' },
]

function countdownLabel(iso: string): string {
  const d = diffDays(todaySp(), spDay(iso))
  if (d === 0) return 'HOJE'
  if (d > 0) return `EM ${d} ${d === 1 ? 'DIA' : 'DIAS'}`
  return `HÁ ${-d} ${-d === 1 ? 'DIA' : 'DIAS'}`
}

export function RacePanel({ race, mode, onModeChange, onClose, onSaved }: RacePanelProps) {
  const isNew = mode === 'new'
  return (
    <div className="flex h-full flex-col bg-white panel-in">
      <header className="shrink-0 border-b border-ink-100 px-5 pt-5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow text-ink-500">
            {isNew ? 'Cadastro' : race ? `${TYPE_LABELS[race.type]} · ${countdownLabel(race.date)}` : ''}
          </span>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar painel">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <h2 className="mt-1 text-xl font-light tracking-tight text-ink-900">
          {isNew ? 'Nova prova' : race?.name}
        </h2>
        {!isNew && race && (
          <p className="mt-1 text-sm text-ink-700">
            {formatDateBr(race.date)} · {weekdayLong(race.date)} · {race.city}, {race.state}
          </p>
        )}
      </header>

      {mode === 'view' && race ? (
        <ViewMode key={race.id} race={race} onEdit={() => onModeChange('edit')} onDeleted={onClose} />
      ) : (
        <EditMode
          key={race?.id ?? 'new'}
          race={isNew ? undefined : race}
          onCancel={() => (isNew ? onClose() : onModeChange('view'))}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}

function ViewMode({
  race, onEdit, onDeleted,
}: {
  race: Race
  onEdit: () => void
  onDeleted: () => void
}) {
  const qc = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const remove = useMutation({
    mutationFn: () => racesApi.delete(race.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['races'] })
      toast(`Prova excluída: ${race.name}`)
      onDeleted()
    },
    onError: () => toast.error('Não foi possível excluir a prova'),
  })

  const tier = useMutation({
    mutationFn: (t: RaceTier) => racesApi.setTier(race.id, t),
    onSuccess: (_, t) => {
      qc.invalidateQueries({ queryKey: ['races'] })
      toast(`Prioridade de ${race.name}: ${TIER_LABELS[t]}`)
    },
    onError: () => toast.error('Não foi possível alterar a prioridade'),
  })

  const status = useMutation({
    mutationFn: (s: RaceStatus) => racesApi.setStatus(race.id, s),
    onSuccess: (_, s) => {
      qc.invalidateQueries({ queryKey: ['races'] })
      toast(`Status de ${race.name}: ${STATUS_LABELS[s]}`)
    },
    onError: () => toast.error('Não foi possível alterar o status'),
  })

  const hasResult = (race.status === 'COMPLETED' || race.status === 'DNF') && !!race.resultTime
  const details: [string, string | null | undefined][] = [
    ['Distâncias', race.distances],
    ['Minha distância', race.myDistance],
    ['Terreno', race.terrain],
    ['Altimetria', race.elevation],
    ['Organizador', race.organizer],
    ['Fonte', race.source],
  ]

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
        <div className="space-y-1.5">
          <div className="eyebrow text-ink-500">Prioridade</div>
          <Segmented
            size="sm"
            label="Prioridade"
            value={race.tier}
            options={TIER_OPTIONS}
            onChange={(t) => t !== race.tier && tier.mutate(t)}
            className="max-w-full overflow-x-auto no-scrollbar"
          />
        </div>

        <div className="space-y-1.5">
          <div className="eyebrow text-ink-500">Status</div>
          <Select
            value={race.status}
            onChange={(e) => status.mutate(e.target.value as RaceStatus)}
            aria-label="Status"
          >
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>

        {hasResult && <ResultBlock race={race} />}

        <dl className="text-sm">
          {details
            .filter(([, v]) => !!v)
            .map(([k, v]) => (
              <div key={k} className="grid grid-cols-[120px_1fr] gap-3 py-2 border-b border-ink-100 last:border-b-0">
                <dt className="text-ink-500">{k}</dt>
                <dd className="text-ink-900 break-words">{v}</dd>
              </div>
            ))}
        </dl>

        {race.notes && (
          <div className="rounded-md bg-paper-2 px-3 py-2.5 text-sm text-ink-700 whitespace-pre-wrap">
            {race.notes}
          </div>
        )}
      </div>

      {confirmDelete ? (
        <footer className="shrink-0 border-t border-ink-100 bg-bordeaux-bg px-5 py-3 space-y-3">
          <p className="text-sm text-ink-900">
            Excluir <strong className="font-semibold">{race.name}</strong>? Isso remove a prova e o resultado, e não pode ser desfeito.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="destructive" onClick={() => remove.mutate()} disabled={remove.isPending}>
              <Trash2 className="w-4 h-4" />
              {remove.isPending ? 'Excluindo' : 'Excluir'}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={remove.isPending}>
              Cancelar
            </Button>
          </div>
        </footer>
      ) : (
        <footer className="shrink-0 flex items-center gap-4 border-t border-ink-100 px-5 py-3">
          <Button variant="secondary" onClick={onEdit}>
            <Pencil className="w-4 h-4" />
            Editar
          </Button>
          {race.website && (
            <a href={race.website} target="_blank" rel="noreferrer" className="text-sm font-medium">
              Site oficial →
            </a>
          )}
          <Button variant="ghost" size="icon" className="ml-auto text-bordeaux hover:bg-bordeaux-bg" onClick={() => setConfirmDelete(true)} aria-label="Excluir prova" title="Excluir prova">
            <Trash2 className="w-4 h-4" />
          </Button>
        </footer>
      )}
    </>
  )
}

function ResultBlock({ race }: { race: Race }) {
  return (
    <div className="rounded-lg border border-ink-100 bg-paper p-4">
      <div className="eyebrow text-ink-500">Tempo líquido</div>
      <div className={cn('mt-1 text-[34px] font-semibold leading-none tabular', race.status === 'DNF' && 'text-bordeaux')}>
        {race.resultTime}
      </div>
      {(race.resultOverall || race.resultCategory) && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-ink-500">Geral</div>
            <div className="text-base font-semibold tabular">{race.resultOverall || '·'}</div>
          </div>
          <div>
            <div className="text-xs text-ink-500">
              Categoria{race.resultCategoryName ? ` ${race.resultCategoryName}` : ''}
            </div>
            <div className="text-base font-semibold tabular">{race.resultCategory || '·'}</div>
          </div>
        </div>
      )}
      {race.resultUrl && (
        <a href={race.resultUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium">
          Resultado oficial →
        </a>
      )}
    </div>
  )
}

const EMPTY: Partial<Race> = {
  name: '',
  date: '',
  city: '',
  state: 'RS',
  distances: '',
  type: 'CORRIDA',
  source: 'manual',
}

const NULLABLE_TEXT: (keyof Race)[] = [
  'terrain', 'organizer', 'website', 'myDistance', 'notes', 'elevation',
  'resultTime', 'resultOverall', 'resultCategory', 'resultCategoryName', 'resultUrl',
]

function EditMode({
  race, onCancel, onSaved,
}: {
  race?: Race
  onCancel: () => void
  onSaved: (r: Race) => void
}) {
  const qc = useQueryClient()
  const isEdit = !!race
  const [form, setForm] = useState<Partial<Race>>(race ? { ...race } : { ...EMPTY })
  const set = (field: keyof Race, value: string) => setForm((p) => ({ ...p, [field]: value }))
  const dateValue = (v?: string | null) => (v ? spDay(v) : '')

  const save = useMutation({
    mutationFn: () => {
      const payload: Partial<Race> = { ...form }
      for (const k of NULLABLE_TEXT) {
        if (payload[k] === '') (payload as Record<string, unknown>)[k] = null
      }
      if (!payload.dateEnd) delete payload.dateEnd
      return isEdit ? racesApi.update(race!.id, payload) : racesApi.create(payload)
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['races'] })
      toast(isEdit ? 'Alterações salvas' : 'Prova cadastrada')
      onSaved(res.data)
    },
    onError: () => toast.error('Erro ao salvar a prova'),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name?.trim() || !form.date || !form.city?.trim()) {
      toast.error('Preencha nome, data e cidade')
      return
    }
    save.mutate()
  }

  const showResult = race?.status === 'COMPLETED' || race?.status === 'DNF'

  return (
    <form onSubmit={submit} className="flex flex-1 min-h-0 flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
        <Field label="Nome">
          <Input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="Maratona de Porto Alegre" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data">
            <Input type="date" value={dateValue(form.date)} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Tipo">
            <Select value={form.type ?? 'CORRIDA'} onChange={(e) => set('type', e.target.value)}>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-[1fr_80px] gap-3">
          <Field label="Cidade">
            <Input value={form.city ?? ''} onChange={(e) => set('city', e.target.value)} placeholder="Porto Alegre" />
          </Field>
          <Field label="UF">
            <Select value={form.state ?? 'RS'} onChange={(e) => set('state', e.target.value)}>
              {BR_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Distâncias oferecidas" hint="Separe por vírgula">
          <Input value={form.distances ?? ''} onChange={(e) => set('distances', e.target.value)} placeholder="5 km, 10 km, 21 km, 42 km" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Minha distância">
            <Input value={form.myDistance ?? ''} onChange={(e) => set('myDistance', e.target.value)} placeholder="42 km" />
          </Field>
          <Field label="Altimetria">
            <Input value={form.elevation ?? ''} onChange={(e) => set('elevation', e.target.value)} placeholder="+120 m" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Terreno">
            <Input value={form.terrain ?? ''} onChange={(e) => set('terrain', e.target.value)} placeholder="Asfalto" />
          </Field>
          <Field label="Organizador">
            <Input value={form.organizer ?? ''} onChange={(e) => set('organizer', e.target.value)} />
          </Field>
        </div>
        <Field label="Site oficial">
          <Input type="url" value={form.website ?? ''} onChange={(e) => set('website', e.target.value)} placeholder="https://" />
        </Field>

        {showResult && (
          <fieldset className="space-y-3 rounded-lg border border-ink-100 bg-paper p-3">
            <legend className="eyebrow px-1 text-ink-500">Resultado</legend>
            <Field label="Tempo líquido" hint="h:mm:ss">
              <Input value={form.resultTime ?? ''} onChange={(e) => set('resultTime', e.target.value)} placeholder="3:29:14" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Geral">
                <Input value={form.resultOverall ?? ''} onChange={(e) => set('resultOverall', e.target.value)} placeholder="612º de 4.200" />
              </Field>
              <Field label="Categoria">
                <Input value={form.resultCategory ?? ''} onChange={(e) => set('resultCategory', e.target.value)} placeholder="98º de 610" />
              </Field>
            </div>
            <Field label="Nome da categoria">
              <Input value={form.resultCategoryName ?? ''} onChange={(e) => set('resultCategoryName', e.target.value)} placeholder="M 30-34" />
            </Field>
            <Field label="Link do resultado">
              <Input type="url" value={form.resultUrl ?? ''} onChange={(e) => set('resultUrl', e.target.value)} placeholder="https://" />
            </Field>
          </fieldset>
        )}

        <Field label="Notas">
          <Textarea rows={3} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>

      <footer className="shrink-0 flex items-center gap-2 border-t border-ink-100 px-5 py-3">
        <Button type="submit" disabled={save.isPending}>
          <Save className="w-4 h-4" />
          {save.isPending ? 'Salvando' : 'Salvar'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </footer>
    </form>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium leading-none text-ink-700">
        {label}
        {hint && <span className="ml-2 font-normal text-ink-500">{hint}</span>}
      </span>
      {children}
    </label>
  )
}
