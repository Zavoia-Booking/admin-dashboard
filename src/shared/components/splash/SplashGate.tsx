import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import { selectAuthStatus } from '../../../features/auth/selectors'
import { AuthStatusEnum } from '../../../features/auth/types'
import { isNativeApp } from '../../../app/config/env'
import { drawSplashFrame, type SplashPhase } from './splashCanvas'
import './splash.css'

const STORAGE_KEY = 'zv_splash_played'

const ENTER_MS = 3150
const EXIT_MS = 1350
const SAFETY_TIMEOUT_MS = 6000

/** Display size of the rendered splash mark, in CSS pixels. The canvas
 * itself is larger (full viewport) so the exit zoom-warp can expand
 * into the screen without being clipped at the canvas edges. */
const MARK_DISPLAY_PX = 380

export type { SplashPhase }

interface SplashGateProps {
  /** Skip the sessionStorage check, the preview-route bail-out, and the
   * sessionStorage write at the end. For dev/preview tools that drive the
   * splash imperatively. */
  bypass?: boolean
  /** Fires whenever the splash phase changes. Useful for HUDs in the
   * preview page; not used in production. */
  onPhaseChange?: (phase: SplashPhase) => void
}

export default function SplashGate({ bypass = false, onPhaseChange }: SplashGateProps = {}) {
  const [shouldRender] = useState(() => {
    if (bypass) return true
    if (typeof window === 'undefined') return false
    if (window.location.pathname.startsWith('/splash-preview')) return false
    // Native-only: skip on web/desktop. Capacitor's iOS/Android wrappers
    // are the intended audience for this animation; on desktop the app
    // boots directly into the dashboard.
    if (!isNativeApp()) return false
    return sessionStorage.getItem(STORAGE_KEY) !== '1'
  })

  const [phase, setPhase] = useState<SplashPhase>('entering')
  const [minHoldElapsed, setMinHoldElapsed] = useState(false)
  const [routesReady, setRoutesReady] = useState(false)
  const authStatus = useSelector(selectAuthStatus)
  // matchMedia query result. Read once on mount instead of every effect
  // run (i.e. every phase transition).
  const [reduceMotion] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const authReady =
    bypass ||
    (authStatus !== AuthStatusEnum.IDLE && authStatus !== AuthStatusEnum.LOADING)

  useEffect(() => {
    onPhaseChange?.(phase)
  }, [phase, onPhaseChange])

  // Preload the likely-first routes AND wait for them to finish.
  // Without the wait, on slow networks/devices the splash exits while
  // the lazy chunks are still being fetched, and Suspense flashes its
  // fallback Spinner. Splash now blocks its exit on `routesReady`, so
  // the user goes splash → app with no spinner in between.
  // The catch ensures we never hang the splash if a chunk fails — the
  // SAFETY_TIMEOUT_MS also covers this as a backstop.
  useEffect(() => {
    Promise.all([
      import('../../../features/auth/components/AuthLayout'),
      import('../../../features/auth/pages/login'),
      import('../../../features/dashboard/pages/Dashboard'),
    ])
      .then(() => setRoutesReady(true))
      .catch(() => setRoutesReady(true))
  }, [])

  useEffect(() => {
    if (!shouldRender) return

    document.body.classList.add('splash-active')

    const enterDone = setTimeout(() => setPhase('holding'), ENTER_MS)
    const holdDone = setTimeout(() => setMinHoldElapsed(true), ENTER_MS)

    const safety = setTimeout(() => {
      setPhase('exiting')
    }, SAFETY_TIMEOUT_MS)

    return () => {
      clearTimeout(enterDone)
      clearTimeout(holdDone)
      clearTimeout(safety)
      document.body.classList.remove('splash-active')
      document.body.classList.remove('splash-exiting')
    }
  }, [shouldRender])

  useEffect(() => {
    if (!shouldRender) return
    if (phase !== 'holding') return
    if (!minHoldElapsed || !authReady || !routesReady) return

    setPhase('exiting')
  }, [shouldRender, phase, minHoldElapsed, authReady, routesReady])

  useEffect(() => {
    if (phase === 'exiting') {
      document.body.classList.add('splash-exiting')
    } else {
      document.body.classList.remove('splash-exiting')
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'exiting') return
    const t = setTimeout(() => {
      setPhase('done')
      if (!bypass) sessionStorage.setItem(STORAGE_KEY, '1')
      document.body.classList.remove('splash-active')
      document.body.classList.remove('splash-exiting')
    }, EXIT_MS)
    return () => clearTimeout(t)
  }, [phase, bypass])

  // ── Canvas rendering ────────────────────────────────────────────────
  // The splash mark is drawn imperatively to a <canvas> via rAF instead
  // of as animated SVG. On cheap Android, the SVG version hit ~10–15fps
  // because `stroke-width` on a clipped path forces per-frame
  // re-tessellation in the WebView. Canvas turns that into one bitmap
  // composite per frame and runs at 60fps on the same hardware.
  //
  // Phase transitions reset the start timestamp, so each phase's
  // animation runs from t=0 in its own clock. The rAF loop self-stops
  // when the phase reaches a static state ('holding' draws once and
  // stops; 'done' clears and stops).
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const phaseStartRef = useRef<number>(0)
  // Wall-clock timestamp when the splash began. Persists across all
  // phase transitions so the counter-rotating ring animation runs as
  // one continuous curve from entering→holding→exiting instead of
  // resetting at each phase boundary. Set once when entering starts;
  // never reset within a single splash lifecycle.
  const splashStartRef = useRef<number | null>(null)

  useEffect(() => {
    if (!shouldRender) return
    if (phase === 'done') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Size the canvas backing buffer to match the viewport × DPR. The
    // canvas fills the splash overlay (which is fixed inset:0), so its
    // CSS size IS the viewport size — read window dimensions directly
    // instead of calling getBoundingClientRect, which would force a
    // synchronous layout flush on every effect run (i.e. every phase
    // transition).
    const dpr = window.devicePixelRatio || 1
    const cssWidth = window.innerWidth
    const cssHeight = window.innerHeight
    // Resize the backing buffer if EITHER dimension changed. Checking
    // only width misses the iOS PWA case where the dynamic toolbar /
    // safe-area changes height while width stays constant — leaving a
    // stale buffer that gets stretched non-uniformly to fit the CSS
    // dimensions (circles become ellipses, draws bleed colour).
    const targetWidth = Math.round(cssWidth * dpr)
    const targetHeight = Math.round(cssHeight * dpr)
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth
      canvas.height = targetHeight
    }

    // Mark is drawn at a fixed display size, capped at the smaller
    // viewport dimension on small screens so it doesn't overflow.
    const markSize = Math.min(MARK_DISPLAY_PX, cssWidth * 0.7, cssHeight * 0.7)

    // Reduced motion: snap to a fully-formed mark and stop. No rAF, no
    // animation. Honours the same intent as the splash.css media query
    // we just removed.
    if (reduceMotion) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawSplashFrame({
        ctx,
        canvasWidth: cssWidth,
        canvasHeight: cssHeight,
        markSize,
        phase: 'holding',
        elapsed: 0,
        ringElapsed: 0,
      })
      return
    }

    phaseStartRef.current = performance.now()
    if (phase === 'entering') {
      splashStartRef.current = phaseStartRef.current
    }
    let rafId = 0

    // Counter-rings hold off until this many ms after splash start.
    // Short delay so the rings appear early — they draw on from
    // single dots and stagger between themselves, so the rings reach
    // their fully-drawn state during the same window the Z is
    // tracing. The CW wind-up peak (≈t+400ms relative to ring start)
    // lands while the Z trace is still completing.
    const RING_DELAY_MS = 600

    const tick = (ts: number) => {
      const elapsed = ts - phaseStartRef.current
      const splashElapsed =
        splashStartRef.current !== null ? ts - splashStartRef.current : 0
      const ringElapsed = Math.max(0, splashElapsed - RING_DELAY_MS)
      // setTransform replaces the prior save+scale+restore wrapper —
      // drawSplashFrame already isolates its own canvas state with an
      // internal save/restore, so an outer pair was redundant. We just
      // need to install the DPR scale before the frame starts.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawSplashFrame({
        ctx,
        canvasWidth: cssWidth,
        canvasHeight: cssHeight,
        markSize,
        phase,
        elapsed,
        ringElapsed,
      })

      // Holding has continuous animation now (counter-rotating rings
      // that telegraph the upcoming exit), so keep the loop running.
      // The phase transition to 'exiting' will tear this effect down.
      if (phase !== 'holding') {
        // Exiting + entering have known durations. Stop the loop once
        // the phase's internal animation has completed; the React
        // phase change will re-mount the effect anyway, but stopping
        // early saves a few frames of unnecessary work.
        const phaseDuration = phase === 'entering' ? ENTER_MS : EXIT_MS
        if (elapsed >= phaseDuration) return
      }

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [phase, shouldRender, reduceMotion])

  if (!shouldRender || phase === 'done') return null

  const overlayClass = [
    'splash-overlay',
    phase === 'exiting' && 'splash-overlay--exiting',
  ]
    .filter(Boolean)
    .join(' ')

  // Portal the overlay to <body> so it can never inherit opacity/transform
  // from an ancestor wrapper (e.g. the .splash-app-root rise rule, which
  // would otherwise zero out the overlay when SplashGate is rendered
  // inside a route — see SplashPreviewPage).
  return createPortal(
    <div className={overlayClass} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="splash-mark"
        // CSS sets the displayed (CSS) size; the effect above sets the
        // backing buffer to CSS size × DPR for crisp output on retina.
      />
    </div>,
    document.body,
  )
}
