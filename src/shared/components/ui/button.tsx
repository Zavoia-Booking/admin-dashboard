import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { Spinner } from "./spinner"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none cursor-pointer focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:!transition-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-xs hover:bg-primary-hover hover:text-white",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-border bg-surface-hover text-foreground-1 shadow-xs hover:bg-surface-active hover:border-border-strong",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary-hover",
        ghost:
          "hover:bg-surface-hover hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        info:
          "border border-blue-500 bg-transparent text-blue-600 shadow-xs hover:bg-blue-50 hover:border-blue-600 focus-visible:ring-blue-500/20",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3 [&_svg:not([class*='size-'])]:size-4",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-10 px-6 has-[>svg]:px-4 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-9 [&_svg:not([class*='size-'])]:size-5",
      },
      rounded: {
        default: "rounded-md",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  rounded,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Show the app Spinner in place of the label and disable the button. Never render loading text. */
    loading?: boolean
  }) {
  const Comp = asChild ? Slot : "button"
  // Filled variants have white labels; everything else sits on a light surface.
  const spinnerColor = variant === "default" || variant === "destructive" ? "white" : "default"
  // Slot requires a single child, so skip injection when asChild.
  const showSpinner = loading && !asChild

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, rounded, className }))}
      disabled={asChild ? disabled : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {showSpinner ? <Spinner size="sm" color={spinnerColor} /> : children}
    </Comp>
  )
}

export { Button, buttonVariants }
