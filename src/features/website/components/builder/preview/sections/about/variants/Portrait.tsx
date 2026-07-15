import { splitAboutContent } from "../../../../aboutContent";
import { Kicker, CountUp } from "../../../shared/primitives";
import { locationPhoto } from "../../../shared/contact";
import type { AboutVariantProps } from "../types";
import { computeAboutStats } from "../util";

/** Portrait — a representative photo column beside the lede/body, stats in a 2-up grid (mirrors the source
 *  AboutPortrait). Photo = the hero cover, else the first location's featured/portfolio image, else an accent
 *  field. Caption is the business name (the source's "est. {year}" is dropped — no field). */
export function Portrait({ data, t, no }: AboutVariantProps) {
  const raw = data.aboutContent?.trim() ?? "";
  const { title, body } = raw ? splitAboutContent(raw) : { title: "", body: "" };
  const lede = title.trim();
  const rest = body.trim();
  const photo = data.heroImageUrl || data.locations.map(locationPhoto).find(Boolean) || null;
  const stats = computeAboutStats(data);

  return (
    <div className="mc-abp">
      <div className="mc-abp-fig mc-mask-in">
        {photo ? (
          <img src={photo} alt={data.businessName} loading="lazy" decoding="async" className="mc-abp-img" />
        ) : (
          <div className="mc-abp-img" style={{ background: "var(--mc-accent-field)" }} />
        )}
        <span className="mc-abp-cap">{data.businessName}</span>
      </div>
      <div>
        <Kicker no={no}>{t("businessPage.builder.preview.kicker.about")}</Kicker>
        {raw ? (
          <>
            <p className="mc-abp-lede">{lede}</p>
            {rest && <p className="mc-abp-body">{rest}</p>}
          </>
        ) : (
          // Empty: the real layout with desaturated sample copy (aria-hidden ghost), matching the editorial default.
          <div className="mc-about-ghost" aria-hidden>
            <p className="mc-abp-lede">{t("businessPage.builder.preview.aboutGhostLede")}</p>
            <p className="mc-abp-body">{t("businessPage.builder.preview.aboutGhostBody")}</p>
          </div>
        )}
        {stats.length > 0 && (
          <div className="mc-abp-stats">
            {stats.map((s, i) => (
              <div key={i} className="mc-abp-stat">
                <span className="mc-abp-n">
                  <CountUp value={s.n} decimals={s.dec} delayMs={160 + i * 70} />
                </span>
                <span className="mc-abp-l">{t(s.labelKey)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
