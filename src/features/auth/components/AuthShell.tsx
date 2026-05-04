import type { ReactNode } from "react"
import { cn } from "../../../shared/lib/utils"

type AuthShellProps = {
  children: ReactNode
  maxWidthClass?: string
  className?: string
}

export function AuthShell({
  children,
  maxWidthClass = "max-w-sm md:max-w-250",
  className,
}: AuthShellProps) {
  return (
    <div
      className={cn(
        "bg-base flex min-h-svh flex-col items-center justify-center p-4",
        className,
      )}
    >
      <div className={cn("w-full flex flex-col items-center gap-6 md:gap-0", maxWidthClass)}>
        {children}
      </div>
    </div>
  )
}
