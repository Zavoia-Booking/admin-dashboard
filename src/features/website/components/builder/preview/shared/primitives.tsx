import { useEffect, useState, type CSSProperties } from "react";
import { Star, ArrowRight } from "lucide-react";
import { cn } from "../../../../../../shared/lib/utils";
import { DISPLAY } from "./constants";

/** Count-up that re-runs on mount — eases 0→value with a cubic ease-out (mirrors the microsite RollNum). */
export function CountUp({ value, decimals = 0, durationMs = 760, delayMs = 0 }: { value: number; decimals?: number; durationMs?: number; delayMs?: number }) {
  const reduce =
    typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    let start = 0;
    const begin = performance.now() + delayMs;
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);
    const step = (now: number) => {
      if (now < begin) {
        raf = requestAnimationFrame(step);
        return;
      }
      if (!start) start = now;
      const p = Math.min(1, (now - start) / durationMs);
      setShown(value * ease(p));
      if (p < 1) raf = requestAnimationFrame(step);
      else setShown(value);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // Runs once per mount; the parent re-keys per selected location so it replays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <>{shown.toFixed(decimals)}</>;
}

export function Section({ children, soft, narrow }: { children: React.ReactNode; soft?: boolean; narrow?: boolean }) {
  return (
    <section
      className="px-[clamp(20px,5cqw,48px)] py-[clamp(40px,7cqw,76px)]"
      style={soft ? { background: "var(--mc-soft)" } : undefined}
    >
      <div className={cn("mx-auto w-full", narrow ? "max-w-[940px]" : "max-w-[1320px]")}>{children}</div>
    </section>
  );
}

/**
 * Section header — display heading on the left, an optional muted sublede on the right. Mirrors the
 * microsite's `.mc-shead` / `.mc-h2`. The design retired the numbered "0N —" eyebrow kickers (its
 * `SecKicker` is an intentional no-op), so `no`/`kicker` are accepted for call-site compatibility but
 * never rendered. `stacked` switches to the design's single-column variant (large heading → sublede
 * below), used by Locations (`#locations .mc-shead` / `.lb-locx-sublede`).
 */
export function SectionHead({ heading, sublede, stacked }: { no?: string; kicker?: string; heading: string; sublede?: string; stacked?: boolean }) {
  if (stacked) {
    return (
      <div className="mb-[clamp(24px,4.5cqw,52px)]">
        <h2 className="text-balance" style={{ ...DISPLAY, fontSize: "clamp(34px,7cqw,68px)", lineHeight: 0.98 }}>
          {heading}
        </h2>
        {sublede && (
          <p className="mt-[clamp(14px,2.2cqw,20px)] max-w-[540px] text-[clamp(14px,1.7cqw,16px)] leading-relaxed" style={{ color: "var(--mc-muted)" }}>
            {sublede}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="mb-[clamp(28px,4cqw,52px)] flex flex-wrap items-end justify-between gap-x-[clamp(16px,3cqw,40px)] gap-y-3">
      <h2 style={{ ...DISPLAY, fontSize: "clamp(34px,5.2cqw,72px)", lineHeight: 0.98, marginTop: 10 }}>{heading}</h2>
      {sublede && (
        <p className="max-w-[300px] text-[14px] leading-relaxed" style={{ color: "var(--mc-muted)" }}>
          {sublede}
        </p>
      )}
    </div>
  );
}

export function Placeholder({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-[13.5px]"
      style={{ borderColor: "var(--mc-line)", background: "color-mix(in oklch, var(--mc-fg) 2%, transparent)", color: "var(--mc-muted)" } as CSSProperties}
    >
      {icon}
      {children}
    </div>
  );
}

export function BookButton({ label, tone, size = "md", styleOverride }: { label: string; tone: "accent" | "paper"; size?: "sm" | "md" | "lg" | "nav"; styleOverride?: CSSProperties }) {
  const style: CSSProperties = {
    // Accent fills use the AA-safe deepened accent (--mc-accent-field) so warm-white labels clear 4.5:1 even
    // on the lightest swatches (raw terracotta/amber sit at ~4.2:1). Identical to --mc-accent for the other 6.
    ...(tone === "paper"
      ? { background: "#fff", color: "var(--mc-ink)" }
      : { background: "var(--mc-accent-field)", color: "var(--mc-on-accent)" }),
    ...styleOverride,
  };
  const sizing =
    size === "sm"
      ? "px-4 py-2 text-[12.5px]"
      : size === "lg"
        ? "px-6 py-3 text-[14.5px]"
        : size === "nav"
          ? "px-[22px] py-3 text-[14px]" // matches the microsite .mc-btn nav CTA (no resting shadow)
          : "px-5 py-2.5 text-[13.5px]";
  return (
    <span
      className={cn("pointer-events-none inline-flex items-center gap-2 whitespace-nowrap rounded-full font-semibold", size !== "nav" && "shadow-sm", sizing)}
      style={style}
    >
      {label}
      {/* Nav CTA is text-only, matching the microsite `.mc-btn` in the header; hero/footer keep the arrow. */}
      {size !== "nav" && <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />}
    </span>
  );
}

export function Stars({ value, size = 14, color, empty }: { value: number; size?: number; color?: string; empty?: string }) {
  const on = color ?? "var(--mc-accent)";
  const off = empty ?? "color-mix(in oklch, var(--mc-fg) 20%, transparent)";
  const rounded = Math.round(value);
  return (
    <span className="inline-flex" style={{ gap: 1 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} style={{ width: size, height: size, color: i < rounded ? on : off }} fill={i < rounded ? on : "none"} strokeWidth={1.5} />
      ))}
    </span>
  );
}
