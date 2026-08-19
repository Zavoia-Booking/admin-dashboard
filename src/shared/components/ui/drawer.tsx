"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "../../lib/utils"
import appConfig from "../../../app/config/env"
import { useKeyboardVisible } from "../../hooks/useKeyboardVisible"
import { ignoreToastPointerDown } from "../../lib/toastInteraction"

/**
 * vaul compensates for the soft keyboard by rewriting the drawer's inline
 * height, sizing it from `window.innerHeight - visualViewport.height` and
 * caching the pre-keyboard height to restore later. Both only hold on the web,
 * where the keyboard shrinks the visual viewport alone. Under Capacitor the
 * native layer resizes the whole web view, so the two heights move together and
 * the cached baseline can be captured mid-resize -- after which every "restore"
 * writes back a too-small height and the drawer is left stranded at part size.
 *
 * Native builds therefore let the web view resize do the work by itself, with
 * drawer height coming from CSS (dvh) so nothing is cached to go stale. Pass
 * `repositionInputs` explicitly to override this per drawer.
 */
/**
 * On Safari and every iOS browser, vaul pins `body` with `position: fixed` and a
 * negative `top` while a drawer is open, which drops the document's real scroll
 * offset to 0. On close it restores those styles and then calls `window.scrollTo`
 * inside a requestAnimationFrame to put you back. Our global
 * `html { scroll-behavior: smooth }` turns that restore into an animation, so the
 * page sits at the top for a moment and then visibly glides back down.
 *
 * vaul already forces `scroll-behavior: auto` while the drawer is open, but it
 * releases it in the effect cleanup -- one frame before that scrollTo runs. So
 * the window that actually needs covering starts at close, not at open.
 *
 * This is done with a class rather than an inline style on purpose: vaul's own
 * set/reset helpers cache the previous *inline* value, so writing inline here
 * would make vaul cache our value and restore it forever. A class is invisible to
 * that bookkeeping. Refcounted so nested drawers don't release it early.
 */
const INSTANT_SCROLL_CLASS = "drawer-instant-scroll"
let instantScrollHolds = 0
let instantScrollRelease: number | null = null

function holdInstantScroll() {
  if (typeof document === "undefined") return
  if (instantScrollRelease !== null) {
    window.clearTimeout(instantScrollRelease)
    instantScrollRelease = null
  }
  instantScrollHolds += 1
  document.documentElement.classList.add(INSTANT_SCROLL_CLASS)
}

function releaseInstantScroll() {
  if (typeof document === "undefined") return
  instantScrollHolds = Math.max(0, instantScrollHolds - 1)
  if (instantScrollHolds > 0) return
  if (instantScrollRelease !== null) window.clearTimeout(instantScrollRelease)
  instantScrollRelease = window.setTimeout(() => {
    instantScrollRelease = null
    if (instantScrollHolds !== 0) return
    document.documentElement.classList.remove(INSTANT_SCROLL_CLASS)
  }, 300)
}

function Drawer({
  repositionInputs,
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  // Track the open state for both controlled and uncontrolled callers: a parent
  // closing a drawer by flipping `open` never fires onOpenChange, and an
  // uncontrolled drawer never passes `open` at all.
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(!!defaultOpen)
  const isOpen = open ?? uncontrolledOpen

  React.useEffect(() => {
    if (!isOpen) return
    holdInstantScroll()
    return releaseInstantScroll
  }, [isOpen])

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (open === undefined) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [open, onOpenChange]
  )

  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      repositionInputs={repositionInputs ?? !appConfig.IS_NATIVE}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={handleOpenChange}
      {...props}
    />
  )
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

/**
 * Chromium hands a touch to native scrolling the moment it starts inside a scroll
 * container -- even at scrollTop 0 with nothing to scroll -- and cancels the pointer
 * stream vaul drags the sheet with. Bodies that overflow could therefore only be
 * dragged closed from the handle, and only by luck from the content (vaul saw 1-2
 * moves before the cancel). `pan-down` at the top keeps finger-down gestures for
 * the sheet while finger-up still scrolls natively; once scrolled, `pan-y` gives
 * the whole gesture back to the scroller. Safari ignores `pan-down`, so iOS is
 * unchanged. Purely horizontal scrollers are left alone.
 */
function useSheetScrollTouchAction(root: HTMLElement | null) {
  React.useEffect(() => {
    if (!root || root.getAttribute("data-vaul-drawer-direction") !== "bottom") return

    const apply = (el: HTMLElement) => {
      const horizontal = el.scrollWidth > el.clientWidth ? "pan-x " : ""
      el.style.touchAction = horizontal + (el.scrollTop <= 0 ? "pan-down" : "pan-y")
    }
    const isVerticalScroller = (el: HTMLElement) => {
      if (el.scrollHeight <= el.clientHeight) return false
      const overflowY = getComputedStyle(el).overflowY
      return overflowY === "auto" || overflowY === "scroll"
    }
    const scan = () => {
      root.querySelectorAll<HTMLElement>("*").forEach((el) => {
        if (isVerticalScroller(el)) apply(el)
      })
    }
    const onScroll = (e: Event) => {
      const el = e.target
      if (el instanceof HTMLElement && el !== root && root.contains(el)) apply(el)
    }

    let frame = 0
    const schedule = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(scan)
    }
    schedule()
    root.addEventListener("scroll", onScroll, { capture: true, passive: true })
    const mutations = new MutationObserver(schedule)
    mutations.observe(root, { childList: true, subtree: true })
    const resizes = new ResizeObserver(schedule)
    resizes.observe(root)

    return () => {
      window.cancelAnimationFrame(frame)
      mutations.disconnect()
      resizes.disconnect()
      root.removeEventListener("scroll", onScroll, { capture: true })
    }
  }, [root])
}

function DrawerContent({
  className,
  overlayClassName,
  children,
  ref,
  onPointerDownOutside,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {
  overlayClassName?: string;
}) {
  // State, not a ref: the content mounts inside a Radix Portal one commit later
  // than this component, so a ref is still null when a mount effect would run.
  const [contentEl, setContentEl] = React.useState<HTMLDivElement | null>(null)
  useSheetScrollTouchAction(contentEl)
  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      setContentEl(node)
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )

  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay className={overlayClassName} />
      <DrawerPrimitive.Content
        ref={setRef}
        data-slot="drawer-content"
        onPointerDownOutside={ignoreToastPointerDown(onPointerDownOutside)}
        className={cn(
          "group/drawer-content bg-background fixed z-50 flex h-auto flex-col",
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[85vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[85vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
          className
        )}
        {...props}
      >
        <DrawerPrimitive.Handle className="bg-border-strong dark:bg-neutral-500 mx-auto mt-4 !hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:!block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  // Native keyboard covers the footer (like the bottom nav) instead of pushing it up.
  const keyboardVisible = useKeyboardVisible()
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", keyboardVisible && "hidden", className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
