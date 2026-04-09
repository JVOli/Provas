import { cn } from '@/lib/utils'
import { LabelHTMLAttributes } from 'react'

function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-sm font-medium text-foreground/80 leading-none', className)}
      {...props}
    />
  )
}

export { Label }
