import { useRef, type CSSProperties } from "react";
import { AboutStatValue, ManifestoWords } from "../parts";
import { useAboutReveal } from "../motion";
import type { AboutVariantProps } from "../types";
import { aboutCopy, aboutStatLabel, computeAboutStats } from "../util";
import "./manifesto.css";

export function Manifesto({ data, t, showStats, headlineHidden }: AboutVariantProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useAboutReveal(rootRef);
  const copy = aboutCopy(data, t, headlineHidden);
  const stats = showStats ? computeAboutStats(data) : [];
  const kicker = data.establishedYear === null
    ? t("businessPage.builder.preview.aboutStory")
    : t("businessPage.builder.preview.aboutSince", { year: data.establishedYear });

  return (
    <section
      className="mc-about-section mc-about-manifesto"
      data-about="manifesto"
      aria-label={copy.lede || t("businessPage.builder.preview.kicker.about")}
    >
      <div className="mc-about-wrap" ref={rootRef}>
        <div className="mc-abm">
          <p className="mc-abm-kicker" data-about-reveal><span>{kicker}</span></p>
          {copy.lede ? <ManifestoWords text={copy.lede} ghost={copy.ledeGhost} /> : null}
          {(copy.body || copy.bodyGhost) && (
            <p
              className={`mc-abm-body${copy.bodyGhost ? " mc-about-ghost" : ""}`}
              data-about-reveal
              aria-hidden={copy.bodyGhost || undefined}
              style={{ "--about-delay": "120ms" } as CSSProperties}
            >
              {copy.body}
            </p>
          )}
          {stats.length > 0 && (
            <div className="mc-abm-signature" data-about-reveal>
              {stats.map((stat, index) => (
                <div className="mc-abm-cell" key={stat.labelKey}>
                  <span className="mc-abm-number"><AboutStatValue stat={stat} index={index} /></span>
                  <span className="mc-abm-label">{aboutStatLabel(stat, t)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
