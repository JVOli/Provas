import { cn } from '@/lib/utils'

interface SegmentedProps<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  className?: string
  size?: 'sm' | 'md'
  label?: string
}

export function Segmented<T extends string>({
  value, options, onChange, className, size = 'md', label,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex items-center gap-0.5 rounded-lg bg-mist p-0.5 shrink-0', className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md font-medium whitespace-nowrap transition-colors duration-[120ms]',
            size === 'sm' ? 'h-7 px-3 text-xs' : 'h-8 px-3 text-sm',
            value === o.value
              ? 'bg-white text-navy-800 shadow-xs'
              : 'text-ink-700 hover:text-navy-800'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
