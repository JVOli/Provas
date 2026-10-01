import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm text-ink-700 whitespace-nowrap">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors duration-[180ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          checked ? 'bg-signal' : 'bg-mist-2'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-xs transition-transform duration-[180ms]',
            checked && 'translate-x-4'
          )}
        />
      </button>
      {label}
    </label>
  )
}
