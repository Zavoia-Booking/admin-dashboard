import * as React from "react";
import { useLayoutEffect } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { useIsMobile } from "../../hooks/use-mobile";

export interface ResponsiveTabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  content: React.ReactNode;
}

interface ResponsiveTabsProps {
  items: ResponsiveTabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  tabsClassName?: string;
  contentClassName?: string;
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
  const [internalValue, setInternalValue] = React.useState(
    defaultValue || items[0]?.id || ""
  );
  const value = controlledValue ?? internalValue;
  const isMobile = useIsMobile();
  const setValue = React.useCallback(
    (newValue: string) => {
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [controlledValue, onValueChange]
  );

  const tabsListRef = React.useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = React.useState<{
    left: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!tabsListRef.current) return;

    const activeButton = tabsListRef.current.querySelector<HTMLButtonElement>(
      `[data-tab-id="${value}"]`
    );

    if (!activeButton) return;

    const containerRect = tabsListRef.current.getBoundingClientRect();
    const rect = activeButton.getBoundingClientRect();

    setIndicatorStyle({
      left: rect.left - containerRect.left,
      width: rect.width,
    });
  }, [value, items.length, isMobile]);

  const activeTab = items.find((item) => item.id === value);
  const activeContent = activeTab?.content;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Tabs */}
      <div
        className={cn(
          "mb-4 w-full",
          !isMobile && "border-b border-border-strong"
        )}
      >
        <div
          ref={tabsListRef}
          className={cn(
            "relative flex w-full items-stretch",
            isMobile ? "gap-1 rounded-full bg-muted p-1" : "gap-4",
            tabsClassName
          )}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = value === item.id;

            return (
              <button
                key={item.id}
                data-tab-id={item.id}
                onClick={() => setValue(item.id)}
                className={cn(
                  "relative z-10 flex items-center justify-center gap-2 text-xs font-medium cursor-pointer transition-colors",
                  isMobile
                    ? "flex-1 rounded-full px-1.5 py-1.5"
                    : "flex-none rounded-none px-4 py-2 text-sm",
                  isActive
                    ? "text-foreground"
                    : "text-foreground-3 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  {/* {Icon && !isMobile && <Icon className="h-4 w-4" />} */}
                  <span className="text-sm md:text-lg ">{item.label}</span>
                </div>
              </button>
            );
          })}

          {/* Animated mobile pill indicator */}
          {isMobile && indicatorStyle && (
            <span
              className="pointer-events-none absolute inset-y-1 block rounded-full bg-sidebar shadow-sm transition-all duration-300 ease-out"
              style={{
                width: `${Math.max(0, indicatorStyle.width - 2)}px`,
                transform: `translateX(${indicatorStyle.left - 3}px)`,
              }}
            />
          )}

          {/* Animated underline indicator on desktop */}
          {!isMobile && indicatorStyle && (
            <span
              className="pointer-events-none absolute -bottom-[1px] h-0.5 rounded-full bg-primary transition-all duration-300 ease-out"
              style={{
                width: `${indicatorStyle.width}px`,
                transform: `translateX(${indicatorStyle.left}px)`,
              }}
            />
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeContent && (
        <div className={cn("outline-none", contentClassName)}>
          {activeContent}
        </div>
      )}
    </div>
  );
}
