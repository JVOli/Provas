import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

const badgeVariants = cva(
  'inline-flex items-center h-5 rounded-full px-2 text-2xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-navy-800 text-white',
        outline: 'bg-white text-ink-500 border border-ink-100',
        positive: 'bg-forest-bg text-forest',
        negative: 'bg-bordeaux-bg text-bordeaux',
        warning: 'bg-mostarda-bg text-mostarda',
        neutral: 'bg-mist text-ink-700',
        info: 'bg-signal-100 text-signal-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
