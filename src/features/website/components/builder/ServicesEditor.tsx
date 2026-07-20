import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Image as ImageIcon,
  Info,
  TriangleAlert,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { modalHelperSmall } from "../../../../shared/components/ui/modal-tokens";
import { Button } from "../../../../shared/components/ui/button";
import { Switch } from "../../../../shared/components/ui/switch";
import { cn } from "../../../../shared/lib/utils";
import type {
  GalleryImageRef,
  ServicesConfig,
  WebsiteBuilderLocation,
} from "../../types";
import { GROUP_LABEL } from "./CopyOverride";
import { OptionalCopyOverride } from "./OptionalCopyOverride";
import { localeCopyIsHidden, setLocaleCopyHidden } from "./copyBlankState";
import { isGalleryImageRef } from "./gallerySelection";
import { LocationPortfolioPhotoPickerDialog } from "./LocationPortfolioPhotoPickerDialog";
import { resolveServicesFeatureImageSelection } from "./servicesFeatureImageSelection";
import type { WebsiteDraftIssue } from "./draftValidation";

interface ServicesEditorProps {
  config: ServicesConfig;
  locale: "en" | "ro";
  locations: WebsiteBuilderLocation[];
  selectedPreviewLocationId?: number | null;
  showPhoto: boolean;
  followsLocationSelection?: boolean;
  onConfigChange: (patch: Partial<ServicesConfig>) => void;
  blockingIssues?: WebsiteDraftIssue[];
}

interface ServicesFeaturePhotoEditorProps {
  config: ServicesConfig;
  location?: WebsiteBuilderLocation;
  onConfigChange: (patch: Partial<ServicesConfig>) => void;
}

function ServicesFeaturePhotoEditor({
  config,
  location,
  onConfigChange,
}: ServicesFeaturePhotoEditorProps) {
  const { t } = useTranslation("website");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerLocations = useMemo(() => (location ? [location] : []), [location]);
  const selection = useMemo(
    () =>
      location
        ? resolveServicesFeatureImageSelection(config, location)
        : { image: null, mode: "automatic" as const },
    [config, location],
  );
  const selectedRef =
    selection.mode === "manual" && location && Array.isArray(config.featureImageRefs)
      ? config.featureImageRefs.find(
          (ref) => isGalleryImageRef(ref) && ref.locationId === location.id,
        ) ?? null
      : null;
  const managePhotosPath = location
    ? `/marketplace?tab=locations&locationId=${location.id}`
    : "/marketplace?tab=locations";

  const selectImage = (ref: GalleryImageRef) => {
    const currentRefs = Array.isArray(config.featureImageRefs)
      ? config.featureImageRefs.filter(isGalleryImageRef)
      : [];
    onConfigChange({
      featureImageRefs: [
        ...currentRefs.filter((current) => current.locationId !== ref.locationId),
        ref,
      ],
    });
  };

  return (
    <section className="space-y-3 border-t border-border pt-5">
      <div>
        <h3 className={GROUP_LABEL}>
          {t("businessPage.builder.settings.services.photo.label")}
        </h3>
        <p className={cn(modalHelperSmall, "mt-1")}>
          {location
            ? t("businessPage.builder.settings.services.photo.helpLocation", {
                name: location.name,
              })
            : t("businessPage.builder.settings.services.photo.help")}
        </p>
      </div>

      {selection.image ? (
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={selection.image.src}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-16 shrink-0 rounded-lg bg-surface-hover object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-foreground-1">
              {selection.image.locationName}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
              className="mt-2 max-w-full shadow-none"
            >
              {t(
                selection.mode === "manual"
                  ? "businessPage.builder.settings.services.photo.change"
                  : "businessPage.builder.settings.services.photo.choose",
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center">
          <ImageIcon className="mx-auto size-5 text-foreground-3" strokeWidth={1.5} aria-hidden />
          <p className="mt-2 text-[12px] font-medium text-foreground-1">
            {t("businessPage.builder.settings.services.photo.emptyTitle")}
          </p>
          <p className="mx-auto mt-1 max-w-[36ch] text-[11px] leading-[1.55] text-foreground-3">
            {t("businessPage.builder.settings.services.photo.emptyHelp")}
          </p>
        </div>
      )}

      {selection.mode === "stale" ? (
        <div
          className="flex items-start gap-2 rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2.5 text-amber-950 dark:border-amber-700/70 dark:bg-amber-950/30 dark:text-amber-100"
          role="status"
        >
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
          <p className="text-[11px] leading-[1.5]">
            {t("businessPage.builder.settings.services.photo.staleHelp")}
          </p>
        </div>
      ) : null}

      <Link
        to={managePhotosPath}
        className="inline-flex min-h-9 items-center gap-1 rounded-md px-1 text-[11px] font-semibold text-foreground-2 outline-none hover:text-foreground-1 focus-visible:ring-2 focus-visible:ring-focus"
      >
        {t("businessPage.builder.settings.services.photo.manage")}
        <ArrowRight className="size-3.5" strokeWidth={1.8} aria-hidden />
      </Link>

      <LocationPortfolioPhotoPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        locations={pickerLocations}
        selectedRef={selectedRef}
        onSelect={selectImage}
        title={
          location
            ? t("businessPage.builder.settings.services.photo.dialogTitleLocation", {
                name: location.name,
              })
            : t("businessPage.builder.settings.services.photo.dialogTitle")
        }
        description={t("businessPage.builder.settings.services.photo.dialogDescription")}
        emptyTitle={t("businessPage.builder.settings.services.photo.emptyTitle")}
        emptyDescription={t("businessPage.builder.settings.services.photo.emptyHelp")}
        featuredLabel={t("businessPage.builder.settings.gallery.featured")}
        getPhotoCountLabel={(count) => t(
          "businessPage.builder.settings.gallery.locationPhotos",
          { count },
        )}
        managePhotosHref={managePhotosPath}
        managePhotosLabel={t("businessPage.builder.settings.services.photo.manage")}
        getPhotoLabel={(image) => t(
          "businessPage.builder.settings.services.photo.selectPhoto",
          { name: image.locationName },
        )}
      />
    </section>
  );
}

/**
 * Services settings remain a presentation layer over the canonical Services catalog. Owners can tune
 * copy and visibility here, then jump to Services for catalog changes or Assignments for availability
 * and overrides scoped to the location currently selected in the preview.
 */
export function ServicesEditor({
  config,
  locale,
  locations,
  selectedPreviewLocationId,
  showPhoto,
  followsLocationSelection = false,
  onConfigChange,
  blockingIssues = [],
}: ServicesEditorProps) {
  const { t } = useTranslation("website");
  const showDescriptions = config.hideDescriptions !== true;
  const showBundles = config.hideBundles !== true;
  const hasBundles = locations.some((location) => (location.bundles ?? []).length > 0);
  const effectivePreviewLocation =
    locations.find((location) => location.id === selectedPreviewLocationId) ?? locations[0];
  const assignmentsPath = effectivePreviewLocation
    ? `/assignments?locationId=${effectivePreviewLocation.id}`
    : "/assignments";
  const issueFor = (controlId: string) => blockingIssues.find(
    (issue) => issue.controlId === controlId && (!issue.locale || issue.locale === locale),
  )?.message;

  const setCopy = (field: "heading" | "sublede", value: string) => {
    const current = config[field] ?? { en: "", ro: "" };
    const next = { ...current, [locale]: value };
    const hasOverride = next.en.trim() !== "" || next.ro.trim() !== "";
    onConfigChange({ [field]: hasOverride ? next : undefined });
  };
  const setCopyBlank = (field: "heading" | "sublede", blank: boolean) => {
    if (field === "heading") {
      onConfigChange({
        headingHidden: setLocaleCopyHidden(config.headingHidden, locale, blank),
      });
      return;
    }
    onConfigChange({
      subledeHidden: setLocaleCopyHidden(config.subledeHidden, locale, blank),
    });
  };

  const defaultSubledeKey =
    locations.length > 1
      ? "businessPage.builder.preview.servicesSubledeMultiple"
      : "businessPage.builder.preview.servicesSubledeSingle";

  return (
    <div className="space-y-5">
      <div className="space-y-5">
        <OptionalCopyOverride
          idBase="services-heading"
          locale={locale}
          label={t("businessPage.builder.settings.headingLabel")}
          defaultText={t("businessPage.builder.preview.servicesHeading")}
          value={config.heading?.[locale] ?? ""}
          blank={localeCopyIsHidden(config.headingHidden, locale)}
          onChange={(value) => setCopy("heading", value)}
          onBlankChange={(blank) => setCopyBlank("heading", blank)}
          maxLength={80}
          rows={2}
          externalError={issueFor("services-heading")}
        />
        <div className="border-t border-border-subtle pt-5">
          <OptionalCopyOverride
            idBase="services-sublede"
            locale={locale}
            label={t("businessPage.builder.settings.subledeLabel")}
            defaultText={t(defaultSubledeKey)}
            value={config.sublede?.[locale] ?? ""}
            blank={localeCopyIsHidden(config.subledeHidden, locale)}
            onChange={(value) => setCopy("sublede", value)}
            onBlankChange={(blank) => setCopyBlank("sublede", blank)}
            maxLength={220}
            rows={3}
            externalError={issueFor("services-sublede")}
          />
        </div>
      </div>

      {followsLocationSelection ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-hover/40 px-3 py-2.5">
          <Info className="mt-0.5 size-3.5 shrink-0 text-foreground-3" strokeWidth={1.7} aria-hidden />
          <p className="text-[11.5px] leading-[1.55] text-foreground-3">
            {t("businessPage.builder.settings.services.locationSelectionNote")}
          </p>
        </div>
      ) : null}

      <section className="space-y-4 border-t border-border pt-5">
        <h3 className={GROUP_LABEL}>
          {t("businessPage.builder.settings.services.displayTitle")}
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[12px] font-medium text-foreground-1">
              {t("businessPage.builder.settings.services.showDescriptions")}
            </span>
            <Switch
              checked={showDescriptions}
              onCheckedChange={(show) => onConfigChange({ hideDescriptions: !show })}
              aria-label={t("businessPage.builder.settings.services.showDescriptions")}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[12px] font-medium text-foreground-1">
              {t("businessPage.builder.settings.services.showDurations")}
            </span>
            <Switch
              checked={config.hideDurations !== true}
              onCheckedChange={(show) => onConfigChange({ hideDurations: !show })}
              aria-label={t("businessPage.builder.settings.services.showDurations")}
            />
          </div>
          {hasBundles ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-[12px] font-medium text-foreground-1">
                {t("businessPage.builder.settings.services.showBundles")}
              </span>
              <Switch
                checked={showBundles}
                onCheckedChange={(show) => onConfigChange({ hideBundles: !show })}
                aria-label={t("businessPage.builder.settings.services.showBundles")}
              />
            </div>
          ) : null}
        </div>
      </section>

      {showPhoto ? (
        <ServicesFeaturePhotoEditor
          config={config}
          location={effectivePreviewLocation}
          onConfigChange={onConfigChange}
        />
      ) : null}

      <section className="space-y-3 border-t border-border pt-5">
        <div>
          <h3 className={GROUP_LABEL}>
            {t("businessPage.builder.settings.services.setupTitle")}
          </h3>
          <p className={cn(modalHelperSmall, "mt-1")}>
            {t("businessPage.builder.settings.services.setupHint")}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <Link
            to="/services"
            className="group flex min-h-11 items-start justify-between gap-3 px-3 py-3 outline-none transition-colors duration-150 hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
          >
            <span className="min-w-0">
              <span className="block text-[12px] font-semibold text-foreground-1">
                {t("businessPage.builder.settings.services.manageCatalogTitle")}
              </span>
              <span className="mt-0.5 block text-pretty text-[10.5px] leading-[1.45] text-foreground-3">
                {t("businessPage.builder.settings.services.manageCatalogDescription")}
              </span>
            </span>
            <ArrowUpRight
              className="mt-0.5 size-3.5 shrink-0 text-foreground-3 transition-colors duration-150 group-hover:text-foreground-1 group-focus-visible:text-foreground-1"
              strokeWidth={1.8}
              aria-hidden
            />
          </Link>

          <Link
            to={assignmentsPath}
            className="group flex min-h-11 items-start justify-between gap-3 border-t border-border-subtle px-3 py-3 outline-none transition-colors duration-150 hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
          >
            <span className="min-w-0">
              <span className="block text-[12px] font-semibold text-foreground-1">
                {effectivePreviewLocation
                  ? t("businessPage.builder.settings.services.manageAssignmentsTitleLocation", {
                      name: effectivePreviewLocation.name,
                    })
                  : t("businessPage.builder.settings.services.manageAssignmentsTitle")}
              </span>
              <span className="mt-0.5 block text-pretty text-[10.5px] leading-[1.45] text-foreground-3">
                {effectivePreviewLocation
                  ? t("businessPage.builder.settings.services.manageAssignmentsDescriptionLocation")
                  : t("businessPage.builder.settings.services.manageAssignmentsDescription")}
              </span>
            </span>
            <ArrowUpRight
              className="mt-0.5 size-3.5 shrink-0 text-foreground-3 transition-colors duration-150 group-hover:text-foreground-1 group-focus-visible:text-foreground-1"
              strokeWidth={1.8}
              aria-hidden
            />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ServicesEditor;
