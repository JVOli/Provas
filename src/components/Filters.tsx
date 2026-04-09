import { Search, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { cn, BR_STATES, PRIORITY_STATES, TYPE_LABELS, TIER_LABELS, STATUS_LABELS } from '@/lib/utils'
import { Input } from './ui/input'
import { Button } from './ui/button'

export interface FilterState {
  states: string[]
  types: string[]
  tiers: string[]
  statuses: string[]
  search: string
  from: string
  to: string
}

export const defaultFilters: FilterState = {
  states: [],
  types: [],
  tiers: [],
  statuses: [],
  search: '',
  from: '',
  to: '',
}

interface FiltersProps {
  filters: FilterState
  onChange: (f: FilterState) => void
}

export function Filters({ filters, onChange }: FiltersProps) {
  const [expanded, setExpanded] = useState(false)

  const toggle = (key: keyof FilterState, value: string) => {
    const arr = filters[key] as string[]
    onChange({
      ...filters,
      [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
    })
  }

  const hasActiveFilters =
    filters.states.length > 0 ||
    filters.types.length > 0 ||
    filters.tiers.length > 0 ||
    filters.statuses.length > 0 ||
    filters.search ||
    filters.from ||
    filters.to

  const activeCount =
    filters.states.length +
    filters.types.length +
    filters.tiers.length +
    filters.statuses.length +
    (filters.search ? 1 : 0) +
    (filters.from || filters.to ? 1 : 0)

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Top row — always visible */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cidade..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="pl-8 h-8"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors',
            expanded ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Filtros
          {activeCount > 0 && (
            <span className="bg-blue-500/30 text-blue-300 text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
              {activeCount}
            </span>
          )}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(defaultFilters)}
            className="text-xs text-muted-foreground"
          >
            <X className="w-3.5 h-3.5" />
            Limpar
          </Button>
        )}
      </div>

      {/* Expanded filter panel */}
      {expanded && (
        <div className="border-t border-border px-3 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* States */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Estado</p>
            <div className="flex flex-wrap gap-1">
              {PRIORITY_STATES.map((s) => (
                <FilterChip
                  key={s}
                  label={s}
                  active={filters.states.includes(s)}
                  onClick={() => toggle('states', s)}
                  highlight
                />
              ))}
              {BR_STATES.filter((s) => !PRIORITY_STATES.includes(s)).map((s) => (
                <FilterChip
                  key={s}
                  label={s}
                  active={filters.states.includes(s)}
                  onClick={() => toggle('states', s)}
                />
              ))}
            </div>
          </div>

          {/* Types */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Tipo</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <FilterChip
                  key={k}
                  label={v}
                  active={filters.types.includes(k)}
                  onClick={() => toggle('types', k)}
                />
              ))}
            </div>
          </div>

          {/* Tiers */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Prioridade</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(TIER_LABELS).map(([k, v]) => (
                <FilterChip
                  key={k}
                  label={v}
                  active={filters.tiers.includes(k)}
                  onClick={() => toggle('tiers', k)}
                />
              ))}
            </div>
          </div>

          {/* Status + Date range */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Status</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <FilterChip
                    key={k}
                    label={v}
                    active={filters.statuses.includes(k)}
                    onClick={() => toggle('statuses', k)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Período</p>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.from}
                  onChange={(e) => onChange({ ...filters, from: e.target.value })}
                  className="h-7 text-xs"
                  placeholder="De"
                />
                <Input
                  type="date"
                  value={filters.to}
                  onChange={(e) => onChange({ ...filters, to: e.target.value })}
                  className="h-7 text-xs"
                  placeholder="Até"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterChip({
  label, active, onClick, highlight,
}: {
  label: string
  active: boolean
  onClick: () => void
  highlight?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2 py-0.5 rounded text-xs font-medium transition-colors border',
        active
          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
          : highlight
          ? 'bg-muted/70 text-foreground border-border hover:border-blue-500/30'
          : 'bg-muted/30 text-muted-foreground border-border/50 hover:text-foreground hover:border-border'
      )}
    >
      {label}
    </button>
  )
}
