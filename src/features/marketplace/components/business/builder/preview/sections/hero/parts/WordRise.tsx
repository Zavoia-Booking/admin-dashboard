import { Fragment, type CSSProperties } from "react";

/** Headline split into per-word masks that rise into place (mirrors the design's SplitReveal). */
export function WordRise({ text, base, step, className, style }: { text: string; base: number; step: number; className?: string; style?: CSSProperties }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <h1 className={className} style={style}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="mc-rev-word">
            <span style={{ animationDelay: `${base + i * step}ms` }}>{w}</span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </h1>
  );
}
