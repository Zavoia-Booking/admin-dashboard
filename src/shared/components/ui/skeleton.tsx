import { cn } from "../../lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-border rounded-md relative overflow-hidden skeleton-shimmer",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
