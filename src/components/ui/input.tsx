import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm text-ink-900 placeholder:text-ink-300',
      'focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-signal',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-colors duration-[120ms]',
      className
    )}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }
