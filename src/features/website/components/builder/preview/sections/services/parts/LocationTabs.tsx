import type { WebsiteBuilderLocation } from "../../../../../../types";
import type { T } from "../../../shared/types";

export function LocationTabs({
  locations,
  selectedLocationId,
  onSelect,
  t,
}: {
  locations: WebsiteBuilderLocation[];
  selectedLocationId: number;
  onSelect: (locationId: number) => void;
  t: T;
}) {
  if (locations.length < 2) return null;
  return (
    <div className="mc-services-location-wrap mc-mask-in">
      <div className="mc-services-locations" role="tablist" aria-label={t("businessPage.builder.preview.aria.selectServicesLocation")}>
        {locations.map((location) => {
          const selected = location.id === selectedLocationId;
          return (
            <button
              key={location.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className="mc-services-location"
              data-on={selected ? "1" : "0"}
              onClick={() => onSelect(location.id)}
            >
              {location.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
