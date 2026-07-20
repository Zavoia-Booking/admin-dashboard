import { useRef, type CSSProperties } from "react";
import { AboutImage, AboutStatValue, RisingWords } from "../parts";
import { useAboutReveal } from "../motion";
import type { AboutVariantProps } from "../types";
import { aboutCopy, aboutStatLabel, computeAboutStats } from "../util";
import "./editorial.css";

export function Editorial({ data, t, media, showStats, headlineHidden }: AboutVariantProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useAboutReveal(rootRef);
  const copy = aboutCopy(data, t, headlineHidden);
  const stats = showStats ? computeAboutStats(data) : [];
  const bodyCharacters = Array.from(copy.body);
  const hasBody = bodyCharacters.length > 0;
  const storyWordCount = hasBody ? copy.body.split(/\s+/).length : 0;
  const storySize = storyWordCount === 0 ? "none" : storyWordCount <= 90 ? "short" : "long";

  return (
    <section
      className="mc-about-section mc-about-editorial"
      data-about="editorial"
      aria-label={copy.lede || t("businessPage.builder.preview.kicker.about")}
    >
      <div className="mc-about-wrap" ref={rootRef}>
        <div className="mc-abe">
          <div className="mc-abe-meta" data-about-reveal>
            <span>{t("businessPage.builder.preview.kicker.about")}</span>
            {data.establishedYear !== null && (
              <>
                <span className="mc-abe-separator" aria-hidden="true">—</span>
                <span>{t("businessPage.builder.preview.aboutEstablishedShort", { year: data.establishedYear })}</span>
              </>
            )}
          </div>

          {copy.lede ? (
            <RisingWords text={copy.lede} className="mc-abe-lede" ghost={copy.ledeGhost} />
          ) : null}

          {(hasBody || media) && (
            <div
              className="mc-abe-spread"
              data-has-body={hasBody ? "true" : "false"}
              data-has-media={media ? "true" : "false"}
              data-story-size={storySize}
            >
              {hasBody && (
                <div className="mc-abe-copy">
                  <p
                    className={`mc-abe-body${copy.bodyGhost ? " mc-about-ghost" : ""}`}
                    data-about-reveal
                    aria-hidden={copy.bodyGhost || undefined}
                  >
                    <span className="mc-abe-drop" aria-hidden="true">{bodyCharacters[0]}</span>
                    {bodyCharacters.slice(1).join("")}
                  </p>
                </div>
              )}

              {media && (
                <div
                  className="mc-abe-figure-wrap"
                  data-about-reveal
                  style={{ "--about-delay": "80ms" } as CSSProperties}
                >
                  <figure className="mc-abe-figure">
                    <AboutImage media={media} className="mc-abe-image" />
                  </figure>
                </div>
              )}
            </div>
          )}

          {stats.length > 0 && (
            <div className="mc-abe-stats" data-count={stats.length}>
              {stats.map((stat, index) => (
                <div
                  className="mc-abe-stat"
                  data-about-reveal
                  key={stat.labelKey}
                  style={{ "--about-delay": `${index * 80}ms` } as CSSProperties}
                >
                  <div className="mc-abe-stat-number"><AboutStatValue stat={stat} index={index} /></div>
                  <div className="mc-abe-stat-label">{aboutStatLabel(stat, t)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
