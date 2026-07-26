import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Image as ImageIcon,
  TriangleAlert,
} from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { Input } from "../../../../shared/components/ui/input";
import { Label } from "../../../../shared/components/ui/label";
import { Switch } from "../../../../shared/components/ui/switch";
import TextareaField from "../../../../shared/components/forms/fields/TextareaField";
import type {
  AboutConfig,
  GalleryImageRef,
  WebsiteBuilderLocation,
} from "../../types";
import {
  resolveAboutImageSelection,
} from "./aboutImageSelection";
import { OptionalCopyOverride } from "./OptionalCopyOverride";
import { LocationPortfolioPhotoPickerDialog } from "./LocationPortfolioPhotoPickerDialog";
import { splitAboutContent, joinAboutContent } from "./aboutContent";
import {
  hasUnsafeWebsiteCopyCharacters,
  validateWebsiteCopy,
} from "../../../../shared/utils/validation";
import type { WebsiteDraftIssue } from "./draftValidation";

const TITLE_MAX = 200;
const BODY_MAX = 1800;
const ESTABLISHED_YEAR_LENGTH = 4;

interface AboutEditorProps {
  value: string;
  onChange: (value: string) => void;
  config: AboutConfig;
  locations: WebsiteBuilderLocation[];
  onConfigChange: (patch: Partial<AboutConfig>) => void;
  businessDescription: string | null;
  establishedYear: number | null;
  onEstablishedYearChange: (value: number | null) => void;
  establishedYearError?: string | null;
  /** A visible About section must have a Story before the website can be published. */
  required?: boolean;
  showPhoto: boolean;
  locale: "en" | "ro";
  blockingIssues?: WebsiteDraftIssue[];
}

interface AboutPhotoEditorProps {
  config: AboutConfig;
  locations: WebsiteBuilderLocation[];
  onConfigChange: (patch: Partial<AboutConfig>) => void;
}

function AboutPhotoEditor({ config, locations, onConfigChange }: AboutPhotoEditorProps) {
  const { t } = useTranslation("website");
  const [pickerOpen, setPickerOpen] = useState(false);
  const selection = useMemo(
    () => resolveAboutImageSelection(config, locations),
    [config, locations],
  );
  const managePhotosPath = locations.length === 1
    ? `/marketplace?tab=locations&locationId=${locations[0].id}`
    : "/marketplace?tab=locations";

  const selectImage = (ref: GalleryImageRef) => {
    onConfigChange({ imageRef: ref });
  };

  return (
    <section className="space-y-3 border-t border-border-subtle pt-5">
      <div>
        <h4 className="text-[12px] font-semibold text-foreground-1">
          {t("businessPage.about.photo.label")}
        </h4>
        <p className="mt-1 text-[11px] leading-[1.55] text-foreground-3">
          {t("businessPage.about.photo.help")}
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
                  ? "businessPage.about.photo.change"
                  : "businessPage.about.photo.choose",
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center">
          <ImageIcon className="mx-auto size-5 text-foreground-3" strokeWidth={1.5} aria-hidden />
          <p className="mt-2 text-[12px] font-medium text-foreground-1">
            {t("businessPage.about.photo.emptyTitle")}
          </p>
          <p className="mx-auto mt-1 max-w-[36ch] text-[11px] leading-[1.55] text-foreground-3">
            {t("businessPage.about.photo.emptyHelp")}
          </p>
        </div>
      )}

      {selection.mode === "stale" ? (
        <div
          className="flex items-start gap-2 rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2.5 text-amber-950 dark:border-amber-700/70 dark:bg-amber-950/30 dark:text-amber-100"
          role="status"
        >
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
          <p className="text-[11px] leading-[1.5]">{t("businessPage.about.photo.staleHelp")}</p>
        </div>
      ) : null}

      <Link
        to={managePhotosPath}
        className="inline-flex min-h-9 items-center gap-1 rounded-md px-1 text-[11px] font-semibold text-foreground-2 outline-none hover:text-foreground-1 focus-visible:ring-2 focus-visible:ring-focus"
      >
        {t("businessPage.about.photo.manage")}
        <ArrowRight className="size-3.5" strokeWidth={1.8} aria-hidden />
      </Link>

      <LocationPortfolioPhotoPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        locations={locations}
        selectedRef={selection.mode === "manual" ? config.imageRef : null}
        onSelect={selectImage}
        title={t("businessPage.about.photo.dialogTitle")}
        description={t("businessPage.about.photo.dialogDescription")}
        emptyTitle={t("businessPage.about.photo.emptyTitle")}
        emptyDescription={t("businessPage.about.photo.emptyHelp")}
        featuredLabel={t("businessPage.builder.settings.gallery.featured")}
        getPhotoCountLabel={(count) => t("businessPage.builder.settings.gallery.locationPhotos", {
          count,
        })}
        managePhotosHref={managePhotosPath}
        managePhotosLabel={t("businessPage.about.photo.manage")}
        getPhotoLabel={(image) => t("businessPage.about.photo.selectPhoto", {
          name: image.locationName,
        })}
      />
    </section>
  );
}

interface StorySourcePanelProps {
  canUseProfileStory: boolean;
  onUseProfileStory: () => void;
}

function StorySourcePanel({
  canUseProfileStory,
  onUseProfileStory,
}: StorySourcePanelProps) {
  const { t } = useTranslation("website");

  if (!canUseProfileStory) return null;

  return (
    <div className="mt-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onUseProfileStory}
        className="h-auto min-h-9 max-w-full justify-start whitespace-normal rounded-lg px-3 py-2 text-left text-[11px] leading-4 shadow-none"
      >
        {t("businessPage.about.storyUseProfile")}
      </Button>
    </div>
  );
}

/**
 * Long-form "about" content, stored as one string ("aboutContent") but edited as two fields — a bold
 * Headline (the serif lede) and the Story body — joined on a blank line via {@link joinAboutContent}.
 * All authoring controls reuse the app's shared form primitives: OptionalCopyOverride for the headline,
 * TextareaField for the required Story, and Input for the established year. The headline is kept
 * single-paragraph so the split stays unambiguous. Story source actions copy concrete text into this
 * Website-owned draft; they never create a live relationship with the Business Profile.
 */
export function AboutEditor({
  value,
  onChange,
  config,
  locations,
  onConfigChange,
  businessDescription,
  establishedYear,
  onEstablishedYearChange,
  establishedYearError,
  required = false,
  showPhoto,
  locale,
  blockingIssues = [],
}: AboutEditorProps) {
  const { t } = useTranslation(["website", "common"]);
  const [blurred, setBlurred] = useState({ year: false, body: false });

  const { title, body } = splitAboutContent(value);
  const profileStory = businessDescription?.trim() ?? "";
  const hasProfileStory = profileStory !== "";
  const trimmedBody = body.trim();
  const storyMatchesProfile = hasProfileStory && trimmedBody === profileStory;
  const hasStory = trimmedBody !== "";
  const storyMissing = required && !hasStory;
  const canUseProfileStory = hasProfileStory && !storyMatchesProfile;
  const bodyValidation = validateWebsiteCopy(body, t, {
    fieldLabel: t("businessPage.about.bodyLabel"),
    maxLength: BODY_MAX,
  });
  const issueFor = (controlId: string) => blockingIssues.find(
    (issue) => issue.controlId === controlId && (!issue.locale || issue.locale === locale),
  )?.message;
  const localBodyError = storyMissing
    ? t("businessPage.about.storyRequired")
    : blurred.body || hasUnsafeWebsiteCopyCharacters(body)
      ? bodyValidation ?? undefined
      : undefined;
  const bodyError = issueFor("business-page-about-body") ?? localBodyError;
  const yearError = issueFor("business-page-about-established-year") ?? (
    blurred.year ? establishedYearError ?? undefined : undefined
  );

  // Headline is one wrapping line — collapse newlines so the blank-line split stays unambiguous.
  const setTitle = (raw: string) => onChange(joinAboutContent(raw.replace(/\s*\n\s*/g, " "), body));
  const setBody = (raw: string) => onChange(joinAboutContent(title, raw));
  const restoreBody = (raw: string) => onChange(joinAboutContent(title, raw));
  const useProfileStory = () => {
    if (!profileStory) return;
    restoreBody(profileStory);
    setBlurred((current) => ({ ...current, body: true }));
  };

  return (
    <div className="space-y-5">
      <OptionalCopyOverride
        idBase="business-page-about-title"
        label={t("businessPage.about.titleLabel")}
        defaultText={t("businessPage.builder.preview.aboutGhostLede")}
        value={title}
        blank={config.headlineHidden === true}
        onChange={setTitle}
        onBlankChange={(blank) => onConfigChange({ headlineHidden: blank || undefined })}
        maxLength={TITLE_MAX}
        rows={2}
        locale={locale}
        required={required}
        requiredMessage={t("businessPage.about.headlineRequired")}
        externalError={issueFor("business-page-about-title")}
      />

      <div>
        <TextareaField
          id="business-page-about-body"
          label={t("businessPage.about.bodyLabel")}
          required={required}
          placeholder={t("businessPage.about.bodyPlaceholder")}
          value={body}
          onChange={setBody}
          onBlur={() => {
            if (body.trim() !== body) setBody(body.trim());
            setBlurred((current) => ({ ...current, body: true }));
          }}
          maxLength={BODY_MAX}
          showCharacterCount
          rows={6}
          className="!pt-0"
          textareaClassName="!min-h-[160px]"
          hint={(
            <StorySourcePanel
              canUseProfileStory={canUseProfileStory}
              onUseProfileStory={useProfileStory}
            />
          )}
          error={bodyError}
        />
        {!bodyError ? (
          <p className="mt-1 text-[11.5px] leading-[1.55] text-foreground-3">
            {t("businessPage.about.storyWritingHelp")}
          </p>
        ) : null}
      </div>

      <div className="space-y-2 border-t border-border-subtle pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="business-page-about-established-year" className="text-base font-medium">
            {t("businessPage.about.establishedYearLabel")}
          </Label>
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-foreground-3">
            {t("businessPage.about.optionalLabel")}
          </span>
        </div>
        <Input
          id="business-page-about-established-year"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={ESTABLISHED_YEAR_LENGTH}
          placeholder={t("businessPage.about.establishedYearPlaceholder")}
          value={establishedYear ?? ""}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "").slice(0, ESTABLISHED_YEAR_LENGTH);
            onEstablishedYearChange(digits === "" ? null : Number(digits));
          }}
          onBlur={() => setBlurred((current) => ({ ...current, year: true }))}
          autoComplete="off"
          className="max-w-[9rem] tabular-nums"
          aria-invalid={!!yearError}
          aria-describedby={yearError
            ? "business-page-about-established-year-error"
            : "business-page-about-established-year-help"}
        />
        {!yearError && (
          <p
            id="business-page-about-established-year-help"
            className="text-xs text-foreground-3 dark:text-foreground-2"
          >
            {t("businessPage.about.establishedYearHelp")}
          </p>
        )}
        <div className="min-h-5">
          {yearError && (
            <p
              id="business-page-about-established-year-error"
              className="mt-1 flex items-center gap-1.5 text-xs text-destructive"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="size-3.5" aria-hidden="true" />
              <span>{yearError}</span>
            </p>
          )}
        </div>
      </div>

      <section className="border-t border-border-subtle pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-[12px] font-semibold text-foreground-1">
              {t("businessPage.about.statsLabel")}
            </h4>
            <p className="mt-1 text-[11px] leading-[1.55] text-foreground-3">
              {t("businessPage.about.statsHelp")}
            </p>
          </div>
          <Switch
            checked={config.showStats !== false}
            onCheckedChange={(show) => onConfigChange({ showStats: show })}
            aria-label={t("businessPage.about.statsToggle")}
          />
        </div>
      </section>

      {showPhoto ? (
        <AboutPhotoEditor
          config={config}
          locations={locations}
          onConfigChange={onConfigChange}
        />
      ) : null}
    </div>
  );
}

export default AboutEditor;
