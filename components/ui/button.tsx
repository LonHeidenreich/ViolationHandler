import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-lg hover:shadow-xl",
        destructive:
          "bg-[var(--error)] text-white hover:bg-[var(--error)]/90 shadow-lg hover:shadow-xl",
        outline:
          "border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-panel)] hover:border-[var(--color-border-strong)]",
        secondary:
          "bg-[var(--color-panel-alt)] text-[var(--color-text)] hover:bg-[var(--color-panel)] border border-[var(--color-border)]",
        ghost: "hover:bg-[var(--color-panel)] hover:text-[var(--color-text)]",
        link: "text-[var(--accent)] underline-offset-4 hover:underline hover:translate-y-0",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
