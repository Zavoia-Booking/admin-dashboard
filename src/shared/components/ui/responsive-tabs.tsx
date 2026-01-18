import * as React from "react";
import { useLayoutEffect } from "react";
import { type LucideIcon, Info } from "lucide-react";
import { cn } from "../../lib/utils";
import { useIsMobile } from "../../hooks/use-mobile";

export interface ResponsiveTabItem {
  id: string;
  label: string;
  mobileLabel?: string;
  icon?: LucideIcon;
  content: React.ReactNode;
  showBadge?: boolean;
}

interface ResponsiveTabsProps {
  items: ResponsiveTabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  tabsClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  rightContent?: React.ReactNode;
  stickyHeader?: boolean;
}

export function ResponsiveTabs({
  items,
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  tabsClassName,
  contentClassName,
  headerClassName,
  rightContent,
  stickyHeader = false,
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


  return (
    <div className={cn(
      "space-y-6 bg-transparent max-w-256",
      // CSS-based responsive positioning to prevent layout shift:
      // Mobile (<md): negative margin to break out of parent padding and span full width
      // Desktop (md+): absolute positioning for layout
      "-mx-2 -mt-8 md:mx-0 md:mt-0 md:absolute md:top-0 md:left-0 md:right-0",
      className
    )}>
      {/* Tabs Header */}
      <div
        className={cn(
          // Base + responsive sizing (CSS-based to prevent layout shift)
          "w-full transition-all duration-300",
          "h-[68px] md:h-[61px]",
          "p-0 pt-4.5 px-4 md:pt-4 md:pl-4 md:pr-4",
          // Sticky behavior
          stickyHeader && "sticky z-40 md:z-50 bg-surface md:bg-gradient-to-r md:from-background md:from-24% md:to-transparent backdrop-blur-xl",
          // Mobile: below breadcrumbs; Desktop: at top
          stickyHeader && "top-11 md:top-0",
          // Desktop border
          "md:border-b md:border-border-strong",
          headerClassName
        )}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-0">
          <div
            ref={tabsListRef}
            className={cn(
              "relative flex items-stretch",
              // CSS-based responsive: mobile pill style, desktop text style
              "w-full md:w-auto gap-1 md:gap-4 rounded-full md:rounded-none bg-sidebar md:bg-transparent p-1 md:p-0 h-10 md:h-auto",
              tabsClassName
            )}
          >
            {items.map((item) => {
              const isActive = value === item.id;

              return (
                <button
                  key={item.id}
                  data-tab-id={item.id}
                  onClick={() => setValue(item.id)}
                  className={cn(
                    "relative z-10 flex items-center !pt-0 justify-center gap-2 text-xs font-medium transition-colors",
                    // CSS-based responsive button styling
                    "flex-1 md:flex-none rounded-full md:rounded-none px-1.5 md:px-4 py-1.5 md:py-2 -mt-[2px] md:mt-0 md:text-sm",
                    isActive
                      ? "text-foreground cursor-default"
                      : "text-foreground-2 hover:text-foreground cursor-pointer"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm md:text-lg relative">
                      {isMobile && item.mobileLabel ? item.mobileLabel : item.label}
                      {item.showBadge && (
                        <span className="absolute -top-1.5 -right-3.5 flex h-3.5 w-3.5">
                          <span 
                            className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-20"
                            style={{ animationDuration: '3s' }}
                          ></span>
                          <Info className="relative inline-flex h-3.5 w-3.5 text-primary" />
                        </span>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Animated mobile pill indicator */}
            {isMobile && indicatorStyle && (
              <span
                className="pointer-events-none absolute inset-y-1 block rounded-full bg-surface shadow-sm transition-all duration-300 ease-out"
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

          {rightContent && (
            <div className="absolute md:static -top-8.5 md:top-auto right-4 md:right-auto w-1/2 sm:w-auto flex justify-end items-center">
              {rightContent}
            </div>
          )}
        </div>
      </div>

      {/* Tab Content - Keep all tabs mounted but hidden to prevent remounting */}
      <div
        className={cn("outline-none pl-4 pr-4 md:pr-0", contentClassName)}
      >
        {items.map((item) => {
          const isActive = value === item.id;
          return (
            <div
              key={item.id}
              className={cn(
                isActive ? "block" : "hidden"
              )}
            >
              {item.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
