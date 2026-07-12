import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { BookButton } from "../../../shared/primitives";
import { FootDetail } from "../parts/FootDetail";
import { ContactLabel } from "../parts/ContactLabel";
import { FootSocials } from "../parts/FootSocials";
import type { FooterBodyProps } from "../types";

/** Default — editorial closing footer (mirrors the source `MicroFooter`): a "come visit" headline + Book CTA,
 *  then a brand lockup with socials, a selectable locations list with a sliding indicator, the selected
 *  location's address + hours, and get-in-touch. The orchestrator owns the `<footer>` shell + closing wordmark;
 *  this renders only the pad body. */
export function Default({ data, t }: FooterBodyProps) {
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const locs = data.locations;
  const multi = locs.length > 1;

  const [sel, setSel] = useState(0);
  useEffect(() => {
    if (sel >= locs.length) setSel(0);
  }, [locs.length, sel]);
  const here = locs[sel] ?? locs[0] ?? null;

  // Sliding accent indicator glides to the active location row.
  const listRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState<{ y: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const row = listRef.current?.querySelectorAll(".mc-foot-loc")[sel] as HTMLElement | undefined;
    if (row) setInd({ y: row.offsetTop + 7, h: Math.max(0, row.offsetHeight - 14) });
    else setInd(null);
  }, [sel, locs.length, name]);

  // Cap the footer list so it never collides with the giant wordmark; the rest roll into a "+N more" line.
  const LOC_CAP = 4;
  const shown = locs.length > LOC_CAP + 1 ? locs.slice(0, LOC_CAP) : locs;
  const more = locs.length - shown.length;

  const website = data.social.website?.trim();
  const websiteHref = website ? (/^https?:\/\//.test(website) ? website : `https://${website}`) : null;
  const websiteText = website ? website.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;

  const headline =
    multi || !here
      ? t("businessPage.builder.preview.footerComeFind")
      : t("businessPage.builder.preview.contactHeadingLoc", { name: here.name });

  return (
    <div className="mc-foot-pad">
      <div className="mc-foot-top">
        <div className="mc-foot-headline">{headline}</div>
        <BookButton
          label={here ? t("businessPage.builder.preview.bookAt", { name: here.name }) : t("businessPage.builder.preview.book")}
          tone="accent"
          size="lg"
        />
      </div>

      <div className="mc-foot-cols">
        {/* Brand — logo when provided, else wordmark lockup; tagline; socials */}
        <div className="mc-foot-col mc-foot-brand">
          {data.logo ? (
            <img className="mc-foot-logo" src={data.logo} alt={name} />
          ) : (
            <div className="mc-foot-lockup">
              <span className="mc-foot-mark" aria-hidden>
                {name.trim().charAt(0) || "•"}
              </span>
              <span className="mc-foot-wordmark">{name}</span>
            </div>
          )}
          {data.tagline?.trim() && <p className="mc-foot-tag">{data.tagline}</p>}
          <FootSocials social={data.social} />
        </div>

        {/* Locations — selectable list with sliding indicator + capped "+N more" line */}
        {locs.length > 0 && (
          <div className="mc-foot-col">
            <ContactLabel>
              {multi ? t("businessPage.builder.preview.kicker.locations") : t("businessPage.builder.preview.footerWhere")}
            </ContactLabel>
            <div className="mc-foot-locs" ref={listRef}>
              {ind && <span className="mc-foot-loc-ind" aria-hidden style={{ transform: `translateY(${ind.y}px)`, height: ind.h }} />}
              {shown.map((l, i) => (
                <button
                  key={l.id}
                  type="button"
                  className="mc-foot-loc"
                  data-on={i === sel ? "1" : "0"}
                  aria-pressed={i === sel}
                  onClick={() => setSel(i)}
                >
                  <span className="mc-foot-loc-no">{String(i + 1).padStart(2, "0")}</span>
                  <span className="mc-foot-loc-name">{l.name}</span>
                  <span className="mc-foot-loc-mark" aria-hidden>
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </span>
                </button>
              ))}
              {more > 0 && (
                <span className="mc-foot-more">
                  <span className="mc-foot-more-no">+{more}</span>
                  <span className="mc-foot-more-tx">{t("businessPage.builder.preview.footerMore")}</span>
                  <span className="mc-foot-more-mark" aria-hidden>
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Selected location — address + hours */}
        {here && <FootDetail key={here.id} loc={here} t={t} />}

        {/* Get in touch — shared business contact */}
        {(data.email || websiteHref) && (
          <div className="mc-foot-col">
            <ContactLabel>{t("businessPage.builder.preview.contactReach")}</ContactLabel>
            {data.email && (
              <a className="mc-foot-row mc-foot-link" href={`mailto:${data.email.trim()}`}>
                {data.email}
              </a>
            )}
            {websiteHref && websiteText && (
              <a className="mc-foot-row mc-foot-link" href={websiteHref} target="_blank" rel="noreferrer">
                {websiteText}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
