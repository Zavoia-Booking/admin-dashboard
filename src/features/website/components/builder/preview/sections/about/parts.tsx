import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { AboutMedia } from "./types";
import type { AboutStat } from "./util";
import {
  useAboutCounter,
  useAboutParallax,
  useManifestoWords,
  useRisingWords,
} from "./motion";

function words(text: string) {
  return text.split(/\s+/).filter(Boolean);
}

export function RisingWords({ text, className, ghost }: { text: string; className: string; ghost?: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useRisingWords(ref, text);
  return (
    <h2 ref={ref} className={`${className}${ghost ? " mc-about-ghost" : ""}`} aria-label={ghost ? undefined : text} aria-hidden={ghost || undefined}>
      {words(text).map((word, index) => (
        <span className="mc-about-word-clip" aria-hidden="true" key={`${word}-${index}`}>
          <span data-about-word>{word}</span>
        </span>
      ))}
    </h2>
  );
}

export function ManifestoWords({ text, ghost }: { text: string; ghost?: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useManifestoWords(ref, text);
  const tokens = words(text);
  return (
    <h2 ref={ref} className={`mc-abm-lede${ghost ? " mc-about-ghost" : ""}`} aria-label={ghost ? undefined : text} aria-hidden={ghost || undefined}>
      {tokens.map((word, index) => (
        <span className="mc-abm-word" data-about-word aria-hidden="true" key={`${word}-${index}`}>
          {word}
          {index < tokens.length - 1 ? " " : ""}
        </span>
      ))}
    </h2>
  );
}

export function AboutImage({
  media,
  className,
}: {
  media: AboutMedia | null;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [settledSrc, setSettledSrc] = useState<string | null>(null);
  useAboutParallax(ref);
  const mediaSettled = media !== null && settledSrc === media.src;

  return (
    <div ref={ref} className={`mc-about-media${className ? ` ${className}` : ""}`}>
      <div className="mc-about-media-move" data-about-parallax>
        {media ? (
          <img
            key={media.src}
            src={media.src}
            alt={media.alt}
            loading="eager"
            fetchPriority="low"
            decoding="async"
            data-loaded={mediaSettled ? "true" : "false"}
            onLoad={() => setSettledSrc(media.src)}
            onError={() => setSettledSrc(media.src)}
          />
        ) : (
          <span className="mc-about-media-placeholder" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

export function AboutStatValue({ stat, index }: { stat: AboutStat; index: number }) {
  const { ref, shown } = useAboutCounter(stat.n, stat.dec, index * 80, stat.raw);
  const finalValue = stat.n.toFixed(stat.dec);
  return (
    <>
      <span ref={ref} aria-hidden="true">{shown}</span>
      <span className="sr-only">{finalValue}</span>
    </>
  );
}

export function StoryCta({ label }: { label: string }) {
  return (
    <span className="mc-abs-cta" aria-label={label}>
      <span>{label}</span>
      <ArrowRight aria-hidden="true" size={15} strokeWidth={1.7} />
    </span>
  );
}
