import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { AppLayout } from "../../../shared/components/layouts/app-layout";
import BusinessSetupGate from "../../../shared/components/guards/BusinessSetupGate";
import { Button } from "../../../shared/components/ui/button";
import { Spinner } from "../../../shared/components/ui/spinner";
import { selectBusinessId } from "../../auth/selectors";
import { fetchWebsiteBuilderAction } from "../actions";
import {
  selectWebsiteLoading,
  selectWebsiteError,
  selectWebsiteIdentity,
  selectWebsiteDraft,
  selectWebsiteLocations,
  selectWebsiteAccess,
} from "../selectors";
import { WebsiteWorkspace } from "../components/WebsiteWorkspace";
import { WebsiteBuilderLockedView } from "../components/WebsiteBuilderLockedView";

/**
 * /website — the Website Builder as a first-class owner workspace. Editing is Plus-only:
 * plans without the websiteBuilder feature get the locked teaser view; owners on Plus get
 * the versioned draft editor. Saving here is a DRAFT save — it never publishes, renames,
 * retags, or remaps the Marketplace listing.
 */
export default function WebsitePage() {
  const dispatch = useDispatch();
  const { t } = useTranslation("website");
  const isLoading = useSelector(selectWebsiteLoading);
  const error = useSelector(selectWebsiteError);
  const identity = useSelector(selectWebsiteIdentity);
  const draft = useSelector(selectWebsiteDraft);
  const locations = useSelector(selectWebsiteLocations);
  const access = useSelector(selectWebsiteAccess);
  const businessId = useSelector(selectBusinessId);

  useEffect(() => {
    if (!businessId) return;
    dispatch(fetchWebsiteBuilderAction.request());
  }, [businessId, dispatch]);

  // Initial load only — a refetch (post-save reload) keeps the workspace mounted.
  if (isLoading && !draft) {
    return (
      <AppLayout tabbedPage contentClassName="md:max-w-[1600px]">
        <BusinessSetupGate>
          <div className="flex h-[calc(100vh-200px)] items-center justify-center">
            <Spinner size="lg" />
          </div>
        </BusinessSetupGate>
      </AppLayout>
    );
  }

  if (error && !draft) {
    return (
      <AppLayout contentClassName="md:max-w-[1600px]">
        <BusinessSetupGate>
          <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center gap-4 px-4 text-center">
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
      </AppLayout>
    );
  }

  if (!identity || !draft || !access) {
    return (
      <AppLayout contentClassName="md:max-w-[1600px]">
        <BusinessSetupGate>
          <div className="flex h-[calc(100vh-200px)] items-center justify-center">
            <p className="text-muted-foreground">{t("page.loadError")}</p>
          </div>
        </BusinessSetupGate>
      </AppLayout>
    );
  }

  // Plans without websiteBuilder see a read-only teaser built from their saved draft values.
  if (!access.canEdit) {
    return (
      <AppLayout tabbedPage contentClassName="md:max-w-[1600px]">
        <BusinessSetupGate>
          <WebsiteBuilderLockedView
            business={{ ...identity } as never}
            locations={locations}
            heroImageUrl={draft.heroImageUrl}
            tagline={draft.tagline ?? undefined}
            brandColorHex={draft.brandColorHex ?? undefined}
          />
        </BusinessSetupGate>
      </AppLayout>
    );
  }

  return (
    <AppLayout tabbedPage contentClassName="md:max-w-[1600px]">
      <BusinessSetupGate>
        <WebsiteWorkspace
          identity={identity}
          draft={draft}
          locations={locations}
          businessId={businessId ?? null}
        />
      </BusinessSetupGate>
    </AppLayout>
  );
}
