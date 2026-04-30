import { useEffect, useMemo, useRef, useState } from 'react'
import SplashGate, { type SplashPhase } from './SplashGate'
import wordmarkUrl from '../../../assets/zavoia_logo_primary_wordmark_transparent.svg'

const STORAGE_KEY = 'zv_splash_played'

// Mirror of the constants in SplashGate so the HUD timeline matches.
const ENTER_MS = 2100
const MIN_HOLD_MS = 0
const EXIT_MS = 900

export default function SplashPreviewPage() {
  // Lazy initializer runs before children mount, so SplashGate sees a clean
  // sessionStorage on first render.
  const [replayKey, setReplayKey] = useState(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY)
    }
    return 0
  })

  const [phase, setPhase] = useState<SplashPhase>('entering')
  const [elapsedMs, setElapsedMs] = useState(0)
  const startedAtRef = useRef<number>(performance.now())

  function replay() {
    sessionStorage.removeItem(STORAGE_KEY)
    startedAtRef.current = performance.now()
    setElapsedMs(0)
    setPhase('entering')
    setReplayKey((k) => k + 1)
  }

  // Tick a clock so the HUD shows elapsed time during entry.
  useEffect(() => {
    if (phase === 'done') return
    let raf = 0
    const tick = () => {
      setElapsedMs(performance.now() - startedAtRef.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, replayKey])

  const phaseLabel: Record<SplashPhase, string> = {
    entering: 'entering',
    holding: 'holding',
    exiting: 'exiting',
    done: 'done',
  }

  const phaseColor: Record<SplashPhase, string> = {
    entering: 'bg-amber-500',
    holding: 'bg-emerald-500',
    exiting: 'bg-rose-500',
    done: 'bg-slate-400',
  }

  const totalMs = ENTER_MS + MIN_HOLD_MS + EXIT_MS
  const enterPct = (ENTER_MS / totalMs) * 100
  const holdPct = (MIN_HOLD_MS / totalMs) * 100
  const exitPct = (EXIT_MS / totalMs) * 100

  // Cursor position on the timeline (0..1) based on elapsed time.
  const cursor = useMemo(() => Math.min(elapsedMs / totalMs, 1), [elapsedMs, totalMs])

  return (
    <div className="bg-muted relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      {/* Splash hand-off mock — mirrors the login layout. The whole route
       * is wrapped by .splash-app-root in App.tsx, which applies the rise
       * animation to all of this content during splash exit. */}
      <div className="w-full max-w-sm md:max-w-3xl flex flex-col items-center gap-6">
        <img
          src={wordmarkUrl}
          alt="Zavoia"
          className="h-10 md:h-14 w-auto"
        />
        <div className="w-full rounded-xl border bg-card p-8 shadow-sm">
          <h1 className="text-lg font-semibold mb-2">Splash hand-off target</h1>
          <p className="text-sm text-muted-foreground">
            This card and the wordmark above stand in for the login screen, so
            the splash exit animation has somewhere to land.
          </p>
        </div>
      </div>

      {/* Debug HUD — phase + timeline */}
      <div className="fixed top-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-[10000] rounded-xl border bg-background/95 backdrop-blur p-4 shadow-lg font-mono text-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${phaseColor[phase]}`} />
            <span className="font-semibold uppercase tracking-wide">{phaseLabel[phase]}</span>
          </div>
          <span className="tabular-nums text-muted-foreground">
            {Math.round(elapsedMs)}ms
          </span>
        </div>

        {/* Phase timeline */}
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted/60 border">
          <div
            className="absolute inset-y-0 left-0 bg-amber-500/80"
            style={{ width: `${enterPct}%` }}
            title={`entering (0..${ENTER_MS}ms)`}
          />
          <div
            className="absolute inset-y-0 bg-emerald-500/80"
            style={{ left: `${enterPct}%`, width: `${holdPct}%` }}
            title={`holding (${ENTER_MS}..${ENTER_MS + MIN_HOLD_MS}ms)`}
          />
          <div
            className="absolute inset-y-0 bg-rose-500/80"
            style={{ left: `${enterPct + holdPct}%`, width: `${exitPct}%` }}
            title={`exiting (${ENTER_MS + MIN_HOLD_MS}..${totalMs}ms)`}
          />
          {/* Playhead cursor */}
          <div
            className="absolute inset-y-0 w-[2px] bg-foreground"
            style={{ left: `calc(${cursor * 100}% - 1px)` }}
          />
        </div>

        <div className="mt-2 flex justify-between text-[10px] tabular-nums text-muted-foreground">
          <span>0</span>
          <span>{ENTER_MS}</span>
          <span>{ENTER_MS + MIN_HOLD_MS}</span>
          <span>{totalMs}ms</span>
        </div>
      </div>

      {/* Replay button */}
      <button
        type="button"
        onClick={replay}
        className="fixed bottom-6 right-6 z-[10000] rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium shadow-lg hover:opacity-90 active:scale-[0.98] transition-transform"
      >
        ↻ Replay splash
      </button>

      {/* The splash itself — re-mounts on every replay click. */}
      <SplashGate key={replayKey} bypass onPhaseChange={setPhase} />
    </div>
  )
}
