import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary CTA - Brand red with white text (high contrast)
        default:
          "bg-primary-red text-white shadow-md hover:bg-primary-red-dark hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        // Destructive - Red for dangerous actions
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md active:scale-[0.98]",
        // Outline/Secondary - White bg with brand red border, fills on hover
        outline:
          "border-2 border-primary-red bg-white text-primary-red shadow-sm hover:bg-primary-red hover:text-white hover:shadow-md active:scale-[0.98]",
        // Secondary - Subtle gray background
        secondary:
          "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 hover:shadow active:scale-[0.98]",
        // Ghost - No background, subtle hover
        ghost:
          "text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200",
        // Link - Underlined text style
        link:
          "text-primary-red underline-offset-4 hover:underline hover:text-primary-red-dark",
        // Success variant for confirmations
        success:
          "bg-green-600 text-white shadow-sm hover:bg-green-700 hover:shadow-md active:scale-[0.98]",
        // Warning variant
        warning:
          "bg-amber-500 text-white shadow-sm hover:bg-amber-600 hover:shadow-md active:scale-[0.98]",
        // Dark variant for contrast sections
        dark:
          "bg-gray-900 text-white shadow-sm hover:bg-gray-800 hover:shadow-md active:scale-[0.98]",
        // Subtle outline with gray
        "outline-gray":
          "border-2 border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
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
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
