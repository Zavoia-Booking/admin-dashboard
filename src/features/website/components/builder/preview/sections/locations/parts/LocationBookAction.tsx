import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";

/** Builder-safe booking affordance with the executable design's character roll and arrow swap. */
export function LocationBookAction({
  label,
  className,
  arrowSize = 16,
}: {
  label: string;
  className: string;
  arrowSize?: number;
}) {
  return (
    <span className={`mc-loc-book-action ${className}`}>
      <span className="mc-loc-book-sr">{label}</span>
      <span className="mc-loc-book-word" aria-hidden>
        {Array.from(label).map((character, index) => (
          <span
            key={`${character}:${index}`}
            className="mc-loc-book-char"
            style={{ "--mc-loc-book-delay": `${index * 24}ms` } as CSSProperties}
          >
            <span className="mc-loc-book-char-a">{character}</span>
            <span className="mc-loc-book-char-b">{character}</span>
          </span>
        ))}
      </span>
      <span
        className="mc-loc-book-arrow"
        aria-hidden
        style={{ width: arrowSize, height: arrowSize }}
      >
        <ArrowRight className="mc-loc-book-arrow-a" size={arrowSize} strokeWidth={1.8} />
        <ArrowRight className="mc-loc-book-arrow-b" size={arrowSize} strokeWidth={1.8} />
      </span>
    </span>
  );
}
