import { useState } from "react";
import { telHref } from "../../../shared/contact";
import { FootSocials } from "../parts/FootSocials";
import type { FooterBodyProps } from "../types";

/** Minimal — one quiet deck: brand lockup + socials on top, then a single mono line of contact and (for
 *  multi-location businesses) selectable place names below. No giant wordmark — the orchestrator drops it for
 *  this variant. Mirrors the source footer's `minimal` branch. */
export function Minimal({ data, t }: FooterBodyProps) {
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const locs = data.locations;
  const multi = locs.length > 1;

  const [sel, setSel] = useState(0);
  const selectedIndex = sel >= 0 && sel < locs.length ? sel : 0;
  const here = locs[selectedIndex] ?? null;
  const phone = here?.phone?.trim();

  return (
    <div className="mc-foot-pad">
      <div className="mc-fmin-top">
        <div className="mc-fmin-brand">
          {data.logo ? (
            <img className="mc-foot-logo" src={data.logo} alt={name} loading="lazy" decoding="async" />
          ) : (
            <div className="mc-foot-lockup">
              <span className="mc-foot-mark" aria-hidden>
                {name.trim().charAt(0) || "•"}
              </span>
              <span className="mc-foot-wordmark">{name}</span>
            </div>
          )}
          {data.tagline?.trim() && <p className="mc-foot-tag">{data.tagline}</p>}
        </div>
        <FootSocials social={data.social} />
      </div>
      <div className="mc-fmin-mid">
        {data.email && <a href={`mailto:${data.email.trim()}`}>{data.email}</a>}
        {phone && <a href={telHref(phone)}>{phone}</a>}
        {multi &&
          locs.map((l, i) => (
            <button
              key={l.id}
              type="button"
              style={i === selectedIndex ? { color: "var(--mc-accent)" } : undefined}
              onClick={() => setSel(i)}
            >
              {l.name}
            </button>
          ))}
      </div>
    </div>
  );
}
