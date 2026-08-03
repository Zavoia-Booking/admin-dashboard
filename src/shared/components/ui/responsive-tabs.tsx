import * as React from "react";
import { useLayoutEffect } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { useIsMobile } from "../../hooks/use-mobile";
import { AttentionDot } from "../common/AttentionDot";
import { HeaderTitleSlot } from "../layouts/HeaderRightSlot";
import { APP_SCROLL_CONTAINER_ATTR } from "../../utils/scroll";

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
  /** Mobile only: project the pill switcher into the AppLayout breadcrumb header
   *  (replacing the page title) instead of rendering its own tab band. */
  mobileTabsInHeader?: boolean;
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
  mobileTabsInHeader = false,
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

  // Direction of the last tab change (±1), so the incoming panel slides in
  // from the side it "lives" on — matching the indicator's travel.
  const [prevValue, setPrevValue] = React.useState(value);
  const [panelDirection, setPanelDirection] = React.useState(0);
  if (prevValue !== value) {
    const oldIndex = items.findIndex((item) => item.id === prevValue);
    const newIndex = items.findIndex((item) => item.id === value);
    setPanelDirection(newIndex >= oldIndex ? 1 : -1);
    setPrevValue(value);
  }

  // Per-tab scroll memory. The offset is tracked live via a scroll listener
  // (reading it after the panel swap would see the shorter panel's clamped
  // value), and restored before paint on each switch — like native tab bars.
  const scrollMapRef = React.useRef<Record<string, number>>({});
  const scrollTabRef = React.useRef(value);
  React.useEffect(() => {
    const scroller = document.querySelector<HTMLElement>(
      `[${APP_SCROLL_CONTAINER_ATTR}]`
    );
    if (!scroller) return;
    const onScroll = () => {
      scrollMapRef.current[scrollTabRef.current] = scroller.scrollTop;
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);
  useLayoutEffect(() => {
    if (scrollTabRef.current === value) return;
    scrollTabRef.current = value;
    const scroller = document.querySelector<HTMLElement>(
      `[${APP_SCROLL_CONTAINER_ATTR}]`
    );
    if (!scroller) return;
    // Guarded: writing scrollTop here forces a synchronous layout of the panel
    // that just came out of display:none, and both tabs sitting at 0 is the
    // common case. Skip the write when there is nothing to move.
    const target = scrollMapRef.current[value] ?? 0;
    if (scroller.scrollTop !== target) scroller.scrollTop = target;
  }, [value]);

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
      "-mx-2 md:mx-0 md:absolute md:top-0 md:left-0 md:right-0",
      // The -mt-8 breakout compensates for the tab band's own top padding; without
      // a band (tabs live in the breadcrumb header) it would tuck content under it.
      mobileTabsInHeader ? "mt-0 md:mt-0" : "-mt-8 md:mt-0",
      className
    )}>
      {/* Mobile: pill switcher projected into the breadcrumb header title area */}
      {mobileTabsInHeader && isMobile && (
        <HeaderTitleSlot>
          <MobileHeaderTabs items={items} value={value} onSelect={setValue} />
        </HeaderTitleSlot>
      )}
      {/* Tabs Header */}
      <div
        className={cn(
          mobileTabsInHeader && "hidden md:block",
          // Base + responsive sizing (CSS-based to prevent layout shift)
          "w-full transition-all duration-300",
          "h-[68px] md:h-[61px]",
          "p-0 pt-4.5 px-4 md:pt-4 md:pl-4 md:pr-4",
          // Sticky behavior — solid theme-aware bg with subtle frosted-glass blur (no gradient seam)
          stickyHeader && "sticky z-40 md:z-50 bg-surface md:bg-base/85 backdrop-blur-xl",
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
                    <span className="text-sm md:text-lg">
                      {isMobile && item.mobileLabel ? item.mobileLabel : item.label}
                    </span>
                    {item.showBadge && <AttentionDot />}
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
      <div className={cn("outline-none pl-4 pr-4 md:pr-0", contentClassName)}>
        {items.map((item) => {
          const isActive = value === item.id;
          // display:none cancels CSS animations, so the entrance replays each
          // time a panel becomes visible — no keys or remounts needed.
          return (
            <div
              key={item.id}
              className={cn(
                isActive ? "block animate-tab-panel-in" : "hidden"
              )}
              style={
                isActive
                  ? ({
                      "--tab-shift": `${panelDirection * 16}px`,
                    } as React.CSSProperties)
                  : undefined
              }
            >
              {item.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The mobile pill switcher, self-contained so it can live in the breadcrumb
 *  header slot (it measures its own active-tab indicator where it mounts).
 *  h-9 keeps the header row at its usual 44px total height. */
function MobileHeaderTabs({
  items,
  value,
  onSelect,
}: {
  items: ResponsiveTabItem[];
  value: string;
  onSelect: (id: string) => void;
}) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = React.useState<{
    left: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!listRef.current) return;

    const activeButton = listRef.current.querySelector<HTMLButtonElement>(
      `[data-tab-id="${value}"]`
    );
    if (!activeButton) return;

    const containerRect = listRef.current.getBoundingClientRect();
    const rect = activeButton.getBoundingClientRect();
    setIndicator({
      left: rect.left - containerRect.left,
      width: rect.width,
    });
  }, [value, items.length]);

  return (
    <div
      ref={listRef}
      className="relative flex h-9 w-full items-stretch gap-1 rounded-full bg-sidebar p-1"
    >
      {items.map((item) => {
        const isActive = value === item.id;
        return (
          <button
            key={item.id}
            data-tab-id={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              // !min-* neutralize the global 44px touch-target rule, which would
              // overflow the h-9 track and push the labels off-center
              "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full px-1.5 !min-h-0 !min-w-0 py-0 text-xs font-medium transition-colors",
              isActive
                ? "text-foreground cursor-default"
                : "text-foreground-2 hover:text-foreground cursor-pointer"
            )}
          >
            <span className="text-sm">{item.mobileLabel ?? item.label}</span>
            {item.showBadge && <AttentionDot />}
          </button>
        );
      })}

      {indicator && (
        <span
          className="pointer-events-none absolute inset-y-1 block rounded-full bg-surface shadow-sm transition-all duration-300 ease-out"
          style={{
            width: `${Math.max(0, indicator.width - 2)}px`,
            transform: `translateX(${indicator.left - 3}px)`,
          }}
        />
      )}
    </div>
  );
}
