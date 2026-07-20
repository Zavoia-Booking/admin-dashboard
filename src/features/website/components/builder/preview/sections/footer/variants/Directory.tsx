import { ArrowRight } from "lucide-react";
import { mapHref, telHref } from "../../../shared/contact";
import { FootSocials } from "../parts/FootSocials";
import { FooterLegal } from "../parts/FooterLegal";
import type { FooterViewProps } from "../types";

import "./directory.css";

const absoluteUrl = (value: string) => /^https?:\/\//i.test(value) ? value : `https://${value}`;

/** Directory — the included dark sitemap footer. Its links are derived from the visible builder layout;
 * external contact/location destinations stay real while the booking treatment remains decorative. */
export function Directory({ data, t, footerRef, links, selectedLocationId, showLogo, description, onNavigate }: FooterViewProps) {
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const initial = name.trim().charAt(0) || "•";
  const longName = name.trim().length > 24;
  const email = data.email?.trim();
  const primaryLocation = data.locations.find((location) => location.id === selectedLocationId) ?? data.locations[0] ?? null;
  const phone = primaryLocation?.phone?.trim() || data.phone?.trim();
  const website = data.social.website?.trim();
  const websiteHref = website ? absoluteUrl(website) : null;
  const websiteLabel = website?.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  const hasContact = !!(email || phone || (websiteHref && websiteLabel));
  const columnCount = Number(links.length > 0)
    + Number(data.locations.length > 0)
    + Number(hasContact)
    + 1;
  const locationsLabel = data.locations.length > 1
    ? t("businessPage.builder.preview.kicker.locations")
    : t("businessPage.builder.preview.footerWhere");

  const navigate = (event: React.MouseEvent<HTMLAnchorElement>, type: string) => {
    event.preventDefault();
    onNavigate(type);
  };

  return (
    <footer ref={footerRef} data-preview-section="footer" className="mc-footer mc-footer--directory">
      <div className="mc-foot-pad mc-fdir">
        <div className="mc-fdir-top">
          <a
            href="#top"
            className="mc-fdir-brand"
            aria-label={name}
            onClick={(event) => navigate(event, "hero")}
          >
            {data.logo && showLogo ? (
              <img
                className="mc-fdir-logo"
                src={data.logo}
                alt=""
                loading="lazy"
                decoding="async"
              />
            ) : (
              <>
                <span className="mc-mast-mark" aria-hidden>{initial}</span>
                <span className={`mc-wordmark${longName ? " mc-wordmark--long" : ""}`}>{name}</span>
              </>
            )}
          </a>
          {description && <p className="mc-fdir-statement">{description}</p>}
        </div>

        <div className="mc-fdir-rule" aria-hidden />

        <div className="mc-fdir-main" data-columns={columnCount}>
          {links.length > 0 && (
            <nav className="mc-fdir-col" aria-label={t("businessPage.builder.preview.footerExplore")}>
              <div className="mc-fdir-h">{t("businessPage.builder.preview.footerExplore")}</div>
              {links.map((link) => (
                <a
                  key={link.type}
                  className="mc-fdir-link"
                  href={`#${link.type}`}
                  onClick={(event) => navigate(event, link.type)}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          {data.locations.length > 0 && (
            <nav className="mc-fdir-col" aria-label={locationsLabel}>
              <div className="mc-fdir-h">{locationsLabel}</div>
              {data.locations.map((location) => {
                const href = mapHref(location);
                return href ? (
                  <a
                    key={location.id}
                    className="mc-fdir-link"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {location.name}
                  </a>
                ) : (
                  <span key={location.id} className="mc-fdir-link mc-fdir-link--static">
                    {location.name}
                  </span>
                );
              })}
            </nav>
          )}

          {hasContact && (
            <nav className="mc-fdir-col" aria-label={t("businessPage.builder.preview.contactReach")}>
              <div className="mc-fdir-h">{t("businessPage.builder.preview.contactReach")}</div>
              {email && <a className="mc-fdir-link" href={`mailto:${email}`}>{email}</a>}
              {phone && <a className="mc-fdir-link" href={telHref(phone)}>{phone}</a>}
              {websiteHref && websiteLabel && (
                <a
                  className="mc-fdir-link"
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {websiteLabel}
                </a>
              )}
            </nav>
          )}

          <div className="mc-fdir-util">
            <div className="mc-fdir-util-row">
              <span className="mc-fdir-book">
                <span>{t("businessPage.builder.preview.book")}</span>
                <ArrowRight aria-hidden size={13} strokeWidth={1.8} />
              </span>
              <FootSocials social={data.social} />
            </div>
          </div>
        </div>

        <div className="mc-fdir-base"><FooterLegal data={data} t={t} /></div>
      </div>
    </footer>
  );
}
