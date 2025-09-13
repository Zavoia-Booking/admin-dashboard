/**
 * Bouncing dots spinner component
 * 
 * Sizes: sm (32px), default (48px), lg (64px), xl (80px)
 * Colors: default, white, muted, destructive, success, warning, info
 * 
 * @example
 * <Spinner />                           // default size & color
 * <Spinner size="sm" color="muted" />    // small, muted
 * <Spinner size="lg" color="white" />    // large, white for dark backgrounds
 * <Spinner className="my-4" />          // with custom styling
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const spinnerVariants = cva(
  "flex justify-center items-center gap-1",
  {
    variants: {
      size: {
        sm: "w-8 h-6",
        default: "w-12 h-8", 
        lg: "w-16 h-10",
        xl: "w-20 h-12",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const dotVariants = cva(
  "rounded-full animate-bounce",
  {
    variants: {
      size: {
        sm: "w-2 h-2",
        default: "w-3 h-3",
        lg: "w-4 h-4", 
        xl: "w-5 h-5",
      },
      color: {
        default: "bg-primary",
        white: "bg-white",
        muted: "bg-muted-foreground",
        destructive: "bg-destructive",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        info: "bg-blue-500",
      },
    },
    defaultVariants: {
      size: "default",
      color: "default",
    },
  }
)

export interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof spinnerVariants> {
  color?: VariantProps<typeof dotVariants>["color"]
  dotClassName?: string
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, color = "default", dotClassName, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(spinnerVariants({ size }), className)}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <div 
          className={cn(
            dotVariants({ size, color }),
            "animate-[bounce_1.2s_ease-in-out_infinite]",
            dotClassName
          )} 
        />
        <div 
          className={cn(
            dotVariants({ size, color }),
            "animate-[bounce_1.2s_ease-in-out_0.15s_infinite]",
            dotClassName
          )} 
        />
        <div 
          className={cn(
            dotVariants({ size, color }),
            "animate-[bounce_1.2s_ease-in-out_0.3s_infinite]",
            dotClassName
          )} 
        />
        <span className="sr-only">Loading...</span>
      </div>
    )
  }
)
Spinner.displayName = "Spinner"

export { Spinner, spinnerVariants, dotVariants }
