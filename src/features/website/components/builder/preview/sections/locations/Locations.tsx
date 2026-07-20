import { useEffect, useRef } from "react";
import type { GalleryConfig, LocationsConfig, SectionEntry } from "../../../../../types";
import { resolveGalleryImages } from "../../../gallerySelection";
import { resolveVisibleLocations } from "../../../locationSelection";
import { Placeholder } from "../../shared/primitives";
import { useInView } from "../../shared/hooks";
import type { PreviewData, T } from "../../shared/types";
import { Showcase } from "./variants/Showcase";
import { Bento } from "./variants/Bento";
import { Panorama } from "./variants/Panorama";
import { Atlas } from "./variants/Atlas";
import type { LocationsVariantProps } from "./types";
import "./base.css";

// Locations orchestrator — owns filtering, shared selection, tag dictionaries and the empty state. The
// design-source layouts own their complete presentation and interaction logic in isolated variant files.

// Layout registry — add a variant by adding its component file + a catalog entry (sectionCatalog). The
// resolver below maps the saved variant to its component, falling back to the Included Panorama layout.
const VARIANTS: Record<string, React.FC<LocationsVariantProps>> = {
  panorama: Panorama,
  showcase: Showcase,
  cards: Bento,
  atlas: Atlas,
};

export function Locations({
  entry,
  data,
  t,
  selectedLocationId,
  onSelectLocation,
  showTeamLink,
  layout,
}: {
  entry: SectionEntry;
  data: PreviewData;
  t: T;
  selectedLocationId: number | null;
  onSelectLocation: (locationId: number) => void;
  showTeamLink: boolean;
  layout: SectionEntry[];
}) {
  const rootRef = useRef<HTMLElement>(null);
  const revealed = useInView(rootRef, { threshold: 0.08, once: true });
  const shown = resolveVisibleLocations((entry.config ?? {}) as LocationsConfig, data.locations);
  // Tag dictionaries (label/slug per id) arrive via PreviewData so this section stays a pure render; the
  // host (dashboard) supplies the authenticated fetch's result. Absent → the tag band doesn't render.
  const dictionaries = data.tagDictionaries ?? null;
  const selectedIndex = shown.findIndex((location) => location.id === selectedLocationId);
  const idx = selectedIndex >= 0 ? selectedIndex : 0;
  const loc = shown[idx];
  useEffect(() => {
    if (loc && loc.id !== selectedLocationId) onSelectLocation(loc.id);
  }, [loc, onSelectLocation, selectedLocationId]);
  const selectIndex = (index: number) => {
    const location = shown[index];
    if (location) onSelectLocation(location.id);
  };

  const galleryEntry = layout.find((section) => section.type === "gallery");
  const galleryConfig = (galleryEntry?.config ?? {}) as GalleryConfig;
  const galleryImages = resolveGalleryImages(galleryConfig, data.locations).map(({ src }) => ({ src }));

  const variant = Object.hasOwn(VARIANTS, entry.variant) ? entry.variant : "panorama";
  const View = VARIANTS[variant];

  return (
    <section
      ref={rootRef}
      className="mc-locations"
      data-locations={variant}
      data-revealed={revealed ? "1" : "0"}
    >
      <div className="mc-locations-wrap">
        {/* The source keeps an empty section-head rhythm after its intentionally no-op SecKicker. */}
        <div className="mc-locations-head" aria-hidden="true" />
        {shown.length === 0 || !loc ? (
          <Placeholder>{t("businessPage.builder.preview.locationsEmpty")}</Placeholder>
        ) : (
          <View
            shown={shown}
            idx={idx}
            loc={loc}
            onSelect={selectIndex}
            dict={dictionaries}
            t={t}
            businessEmail={data.email}
            showTeamLink={showTeamLink}
            galleryImages={galleryImages}
          />
        )}
      </div>
    </section>
  );
}
