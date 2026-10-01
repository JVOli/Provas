import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterOption {
  value: string
  label: string
}

interface MultiFilterProps {
  title: string
  allLabel: string
  pluralLabel: string
  options: FilterOption[]
  /** Valores em destaque visual (ex.: estados prioritários). */
  highlight?: string[]
  value: string[]
  onChange: (v: string[]) => void
  className?: string
}

export function MultiFilter({
  title, allLabel, pluralLabel, options, highlight = [], value, onChange, className,
}: MultiFilterProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])

  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v
  const label =
    value.length === 0
      ? allLabel
      : value.length <= 2
        ? value.map(labelOf).join(', ')
        : `${value.length} ${pluralLabel}`

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-white pl-3 pr-2.5 text-sm text-ink-900 transition-colors duration-[120ms] focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-signal',
          value.length > 0 ? 'border-signal' : 'border-input'
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-500" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-[280px] max-w-[calc(100vw-32px)] rounded-lg border border-ink-100 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="eyebrow text-ink-500">{title}</span>
            {value.length > 0 && (
              <button type="button" onClick={() => onChange([])} className="text-xs font-medium text-signal hover:text-signal-700">
                Limpar
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {options.map((o) => {
              const active = value.includes(o.value)
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(o.value)}
                  className={cn(
                    'inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors duration-[120ms]',
                    active
                      ? 'border-signal bg-signal-100 text-signal-700'
                      : highlight.includes(o.value)
                        ? 'border-navy-200 bg-white text-navy-800 hover:bg-hover'
                        : 'border-ink-100 bg-white text-ink-700 hover:bg-hover'
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                  {o.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
