import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Check, CircleAlert, Eye, LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  onPublish?: () => void;
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
  invalid: "page.autosave.invalid",
  offline: "page.autosave.offline",
  failed: "page.autosave.failed",
  conflict: "page.autosave.conflict",
};

function SaveStatus({ status }: { status: AtelierSaveStatus }) {
  const { t } = useTranslation("website");
  const previousStatus = useRef(status);
  const [showSavedFlash, setShowSavedFlash] = useState(false);
  const isWarning = status === "invalid" || status === "offline" || status === "failed" || status === "conflict";
  const isVisible = status !== "saved" || showSavedFlash;

  useEffect(() => {
    const previous = previousStatus.current;
    previousStatus.current = status;

    if (status !== "saved") return;
    if (previous === "saved") return;

    setShowSavedFlash(true);
    const timeout = window.setTimeout(() => setShowSavedFlash(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [status]);

  return (
    <span
      className="inline-flex min-w-0 items-center gap-1.5 text-[11px]"
      style={{
        color: isWarning
          ? "var(--atelier-warning)"
          : status === "saved"
            ? "var(--atelier-success)"
            : "var(--atelier-muted)",
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      {isVisible ? (
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
          <span className="truncate">{t(saveStatusKey[status])}</span>
        </>
      ) : null}
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
      <span className="hidden truncate text-[12px] text-[var(--atelier-muted)] min-[1120px]:inline">{detail}</span>
    </div>
  );
}

export function WebsiteAtelierHeader({
  variant,
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
  onPublish,
  publishDisabled = false,
  publishDisabledReason,
  publishBusy = false,
}: WebsiteAtelierHeaderProps) {
  const { t } = useTranslation("website");
  const publishReasonId = useId();
  const title = businessName?.trim() || t("page.identity.fallbackName");
  const isSaveWarning =
    saveStatus === "invalid" ||
    saveStatus === "offline" ||
    saveStatus === "failed" ||
    saveStatus === "conflict";
  const mobilePublicationSummary =
    publishStatus === "live"
      ? t("page.status.upToDate")
      : publishStatus === "stale"
        ? t("page.status.draftAheadOfLive")
        : t("page.status.notPublishedYet");
  const mobileStatusLabel =
    saveStatus === "saving" || saveStatus === "queued" || isSaveWarning
      ? t(saveStatusKey[saveStatus])
      : mobilePublicationSummary;
  const desktopPublishLabel =
    publishStatus === "live"
      ? t("page.actions.published")
      : publishStatus === "stale"
        ? t("page.actions.publishChanges")
        : t("page.actions.publish");
  const mobilePublishLabel =
    publishStatus === "live"
      ? t("page.actions.published")
      : t("page.actions.publish");
  const isCurrentLive = publishStatus === "live" && publishDisabled;
  const publishAriaLabel = (label: string) =>
    publishBusy
      ? t("page.status.publishing")
      : publishDisabledReason
        ? `${label}: ${publishDisabledReason}`
        : label;

  const handlePublish = () => {
    if (publishDisabled || publishBusy) return;
    onPublish?.();
  };

  if (variant === "mobile") {
    return (
      <div className="flex h-[54px] w-full min-w-0 items-center gap-2.5 px-3">
        <button
          type="button"
          onClick={onBack}
          className="website-atelier-focus website-atelier-press relative grid size-8 shrink-0 place-items-center rounded-[8px] text-[var(--atelier-ink-soft)] after:absolute after:-inset-1.5 after:content-[''] hover:bg-[var(--atelier-field)]"
          aria-label={t("page.actions.backToDashboard")}
        >
          <ArrowLeft className="size-[17px]" strokeWidth={1.9} aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-[650] tracking-[-0.01em]">{t("page.title")}</span>
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  publishStatus === "live"
                    ? "var(--atelier-success)"
                    : publishStatus === "stale"
                      ? "var(--atelier-warning)"
                      : "#d8d2c1",
              }}
              aria-hidden
            />
          </div>
          <p className="mt-0.5 truncate text-[10.5px] text-[var(--atelier-muted)]" aria-live="polite">
            {mobileStatusLabel}
          </p>
        </div>
        {onPreview ? (
          <button
            type="button"
            onClick={onPreview}
            className="website-atelier-focus website-atelier-press relative grid h-8 w-[34px] shrink-0 place-items-center rounded-[9px] border border-[var(--atelier-border)] bg-[var(--atelier-surface-strong)] text-[var(--atelier-ink-soft)] after:absolute after:-inset-[5px] after:content-[''] hover:border-[color-mix(in_srgb,var(--atelier-ink)_28%,transparent)]"
            aria-label={t("businessPage.builder.openPreview")}
          >
            <Eye className="size-3.5" strokeWidth={1.7} aria-hidden />
          </button>
        ) : null}
        {onPublish ? (
          <>
            <button
              type="button"
              onClick={handlePublish}
              aria-disabled={publishDisabled || publishBusy}
              aria-busy={publishBusy}
              aria-describedby={publishDisabledReason ? publishReasonId : undefined}
              aria-label={publishAriaLabel(mobilePublishLabel)}
              className={`website-atelier-focus website-atelier-press relative flex h-8 min-w-[72px] shrink-0 items-center justify-center whitespace-nowrap rounded-[9px] px-3 text-[12px] font-semibold after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-[''] aria-disabled:cursor-not-allowed aria-disabled:opacity-45 ${
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
            {publishDisabledReason ? (
              <span id={publishReasonId} className="sr-only">
                {publishDisabledReason}
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
      <SaveStatus status={saveStatus} />
      <div className="min-w-0 flex-1" />
      {pendingControl}
      {onPreview ? (
        <button
          type="button"
          onClick={onPreview}
          aria-label={t("businessPage.builder.openPreview")}
          className="website-atelier-focus website-atelier-press flex h-8 shrink-0 items-center gap-1.5 rounded-[9px] border border-[var(--atelier-border)] bg-[var(--atelier-surface-strong)] px-3 text-[12.5px] font-medium text-[var(--atelier-ink-soft)] hover:border-[color-mix(in_srgb,var(--atelier-ink)_28%,transparent)] max-[1119px]:size-[34px] max-[1119px]:justify-center max-[1119px]:px-0"
        >
          <Eye className="size-3.5" strokeWidth={1.7} aria-hidden />
          <span className="hidden min-[1120px]:inline">{t("businessPage.builder.openPreview")}</span>
        </button>
      ) : null}
      {onPublish ? (
        <>
          <button
            type="button"
            onClick={handlePublish}
            aria-disabled={publishDisabled || publishBusy}
            aria-busy={publishBusy}
            aria-describedby={publishDisabledReason ? publishReasonId : undefined}
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
          {publishDisabledReason ? (
            <span id={publishReasonId} className="sr-only">
              {publishDisabledReason}
            </span>
          ) : null}
        </>
      ) : null}
      {moreControl}
    </div>
  );
}
