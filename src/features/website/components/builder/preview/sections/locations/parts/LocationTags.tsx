import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { tagIcon } from "../../../../../../../marketplace/utils/tagIcons";
import { cn } from "../../../../../../../../shared/lib/utils";
import { MONO } from "../../../shared/constants";
import type { LocationTagGroup } from "../types";

/** Tag band: category groups of pills. Past ~4 rows it clamps with a frosted bottom fade and a chevron
 *  toggle that springs the band open/closed (max-height tween). Re-mounts per location via key, so it
 *  resets to collapsed and re-measures on switch. */
export function LocationTags({ groups }: { groups: LocationTagGroup[] }) {
  const { t } = useTranslation("website");
  // Category labels reuse the owner-facing slider's namespace so copy stays in lockstep (en + ro).
  const { t: tTags } = useTranslation("locationMarketplaceDetails");
  const innerRef = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(0);
  const [open, setOpen] = useState(false);
  const COLLAPSED = 184; // ~4 pill rows incl. a category label

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => setFull(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [groups]);

  const overflows = full > COLLAPSED + 12;
  const clamped = overflows && !open;

  return (
    <div className="mc-locx-fade border-t p-[clamp(18px,3cqw,32px)]" style={{ borderColor: "var(--mc-line)", animationDelay: "300ms" }}>
      <div className="relative">
        <div
          ref={innerRef}
          className="flex flex-col gap-[clamp(16px,2.4cqw,26px)]"
          style={{
            maxHeight: overflows ? (open ? full : COLLAPSED) : undefined,
            overflow: overflows ? "hidden" : undefined,
            transition: "max-height 0.55s var(--ease-out-strong)",
          }}
        >
          {groups.map((grp) => (
            <div key={grp.key}>
              <div className="mb-3 text-[10.5px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.12em", color: "var(--mc-muted)" }}>
                {tTags(`sections.${grp.key}.title`)}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {grp.items.map(({ label, slug }, i) => {
                  const Icon = tagIcon(slug);
                  return (
                    <span
                      key={slug}
                      className={cn(
                        "mc-locx-rowin inline-flex h-8 items-center gap-2 rounded-full border pr-4 text-[13px] font-semibold",
                        Icon ? "pl-3" : "pl-4",
                      )}
                      style={{ borderColor: "var(--mc-line)", background: "color-mix(in oklch, var(--mc-fg) 3%, transparent)", color: "var(--mc-fg)", animationDelay: `${200 + i * 36}ms` }}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />}
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {/* Frosted fade over the clipped rows — gradient to the card colour + a masked blur for depth. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 backdrop-blur-[1.5px] transition-opacity duration-300"
          style={{
            background: "linear-gradient(to bottom, transparent, var(--mc-card))",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 78%)",
            maskImage: "linear-gradient(to bottom, transparent, #000 78%)",
            opacity: clamped ? 1 : 0,
          }}
        />
      </div>
      {overflows && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? t("businessPage.builder.preview.tagsShowLess") : t("businessPage.builder.preview.tagsShowAll")}
            className={cn("inline-flex h-9 w-9 cursor-pointer items-center justify-center transition-opacity hover:opacity-70", !open && "mc-chev-bob")}
            style={{ color: "var(--mc-fg)" }}
          >
            <ChevronDown className={cn("h-[26px] w-[26px] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]", open && "rotate-180")} strokeWidth={1.75} />
          </button>
        </div>
      )}
    </div>
  );
}
