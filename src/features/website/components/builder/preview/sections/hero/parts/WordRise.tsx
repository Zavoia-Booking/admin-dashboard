import { Fragment, type CSSProperties, type ElementType } from "react";

/** Headline split into per-word masks that rise into place (mirrors the design's SplitReveal). Renders an
 *  <h1> by default; pass `as="span"` to compose several lines inside an outer heading (poster / portal). */
export function WordRise({
  text,
  base,
  step,
  className,
  style,
  as: Tag = "h1",
  ariaLabel,
}: {
  text: string;
  base: number;
  step: number;
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
  ariaLabel?: string;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <Tag className={className} style={style} aria-label={ariaLabel}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="mc-rev-word">
            <span style={{ animationDelay: `${base + i * step}ms` }}>{w}</span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </Tag>
  );
}
