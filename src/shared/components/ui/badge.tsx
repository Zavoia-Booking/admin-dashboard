import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "filter";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default:
      "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary:
      "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive:
      "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground",
    // Softer, neutral pill variant – useful for filter chips, etc.
    filter:
      "border-border px-3 py-1.5 bg-surface-hover text-foreground-2 hover:bg-info-100 dark:hover:bg-neutral-800",
  }

  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantClasses[variant],
        className
      )} 
      {...props} 
    />
  )
}

export { Badge } 