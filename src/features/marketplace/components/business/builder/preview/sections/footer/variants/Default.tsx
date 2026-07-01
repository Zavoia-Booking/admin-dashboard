import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, Sparkles, Instagram, Facebook, Globe, Music2, Link2, type LucideIcon } from "lucide-react";
import { BookButton } from "../../../shared/primitives";
import type { PreviewData } from "../../../shared/types";
import { FootDetail } from "../parts/FootDetail";
import { ContactLabel } from "../parts/ContactLabel";
import type { FooterVariantProps } from "../types";

/** Fit a single-line wordmark edge-to-edge: measure its natural width at a reference size and scale the
 *  font so the text spans its padded column (mirrors the source footer's fit-to-width closing name). The
 *  footer is this hook's only consumer, so it lives here rather than in shared/hooks. */
function useFitText(ref: React.RefObject<HTMLElement | null>, dep: string) {
  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const fit = () => {
      el.style.fontSize = "100px";
      const avail = parent.clientWidth;
      const textW = el.scrollWidth;
      if (!avail || !textW) return;
      el.style.fontSize = `${Math.max(34, Math.min((100 * avail) / textW, 240)).toFixed(1)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [ref, dep]);
}

/** Default — editorial closing footer (mirrors the source `MicroFooter`): a "come visit" headline + Book CTA,
 *  then a brand lockup with socials, a selectable locations list with a sliding indicator, the selected
 *  location's address + hours, and get-in-touch — closed by a giant fit-to-width wordmark. The whole panel is
 *  pinned behind the page and uncovered on scroll (see `.mc-footer` / `useFooterReveal`). */
export function Default({ data, t, footerRef }: FooterVariantProps) {
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const locs = data.locations;
  const multi = locs.length > 1;
  const socials = buildSocials(data.social);
  const year = new Date().getFullYear();

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

  const nameRef = useRef<HTMLDivElement>(null);
  useFitText(nameRef, name);

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
    <footer className="mc-footer" ref={footerRef as React.RefObject<HTMLElement>}>
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
            {socials.length > 0 && (
              <div className="mc-foot-social">
                {socials.map((s) => (
                  <span key={s.key} className="mc-foot-soc" title={s.label} aria-hidden>
                    <s.Icon className="h-[17px] w-[17px]" strokeWidth={1.7} />
                  </span>
                ))}
              </div>
            )}
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

      <div className="mc-foot-pad mc-foot-bottom">
        <div ref={nameRef} className="mc-foot-name">
          {name}
        </div>
        <div className="mc-foot-base">
          <span>{t("businessPage.builder.preview.footer.rights", { year, name })}</span>
          <span className="mc-foot-zav">
            <Sparkles className="h-3 w-3" strokeWidth={1.6} style={{ color: "var(--mc-accent)" }} />
            {t("businessPage.builder.preview.footer.poweredBy")}
          </span>
        </div>
      </div>
    </footer>
  );
}

/** Owner's social links, in display order, dropping any that aren't set. */
function buildSocials(social: PreviewData["social"]): { key: string; label: string; url: string; Icon: LucideIcon }[] {
  const all: { key: string; label: string; url?: string | null; Icon: LucideIcon }[] = [
    { key: "instagram", label: "Instagram", url: social.instagram, Icon: Instagram },
    { key: "facebook", label: "Facebook", url: social.facebook, Icon: Facebook },
    { key: "tiktok", label: "TikTok", url: social.tiktok, Icon: Music2 },
    { key: "website", label: "Website", url: social.website, Icon: Globe },
    { key: "pinterest", label: "Pinterest", url: social.pinterest, Icon: Link2 },
  ];
  return all.filter((s): s is { key: string; label: string; url: string; Icon: LucideIcon } => !!s.url);
}
