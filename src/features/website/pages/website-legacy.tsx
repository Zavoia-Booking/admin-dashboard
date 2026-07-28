import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { AppLayout } from "../../../shared/components/layouts/app-layout";
import BusinessSetupGate from "../../../shared/components/guards/BusinessSetupGate";
import { ErrorState } from "../../../shared/components/common/ErrorState";
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
import { WebsiteLegacyWorkspace } from "../components/legacy/WebsiteLegacyWorkspace";
import { WebsiteBuilderLockedView } from "../components/WebsiteBuilderLockedView";

/**
 * /website — the Website Builder as a first-class owner workspace. Editing is Plus-only:
 * plans without the websiteBuilder feature get the locked teaser view; owners on Plus get
 * the versioned draft editor. Saving here is a DRAFT save — it never publishes, renames,
 * retags, or remaps the Marketplace listing.
 */
export default function WebsiteLegacyPage() {
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
          <ErrorState
            variant="page"
            body={t("page.loadError")}
            onRetry={() => dispatch(fetchWebsiteBuilderAction.request())}
            retryLabel={t("page.retry")}
          />
        </BusinessSetupGate>
      </AppLayout>
    );
  }

  if (!identity || !draft || !access) {
    return (
      <AppLayout contentClassName="md:max-w-[1600px]">
        <BusinessSetupGate>
          <ErrorState
            variant="page"
            body={t("page.loadError")}
            onRetry={() => dispatch(fetchWebsiteBuilderAction.request())}
            retryLabel={t("page.retry")}
          />
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
        <WebsiteLegacyWorkspace
          identity={identity}
          draft={draft}
          locations={locations}
          businessId={businessId ?? null}
        />
      </BusinessSetupGate>
    </AppLayout>
  );
}

