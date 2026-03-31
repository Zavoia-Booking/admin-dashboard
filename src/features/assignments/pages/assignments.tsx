import { useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { AppLayout } from "../../../shared/components/layouts/app-layout";
import { LocationAssignmentsView } from "../components/LocationAssignmentsView";
import { selectLocationAction } from "../actions";

export default function AssignmentsPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation("assignments");

  // Track the last location.key to detect new navigation to this page
  const lastLocationKeyRef = useRef<string | null>(null);

  // Clear selection when navigating TO the assignments page (only if no locationId in URL)
  useEffect(() => {
    const locationIdFromUrl = searchParams.get("locationId");
    if (
      location.pathname === "/assignments" &&
      location.key !== lastLocationKeyRef.current &&
      !locationIdFromUrl
    ) {
      dispatch(selectLocationAction(null));
      lastLocationKeyRef.current = location.key;
    }
  }, [location.pathname, location.key, searchParams, dispatch]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="mb-4 w-full border-b border-border-strong hidden md:block">
          <h1 className="px-4 pb-3 text-sm font-medium text-foreground md:text-2xl">
            {t("page.title")}
          </h1>
        </div>
        <LocationAssignmentsView />
      </div>
    </AppLayout>
  );
}
