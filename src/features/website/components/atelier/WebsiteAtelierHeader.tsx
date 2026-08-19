import { useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Check, ChevronLeft, CircleAlert, Eye, LoaderCircle, Save as SaveIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../../shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../../shared/components/ui/tooltip";

export type AtelierPublishStatus = "draft" | "live" | "stale";
export type AtelierSaveStatus =
  | "saved"
  | "unsaved"
  | "saving"
  | "queued"
  | "invalid"
  | "offline"
  | "failed"
  | "conflict";

interface WebsiteAtelierHeaderProps {
  variant: "desktop" | "mobile";
  /** Phone layout (<768px) inside the mobile variant: labeled Save pill, preview lives in the ⋯ sheet. */
  phone?: boolean;
  /** Phone only: preview would be the ⋯ sheet's only row, so it renders as a header button instead. */
  phoneShowsPreviewInline?: boolean;
  /** Phone Save pill only exists while there is something to save. */
  hasUnsavedChanges?: boolean;
  saveMode?: "save" | "retry";
  /** Edit-only plans: replaces "Not published yet" so the caption says why publish is absent. */
  draftPlanCaption?: string | null;
  businessName?: string | null;
  brandColor?: string | null;
  monogramFontFamily?: string;
  monogramFontWeight?: number;
  publishStatus?: AtelierPublishStatus;
  saveStatus?: AtelierSaveStatus;
  pendingControl?: ReactNode;
  moreControl?: ReactNode;
  onBack?: () => void;
  onPreview?: () => void;
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  saveDisabledReason?: string | null;
  saveBusy?: boolean;
  blockingIssueCount?: number;
  onReviewBlockingIssues?: () => void;
  onPublish?: () => void;
  publishLabel?: string;
  publishHint?: string | null;
  /** Dirty drafts are saved atomically before the returned version is published. */
  publishSavesChanges?: boolean;
  publishDisabled?: boolean;
  publishDisabledReason?: string | null;
  publishBusy?: boolean;
}

const monogramFor = (name?: string | null) => {
  const first = name?.trim().charAt(0);
  return first ? first.toLocaleUpperCase() : "Z";
};

const saveStatusKey: Record<AtelierSaveStatus, string> = {
  saved: "page.status.saved",
  unsaved: "page.status.unsaved",
  saving: "page.status.saving",
  queued: "page.status.queued",
  invalid: "page.save.invalid",
  offline: "page.save.offline",
  failed: "page.save.failed",
  conflict: "page.save.conflict",
};

function SaveStatus({
  status,
  blockingIssueCount = 0,
  onReviewBlockingIssues,
}: {
  status: AtelierSaveStatus;
  blockingIssueCount?: number;
  onReviewBlockingIssues?: () => void;
}) {
  const { t } = useTranslation("website");
  const previousStatus = useRef(status);
  const [showSavedFlash, setShowSavedFlash] = useState(false);
  const isWarning = status === "invalid" || status === "offline" || status === "failed" || status === "conflict";
  const isVisible = status !== "saved" || showSavedFlash;
  const statusLabel =
    status === "invalid" && blockingIssueCount > 0
      ? t(
          onReviewBlockingIssues
            ? "page.save.invalidCount"
            : "page.save.invalidReadOnlyCount",
          { count: blockingIssueCount },
        )
      : t(saveStatusKey[status]);

  useEffect(() => {
    const previous = previousStatus.current;
    previousStatus.current = status;

    // Flash only after a real save lands (not after discard/reload, which also end "saved").
    if (status !== "saved") return;
    if (previous !== "saving" && previous !== "queued") return;

    setShowSavedFlash(true);
    const timeout = window.setTimeout(() => setShowSavedFlash(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const content = isVisible ? (
    <>
      {status === "saving" || status === "queued" ? (
        <span className="size-1.5 rounded-full bg-[var(--atelier-warning)] motion-safe:animate-pulse" aria-hidden />
      ) : status === "saved" ? (
        <Check className="size-3" strokeWidth={2.2} aria-hidden />
      ) : isWarning ? (
        <CircleAlert className="size-3" strokeWidth={2} aria-hidden />
      ) : (
        <span className="size-1.5 rounded-full bg-[var(--atelier-warning)]" aria-hidden />
      )}
      <span className="truncate">{statusLabel}</span>
    </>
  ) : null;
  const sharedStyle = {
    color: isWarning
      ? "var(--atelier-warning)"
      : status === "saved"
        ? "var(--atelier-success)"
        : "var(--atelier-muted)",
  };

  if (status === "invalid" && onReviewBlockingIssues) {
    return (
      <button
        type="button"
        onClick={onReviewBlockingIssues}
        className="website-atelier-focus inline-flex min-w-0 items-center gap-1.5 rounded-[5px] text-[11px] underline decoration-current/35 underline-offset-[3px] hover:decoration-current"
        style={sharedStyle}
        aria-live="polite"
        aria-atomic="true"
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className="inline-flex min-w-0 items-center gap-1.5 text-[11px]"
      style={{
        ...sharedStyle,
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      {content}
    </span>
  );
}

function PublishPill({ status }: { status: AtelierPublishStatus }) {
  const { t } = useTranslation("website");
  const label = status === "draft" ? t("page.status.draft") : t("page.status.published");
  const detail =
    status === "live"
      ? t("page.status.upToDate")
      : status === "stale"
        ? t("page.status.changesToPublish")
        : t("page.status.notPublishedDetail");
  const dot = status === "live" ? "var(--atelier-success)" : status === "stale" ? "var(--atelier-warning)" : "#d8d2c1";

  return (
    <div className="flex h-7 min-w-0 items-center gap-2 rounded-full border border-[var(--atelier-border)] bg-[var(--atelier-surface-strong)] px-3">
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: dot }} aria-hidden />
      <span className="truncate text-[12px] font-medium text-[var(--atelier-ink)]">{label}</span>
      <span
        className="hidden shrink-0 text-[12px] text-[var(--atelier-muted-soft)] min-[1120px]:inline"
        aria-hidden
      >
        ·
      </span>
      <span className="hidden truncate text-[12px] text-[var(--atelier-muted)] min-[1120px]:inline">{detail}</span>
    </div>
  );
}

function ActionReasonTooltip({
  reason,
  children,
}: {
  reason?: string | null;
  children: ReactElement;
}) {
  if (!reason) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8} className="max-w-[260px] text-center">
        {reason}
      </TooltipContent>
    </Tooltip>
  );
}

export function WebsiteAtelierHeader({
  variant,
  phone = false,
  phoneShowsPreviewInline = false,
  hasUnsavedChanges = false,
  saveMode = "save",
  draftPlanCaption,
  businessName,
  brandColor,
  monogramFontFamily,
  monogramFontWeight,
  publishStatus = "draft",
  saveStatus = "saved",
  pendingControl,
  moreControl,
  onBack,
  onPreview,
  onSave,
  saveLabel,
  saveDisabled = false,
  saveDisabledReason,
  saveBusy = false,
  blockingIssueCount = 0,
  onReviewBlockingIssues,
  onPublish,
  publishLabel,
  publishHint,
  publishSavesChanges = false,
  publishDisabled = false,
  publishDisabledReason,
  publishBusy = false,
}: WebsiteAtelierHeaderProps) {
  const { t } = useTranslation("website");
  const saveReasonId = useId();
  const publishReasonId = useId();
  // Phone caption flashes "Saved" briefly on save (the desktop SaveStatus does the same).
  const previousSaveStatus = useRef(saveStatus);
  const [mobileSavedFlash, setMobileSavedFlash] = useState(false);
  useEffect(() => {
    const previous = previousSaveStatus.current;
    previousSaveStatus.current = saveStatus;
    if (saveStatus !== "saved" || (previous !== "saving" && previous !== "queued")) return;
    setMobileSavedFlash(true);
    const timeout = window.setTimeout(() => setMobileSavedFlash(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [saveStatus]);
  const title = businessName?.trim() || t("page.identity.fallbackName");
  const isSaveWarning =
    saveStatus === "invalid" ||
    saveStatus === "offline" ||
    saveStatus === "failed" ||
    saveStatus === "conflict";
  const mobilePublicationSummary =
    publishStatus === "live"
      ? `${t("page.status.published")} · ${t("page.status.upToDate")}`
      : publishStatus === "stale"
        ? t("page.status.draftAheadOfLive")
        : draftPlanCaption || t("page.status.notPublishedYet");
  const mobileStatusLabel =
    saveStatus === "invalid" && blockingIssueCount > 0
      ? t(
          onReviewBlockingIssues
            ? "page.save.invalidCount"
            : "page.save.invalidReadOnlyCount",
          { count: blockingIssueCount },
        )
      : saveStatus === "saving" || saveStatus === "queued" || isSaveWarning
        ? t(saveStatusKey[saveStatus])
        : saveStatus === "unsaved"
          ? t("page.status.unsaved")
          : mobileSavedFlash
            ? t("page.status.saved")
            : mobilePublicationSummary;
  const mobileStatusTone = isSaveWarning
    ? "text-[var(--atelier-warning)]"
    : saveStatus === "saved" && (mobileSavedFlash || publishStatus === "live")
      ? "text-[var(--atelier-success)]"
      : "text-[var(--atelier-ink-soft)]";
  const saveActionLabel = saveLabel ?? t("page.actions.saveChanges");
  const desktopPublishLabel = publishLabel ?? (publishSavesChanges
    ? t("page.actions.savePublish")
    : publishStatus === "live"
      ? t("page.actions.published")
      : publishStatus === "stale"
        ? t("page.actions.publishChanges")
        : t("page.actions.publish"));
  const mobilePublishLabel = publishLabel ?? (publishSavesChanges
    ? t("page.actions.savePublish")
    : publishStatus === "live"
      ? t("page.actions.published")
      : t("page.actions.publish"));
  const publishActionReason = publishDisabledReason ?? publishHint;
  const isCurrentLive = publishStatus === "live" && publishDisabled;
  const mobileSaveTone = isSaveWarning
    ? "text-[var(--atelier-warning)]"
    : saveStatus === "saved"
      ? "text-[var(--atelier-success)]"
      : "text-[var(--atelier-ink)]";
  // Saved + nothing to do: render as inert status, not a bordered control — a bordered
  // check at the top-right of a phone screen reads as "Done" and invites a tap that does nothing.
  const mobileSaveInert = saveStatus === "saved" && !saveBusy;
  const mobileSaveSpinning = saveBusy || saveStatus === "saving" || saveStatus === "queued";
  const publishAriaLabel = (label: string) =>
    publishBusy
      ? t("page.status.publishing")
      : publishActionReason
        ? `${label}: ${publishActionReason}`
        : label;

  const handlePublish = () => {
    if (publishDisabled || publishBusy) return;
    onPublish?.();
  };

  const handleSave = () => {
    if (saveDisabled || saveBusy) return;
    onSave?.();
  };

  if (variant === "mobile") {
    return (
      <div className="flex h-[54px] w-full min-w-0 items-center gap-2.5 px-3">
        {/* Same recipe as the app's mobile page header (Breadcrumbs): nav chrome follows the app, not the skin. */}
        <Button
          variant="ghost"
          size="icon"
          rounded="full"
          onClick={onBack}
          className="h-8 !w-8 shrink-0 text-[var(--atelier-ink-soft)] hover:bg-[var(--atelier-field)] hover:text-[var(--atelier-ink)]"
          aria-label={t("page.actions.backToDashboard")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          {/* Publish state lives in the caption text; no dot echoing it next to the title. */}
          <p className="truncate text-[15px] font-[650] tracking-[-0.01em]">{t("page.title")}</p>
          {saveStatus === "invalid" && onReviewBlockingIssues ? (
            <button
              type="button"
              onClick={onReviewBlockingIssues}
              className="website-atelier-focus mt-px block max-w-full truncate rounded-[4px] text-left text-[12px] text-[var(--atelier-warning)] underline decoration-current/35 underline-offset-2 hover:decoration-current"
              aria-live="polite"
            >
              {mobileStatusLabel}
            </button>
          ) : (
            <p className={`mt-px truncate text-[12px] ${mobileStatusTone}`} aria-live="polite">
              {mobileStatusLabel}
            </p>
          )}
        </div>
        {onPreview && phoneShowsPreviewInline ? (
          // Same recipe as the Save pill: a labeled header action, since it's the screen's
          // only control here — a bare icon square would be under-designed standing alone.
          <Button
            type="button"
            variant="outline"
            size="sm"
            rounded="full"
            onClick={onPreview}
            className="!min-h-0 shrink-0 gap-1.5 px-3 text-xs font-medium"
          >
            <Eye className="h-3.5 w-3.5 text-primary" strokeWidth={1.7} aria-hidden />
            {t("page.actions.preview")}
          </Button>
        ) : onPreview && !phone ? (
          <button
            type="button"
            onClick={onPreview}
            className="website-atelier-focus website-atelier-press relative grid h-8 w-[34px] shrink-0 place-items-center rounded-[9px] border border-[var(--atelier-border)] bg-[var(--atelier-surface-strong)] text-[var(--atelier-ink-soft)] after:absolute after:-inset-[5px] after:content-[''] hover:border-[color-mix(in_srgb,var(--atelier-ink)_28%,transparent)]"
            aria-label={t("businessPage.builder.openPreview")}
          >
            <Eye className="size-3.5" strokeWidth={1.7} aria-hidden />
          </button>
        ) : null}
        {onSave && phone ? (
          hasUnsavedChanges ? (
            <>
              {/* Same recipe as the calendar's "Today" pill: a labeled header action, present only while it has work to do. */}
              <ActionReasonTooltip reason={saveDisabledReason}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  rounded="full"
                  onClick={handleSave}
                  loading={mobileSaveSpinning}
                  aria-disabled={saveDisabled || saveBusy}
                  aria-describedby={saveDisabledReason ? saveReasonId : undefined}
                  aria-label={
                    saveDisabledReason
                      ? `${saveActionLabel}: ${saveDisabledReason}`
                      : saveActionLabel
                  }
                  className={`!min-h-0 shrink-0 gap-1.5 px-3 text-xs font-medium aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${
                    saveMode === "retry" ? "text-[var(--atelier-warning)]" : ""
                  }`}
                >
                  {saveMode === "retry" ? (
                    <CircleAlert className="h-3.5 w-3.5 text-[var(--atelier-warning)]" strokeWidth={1.9} aria-hidden />
                  ) : (
                    <SaveIcon className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} aria-hidden />
                  )}
                  {saveMode === "retry" ? t("page.actions.retry") : t("page.actions.save")}
                </Button>
              </ActionReasonTooltip>
              {saveDisabledReason ? (
                <span id={saveReasonId} className="sr-only">
                  {saveDisabledReason}
                </span>
              ) : null}
            </>
          ) : null
        ) : onSave ? (
          <>
            <ActionReasonTooltip reason={saveDisabledReason}>
              <button
                type="button"
                onClick={handleSave}
                aria-disabled={saveDisabled || saveBusy}
                aria-busy={saveBusy}
                aria-describedby={saveDisabledReason ? saveReasonId : undefined}
                aria-label={
                  saveDisabledReason
                    ? `${saveActionLabel}: ${saveDisabledReason}`
                    : saveActionLabel
                }
                className={`website-atelier-focus relative grid size-[34px] shrink-0 place-items-center rounded-[9px] border after:absolute after:-inset-[5px] after:content-[''] ${
                  mobileSaveInert
                    ? "border-transparent bg-transparent aria-disabled:cursor-default aria-disabled:opacity-100"
                    : `website-atelier-press border-[var(--atelier-border)] bg-[var(--atelier-surface-strong)] hover:border-[color-mix(in_srgb,var(--atelier-ink)_28%,transparent)] aria-disabled:cursor-not-allowed ${
                        isSaveWarning ? "aria-disabled:opacity-100" : "aria-disabled:opacity-45"
                      }`
                } ${mobileSaveTone}`}
              >
                {mobileSaveSpinning ? (
                  <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
                ) : saveStatus === "saved" ? (
                  <Check className="size-3.5" strokeWidth={2} aria-hidden />
                ) : isSaveWarning ? (
                  <CircleAlert className="size-3.5" strokeWidth={1.9} aria-hidden />
                ) : (
                  <SaveIcon className="size-3.5" strokeWidth={1.8} aria-hidden />
                )}
              </button>
            </ActionReasonTooltip>
            {saveDisabledReason ? (
              <span id={saveReasonId} className="sr-only">
                {saveDisabledReason}
              </span>
            ) : null}
          </>
        ) : null}
        {onPublish ? (
          <>
            <ActionReasonTooltip reason={publishActionReason}>
              <button
                type="button"
                onClick={handlePublish}
                aria-disabled={publishDisabled || publishBusy}
                aria-busy={publishBusy}
                aria-describedby={publishActionReason ? publishReasonId : undefined}
                aria-label={publishAriaLabel(mobilePublishLabel)}
                className={`website-atelier-focus website-atelier-press relative flex h-8 min-w-[72px] shrink-0 items-center justify-center whitespace-nowrap rounded-[9px] px-3 text-[12px] font-semibold after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-[''] aria-disabled:cursor-not-allowed aria-disabled:opacity-45 max-[767px]:hidden ${
                  isCurrentLive
                    ? "cursor-default bg-[var(--atelier-field)] text-[var(--atelier-muted)] hover:opacity-100"
                    : "bg-[var(--atelier-ink)] text-[var(--atelier-canvas)] hover:opacity-90"
                }`}
              >
                {publishBusy ? (
                  <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
                ) : (
                  mobilePublishLabel
                )}
              </button>
            </ActionReasonTooltip>
            {publishActionReason ? (
              <span id={publishReasonId} className="sr-only">
                {publishActionReason}
              </span>
            ) : null}
          </>
        ) : null}
        {moreControl}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-w-0 items-center gap-3 px-4">
      <div
        className="grid size-[30px] shrink-0 place-items-center rounded-[9px] text-[15px] font-semibold text-[#fbf8f3]"
        style={{
          backgroundColor: brandColor || "var(--atelier-accent)",
          fontFamily: monogramFontFamily,
          fontWeight: monogramFontWeight,
        }}
        aria-hidden
      >
        {monogramFor(title)}
      </div>
      <div className="min-w-0 leading-[1.1]">
        <p className="truncate text-[14px] font-[650] tracking-[-0.01em] text-[var(--atelier-ink)]">{title}</p>
      </div>
      <span className="h-[18px] w-px shrink-0 bg-[var(--atelier-border)]" aria-hidden />
      <PublishPill status={publishStatus} />
      <SaveStatus
        status={saveStatus}
        blockingIssueCount={blockingIssueCount}
        onReviewBlockingIssues={onReviewBlockingIssues}
      />
      <div className="min-w-0 flex-1" />
      {pendingControl}
      {onSave ? (
        <>
          <ActionReasonTooltip reason={saveDisabledReason}>
            <button
              type="button"
              onClick={handleSave}
              aria-disabled={saveDisabled || saveBusy}
              aria-busy={saveBusy}
              aria-describedby={saveDisabledReason ? saveReasonId : undefined}
              aria-label={
                saveDisabledReason
                  ? `${saveActionLabel}: ${saveDisabledReason}`
                  : saveActionLabel
              }
              className="website-atelier-focus website-atelier-press flex h-8 min-w-[104px] shrink-0 items-center justify-center gap-1.5 rounded-[9px] border border-[var(--atelier-border)] bg-[var(--atelier-surface-strong)] px-3 text-[12.5px] font-semibold text-[var(--atelier-ink)] hover:border-[color-mix(in_srgb,var(--atelier-ink)_28%,transparent)] aria-disabled:cursor-not-allowed aria-disabled:opacity-45 max-[1119px]:min-w-0 max-[1119px]:size-[34px] max-[1119px]:px-0"
            >
              {saveBusy ? (
                <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
              ) : (
                <SaveIcon className="size-3.5" strokeWidth={1.8} aria-hidden />
              )}
              <span className="max-[1119px]:hidden">{saveActionLabel}</span>
            </button>
          </ActionReasonTooltip>
          {saveDisabledReason ? (
            <span id={saveReasonId} className="sr-only">
              {saveDisabledReason}
            </span>
          ) : null}
        </>
      ) : null}
      {onPublish ? (
        <>
          <ActionReasonTooltip reason={publishActionReason}>
            <button
              type="button"
              onClick={handlePublish}
              aria-disabled={publishDisabled || publishBusy}
              aria-busy={publishBusy}
              aria-describedby={publishActionReason ? publishReasonId : undefined}
              aria-label={publishAriaLabel(desktopPublishLabel)}
              className={`website-atelier-focus website-atelier-press flex h-8 min-w-[78px] shrink-0 items-center justify-center rounded-[9px] px-4 text-[12.5px] font-semibold aria-disabled:cursor-not-allowed aria-disabled:opacity-45 ${
                isCurrentLive
                  ? "cursor-default bg-[var(--atelier-field)] text-[var(--atelier-muted)] hover:opacity-100"
                  : "bg-[var(--atelier-ink)] text-[var(--atelier-canvas)] hover:opacity-90"
              }`}
            >
              {publishBusy ? (
                <span className="inline-flex items-center gap-1.5">
                  <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
                  <span className="hidden min-[1120px]:inline">{t("page.status.publishing")}</span>
                </span>
              ) : (
                desktopPublishLabel
              )}
            </button>
          </ActionReasonTooltip>
          {publishActionReason ? (
            <span id={publishReasonId} className="sr-only">
              {publishActionReason}
            </span>
          ) : null}
        </>
      ) : null}
      {moreControl}
    </div>
  );
}
