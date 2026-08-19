import { useEffect, useRef, type ReactNode } from "react"
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
  const scrimRef = useRef<HTMLDivElement>(null)

  // Keep the scrim glued to the VISIBLE top. position:fixed binds to the
  // layout viewport; when the keyboard opens and the WebView pans the visual
  // viewport down to reveal the focused input, fixed top elements slide
  // off-screen. Translating by visualViewport.offsetTop re-anchors it.
  useEffect(() => {
    const vv = window.visualViewport
    const scrim = scrimRef.current
    if (!vv || !scrim) return
    const sync = () => {
      scrim.style.transform = `translateY(${vv.offsetTop}px)`
    }
    sync()
    vv.addEventListener("scroll", sync)
    vv.addEventListener("resize", sync)
    return () => {
      vv.removeEventListener("scroll", sync)
      vv.removeEventListener("resize", sync)
    }
  }, [])

  return (
    <div
      className={cn(
        "bg-base flex min-h-svh flex-col items-center justify-center p-4",
        className,
      )}
      // Keep content clear of the native status bar / gesture bar; 0 on web.
      // --safe-area-top-stable (see shared/lib/safeArea.ts) instead of raw
      // env(): env() collapses to 0 while the Android keyboard is open.
      style={{
        paddingTop: "max(1rem, var(--safe-area-top-stable, env(safe-area-inset-top)))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      {/* Status-bar scrim: gives the transparent system bar a stable backdrop
       *  so scrolling content passes behind the clock/battery icons instead of
       *  colliding with them. Zero-height on web. Below the desktop controls
       *  cluster (z-50) and drawer overlays. */}
      <div
        ref={scrimRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-40 bg-base"
        style={{ height: "var(--safe-area-top-stable, env(safe-area-inset-top))" }}
      />
      <div className={cn("w-full flex flex-col items-center gap-6 md:gap-0", maxWidthClass)}>
        {children}
      </div>
    </div>
  )
}
