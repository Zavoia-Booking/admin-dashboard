import { splitAboutContent } from "../../../../aboutContent";
import { Kicker, CountUp } from "../../../shared/primitives";
import type { AboutVariantProps } from "../types";
import { computeAboutStats } from "../util";

/** Manifesto — a centred statement closed by a counter band (mirrors the source `AboutManifesto`). Same
 *  lede/body split as the editorial default, centred; up to three real stat cells fill the bordered band. */
export function Manifesto({ data, t, no }: AboutVariantProps) {
  const body = data.aboutContent?.trim() ?? "";
  const empty = !body;
  const { title, body: rest } = splitAboutContent(body);
  const lede = title.trim();
  const stats = computeAboutStats(data);

  return (
    <div className="mc-abm">
      <div className="mc-abm-kick">
        <Kicker no={no}>{t("businessPage.builder.preview.kicker.about")}</Kicker>
      </div>
      <p className={`mc-abm-lede${empty ? " mc-about-ghost" : ""}`} aria-hidden={empty || undefined}>
        {empty ? t("businessPage.builder.preview.aboutGhostLede") : lede}
      </p>
      {(empty || rest.trim()) && (
        <p className={`mc-abm-body${empty ? " mc-about-ghost" : ""}`} aria-hidden={empty || undefined}>
          {empty ? t("businessPage.builder.preview.aboutGhostBody") : rest.trim()}
        </p>
      )}
      {stats.length > 0 && (
        <div className="mc-abm-band">
          {stats.map((s, i) => (
            <div key={i} className="mc-abm-cell">
              <span className="mc-abm-n">
                <CountUp value={s.n} decimals={s.dec} delayMs={i * 80} />
              </span>
              <span className="mc-abm-l">{t(s.labelKey)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
