import { useLayoutEffect, useRef, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../../../../../../shared/components/ui/collapsible";
import { AutoHeight } from "../../../../AutoHeight";
import { mapHref, telHref } from "../../../shared/contact";
import { FootSocials } from "../parts/FootSocials";
import { FooterLegal } from "../parts/FooterLegal";
import { socialLinks } from "../parts/socials";
import { useFitMark } from "../parts/useFitMark";
import type { FooterViewProps } from "../types";

import "./signature.css";

type SignatureItem = {
  label: string;
  href?: string;
  type?: string;
  external?: boolean;
};

type SignatureColumn = {
  title: string;
  items: SignatureItem[];
};

const absoluteUrl = (value: string) => /^https?:\/\//i.test(value) ? value : `https://${value}`;

/** Signature — a full-width display mark followed by social and sitemap columns. At phone width, the three
 * columns become accessible disclosure rows while preserving the design's exact ordering. */
export function Signature({ data, t, footerRef, links, selectedLocationId, onNavigate }: FooterViewProps) {
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const markRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  useFitMark(markRef, `${name}:${data.fontKey}`, { base: 240, max: 340, min: 30, wrapMax: 190, wrapBelow: 48 });

  const location = data.locations.find((item) => item.id === selectedLocationId) ?? data.locations[0] ?? null;
  const email = data.email?.trim();
  const phone = location?.phone?.trim() || data.phone?.trim();
  const website = data.social.website?.trim();
  const websiteLabel = website?.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  const socials = socialLinks(data.social);
  const [openColumns, setOpenColumns] = useState<Record<number, boolean>>({});
  const [compact, setCompact] = useState(false);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const measure = () => setCompact(shell.clientWidth <= 720);
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(shell);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const columns: SignatureColumn[] = [];
  if (links.length > 0) {
    columns.push({
      title: t("businessPage.builder.preview.footerExplore"),
      items: links.map((link) => ({ label: link.label, href: `#${link.type}`, type: link.type })),
    });
  }
  if (data.locations.length > 0) {
    columns.push({
      title: data.locations.length > 1
        ? t("businessPage.builder.preview.kicker.locations")
        : t("businessPage.builder.preview.footerWhere"),
      items: data.locations.map((item) => {
        const href = mapHref(item);
        return { label: item.name, href: href ?? undefined, external: !!href };
      }),
    });
  }
  const contactItems: SignatureItem[] = [];
  if (email) contactItems.push({ label: email, href: `mailto:${email}` });
  if (phone) contactItems.push({ label: phone, href: telHref(phone) });
  if (website && websiteLabel) contactItems.push({ label: websiteLabel, href: absoluteUrl(website), external: true });
  if (contactItems.length > 0) {
    columns.push({ title: t("businessPage.builder.preview.contactReach"), items: contactItems });
  }

  return (
    <footer ref={footerRef} className="mc-footer mc-footer--signature" data-preview-section="footer">
      <div
        ref={shellRef}
        className="mc-fsig"
        data-has-follow={socials.length > 0 ? "true" : "false"}
        data-has-links={columns.length > 0 ? "true" : "false"}
      >
        <div className="mc-fsig-mark-wrap">
          <div ref={markRef} className="mc-fsig-mark">{name}</div>
        </div>

        {socials.length > 0 && (
          <div className="mc-fsig-follow">
            <div className="mc-fsig-h">{t("businessPage.builder.preview.footerFollow")}</div>
            <FootSocials social={data.social} />
          </div>
        )}

        {columns.length > 0 && (
          <div className="mc-fsig-links">
            {columns.map((column, index) => (
              <Collapsible
                key={column.title}
                className="mc-fsig-col"
                open={compact ? !!openColumns[index] : true}
                onOpenChange={(open) => {
                  if (compact) setOpenColumns((current) => ({ ...current, [index]: open }));
                }}
              >
                <CollapsibleTrigger className="mc-fsig-col-h" disabled={!compact}>
                  <span>{column.title}</span>
                  <span className="mc-fsig-col-plus" aria-hidden />
                </CollapsibleTrigger>
                <CollapsibleContent className="mc-fsig-col-content">
                  <AutoHeight className="mc-fsig-col-body">
                    {column.items.map((item) => item.type ? (
                      <a
                        key={`${item.type}:${item.label}`}
                        className="mc-fsig-link"
                        href={item.href}
                        onClick={(event) => {
                          event.preventDefault();
                          onNavigate(item.type!);
                        }}
                      >
                        {item.label}
                      </a>
                    ) : item.href ? (
                      <a
                        key={`${item.href}:${item.label}`}
                        className="mc-fsig-link"
                        href={item.href}
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noopener noreferrer" : undefined}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span key={item.label} className="mc-fsig-link mc-fsig-link--static">
                        {item.label}
                      </span>
                    ))}
                  </AutoHeight>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}

        <div className="mc-fsig-base"><FooterLegal data={data} t={t} /></div>
      </div>
    </footer>
  );
}
