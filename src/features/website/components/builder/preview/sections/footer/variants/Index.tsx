import { ArrowRight } from "lucide-react";
import { prettyAddress, mapHref } from "../../../shared/contact";
import { socialLinks } from "../parts/socials";
import type { FooterBodyProps } from "../types";

/** Index — the footer as a numbered ledger: book · locations · write · follow. The book row is decorative
 *  in the preview; the rest are real mailto / map / social links. Mirrors the source `index`. */
export function Index({ data, t }: FooterBodyProps) {
  const locs = data.locations;
  const multi = locs.length > 1;
  const socials = socialLinks(data.social);
  const email = data.email?.trim();

  return (
    <div className="mc-foot-pad">
      <div className="mc-fix">
        <div className="mc-fix-row">
          <span className="mc-fix-head">
            <span className="mc-fix-no">01</span>
            <span className="mc-fix-ttl">{t("businessPage.builder.preview.footerBookAVisit")}</span>
            <span className="mc-fix-end" aria-hidden>
              <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </span>
          </span>
        </div>

        {locs.length > 0 && (
          <div className="mc-fix-row">
            <div className="mc-fix-head">
              <span className="mc-fix-no">02</span>
              <span className="mc-fix-ttl">
                {multi ? t("businessPage.builder.preview.kicker.locations") : t("businessPage.builder.preview.footerWhere")}
              </span>
              <span className="mc-fix-end">{locs.length}</span>
            </div>
            <div className="mc-fix-sub">
              {locs.map((l) => {
                const addr = l.address?.trim() || prettyAddress(l);
                const map = mapHref(l);
                const meta = [addr, l.phone?.trim()].filter(Boolean).join(" · ");
                const inner = (
                  <>
                    <span className="mc-fix-loc-nm">{l.name}</span>
                    {meta && <span className="mc-fix-loc-x">{meta}</span>}
                  </>
                );
                return map ? (
                  <a key={l.id} className="mc-fix-loc" href={map} target="_blank" rel="noreferrer">
                    {inner}
                  </a>
                ) : (
                  <span key={l.id} className="mc-fix-loc">
                    {inner}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {email && (
          <div className="mc-fix-row">
            <a className="mc-fix-head" href={`mailto:${email}`}>
              <span className="mc-fix-no">03</span>
              <span className="mc-fix-ttl">{t("businessPage.builder.preview.footerWriteToUs")}</span>
              <span className="mc-fix-end">{email}</span>
            </a>
          </div>
        )}

        {socials.length > 0 && (
          <div className="mc-fix-row">
            <div className="mc-fix-head">
              <span className="mc-fix-no">04</span>
              <span className="mc-fix-ttl">{t("businessPage.builder.preview.footerFollow")}</span>
            </div>
            <div className="mc-fix-sub">
              <div className="mc-fix-inline">
                {socials.map((s) => (
                  <a key={s.key} href={s.url} target="_blank" rel="noreferrer">
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
