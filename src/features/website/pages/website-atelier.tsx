import { lazy, Suspense, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, RotateCcw } from "lucide-react";
import BusinessSetupGate from "../../../shared/components/guards/BusinessSetupGate";
import { Button } from "../../../shared/components/ui/button";
import { Spinner } from "../../../shared/components/ui/spinner";
import { selectBusinessId } from "../../auth/selectors";
import { enterWebsiteBuilderAction, fetchWebsiteBuilderAction } from "../actions";
import {
  selectWebsiteLoading,
  selectWebsiteError,
  selectWebsiteIdentity,
  selectWebsiteDraft,
  selectWebsiteLocations,
  selectWebsiteAccess,
} from "../selectors";
import { WebsiteWorkspace } from "../components/WebsiteWorkspace";
import { WebsiteAtelierHeader } from "../components/atelier/WebsiteAtelierHeader";
import { WebsiteAtelierShell } from "../components/atelier/WebsiteAtelierShell";
import type { ReactNode } from "react";

const WebsiteBuilderLockedView = lazy(
  () => import("../components/WebsiteBuilderLockedView").then((module) => ({
    default: module.WebsiteBuilderLockedView,
  })),
);

function WebsiteStateShell({
  children,
  businessName,
  brandColor,
  scroll = false,
}: {
  children: ReactNode;
  businessName?: string | null;
  brandColor?: string | null;
  scroll?: boolean;
}) {
  const navigate = useNavigate();
  const headerProps = { businessName, brandColor, publishStatus: "draft" as const, saveStatus: "saved" as const };

  return (
    <WebsiteAtelierShell
      desktopHeader={<WebsiteAtelierHeader variant="desktop" {...headerProps} />}
      mobileHeader={
        <WebsiteAtelierHeader
          variant="mobile"
          {...headerProps}
          onBack={() => navigate("/dashboard")}
        />
      }
    >
      <div className={scroll ? "website-atelier-scrollbar h-full overflow-y-auto p-3 min-[920px]:p-5" : "website-atelier-state"}>
        {children}
      </div>
    </WebsiteAtelierShell>
  );
}

/**
 * /website — the Website Builder as a first-class owner workspace. Editing is Plus-only:
 * plans without the websiteBuilder feature get the locked teaser view; owners on Plus get
 * the versioned draft editor. Saving here is a DRAFT save — it never publishes, renames,
 * retags, or remaps the Marketplace listing.
 */
export default function WebsiteAtelierPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation("website");
  const isLoading = useSelector(selectWebsiteLoading);
  const error = useSelector(selectWebsiteError);
  const identity = useSelector(selectWebsiteIdentity);
  const draft = useSelector(selectWebsiteDraft);
  const locations = useSelector(selectWebsiteLocations);
  const access = useSelector(selectWebsiteAccess);
  const businessId = useSelector(selectBusinessId);
  const entryRequestBusinessIdRef = useRef<string | null>(null);
  const businessScopeKey = businessId == null ? null : String(businessId);
  const entryRequestStarted =
    businessScopeKey !== null && entryRequestBusinessIdRef.current === businessScopeKey;

  useEffect(() => {
    if (businessScopeKey === null) {
      entryRequestBusinessIdRef.current = null;
      return;
    }
    if (entryRequestBusinessIdRef.current === businessScopeKey) return;
    // A ref survives React's development-only StrictMode effect replay, but a real route remount
    // gets a new one and therefore always performs a fresh owner-scoped read.
    entryRequestBusinessIdRef.current = businessScopeKey;
    dispatch(enterWebsiteBuilderAction());
  }, [businessScopeKey, dispatch]);

  useEffect(() => {
    if (businessScopeKey === null || typeof window === "undefined") return;
    const handlePageShow = (event: PageTransitionEvent) => {
      // Browser Back can restore the whole Redux/React tree from BFCache without remounting the
      // route. Treat that as a real entry so off-page profile/location edits cannot stay cached.
      if (event.persisted) dispatch(enterWebsiteBuilderAction());
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [businessScopeKey, dispatch]);

  // Never mount the editor from retained route data. Once this entry request has started,
  // in-workspace refetches keep their existing stale-while-revalidate behavior.
  if (!entryRequestStarted || (isLoading && (!identity || !draft || !access))) {
    return (
      <WebsiteStateShell businessName={entryRequestStarted ? identity?.name : null}>
        <BusinessSetupGate>
          <div className="grid place-items-center" aria-label={t("page.status.loading")}>
            <Spinner size="lg" />
          </div>
        </BusinessSetupGate>
      </WebsiteStateShell>
    );
  }

  if (error && !draft) {
    return (
      <WebsiteStateShell businessName={identity?.name}>
        <BusinessSetupGate>
          <div className="website-atelier-state-card flex flex-col items-center gap-4 px-6 py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" aria-hidden />
            <p className="text-sm text-muted-foreground">{t("page.loadError")}</p>
            <Button
              variant="outline"
              onClick={() => dispatch(fetchWebsiteBuilderAction.request())}
              className="gap-1.5"
            >
              <RotateCcw className="h-4 w-4" />
              {t("page.retry")}
            </Button>
          </div>
        </BusinessSetupGate>
      </WebsiteStateShell>
    );
  }

  if (!identity || !draft || !access) {
    return (
      <WebsiteStateShell businessName={identity?.name} brandColor={draft?.brandColorHex}>
        <BusinessSetupGate>
          <div className="website-atelier-state-card px-6 py-8 text-center">
            <p className="text-muted-foreground">{t("page.loadError")}</p>
          </div>
        </BusinessSetupGate>
      </WebsiteStateShell>
    );
  }

  // Only a fully locked capability set gets the upgrade teaser. Editing, purchasing, and
  // publishing are independent server capabilities; a read-only user may still need the real
  // workspace to preview, purchase, publish, or unpublish.
  if (!access.canEdit && !access.canPurchase && !access.canPublish) {
    return (
      <WebsiteStateShell businessName={identity.name} brandColor={draft.brandColorHex} scroll>
        <BusinessSetupGate>
          <Suspense
            fallback={(
              <div className="grid min-h-64 place-items-center" role="status" aria-label={t("page.status.loading")}>
                <Spinner size="lg" />
              </div>
            )}
          >
            <WebsiteBuilderLockedView
              business={{ ...identity } as never}
              locations={locations}
              heroImageUrl={draft.heroImageUrl}
              tagline={draft.tagline ?? undefined}
              brandColorHex={draft.brandColorHex ?? undefined}
            />
          </Suspense>
        </BusinessSetupGate>
      </WebsiteStateShell>
    );
  }

  return (
    <BusinessSetupGate>
      <WebsiteWorkspace
        identity={identity}
        draft={draft}
        locations={locations}
        businessId={businessId ?? null}
      />
    </BusinessSetupGate>
  );
}
