import { splitAboutContent } from "../../../../aboutContent";
import { DISPLAY } from "../../../shared/constants";
import { Kicker, CountUp } from "../../../shared/primitives";
import type { AboutVariantProps } from "../types";
import { computeAboutStats } from "../util";

/** The serif lede (headline) + muted body for the About section, split on the first blank line via the
 *  shared {@link splitAboutContent} contract and trimmed for display — so editor, preview and validation
 *  all agree on where the break falls. No blank line ⇒ the whole text is the lede. */
function splitLede(text: string): { lede: string; body: string } {
  const { title, body } = splitAboutContent(text);
  return { lede: title.trim(), body: body.trim() };
}

/** Default — the editorial split: the numbered kicker in a slim left rail, lede + body in the wide column. */
export function Default({ data, t, no }: AboutVariantProps) {
  const body = data.aboutContent?.trim() ?? "";
  const { lede, body: rest } = body ? splitLede(body) : { lede: "", body: "" };

  const Copy = body ? (
    <>
      <p className="text-balance" style={{ ...DISPLAY, fontSize: "clamp(21px,4cqw,40px)", lineHeight: 1.26 }}>
        {lede}
      </p>
      {rest && (
        <p className="mt-6 max-w-[62ch] whitespace-pre-line text-[15px] leading-relaxed" style={{ color: "var(--mc-muted)" }}>
          {rest}
        </p>
      )}
    </>
  ) : (
    // Empty: render the real editorial layout with sample copy, desaturated, so the owner sees the shape
    // they'll fill rather than a dashed placeholder box. aria-hidden — it's a ghost, not real content.
    <div className="select-none opacity-35" aria-hidden>
      <p className="text-balance" style={{ ...DISPLAY, fontSize: "clamp(21px,4cqw,40px)", lineHeight: 1.26 }}>
        {t("businessPage.builder.preview.aboutGhostLede")}
      </p>
      <p className="mt-6 max-w-[62ch] text-[15px] leading-relaxed" style={{ color: "var(--mc-muted)" }}>
        {t("businessPage.builder.preview.aboutGhostBody")}
      </p>
    </div>
  );

  // Close the editorial split with a band of real, derived business numbers (locations / team / rating).
  const stats = computeAboutStats(data);

  return (
    // Editorial split — the numbered kicker in a slim left rail, lede + body in the wide column, closed by a
    // stat band. On a narrow preview (mobile) it stacks to one column (mirrors the microsite's collapse).
    <>
      <div className="grid items-start gap-[clamp(18px,3.5cqw,56px)] grid-cols-1 @2xl:[grid-template-columns:minmax(0,0.7fr)_minmax(0,2.3fr)]">
        <Kicker no={no}>{t("businessPage.builder.preview.kicker.about")}</Kicker>
        <div>{Copy}</div>
      </div>
      {stats.length > 0 && (
        <div className="mc-stats">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="mc-stat-n">
                <CountUp value={s.n} decimals={s.dec} delayMs={i * 80} />
              </div>
              <div className="mc-stat-l">{t(s.labelKey)}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
