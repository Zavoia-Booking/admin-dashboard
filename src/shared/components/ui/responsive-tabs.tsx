import * as React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "../../lib/utils"

export interface ResponsiveTabItem {
  id: string
  label: string
  icon?: LucideIcon
  content: React.ReactNode
}

interface ResponsiveTabsProps {
  items: ResponsiveTabItem[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  tabsClassName?: string
  contentClassName?: string
}

export function ResponsiveTabs({
  items,
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  tabsClassName,
  contentClassName,
}: ResponsiveTabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || items[0]?.id || "")
  const value = controlledValue ?? internalValue
  const setValue = React.useCallback(
    (newValue: string) => {
      if (controlledValue === undefined) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
    },
    [controlledValue, onValueChange]
  )

  const activeTab = items.find((item) => item.id === value)
  const activeContent = activeTab?.content

  return (
    <div className={cn("space-y-6", className)}>
      {/* Tabs */}
      <div
        className={cn(
          "flex flex-col md:flex-row gap-2 md:gap-2 md:border-b",
          tabsClassName
        )}
      >
        {items.map((item) => {
          const Icon = item.icon
          const isActive = value === item.id

          return (
            <button
              key={item.id}
              onClick={() => setValue(item.id)}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-3 md:px-4 md:py-2 rounded-lg md:rounded-none border md:border-0 md:border-b-2 transition-colors cursor-pointer",
                isActive
                  ? "bg-primary/10 md:bg-transparent border-primary md:border-primary text-primary"
                  : "bg-card md:bg-transparent border-border md:border-b-transparent hover:bg-muted/50 md:hover:bg-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 md:hidden text-muted-foreground" />
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeContent && (
        <div className={cn("outline-none", contentClassName)}>{activeContent}</div>
      )}
    </div>
  )
}

