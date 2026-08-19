/**
 * Toasts are portaled outside every Radix layer, so a tap on a toast's Undo/close counts as a
 * pointer-down "outside" the open dialog/drawer and would dismiss it. Wrap a content's
 * onPointerDownOutside with this so toasts stay usable over modal layers.
 */
type OutsideEvent = { target: EventTarget | null; detail?: unknown; preventDefault: () => void }

export function isToastTarget(event: OutsideEvent): boolean {
  const original = (event.detail as { originalEvent?: Event } | undefined)?.originalEvent
  const target = (original?.target ?? event.target) as Element | null
  return !!target?.closest?.("[data-sonner-toaster]")
}

export function ignoreToastPointerDown<E extends OutsideEvent>(handler?: (event: E) => void) {
  return (event: E) => {
    if (isToastTarget(event)) {
      event.preventDefault()
      return
    }
    handler?.(event)
  }
}
