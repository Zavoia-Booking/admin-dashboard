import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";

/** Footer-only booking treatment from the design source. The builder preview deliberately does not launch
 * checkout, but the complete character-roll and arrow-swap hover treatment remains visible. */
export function FooterBookAction({ label }: { label: string }) {
  return (
    <span className="mc-fedit-book" aria-label={label}>
      <span className="mc-fedit-word" aria-hidden>
        {Array.from(label).map((character, index) => (
          <span
            key={`${character}:${index}`}
            className="mc-fedit-char"
            style={{ "--mc-fedit-delay": `${index * 24}ms` } as CSSProperties}
          >
            <span className="mc-fedit-char-a">{character}</span>
            <span className="mc-fedit-char-b">{character}</span>
          </span>
        ))}
      </span>
      <span className="mc-fedit-arrow" aria-hidden>
        <ArrowRight className="mc-fedit-arrow-a" size={17} strokeWidth={1.8} />
        <ArrowRight className="mc-fedit-arrow-b" size={17} strokeWidth={1.8} />
      </span>
    </span>
  );
}
