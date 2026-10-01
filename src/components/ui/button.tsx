import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 text-sm whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-navy-800 text-white hover:bg-navy-700',
        destructive: 'bg-bordeaux text-white hover:bg-bordeaux/90',
        outline: 'border border-input bg-white text-navy-800 hover:bg-hover',
        secondary: 'border border-navy-200 bg-white text-navy-800 hover:bg-hover',
        ghost: 'text-ink-700 hover:bg-hover',
        link: 'text-signal underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4',
        sm: 'h-7 px-3 text-xs',
        lg: 'h-11 px-6',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
