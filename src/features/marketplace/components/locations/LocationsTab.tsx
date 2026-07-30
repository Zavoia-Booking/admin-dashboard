import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MapPin } from "lucide-react";
import type { LocationWithAssignments } from "../../types";
import { LimitedAccessBanner } from "../../../../shared/components/common/subscription/LimitedAccessBanner";
import { Button } from "../../../../shared/components/ui/button";
import { LocationPanel } from "./LocationPanel";
import { LocationWorkspaceTransition } from "./LocationWorkspaceTransition";
import { MarketplaceLocationList } from "./MarketplaceLocationList";

const STORAGE_KEY = "zavoia_marketplace_active_location";

interface LocationsTabProps {
  locations: LocationWithAssignments[];
  isActive: boolean;
}

interface MarketplaceLocationNavigationState {
  marketplaceLocationsOrigin?: boolean;
}

function useHasWideMarketplaceWorkspace() {
  const [isWide, setIsWide] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(min-width: 1280px)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const handleChange = () => setIsWide(query.matches);
    query.addEventListener("change", handleChange);
    handleChange();
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return isWide;
}

/**
 * Adaptive Marketplace location workspace:
 * - one location goes straight to its workspace;
 * - xl screens use a persistent location rail and workspace;
 * - smaller screens use URL-driven list-to-detail navigation.
 */
export function LocationsTab({ locations, isActive }: LocationsTabProps) {
  const { t } = useTranslation("marketplace");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const isWideWorkspace = useHasWideMarketplaceWorkspace();
  const rootRef = useRef<HTMLDivElement>(null);
  const listScrollTopRef = useRef(0);
  const lastSelectedIdRef = useRef<number | null>(null);
  const previousExplicitIdRef = useRef<number | null>(null);
  const wasActiveRef = useRef(false);
  const [isWorkspaceBusy, setIsWorkspaceBusy] = useState(false);
  const isSingle = locations.length === 1;

  const rawLocationId = searchParams.get("locationId");
  const parsedLocationId = rawLocationId
    ? Number.parseInt(rawLocationId, 10)
    : null;
  const explicitLocation =
    parsedLocationId != null && !Number.isNaN(parsedLocationId)
      ? locations.find((location) => location.id === parsedLocationId) ?? null
      : null;
  const storedLocation =
    isWideWorkspace && !explicitLocation && typeof window !== "undefined"
      ? (() => {
          const storedId = Number.parseInt(
            window.localStorage.getItem(STORAGE_KEY) ?? "",
            10,
          );
          return Number.isNaN(storedId)
            ? null
            : locations.find((location) => location.id === storedId) ?? null;
        })()
      : null;
  const activeLocation =
    explicitLocation ??
    storedLocation ??
    (isWideWorkspace && !isSingle ? locations[0] ?? null : null);

  useEffect(() => {
    if (!isWideWorkspace || !explicitLocation) return;
    window.localStorage.setItem(STORAGE_KEY, String(explicitLocation.id));
  }, [explicitLocation, isWideWorkspace]);

  // Invalid location deep links return to a valid overview rather than leaving
  // URL and UI selection out of sync.
  useEffect(() => {
    if (!isActive || !rawLocationId || explicitLocation) return;
    const next = new URLSearchParams(searchParams);
    next.delete("locationId");
    setSearchParams(next, { replace: true });
  }, [
    explicitLocation,
    isActive,
    rawLocationId,
    searchParams,
    setSearchParams,
  ]);

  const selectLocation = useCallback(
    (locationId: number) => {
      if (isWorkspaceBusy) return;

      const mainScroller = rootRef.current?.closest("main");
      if (!isWideWorkspace) {
        listScrollTopRef.current = mainScroller?.scrollTop ?? 0;
        lastSelectedIdRef.current = locationId;
      }

      const next = new URLSearchParams(searchParams);
      next.set("tab", "locations");
      next.set("locationId", String(locationId));
      if (isWideWorkspace) {
        window.localStorage.setItem(STORAGE_KEY, String(locationId));
      }

      const existingState =
        routeLocation.state && typeof routeLocation.state === "object"
          ? routeLocation.state
          : {};

      navigate(
        {
          pathname: routeLocation.pathname,
          search: `?${next.toString()}`,
        },
        {
          replace: isWideWorkspace,
          state: isWideWorkspace
            ? existingState
            : {
                ...existingState,
                marketplaceLocationsOrigin: true,
              },
        },
      );
    },
    [
      isWideWorkspace,
      isWorkspaceBusy,
      navigate,
      routeLocation.pathname,
      routeLocation.state,
      searchParams,
    ],
  );

  const returnToLocations = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    const navigationState =
      routeLocation.state &&
      typeof routeLocation.state === "object"
        ? (routeLocation.state as MarketplaceLocationNavigationState)
        : null;

    if (navigationState?.marketplaceLocationsOrigin) {
      navigate(-1);
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set("tab", "locations");
    next.delete("locationId");
    navigate(
      {
        pathname: routeLocation.pathname,
        search: `?${next.toString()}`,
      },
      { replace: true },
    );
  }, [navigate, routeLocation.pathname, routeLocation.state, searchParams]);

  // The AppLayout owns scrolling. Query navigation does not remount it, so
  // explicitly orient the user at the detail heading and restore list context.
  useLayoutEffect(() => {
    if (!isActive) {
      wasActiveRef.current = false;
      return;
    }

    const becameActive = !wasActiveRef.current;
    if (isWideWorkspace) {
      previousExplicitIdRef.current = explicitLocation?.id ?? null;
      wasActiveRef.current = true;
      return;
    }

    const previousId = previousExplicitIdRef.current;
    const currentId = explicitLocation?.id ?? null;
    const mainScroller = rootRef.current?.closest("main");
    let frame = 0;

    if (currentId != null && (currentId !== previousId || becameActive)) {
      frame = window.requestAnimationFrame(() => {
        mainScroller?.scrollTo({ top: 0, behavior: "auto" });
        document
          .getElementById(`marketplace-location-title-${currentId}`)
          ?.focus({ preventScroll: true });
      });
    } else if (currentId == null && previousId != null) {
      frame = window.requestAnimationFrame(() => {
        mainScroller?.scrollTo({
          top: listScrollTopRef.current,
          behavior: "auto",
        });
        const selectedId = lastSelectedIdRef.current;
        if (selectedId != null) {
          rootRef.current
            ?.querySelector<HTMLButtonElement>(
              `[data-location-id="${selectedId}"]`,
            )
            ?.focus({ preventScroll: true });
        }
      });
    }

    previousExplicitIdRef.current = currentId;
    wasActiveRef.current = true;
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [explicitLocation?.id, isActive, isWideWorkspace]);

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

  if (isSingle) {
    return (
      <div
        ref={rootRef}
        className="max-w-5xl space-y-6 pb-[calc(1rem+env(safe-area-inset-bottom))] md:mb-8 md:pb-0"
      >
        <LimitedAccessBanner className="!px-0 !pt-0" />
        <LocationPanel location={locations[0]} />
      </div>
    );
  }

  const showListOnCompact = !explicitLocation;
  const selectedLocationId = activeLocation?.id ?? null;
  const activeLocationIndex = activeLocation
    ? locations.findIndex((entry) => entry.id === activeLocation.id)
    : 0;

  return (
    <div
      ref={rootRef}
      className="max-w-5xl space-y-5 pb-[calc(1rem+env(safe-area-inset-bottom))] md:mb-8 md:pb-0"
    >
      <LimitedAccessBanner className="!px-0 !pt-0" />

      <div
        className={`space-y-1.5 px-1 ${
          explicitLocation ? "hidden xl:block" : ""
        }`}
      >
        <h2 className="text-lg font-semibold tracking-tight text-foreground-1">
          {t("locations.title")}
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-foreground-3 dark:text-foreground-2">
          {t("locations.description")}
        </p>
      </div>

      <div className="grid items-start gap-2 xl:grid-cols-[32%_minmax(0,1fr)]">
        <aside
          className={
            showListOnCompact
              ? "min-w-0 xl:sticky xl:top-20 xl:self-start"
              : "hidden min-w-0 xl:sticky xl:top-20 xl:block xl:self-start"
          }
        >
          <MarketplaceLocationList
            locations={locations}
            selectedLocationId={selectedLocationId}
            onSelect={selectLocation}
            disabled={isWorkspaceBusy}
          />
        </aside>

        <section
          className={
            activeLocation
              ? "min-w-0"
              : "hidden min-w-0 xl:block"
          }
        >
          {activeLocation ? (
            <LocationWorkspaceTransition
              location={activeLocation}
              orderIndex={activeLocationIndex}
              enabled={isWideWorkspace && isActive}
            >
              {(renderedLocation) => (
                <>
                  {explicitLocation && (
                    <div className="flex min-h-11 items-center border-b border-border pb-3 xl:hidden">
                      <Button
                        type="button"
                        variant="ghost"
                        rounded="full"
                        size="sm"
                        onClick={returnToLocations}
                        className="-ml-2 h-11 shrink-0 px-2.5 text-foreground-2 hover:text-primary"
                      >
                        <ArrowLeft
                          className="size-4"
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium">
                          {t("locations.backToAll")}
                        </span>
                      </Button>
                    </div>
                  )}

                  <LocationPanel
                    key={renderedLocation.id}
                    location={renderedLocation}
                    compactGallery
                    onPortfolioBusyChange={setIsWorkspaceBusy}
                  />
                </>
              )}
            </LocationWorkspaceTransition>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/5 px-8 text-center">
              <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-surface text-foreground-3">
                <MapPin className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground-1">
                {t("locations.emptyWorkspaceTitle")}
              </h3>
              <p className="mt-1 max-w-sm text-sm leading-6 text-foreground-3 dark:text-foreground-2">
                {t("locations.emptyWorkspaceDescription")}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default LocationsTab;
