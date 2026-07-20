import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { WebsiteBuilderLocation } from "../../../../../../types";
import type { ResolvedTagDictionaries } from "../../../../../../../marketplace/hooks/useLocationTagDictionaries";
import { tagIcon } from "../../../../../../../marketplace/utils/tagIcons";
import type { T } from "../../../shared/types";
import { buildLocationTagGroups } from "../util";

const COLLAPSED_ROWS = 4;

type AmenitiesMetrics = {
  measured: boolean;
  hasOverflow: boolean;
  collapsedHeight: number;
  fullHeight: number;
  peekHeight: number;
  visibleCount: number;
};

/**
 * The design treats all selected location details as one amenities band. The API stores those details in
 * separate dictionaries, so resolve them through the existing helper, then flatten them in its established
 * reading order. Every amenity keeps its meaningful glyph in the fixed icon-row treatment.
 */
export function LocationAmenities({
  loc,
  dict,
  t,
}: {
  loc: WebsiteBuilderLocation;
  dict: ResolvedTagDictionaries | null;
  t: T;
}) {
  const amenities = useMemo(
    () =>
      buildLocationTagGroups(loc, dict).flatMap((group) =>
        group.items.map((amenity) => ({ amenity, key: `${String(group.key)}:${amenity.id}` })),
      ),
    [dict, loc],
  );
  const listRef = useRef<HTMLUListElement>(null);
  const disclosureId = useId();
  const [expanded, setExpanded] = useState(false);
  const [metrics, setMetrics] = useState<AmenitiesMetrics>(() => ({
    measured: false,
    hasOverflow: false,
    collapsedHeight: 0,
    fullHeight: 0,
    peekHeight: 0,
    visibleCount: amenities.length,
  }));

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || amenities.length === 0) return;

    let frame = 0;
    let active = true;
    const measure = () => {
      const items = Array.from(list.children).filter(
        (node): node is HTMLLIElement => node instanceof HTMLLIElement,
      );
      if (items.length === 0) return;

      const rows: Array<{ top: number; bottom: number; start: number }> = [];
      items.forEach((item, index) => {
        const top = item.offsetTop;
        const bottom = top + item.offsetHeight;
        const previous = rows[rows.length - 1];
        if (!previous || Math.abs(previous.top - top) > 1) {
          rows.push({ top, bottom, start: index });
        } else {
          previous.bottom = Math.max(previous.bottom, bottom);
        }
      });

      const fullHeight = Math.ceil(list.scrollHeight);
      const hasOverflow = rows.length > COLLAPSED_ROWS;
      let collapsedHeight = fullHeight;
      let peekHeight = 0;
      let visibleCount = items.length;

      if (hasOverflow) {
        const lastVisibleRow = rows[COLLAPSED_ROWS - 1];
        const previewRow = rows[COLLAPSED_ROWS];
        const previewDepth = Math.min(
          30,
          Math.max(24, Math.round((previewRow.bottom - previewRow.top) * 0.68)),
        );
        collapsedHeight = Math.min(fullHeight, Math.ceil(previewRow.top + previewDepth));
        peekHeight = Math.max(0, collapsedHeight - lastVisibleRow.bottom);
        visibleCount = previewRow.start;
      }

      const next: AmenitiesMetrics = {
        measured: true,
        hasOverflow,
        collapsedHeight,
        fullHeight,
        peekHeight,
        visibleCount,
      };
      setMetrics((current) =>
        current.measured === next.measured &&
        current.hasOverflow === next.hasOverflow &&
        current.collapsedHeight === next.collapsedHeight &&
        current.fullHeight === next.fullHeight &&
        current.peekHeight === next.peekHeight &&
        current.visibleCount === next.visibleCount
          ? current
          : next,
      );
      if (!hasOverflow) setExpanded(false);
    };
    const scheduleMeasure = () => {
      if (!active) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    };

    setExpanded(false);
    measure();
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleMeasure);
    resizeObserver?.observe(list);
    window.addEventListener("resize", scheduleMeasure);
    const previewRoot = list.closest(".mc-root");
    const themeObserver = previewRoot && typeof MutationObserver !== "undefined"
      ? new MutationObserver(scheduleMeasure)
      : null;
    if (previewRoot) {
      themeObserver?.observe(previewRoot, { attributes: true, attributeFilter: ["class", "style"] });
    }
    const fonts = typeof document === "undefined" ? null : document.fonts;
    fonts?.addEventListener("loadingdone", scheduleMeasure);
    void fonts?.ready.then(scheduleMeasure);

    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      themeObserver?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      fonts?.removeEventListener("loadingdone", scheduleMeasure);
    };
  }, [amenities]);

  if (amenities.length === 0) return null;

  const labelId = `${disclosureId}-label`;
  const contentId = `${disclosureId}-content`;
  const maxHeight = metrics.measured
    ? expanded
      ? metrics.fullHeight
      : metrics.collapsedHeight
    : undefined;

  return (
    <div className="mc-loc-amen mc-locx-fade" style={{ animationDelay: "300ms" }}>
      <span id={labelId} className="mc-loc-amen-label">
        {t("businessPage.builder.preview.locAmenities")}
      </span>
      <div
        id={contentId}
        className="mc-loc-amen-viewport"
        data-expanded={expanded ? "1" : "0"}
        style={maxHeight === undefined ? undefined : { maxHeight: `${maxHeight}px` }}
      >
        <ul ref={listRef} className="mc-loc-amen-list" aria-labelledby={labelId}>
          {amenities.map(({ amenity, key }, i) => {
            const Icon = tagIcon(amenity.slug) ?? Check;
            const hiddenFromAssistiveTech =
              metrics.measured && metrics.hasOverflow && !expanded && i >= metrics.visibleCount;
            const animatesIn = !metrics.measured || i < metrics.visibleCount;
            return (
              <li
                key={key}
                className={`mc-loc-amen-item${animatesIn ? " mc-locx-rowin" : ""}`}
                style={animatesIn ? { animationDelay: `${340 + i * 40}ms` } : undefined}
                aria-hidden={hiddenFromAssistiveTech || undefined}
              >
                <Icon className="size-[14px]" strokeWidth={1.7} aria-hidden />
                <span>{amenity.label}</span>
              </li>
            );
          })}
        </ul>
        {metrics.hasOverflow ? (
          <span
            className="mc-loc-amen-peek"
            data-visible={expanded ? "0" : "1"}
            style={{ height: `${metrics.peekHeight}px` }}
            aria-hidden="true"
          />
        ) : null}
      </div>
      {metrics.hasOverflow ? (
        <button
          type="button"
          className="mc-loc-amen-toggle"
          data-expanded={expanded ? "1" : "0"}
          aria-expanded={expanded}
          aria-controls={contentId}
          aria-label={t(
            expanded
              ? "businessPage.builder.preview.locAmenitiesCollapse"
              : "businessPage.builder.preview.locAmenitiesExpand",
            { name: loc.name },
          )}
          onClick={() => setExpanded((current) => !current)}
        >
          <ChevronDown aria-hidden="true" size={18} strokeWidth={1.7} />
        </button>
      ) : null}
    </div>
  );
}
