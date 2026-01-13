"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, checked, disabled, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked)
      props.onChange?.(e)
    }

    const handleClick = () => {
      if (disabled) return
      onCheckedChange?.(!checked)
    }

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref}
          className="sr-only"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          {...props}
        />
        <div
          onClick={handleClick}
          className={cn(
            "h-4 w-4 shrink-0 rounded-sm border border-gray-300 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 cursor-pointer transition-colors",
            checked && "bg-primary-red border-primary-red text-white",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          {checked && (
            <Check className="h-3 w-3 text-white mx-auto" />
          )}
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }