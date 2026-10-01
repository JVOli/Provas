import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { BR_STATES, PRIORITY_STATES, cn } from '@/lib/utils'

interface StateFilterProps {
  value: string[]
  onChange: (v: string[]) => void
  className?: string
}

const ORDERED = [...PRIORITY_STATES, ...BR_STATES.filter((s) => !PRIORITY_STATES.includes(s))]

export function StateFilter({ value, onChange, className }: StateFilterProps) {
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

  const toggle = (s: string) =>
    onChange(value.includes(s) ? value.filter((v) => v !== s) : [...value, s])

  const label =
    value.length === 0
      ? 'Todos os estados'
      : value.length <= 3
        ? value.join(', ')
        : `${value.length} estados`

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-white pl-3 pr-2.5 text-sm text-ink-900 transition-colors duration-[120ms] focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-signal"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-500" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-[260px] rounded-lg border border-ink-100 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="eyebrow text-ink-500">Estado</span>
            {value.length > 0 && (
              <button type="button" onClick={() => onChange([])} className="text-xs font-medium text-signal hover:text-signal-700">
                Limpar
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ORDERED.map((s) => {
              const active = value.includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(s)}
                  className={cn(
                    'inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors duration-[120ms]',
                    active
                      ? 'border-signal bg-signal-100 text-signal-700'
                      : PRIORITY_STATES.includes(s)
                        ? 'border-navy-200 bg-white text-navy-800 hover:bg-hover'
                        : 'border-ink-100 bg-white text-ink-700 hover:bg-hover'
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                  {s}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
