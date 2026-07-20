import { useMemo, useRef, type CSSProperties } from "react";
import { AboutImage, AboutStatValue, RisingWords, StoryCta } from "../parts";
import { useAboutReveal, useStoryProgress } from "../motion";
import type { AboutVariantProps } from "../types";
import { aboutBeats, aboutCopy, aboutStatLabel, computeAboutStats } from "../util";
import "./story.css";

export function Story({ data, t, media, showStats, headlineHidden }: AboutVariantProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  useAboutReveal(rootRef);
  const copy = aboutCopy(data, t, headlineHidden);
  const beats = useMemo(() => aboutBeats(copy.body, data.locale), [copy.body, data.locale]);
  const hasStory = beats.length > 0;
  useStoryProgress(flowRef, beats.length);
  const stats = showStats ? computeAboutStats(data) : [];
  const hasRightContent = hasStory || stats.length > 0;
  const established = data.establishedYear === null
    ? t("businessPage.builder.preview.aboutStory")
    : t("businessPage.builder.preview.aboutEstablished", { year: data.establishedYear });

  return (
    <section
      className="mc-about-section mc-about-story"
      data-about="sticky"
      aria-label={copy.lede || t("businessPage.builder.preview.kicker.about")}
    >
      <div className="mc-about-wrap" ref={rootRef}>
        <div className="mc-abs" data-has-flow={hasRightContent ? "true" : "false"}>
          <div className="mc-abs-pin">
            {copy.lede ? (
              <RisingWords text={copy.lede} className="mc-abs-lede" ghost={copy.ledeGhost} />
            ) : null}
            <p className="mc-abs-established" data-about-reveal style={{ "--about-delay": "90ms" } as CSSProperties}>
              {established}
            </p>
            <div data-about-reveal style={{ "--about-delay": "150ms" } as CSSProperties}>
              <StoryCta label={t("businessPage.builder.preview.aboutBookVisit")} />
            </div>

            {media && (
              <figure
                className="mc-abs-figure"
                data-about-reveal
                style={{ "--about-delay": "210ms" } as CSSProperties}
              >
                <AboutImage media={media} className="mc-abs-image" />
              </figure>
            )}
          </div>

          {hasRightContent && (
            <div className="mc-abs-flow">
              {hasStory && (
                <div className="mc-abs-beats" ref={flowRef}>
                  <span className="mc-abs-rail" aria-hidden="true"><span className="mc-abs-rail-fill" data-about-rail-fill /></span>
                  {beats.map((beat, index) => (
                    <div className="mc-abs-beat" data-about-beat data-on={index === 0 ? "true" : "false"} key={`${beat}-${index}`}>
                      <span className="mc-abs-index">{String(index + 1).padStart(2, "0")}</span>
                      <p className={`mc-abs-text${copy.bodyGhost ? " mc-about-ghost" : ""}`} aria-hidden={copy.bodyGhost || undefined}>{beat}</p>
                    </div>
                  ))}
                </div>
              )}

              {stats.length > 0 && (
                <div className="mc-abs-stats">
                  {stats.map((stat, index) => (
                    <div
                      className="mc-abs-stat"
                      data-about-reveal
                      key={stat.labelKey}
                      style={{ "--about-delay": `${index * 70}ms` } as CSSProperties}
                    >
                      <span className="mc-abs-number"><AboutStatValue stat={stat} index={index} /></span>
                      <span className="mc-abs-label">{aboutStatLabel(stat, t)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
