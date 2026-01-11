import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "../../lib/utils"

function Switch({
  className,
  onCheckedChange,
  onKeyDown,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Enter key for accessibility (Space is handled by Radix UI by default)
    if (e.key === "Enter" && !props.disabled) {
      e.preventDefault();
      e.stopPropagation();
      // Trigger a click to toggle the switch - Radix UI will handle state changes
      // This works for both controlled and uncontrolled components
      const target = e.currentTarget as HTMLElement;
      target.click();
    }
    // Call any additional onKeyDown handler
    if (onKeyDown) {
      onKeyDown(e as React.KeyboardEvent<HTMLButtonElement>);
    }
  };

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-border-strong focus-visible:border-focus focus-visible:ring-focus/50 dark:data-[state=unchecked]:bg-surface-hover inline-flex !h-5 !w-9 !min-h-0 !min-w-0 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        className
      )}
      onKeyDown={handleKeyDown}
      onCheckedChange={onCheckedChange}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-surface dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
