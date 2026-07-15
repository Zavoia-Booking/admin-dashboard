import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import type { LocationWithAssignments } from "../../types";
import { LimitedAccessBanner } from "../../../../shared/components/common/subscription/LimitedAccessBanner";
import { Button } from "../../../../shared/components/ui/button";
import { LocationVisibilitySection } from "../profile/LocationVisibilitySection";
import { LocationPanel } from "./LocationPanel";

const STORAGE_KEY = "zavoia_marketplace_active_location";

interface LocationsTabProps {
  locations: LocationWithAssignments[];
}

/**
 * Locations tab. Single-location businesses see the per-location panel directly;
 * multi-location businesses get a master/detail drill-in (overview list →
 * per-location panel). The active location is reflected in the URL
 * (`?tab=locations&locationId=`) and remembered in localStorage.
 */
export function LocationsTab({ locations }: LocationsTabProps) {
  const { t } = useTranslation("marketplace");
  const [searchParams, setSearchParams] = useSearchParams();
  const isSingle = locations.length === 1;

  const resolveInitial = (): number | null => {
    const fromUrl = searchParams.get("locationId");
    if (fromUrl) {
      const id = parseInt(fromUrl, 10);
      if (locations.some((l) => l.id === id)) return id;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const id = parseInt(stored, 10);
      if (locations.some((l) => l.id === id)) return id;
    }
    return null;
  };

  const [activeLocationId, setActiveLocationId] = useState<number | null>(resolveInitial);

  // Drill in when the URL gains/changes a locationId after mount (e.g. the
  // publish strip deep-links to a location that still needs photos).
  useEffect(() => {
    const raw = searchParams.get("locationId");
    if (!raw) return;
    const id = parseInt(raw, 10);
    if (!Number.isNaN(id) && id !== activeLocationId && locations.some((l) => l.id === id)) {
      setActiveLocationId(id);
      localStorage.setItem(STORAGE_KEY, String(id));
    }
  }, [searchParams, activeLocationId, locations]);

  const selectLocation = useCallback(
    (id: number | null) => {
      setActiveLocationId(id);
      const next = new URLSearchParams(searchParams);
      next.set("tab", "locations");
      if (id != null) {
        localStorage.setItem(STORAGE_KEY, String(id));
        next.set("locationId", String(id));
      } else {
        next.delete("locationId");
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  if (locations.length === 0) {
    return (
      <div className="max-w-5xl mb-0 md:mb-8 space-y-6">
        <LimitedAccessBanner className="!px-0 !pt-0" />
        <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
          <p className="text-sm text-muted-foreground font-medium">
            {t("locationVisibility.noLocations")}
          </p>
        </div>
      </div>
    );
  }

  // Single location → straight to the panel, no master list.
  if (isSingle) {
    return (
      <div className="max-w-5xl mb-0 md:mb-8 space-y-6">
        <LimitedAccessBanner className="!px-0 !pt-0" />
        <LocationPanel location={locations[0]} />
      </div>
    );
  }

  const activeLocation =
    activeLocationId != null
      ? locations.find((l) => l.id === activeLocationId) ?? null
      : null;

  return (
    <div className="max-w-5xl mb-0 md:mb-8 space-y-6">
      <LimitedAccessBanner className="!px-0 !pt-0" />

      {activeLocation ? (
        <div className="space-y-6">
          {/* Back-to-list + current location header */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              rounded="full"
              size="sm"
              onClick={() => selectLocation(null)}
              className="group !min-h-0 h-8 !px-3 border border-border hover:border-border-strong text-foreground-2 hover:text-primary flex items-center gap-1.5 shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
              <span className="text-xs font-medium">{t("locations.backToAll")}</span>
            </Button>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground-1 truncate capitalize">
                {activeLocation.name}
              </h2>
            </div>
          </div>

          <LocationPanel location={activeLocation} />
        </div>
      ) : (
        <LocationVisibilitySection locations={locations} onManageLocation={selectLocation} />
      )}
    </div>
  );
}

export default LocationsTab;
