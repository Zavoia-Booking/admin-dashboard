/* Canvas renderer for the splash mark. Draws every frame of the
 * entering / holding / exiting choreography directly to a 2D canvas,
 * replacing the SVG + CSS animation that lived here before.
 *
 * Why canvas: on cheap Android, the original SVG implementation was
 * dominated by per-frame SVG re-tessellation (stroke-width changing
 * from 2 → 260 each frame) and clipPath re-evaluation. Both are
 * CPU-bound in the WebView. Canvas collapses everything into a single
 * bitmap composite per frame — the only per-frame work is JS draw
 * calls, which the JIT handles fine even on weak hardware.
 *
 * The animation is a faithful port of the original splash.css timing:
 * same durations, same easings, same keyframe values. The only thing
 * that's different is the rendering target.
 *
 * All drawing happens in viewBox coordinates (0..1254). The caller
 * applies a single ctx.scale() so the output fills the canvas at any
 * size. This keeps the math here clean. */

import { ZAVOIA_Z_PATH } from './zavoiaMarkPaths'

/** SVG viewBox size that all draw coords are expressed in. */
export const VIEWBOX = 1254

const Z_FILL = '#1F1F1D'
const ACCENT = '#CA4F2A'
/** End-state stroke width for the brand Z. Wide enough that the
 * stroke, clipped to the Z silhouette, fills the entire interior
 * via inward extension from each side of the perimeter. */
const Z_STROKE_WIDTH = 260
const BALL_CX = 790
const BALL_CY = 980
const BALL_R = 110

/** Phase enum mirrors SplashGate's local state. */
export type SplashPhase = 'entering' | 'holding' | 'exiting' | 'done'

/* ── Easing ─────────────────────────────────────────────────────────── */

/** CSS-equivalent cubic-bezier evaluator. Returns a function that maps
 * input progress (0..1) to output progress (0..1) along the curve
 * defined by control points (x1,y1) and (x2,y2). Newton-Raphson with
 * an early-exit; same numerical approach Chrome uses internally. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by

  const sampleX = (s: number) => ((ax * s + bx) * s + cx) * s
  const sampleY = (s: number) => ((ay * s + by) * s + cy) * s
  const sampleDx = (s: number) => (3 * ax * s + 2 * bx) * s + cx

  return (t: number): number => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    let s = t
    for (let i = 0; i < 8; i++) {
      const x = sampleX(s) - t
      if (Math.abs(x) < 1e-5) return sampleY(s)
      const dx = sampleDx(s)
      if (Math.abs(dx) < 1e-6) break
      s -= x / dx
    }
    // Fallback: bisection if Newton stalls
    let lo = 0
    let hi = 1
    s = t
    for (let i = 0; i < 20; i++) {
      const x = sampleX(s)
      if (Math.abs(x - t) < 1e-5) return sampleY(s)
      if (x < t) lo = s
      else hi = s
      s = (lo + hi) / 2
    }
    return sampleY(s)
  }
}

/** Curves used in the original splash.css, named for what they do. */
const EASE_ARRIVAL = bezier(0.45, 0.05, 0.2, 1)
const EASE_BOUNCE = bezier(0.4, 0, 0.5, 1)
const EASE_SETTLE = bezier(0.4, 0, 0.6, 1)
// EASE_TRACE: borrowed from a Lottie reference logo's brush-stroke
// keyframe (out=(0.405,0), in=(0,1)). Reads as "designer pulls the
// pen confidently" — slow takeoff (~30% input → ~50% output), then a
// strong middle acceleration, then a long settling tail that does the
// last ~12% slowly. Replaces the previous symmetric smoothstep, which
// looked uniform and lacked energy.
const EASE_TRACE = bezier(0.405, 0, 0, 1)
const EASE_RING = bezier(0.4, 0, 0.6, 1)
const EASE_ZOOM = bezier(0.25, 0.4, 0.5, 1)
const EASE_FADE = bezier(0.4, 0, 0.2, 1)

/* ── Mark-group keyframe tables ─────────────────────────────────────── */
/* All five keyframed properties of the entering arrival share the same
 * 4-keyframe time breakpoints (0, 0.68, 0.85, 1) and the same per-segment
 * easings. Storing them as parallel module-scope arrays lets the per-frame
 * code pick a segment once, evaluate the easing once, and reuse the result
 * across all five values — instead of allocating fresh keyframe arrays
 * each frame and running the bezier solver 5× with identical input. */
const ARRIVAL_DURATION_MS = 1950
const ARRIVAL_BREAKS = [0, 0.68, 0.85, 1] as const
const ARRIVAL_EASES = [EASE_ARRIVAL, EASE_BOUNCE, EASE_SETTLE] as const
const ARRIVAL_TX = [290, -16, 4, 0] as const
const ARRIVAL_TY = [-135, 9, -2, 0] as const
const ARRIVAL_ROT = [100, -9, 3, 0] as const
const ARRIVAL_SCALE = [0.18, 1.1, 0.98, 1] as const
// Opacity originally had only 3 keyframes (0→1 over [0, 0.68], then linear
// 1→1 over [0.68, 1]). Padding to 4 keyframes here keeps the segment math
// uniform; the trailing 1→1 lerps are no-ops regardless of easing.
const ARRIVAL_OPACITY = [0, 1, 1, 1] as const

const DEG_TO_RAD = Math.PI / 180
const HALF_PI = Math.PI / 2
/** 78% of the full circle — the visible arc span of each counter-ring
 * once its draw-on completes. Hoisted so the multiply is paid once. */
const FULL_ARC_SPAN = Math.PI * 2 * 0.78

/* ── Cached path objects ────────────────────────────────────────────── */
/* The brand silhouette path — parsed once from ZAVOIA_Z_PATH and
 * reused every frame. The path's total length is measured once via a
 * hidden SVG element (canvas has no native API for path length) and
 * used to drive setLineDash / lineDashOffset for the trace
 * animation. The original SVG used `pathLength=1` to normalize the
 * dash pattern; canvas needs the real length. */

let zPath: Path2D | null = null
let zPathLength = 0
/* Cached `[zPathLength, zPathLength]` dash array used by drawZ's trace.
 * Populated alongside zPathLength so subsequent draw frames can reuse
 * the same array reference for `setLineDash` instead of allocating a
 * new literal each frame. */
let zDashPattern: [number, number] | null = null

function ensureZPath() {
  if (zPath) return
  const trimmed = ZAVOIA_Z_PATH.trim()
  zPath = new Path2D(trimmed)
  if (typeof document !== 'undefined') {
    const svgNS = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(svgNS, 'svg')
    const path = document.createElementNS(svgNS, 'path')
    path.setAttribute('d', trimmed)
    svg.appendChild(path)
    svg.style.position = 'absolute'
    svg.style.width = '0'
    svg.style.height = '0'
    svg.style.visibility = 'hidden'
    svg.style.overflow = 'hidden'
    document.body.appendChild(svg)
    zPathLength = path.getTotalLength()
    zDashPattern = [zPathLength, zPathLength]
    document.body.removeChild(svg)
  }
}

/* ── Per-element draw routines ──────────────────────────────────────── */

/** Mark group: arrives from off-camera with overshoot + counter-bounce.
 * 1950ms total, four beats: 0% off-camera → 68% impact (overshoot) →
 * 85% counter-bounce → 100% settle. The transform compounds, so this
 * applies the group's overall translate + rotate + scale + opacity.
 *
 * After the curve settles (arrivalT ≥ 1) the values produce an identity
 * transform, so this function early-returns and the entering phase pays
 * no per-frame cost for it during its ~1.2s tail. */
function applyMarkGroupTransform(ctx: CanvasRenderingContext2D, t: number) {
  const arrivalT = t / ARRIVAL_DURATION_MS
  if (arrivalT >= 1) return

  // Pick the segment containing arrivalT, then evaluate its easing once
  // and reuse the result across all five property lerps.
  let segIdx = 0
  if (arrivalT > ARRIVAL_BREAKS[2]) segIdx = 2
  else if (arrivalT > ARRIVAL_BREAKS[1]) segIdx = 1

  const tA = ARRIVAL_BREAKS[segIdx]
  const tB = ARRIVAL_BREAKS[segIdx + 1]
  const segT = (arrivalT - tA) / (tB - tA)
  const eased = ARRIVAL_EASES[segIdx](segT)

  const i = segIdx
  const j = segIdx + 1
  const tx = ARRIVAL_TX[i] + (ARRIVAL_TX[j] - ARRIVAL_TX[i]) * eased
  const ty = ARRIVAL_TY[i] + (ARRIVAL_TY[j] - ARRIVAL_TY[i]) * eased
  const rot = ARRIVAL_ROT[i] + (ARRIVAL_ROT[j] - ARRIVAL_ROT[i]) * eased
  const scale = ARRIVAL_SCALE[i] + (ARRIVAL_SCALE[j] - ARRIVAL_SCALE[i]) * eased
  const opacity =
    ARRIVAL_OPACITY[i] + (ARRIVAL_OPACITY[j] - ARRIVAL_OPACITY[i]) * eased

  // Rotate + scale around the viewBox center, then apply translate in
  // viewBox units (coordinate space is already viewBox-scaled by caller).
  ctx.globalAlpha *= opacity
  ctx.translate(VIEWBOX / 2 + tx, VIEWBOX / 2 + ty)
  ctx.rotate(rot * DEG_TO_RAD)
  ctx.scale(scale, scale)
  ctx.translate(-VIEWBOX / 2, -VIEWBOX / 2)
}

/** Z reveal: faithful port of the original SVG/CSS mechanic on the
 * brand silhouette path. Three things animate with the same easing:
 *
 *   1. stroke-dashoffset: -pathLength → 0 — reveals the stroke along
 *      the perimeter (Lottie trim equivalent).
 *   2. stroke-width: 2 → 260 — clipped to the silhouette, so the
 *      inward extension from the perimeter fills the interior as the
 *      stroke widens.
 *   3. fill-opacity: 0 → 1 over the last 15% — locks the corner
 *      geometry that pure stroke can't quite cover.
 *
 * Known visual cost: at any mid-animation moment, the dash gap leaves
 * a strip of silhouette interior unfilled by the inward stroke
 * growth, producing a subtle "gray line" boundary. SVG's renderer
 * smooths over this; canvas's rasterizer renders it more sharply.
 * Accepted tradeoff: brand fidelity over artifact-free animation. */
function drawZ(ctx: CanvasRenderingContext2D, t: number) {
  // Trace envelope is intentionally longer than ENTER_MS so the curve's
  // dramatic deceleration tail still has room to read; the rest of the
  // mark (ball, rings) finishes settling earlier and waits while the Z
  // continues drawing as the dominant visual.
  const traceT = Math.min(t / 3600, 1)
  const eased = EASE_TRACE(traceT)
  if (eased <= 0) return

  const z = zPath
  if (!z) return

  const strokeWidth = 2 + (Z_STROKE_WIDTH - 2) * eased
  const fillOpacity = eased < 0.85 ? 0 : (eased - 0.85) / 0.15

  ctx.save()
  ctx.clip(z)

  // Trace: dash pattern of [pathLength, pathLength] with a dashoffset
  // of -(1-eased)*pathLength shifts the visible dash so it covers
  // `eased` fraction of the path. Equivalent to SVG's pathLength=1 +
  // dashoffset animation from -1 → 0. The outer save/restore restores
  // the dash automatically, so we only need to SET it when needed —
  // the no-dash branch was redundant.
  if (zPathLength > 0 && eased < 1 && zDashPattern) {
    ctx.setLineDash(zDashPattern)
    ctx.lineDashOffset = -(1 - eased) * zPathLength
  }
  ctx.strokeStyle = Z_FILL
  ctx.lineWidth = strokeWidth
  ctx.lineJoin = 'miter'
  ctx.miterLimit = 100
  ctx.lineCap = 'round'
  ctx.stroke(z)

  // Fill ramp covers the corner geometry (and any small remainder
  // the stroke didn't quite reach) over the final 15% of the trace.
  // Fill doesn't use lineDash, so no need to clear the dash here.
  if (fillOpacity > 0) {
    const prevAlpha = ctx.globalAlpha
    ctx.globalAlpha = prevAlpha * fillOpacity
    ctx.fillStyle = Z_FILL
    ctx.fill(z)
    ctx.globalAlpha = prevAlpha
  }

  ctx.restore()
}

/** Z in fully-formed state — used during holding and as the start of
 * the exit fade. Matches the end state of drawZ at eased=1: filled
 * brand silhouette. The stroke at Z_STROKE_WIDTH (clipped) plus the
 * fill at full opacity is visually identical to a direct fill. */
function drawZFull(ctx: CanvasRenderingContext2D, scale = 1, opacity = 1) {
  const z = zPath
  if (!z) return
  // During holding the call site passes opacity=1 every frame, so the
  // alpha set/restore would be a no-op multiply each time. Guard it.
  const needsAlpha = opacity !== 1
  let prevAlpha = 1
  if (needsAlpha) {
    prevAlpha = ctx.globalAlpha
    ctx.globalAlpha = prevAlpha * opacity
  }

  if (scale !== 1) {
    // Scale around the Z's bounding box center. The Z is roughly
    // centered in the viewBox so we use viewBox center as origin.
    ctx.save()
    ctx.translate(VIEWBOX / 2, VIEWBOX / 2)
    ctx.scale(scale, scale)
    ctx.translate(-VIEWBOX / 2, -VIEWBOX / 2)
    ctx.fillStyle = Z_FILL
    ctx.fill(z)
    ctx.restore()
  } else {
    ctx.fillStyle = Z_FILL
    ctx.fill(z)
  }
  if (needsAlpha) ctx.globalAlpha = prevAlpha
}

/** Ball pop: damped-spring scale function.
 *
 *   y(t) = 1 - e^(-d*t) * cos(ω*t)
 *
 * d=4 (damping), ω=5 (frequency) gives:
 *   t=0    → 0      (start invisible)
 *   t=0.5  → 1.11   (overshoot peak)
 *   t=1.0  → 1.00   (settled)
 *
 * Why a continuous function instead of multi-keyframe lerp: on cheap
 * Android the rAF cadence drops, and the bounce phase (peak →
 * oscillations → settle) is short enough that linear interpolation
 * between discrete keyframes lands the device's sparse samples
 * between bounces, making the pop read as a flat fade. The spring
 * function gives a correct sampled value at any framerate — 4 frames
 * over the whole pop still produces a visible overshoot + settle.
 *
 * 1500ms total pop duration, 200ms delay before start. */
// Settled scale value that drawBall converges to as popT → 1. Cached
// at module scope so drawBall can short-circuit the Math.exp/Math.cos
// pair every frame during holding + exiting (popT clamped to 1 there).
const BALL_SETTLED_SCALE = 1 - Math.exp(-4) * Math.cos(5)

function drawBall(ctx: CanvasRenderingContext2D, t: number, exitGrowth = 1) {
  const popT = Math.max(0, Math.min((t - 300) / 2250, 1))
  if (popT === 0) return

  // Quick fade-in over the first 6% of the pop so the ball doesn't
  // appear at full opacity from frame 1 (matches the original).
  let scale: number
  let opacity: number
  if (popT >= 1) {
    scale = BALL_SETTLED_SCALE
    opacity = 1
  } else {
    scale = 1 - Math.exp(-4 * popT) * Math.cos(5 * popT)
    opacity = popT < 0.06 ? popT / 0.06 : 1
  }
  if (scale <= 0 || opacity <= 0) return

  const finalScale = scale * exitGrowth
  const prevAlpha = ctx.globalAlpha
  ctx.globalAlpha = prevAlpha * opacity
  ctx.fillStyle = ACCENT
  ctx.beginPath()
  ctx.arc(BALL_CX, BALL_CY, BALL_R * finalScale, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = prevAlpha
}

/** Counter-rotating concentric rings used in both the holding and
 * exit phases. Each ring is a 78% arc — the 22% gap makes the
 * rotation visible (a closed circle would render the same at any
 * rotation). Staggered base angles keep the gaps from aligning.
 *
 * The rotation comes from `computeCounterRotation` which is fed a
 * SplashGate-tracked elapsed clock that doesn't reset across the
 * holding→exit boundary, so the curve runs continuously through both
 * phases. During holding the rings are at scale 1; during exit they
 * grow with the ball so they read as its expanding energy field. */

/** rotation(t) = AMP * sin(2π·FREQ·t) · exp(-DECAY·t)  +  DRIFT · t
 *
 * Two superimposed motions, summed. Together they produce the
 * "wind-up clockwise → pulled back → counter-clockwise spin" feel as
 * one continuous formula whose velocity is never zero — so there is
 * no perceptual pause at the direction reversal, just a smooth
 * change of sign as the bounce decays into the linear drift.
 *
 *   1. The damped sinusoid (AMP·sin·exp): a swing that overshoots
 *      clockwise, comes back through zero, would oscillate forever
 *      but the exponential decay damps it out within ~2 seconds.
 *   2. The linear drift (DRIFT·t): a constant counter-clockwise
 *      velocity that's small at first (overpowered by the bounce)
 *      and dominates after the bounce dies out.
 *
 * Tuning: AMP=250 + decay=1.0 makes the CW peak land ~140° at
 * t≈0.4s — wide enough to read as a deliberate "left-to-right"
 * wind-up, slow enough to occupy real visible time. Drift -250°/s
 * gives a clear counter-clockwise spin once the bounce subsides. */
const COUNTER_AMP_DEG = 250
const COUNTER_DECAY_PER_S = 1.0
const COUNTER_FREQ_HZ = 0.5
const COUNTER_DRIFT_DEG_PER_S = -250

function computeCounterRotation(ringElapsed: number): number {
  const t = ringElapsed / 1000
  const bounce =
    COUNTER_AMP_DEG *
    Math.sin(2 * Math.PI * COUNTER_FREQ_HZ * t) *
    Math.exp(-COUNTER_DECAY_PER_S * t)
  const drift = COUNTER_DRIFT_DEG_PER_S * t
  return bounce + drift
}

/** Each ring draws on as a single dot (zero-length arc with round
 * cap = a circle of radius lineWidth/2) that grows into a 78% arc.
 * Staggered by `drawDelay` so the three rings come in one after
 * another rather than all at once. After `drawDuration` each ring is
 * fully drawn and just rotates per the counter-rotation curve. */
const COUNTER_RING_SPECS: CounterRingSpec[] = [
  { rMul: 1.52, width: 10, opacity: 0.55, baseAngleDeg: 0,   drawDelay: 0,   drawDuration: 450 },
  { rMul: 1.71, width: 11, opacity: 0.85, baseAngleDeg: 90,  drawDelay: 130, drawDuration: 450 },
  { rMul: 1.92, width: 12, opacity: 1,    baseAngleDeg: 180, drawDelay: 260, drawDuration: 450 },
]

function drawCounterRings(
  ctx: CanvasRenderingContext2D,
  ringElapsed: number,
  rotationDeg: number,
  scaleFactor: number,
  opacityMul: number,
) {
  // Hoisted state shared across all three rings — only `lineWidth` and
  // `globalAlpha` vary per ring, the rest are invariant.
  ctx.strokeStyle = ACCENT
  ctx.lineCap = 'round'
  for (const s of COUNTER_RING_SPECS) {
    drawCounterRing(ctx, ringElapsed, rotationDeg, scaleFactor, opacityMul, s)
  }
}

interface CounterRingSpec {
  rMul: number
  width: number
  opacity: number
  baseAngleDeg: number
  drawDelay: number
  drawDuration: number
}

function drawCounterRing(
  ctx: CanvasRenderingContext2D,
  ringElapsed: number,
  rotationDeg: number,
  scaleFactor: number,
  opacityMul: number,
  s: CounterRingSpec,
) {
  const drawT = ringElapsed - s.drawDelay
  if (drawT <= 0) return

  // Trim animation: the arc grows from 0 length (a single dot, thanks
  // to lineCap='round') to the full 78% span. Eased so the dot
  // accelerates out smoothly rather than appearing at a flat rate.
  // After the trim completes, EASE_RING(1) === 1 always, so skip the
  // bezier solver for the remaining ~3.8s of the splash.
  const drawProgress = drawT / s.drawDuration
  const eased = drawProgress >= 1 ? 1 : EASE_RING(drawProgress)
  const visibleSpan = FULL_ARC_SPAN * eased

  const startAngle =
    (s.baseAngleDeg + rotationDeg) * DEG_TO_RAD - HALF_PI
  const endAngle = startAngle + visibleSpan
  const radius = BALL_R * s.rMul * scaleFactor

  const prevAlpha = ctx.globalAlpha
  ctx.globalAlpha = prevAlpha * s.opacity * opacityMul
  ctx.lineWidth = s.width
  ctx.beginPath()
  ctx.arc(BALL_CX, BALL_CY, radius, startAngle, endAngle)
  ctx.stroke()
  ctx.globalAlpha = prevAlpha
}

/* ── Frame entry point ──────────────────────────────────────────────── */

export interface DrawFrameArgs {
  ctx: CanvasRenderingContext2D
  /** CSS-pixel width of the canvas (full viewport). */
  canvasWidth: number
  /** CSS-pixel height of the canvas (full viewport). */
  canvasHeight: number
  /** CSS-pixel size of the rendered mark itself. The mark is drawn
   * square at this size, centered in the canvas. The canvas is bigger
   * than the mark so the exit zoom-warp has room to expand. */
  markSize: number
  phase: SplashPhase
  /** Milliseconds since the current phase started. */
  elapsed: number
  /** Milliseconds since the counter-rotating rings started spinning.
   * Tracks a SplashGate-managed clock that doesn't reset across
   * phase transitions, driving the wind-up→pullback→counter-spin
   * curve continuously through entering/holding/exiting. 0 during
   * the early entering window before rings start. */
  ringElapsed: number
}

/** Draw one frame of the splash mark. Pure function of (phase, elapsed). */
export function drawSplashFrame({
  ctx,
  canvasWidth,
  canvasHeight,
  markSize,
  phase,
  elapsed,
  ringElapsed,
}: DrawFrameArgs) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  if (phase === 'done') return

  // Lazy: parse the Z path + measure its length on first paint.
  // No-op on subsequent frames.
  ensureZPath()

  ctx.save()

  // Center the mark in the (full-screen) canvas, then map viewBox
  // (0..1254) onto markSize × markSize. After this, all draw calls work
  // in viewBox units, but they paint into a viewport that's larger than
  // the mark — so the exit zoom-warp can expand without being clipped
  // by the canvas edges.
  ctx.translate((canvasWidth - markSize) / 2, (canvasHeight - markSize) / 2)
  const scale = markSize / VIEWBOX
  ctx.scale(scale, scale)

  if (phase === 'entering') {
    applyMarkGroupTransform(ctx, elapsed)
    drawZ(ctx, elapsed)
    drawBall(ctx, elapsed)
    // The counter-rings span entering→holding→exiting as one
    // continuous animation. Each ring draws on from a single dot to
    // a 78% arc, staggered between rings, then rotates per the
    // wind-up→pullback→counter-spin curve. Always shown — they are
    // the central animation now, not a desktop-only decoration.
    if (ringElapsed > 0) {
      const rotation = computeCounterRotation(ringElapsed)
      drawCounterRings(ctx, ringElapsed, rotation, 1, 1)
    }
  } else if (phase === 'holding') {
    // Mark fully formed at center, no transforms.
    drawZFull(ctx)
    drawBall(ctx, 9999) // any time past pop animation = settled
    // Rings continue the wind-up→pullback→counter-spin curve from
    // entering. The trim draw-on already played out by the time
    // holding begins (drawDuration ≪ entering tail).
    const rotation = computeCounterRotation(ringElapsed)
    drawCounterRings(ctx, ringElapsed, rotation, 1, 1)
  } else if (phase === 'exiting') {
    // Group zoom-warp: scale 1 → 25, opacity 1 → 0, transform-origin
    // at the ball position (63% × 78.2% of viewBox).
    const zoomT = Math.min(elapsed / 1350, 1)
    const eased = EASE_ZOOM(zoomT)
    const groupScale = 1 + (25 - 1) * eased
    const groupOpacity = 1 - eased

    ctx.globalAlpha *= groupOpacity
    const ox = VIEWBOX * 0.63
    const oy = VIEWBOX * 0.782
    ctx.translate(ox, oy)
    ctx.scale(groupScale, groupScale)
    ctx.translate(-ox, -oy)

    // Z fades + slight compress over the first 280ms.
    const fadeT = Math.min(elapsed / 420, 1)
    const fadeEased = EASE_FADE(fadeT)
    const zOpacity = 1 - fadeEased
    const zScale = 1 - 0.15 * fadeEased
    if (zOpacity > 0) drawZFull(ctx, zScale, zOpacity)

    // Ball grows 1 → 1.5 over the full 900ms, stacks with group zoom.
    const ballGrowth = 1 + 0.5 * eased
    // Rings continue the same curve, now scaled with the ball. By
    // the time exit kicks in, the trim draw-on is long done — the
    // rings rotate and grow as one unit.
    const ringRotation = computeCounterRotation(ringElapsed)
    drawCounterRings(ctx, ringElapsed, ringRotation, ballGrowth, 1)
    drawBall(ctx, 9999, ballGrowth)
  }

  ctx.restore()
}
