import { useRef } from "react";
import { mapHref, telHref } from "../../../shared/contact";
import { FootSocials } from "../parts/FootSocials";
import { FooterLegal } from "../parts/FooterLegal";
import { useFitMark } from "../parts/useFitMark";
import { socialLinks } from "../parts/socials";
import type { FooterViewProps } from "../types";

import "./masthead.css";

const absoluteUrl = (value: string) => /^https?:\/\//i.test(value) ? value : `https://${value}`;

/** Masthead — a dark four-column sitemap crossed by full-height rules and closed by a fitted, bleeding
 * wordmark. Builder section links scroll inside the preview; contact, social and map links remain real. */
export function Masthead({ data, t, footerRef, links, selectedLocationId, onNavigate }: FooterViewProps) {
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const markRef = useRef<HTMLDivElement>(null);
  useFitMark(markRef, `${name}:${data.fontKey}`, {
    base: 240,
    max: 400,
    min: 44,
    wrapMax: 200,
    wrapBelow: 48,
    onSize: (fontSize, lines, element) => {
      const wrapper = element.parentElement;
      if (wrapper) wrapper.style.height = `${Math.round(fontSize * (lines > 1 ? lines * 0.95 - 0.15 : 0.64))}px`;
      element.style.bottom = `${Math.round(-fontSize * 0.15)}px`;
    },
  });

  const primaryLocation = data.locations.find((location) => location.id === selectedLocationId) ?? data.locations[0] ?? null;
  const phone = primaryLocation?.phone?.trim() || data.phone?.trim();
  const email = data.email?.trim();
  const website = data.social.website?.trim();
  const websiteHref = website ? absoluteUrl(website) : null;
  const websiteLabel = website?.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  const socials = socialLinks(data.social);
  const columnCount = Number(links.length > 0)
    + Number(data.locations.length > 0)
    + 1
    + Number(socials.length > 0);
  const locationsLabel = data.locations.length > 1
    ? t("businessPage.builder.preview.kicker.locations")
    : t("businessPage.builder.preview.footerWhere");

  const navigate = (event: React.MouseEvent<HTMLAnchorElement>, type: string) => {
    event.preventDefault();
    onNavigate(type);
  };

  return (
    <footer ref={footerRef} className="mc-footer mc-footer--masthead" data-preview-section="footer">
      <div className="mc-fmh" data-columns={columnCount}>
        <div className="mc-fmh-rules" aria-hidden />

        <div className="mc-fmh-cols">
          {links.length > 0 && (
            <nav className="mc-fmh-col" aria-label={t("businessPage.builder.preview.footerExplore")}>
              <div className="mc-fmh-h">{t("businessPage.builder.preview.footerExplore")}</div>
              {links.map((link) => (
                <a
                  key={link.type}
                  className="mc-fmh-link"
                  href={`#${link.type}`}
                  onClick={(event) => navigate(event, link.type)}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          {data.locations.length > 0 && (
            <nav className="mc-fmh-col" aria-label={locationsLabel}>
              <div className="mc-fmh-h">{locationsLabel}</div>
              {data.locations.map((location) => {
                const href = mapHref(location);
                return href ? (
                  <a
                    key={location.id}
                    className="mc-fmh-link"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {location.name}
                  </a>
                ) : (
                  <span key={location.id} className="mc-fmh-link mc-fmh-link--static">
                    {location.name}
                  </span>
                );
              })}
            </nav>
          )}

          <nav className="mc-fmh-col mc-fmh-contact" aria-label={t("businessPage.builder.preview.contactReach")}>
            <div className="mc-fmh-h">{t("businessPage.builder.preview.contactReach")}</div>
            {email && <a className="mc-fmh-link" href={`mailto:${email}`}>{email}</a>}
            {phone && <a className="mc-fmh-link" href={telHref(phone)}>{phone}</a>}
            {websiteHref && websiteLabel && (
              <a
                className="mc-fmh-link"
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                {websiteLabel}
              </a>
            )}
            <span className="mc-fmh-link mc-fmh-link--decorative">
              {t("businessPage.builder.preview.book")}
            </span>
          </nav>

          {socials.length > 0 && (
            <div
              className="mc-fmh-col mc-fmh-connect"
              role="group"
              aria-label={t("businessPage.builder.preview.footerStayConnected")}
            >
              <div className="mc-fmh-h">{t("businessPage.builder.preview.footerStayConnected")}</div>
              <FootSocials social={data.social} />
            </div>
          )}
        </div>

        <div className="mc-fmh-base"><FooterLegal data={data} t={t} /></div>

        <div className="mc-fmh-mark-wrap" aria-hidden>
          <div ref={markRef} className="mc-fmh-mark">{name}</div>
        </div>
      </div>
    </footer>
  );
}
