import { useRef } from "react";
import { prettyAddress, telHref } from "../../../shared/contact";
import { FooterLegal } from "../parts/FooterLegal";
import { socialLinks } from "../parts/socials";
import { useFitMark } from "../parts/useFitMark";
import type { FooterViewProps } from "../types";

import "./marque.css";

/** Marque — a warm greige index of site, social and contact links above a fitted uppercase nameplate. */
export function Marque({ data, t, footerRef, links, selectedLocationId, onNavigate }: FooterViewProps) {
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const markRef = useRef<HTMLDivElement>(null);
  useFitMark(markRef, `${name}:${data.fontKey}`, {
    base: 240,
    max: 460,
    min: 40,
    wrapMax: 220,
    wrapBelow: 46,
  });

  const location = data.locations.find((item) => item.id === selectedLocationId) ?? data.locations[0] ?? null;
  const addressBase = location ? prettyAddress(location) : "";
  const postalCode = location?.addressComponents?.postalCode?.trim();
  const address = [addressBase, postalCode && !addressBase.includes(postalCode) ? postalCode : ""]
    .filter(Boolean)
    .join(", ");
  const phone = location?.phone?.trim() || data.phone?.trim();
  const email = data.email?.trim();
  const socials = socialLinks(data.social);
  const hasContact = !!(address || phone || email);
  const columnCount = 1 + Number(socials.length > 0) + Number(hasContact);

  const navigate = (event: React.MouseEvent<HTMLAnchorElement>, type: string) => {
    event.preventDefault();
    onNavigate(type);
  };

  return (
    <footer ref={footerRef} className="mc-footer mc-footer--marque" data-preview-section="footer">
      <div className="mc-fmq">
        <div className="mc-fmq-rule" aria-hidden />

        <div
          className="mc-fmq-top"
          data-columns={columnCount}
          data-has-contact={hasContact ? "true" : "false"}
        >
          <nav className="mc-fmq-col" aria-label={t("businessPage.builder.preview.footerExplore")}>
            {links.map((link) => (
              <a
                key={link.type}
                className="mc-fmq-link"
                href={`#${link.type}`}
                onClick={(event) => navigate(event, link.type)}
              >
                <span className="mc-fmq-box" aria-hidden>[ ]</span>
                <span>{link.label}</span>
              </a>
            ))}
            <span className="mc-fmq-link mc-fmq-link--decorative">
              <span className="mc-fmq-box" aria-hidden>[ ]</span>
              <span>{t("businessPage.builder.preview.book")}</span>
            </span>
          </nav>

          {socials.length > 0 && (
            <nav className="mc-fmq-col" aria-label={t("businessPage.builder.preview.footerFollow")}>
              {socials.map((social) => (
                <a
                  key={social.key}
                  className="mc-fmq-link"
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="mc-fmq-box" aria-hidden>[ ]</span>
                  <span>{social.label}</span>
                </a>
              ))}
            </nav>
          )}

          {hasContact && (
            <dl className="mc-fmq-contact">
              {address && (
                <div className="mc-fmq-crow">
                  <dt>A</dt>
                  <dd>{address}</dd>
                </div>
              )}
              {phone && (
                <div className="mc-fmq-crow">
                  <dt>P</dt>
                  <dd><a href={telHref(phone)}>{phone}</a></dd>
                </div>
              )}
              {email && (
                <div className="mc-fmq-crow">
                  <dt>E</dt>
                  <dd><a className="mc-fmq-email" href={`mailto:${email}`}>{email}</a></dd>
                </div>
              )}
            </dl>
          )}
        </div>

        <div className="mc-fmq-bottom">
          <div className="mc-fmq-legal"><FooterLegal data={data} t={t} /></div>
          <div ref={markRef} className="mc-fmq-mark">{name}</div>
        </div>
      </div>
    </footer>
  );
}
