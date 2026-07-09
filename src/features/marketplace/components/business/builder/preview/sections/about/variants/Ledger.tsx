import { splitAboutContent } from "../../../../aboutContent";
import { Kicker, CountUp } from "../../../shared/primitives";
import type { AboutVariantProps } from "../types";
import { computeAboutStats } from "../util";

/** Ledger — the lede/body head, then each real stat as a full-width numbered row (mirrors the source
 *  `AboutLedger`). The row layout tolerates 2-3 stats cleanly (unlike a fixed grid). Rows enter staggered. */
export function Ledger({ data, t, no }: AboutVariantProps) {
  const body = data.aboutContent?.trim() ?? "";
  const empty = !body;
  const { title, body: rest } = splitAboutContent(body);
  const lede = title.trim();
  const stats = computeAboutStats(data);

  return (
    <>
      <div className="mc-abl-head">
        <Kicker no={no}>{t("businessPage.builder.preview.kicker.about")}</Kicker>
        <p className={`mc-abl-lede${empty ? " mc-about-ghost" : ""}`} aria-hidden={empty || undefined}>
          {empty ? t("businessPage.builder.preview.aboutGhostLede") : lede}
        </p>
        {(empty || rest.trim()) && (
          <p className={`mc-abl-body${empty ? " mc-about-ghost" : ""}`} aria-hidden={empty || undefined}>
            {empty ? t("businessPage.builder.preview.aboutGhostBody") : rest.trim()}
          </p>
        )}
      </div>
      {stats.length > 0 && (
        <div className="mc-abl">
          {stats.map((s, i) => (
            <div key={i} className="mc-abl-row mc-mask-in" style={{ animationDelay: `${i * 70}ms` }}>
              <span className="mc-abl-idx">{String(i + 1).padStart(2, "0")}</span>
              <span className="mc-abl-n">
                <CountUp value={s.n} decimals={s.dec} delayMs={i * 70} />
              </span>
              <span className="mc-abl-l">{t(s.labelKey)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
