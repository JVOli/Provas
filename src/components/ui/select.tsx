import { cn } from '@/lib/utils'
import { SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { wrapperClassName?: string }
>(({ className, wrapperClassName, children, ...props }, ref) => (
  <div className={cn('relative', wrapperClassName)}>
    <select
      ref={ref}
      className={cn(
        'flex h-9 w-full appearance-none rounded-md border border-input bg-white pl-3 pr-8 py-1 text-sm text-ink-900',
        'focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-signal',
        'disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-[120ms]',
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-500" />
  </div>
))
Select.displayName = 'Select'

export { Select }
