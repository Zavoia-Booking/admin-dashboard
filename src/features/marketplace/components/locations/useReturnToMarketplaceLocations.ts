import { useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

export const ACTIVE_LOCATION_STORAGE_KEY = "zavoia_marketplace_active_location";

interface MarketplaceLocationNavigationState {
  marketplaceLocationsOrigin?: boolean;
}

/** Leaves the location detail view: honors the list-origin history entry when
 *  there is one, otherwise rewrites the URL back to the locations overview.
 *  Shared by every back affordance (top back button, swipe gesture) so they
 *  all perform the exact same navigation. */
export function useReturnToMarketplaceLocations() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const routeLocation = useLocation();

  return useCallback(() => {
    window.localStorage.removeItem(ACTIVE_LOCATION_STORAGE_KEY);
    const navigationState =
      routeLocation.state && typeof routeLocation.state === "object"
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
}
