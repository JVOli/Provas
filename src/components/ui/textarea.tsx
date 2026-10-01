import { cn } from '@/lib/utils'
import { TextareaHTMLAttributes, forwardRef } from 'react'

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-ink-900',
        'placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-signal',
        'disabled:cursor-not-allowed disabled:opacity-50 resize-y transition-colors duration-[120ms]',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

export { Textarea }
