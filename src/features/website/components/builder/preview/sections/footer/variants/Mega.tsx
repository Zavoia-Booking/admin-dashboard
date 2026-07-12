import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { telHref } from "../../../shared/contact";
import { ContactLabel } from "../parts/ContactLabel";
import { FootSocials } from "../parts/FootSocials";
import { socialLinks } from "../parts/socials";
import type { FooterBodyProps } from "../types";

/** Mega — one enormous action: a giant "book your visit" CTA over a single hairline row of essentials
 *  (write · call · locations · follow). The CTA is decorative in the preview. Mirrors the source `mega`. */
export function Mega({ data, t }: FooterBodyProps) {
  const locs = data.locations;
  const multi = locs.length > 1;

  const [sel, setSel] = useState(0);
  useEffect(() => {
    if (sel >= locs.length) setSel(0);
  }, [locs.length, sel]);
  const here = locs[sel] ?? locs[0] ?? null;
  const phone = here?.phone?.trim();
  const hasSocials = socialLinks(data.social).length > 0;

  return (
    <div className="mc-foot-pad mc-fmg">
      <div className="mc-fmg-kick">
        <ContactLabel>{t("businessPage.builder.preview.footerReady")}</ContactLabel>
      </div>
      <span className="mc-fmg-btn">
        {t("businessPage.builder.preview.footerBookVisit")}
        <span className="mc-fmg-arr" aria-hidden>
          <ArrowRight strokeWidth={1.6} />
        </span>
      </span>
      <div className="mc-fmg-row">
        {data.email && (
          <div className="mc-fmg-cell">
            <ContactLabel>{t("businessPage.builder.preview.footerWrite")}</ContactLabel>
            <a className="mc-foot-row mc-foot-link" href={`mailto:${data.email.trim()}`}>
              {data.email}
            </a>
          </div>
        )}
        {phone && (
          <div className="mc-fmg-cell">
            <ContactLabel>
              {multi && here ? t("businessPage.builder.preview.footerCallLoc", { name: here.name }) : t("businessPage.builder.preview.footerCall")}
            </ContactLabel>
            <a className="mc-foot-row mc-foot-link" href={telHref(phone)}>
              {phone}
            </a>
          </div>
        )}
        {multi && (
          <div className="mc-fmg-cell">
            <ContactLabel>{t("businessPage.builder.preview.kicker.locations")}</ContactLabel>
            <div className="mc-fmg-cities">
              {locs.map((l, i) => (
                <button key={l.id} type="button" className="mc-fmg-city" data-on={i === sel ? "1" : "0"} onClick={() => setSel(i)}>
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {hasSocials && (
          <div className="mc-fmg-cell">
            <ContactLabel>{t("businessPage.builder.preview.footerFollow")}</ContactLabel>
            <FootSocials social={data.social} />
          </div>
        )}
      </div>
    </div>
  );
}
