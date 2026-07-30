import * as React from "react"

import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer"
import { cn } from "../../lib/utils"
import { useIsMobile } from "../../hooks/use-mobile"

/**
 * A popover is `position: fixed` against its trigger, so on a phone it routinely
 * lands below the fold with no way to reach it -- fixed elements don't move when
 * the scroll container behind them scrolls, and panels that opt out of collision
 * flipping (`avoidCollisions={false}`, used to fuse a panel to its trigger) can't
 * even flip upward to save themselves. Under Capacitor the soft keyboard makes it
 * worse: the web view resizes and the panel is pushed further out of view.
 *
 * A bottom sheet is anchored to the viewport's bottom edge instead -- which is the
 * top of the keyboard when one is up -- so its content is always reachable.
 *
 * Nested above `BaseSlider` (panel `z-[80]`, overlay `z-[75]`) and the default
 * popover layer (`z-[100]`), matching the precedent in `SortSelect`.
 */
const DRAWER_CONTENT_Z = "!z-[100]"
const DRAWER_OVERLAY_Z = "!z-[95]"

/**
 * Park focus on the panel itself rather than suppressing it: leaving focus on the
 * trigger is worse than useless, because Radix puts the trigger inside an
 * `aria-hidden` subtree while the sheet is open, hiding the focused element from
 * assistive tech. Keeping focus off the first field also means the soft keyboard
 * only appears if the user actually taps a search input.
 */
function parkFocusOnPanel(event: { preventDefault: () => void; currentTarget: EventTarget | null }) {
  event.preventDefault()
  ;(event.currentTarget as HTMLElement | null)?.focus?.()
}

export interface SelectDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Rendered as the sheet's trigger; must accept a ref (`asChild`). */
  trigger: React.ReactNode
  children: React.ReactNode
  /** Visible sheet heading, and the dialog's accessible name. */
  title: string
  /** Screen-reader-only description; defaults to `title`. */
  description?: string
  className?: string
  /** Class for the scrolling sheet body. */
  bodyClassName?: string
}

/**
 * Bottom sheet shell for a select-like control. Use directly when the desktop
 * affordance is not a popover (e.g. a panel that expands inline under the
 * trigger); otherwise prefer {@link ResponsivePopover}.
 */
export function SelectDrawer({
  open,
  onOpenChange,
  trigger,
  children,
  title,
  description,
  className,
  bodyClassName,
}: SelectDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent
        className={cn(
          "flex max-h-[85dvh] flex-col border-border bg-white dark:bg-surface",
          DRAWER_CONTENT_Z,
          className
        )}
        overlayClassName={DRAWER_OVERLAY_Z}
        tabIndex={-1}
        onOpenAutoFocus={parkFocusOnPanel}
      >
        <DrawerHeader className="shrink-0 pb-1 text-left">
          <DrawerTitle className="text-foreground-1">{title}</DrawerTitle>
          <DrawerDescription className="sr-only">{description ?? title}</DrawerDescription>
        </DrawerHeader>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(0.5rem+env(safe-area-inset-bottom))]",
            bodyClassName
          )}
        >
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

type PopoverContentProps = React.ComponentProps<typeof PopoverContent>

export interface ResponsivePopoverProps
  extends Omit<SelectDrawerProps, "className" | "bodyClassName"> {
  /** Class for the desktop popover panel. */
  contentClassName?: string
  /** Class for the mobile sheet panel. */
  drawerClassName?: string
  /** Class for the scrolling mobile sheet body. */
  drawerBodyClassName?: string
  align?: PopoverContentProps["align"]
  side?: PopoverContentProps["side"]
  sideOffset?: PopoverContentProps["sideOffset"]
  avoidCollisions?: PopoverContentProps["avoidCollisions"]
  collisionPadding?: PopoverContentProps["collisionPadding"]
}

/**
 * Popover on desktop, bottom sheet on mobile, with the same children in both.
 *
 * Callers that restyle their trigger while open (e.g. fusing its bottom border to
 * an attached panel) should gate that styling on `!useIsMobile()` -- there is no
 * attached panel in the sheet form.
 */
export function ResponsivePopover({
  open,
  onOpenChange,
  trigger,
  children,
  title,
  description,
  contentClassName,
  drawerClassName,
  drawerBodyClassName,
  align = "start",
  side = "bottom",
  sideOffset,
  avoidCollisions,
  collisionPadding,
}: ResponsivePopoverProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <SelectDrawer
        open={open}
        onOpenChange={onOpenChange}
        trigger={trigger}
        title={title}
        description={description}
        className={drawerClassName}
        bodyClassName={drawerBodyClassName}
      >
        {children}
      </SelectDrawer>
    )
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className={contentClassName}
        align={align}
        side={side}
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        collisionPadding={collisionPadding}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

export default ResponsivePopover
