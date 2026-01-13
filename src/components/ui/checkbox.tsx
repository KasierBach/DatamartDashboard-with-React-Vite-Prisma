import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, checked, onCheckedChange, ...props }, ref) => {
        return (
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    ref={ref}
                    checked={checked}
                    onChange={(e) => onCheckedChange?.(e.target.checked)}
                    className="sr-only peer"
                    {...props}
                />
                <div
                    className={cn(
                        "h-4 w-4 shrink-0 rounded-sm border border-primary shadow",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                        "peer-checked:bg-primary peer-checked:text-primary-foreground",
                        "flex items-center justify-center",
                        className
                    )}
                >
                    {checked && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
            </label>
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
