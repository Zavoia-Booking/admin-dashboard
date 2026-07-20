import { useEffect, useState, type ComponentType } from "react";
import type { SectionEntry, AnnouncementConfig } from "../../../../../types";
import { prefersReducedMotion } from "../../shared/util";
import type { PreviewData, T } from "../../shared/types";
import "./base.css";
import { AnnoDetailsDialog, AnnoDetailsTrigger } from "./parts/AnnoDetails";
import { AnnoDismiss } from "./parts/AnnoDismiss";
import { Pill } from "./variants/Pill";
import { Ribbon } from "./variants/Ribbon";
import { Ticker } from "./variants/Ticker";
import type { AnnouncementLayout, AnnouncementVariantProps } from "./types";

const DISMISSAL_KEY = "mc-anno-dismissed";

/** Resolve the active language first, then the other saved language, ignoring whitespace-only values. */
function localizedAnnouncementText(
  value: { en: string; ro: string } | undefined,
  locale: "en" | "ro",
) {
  if (!value) return "";
  const alternate = locale === "en" ? value.ro : value.en;
  return value[locale].trim() || alternate.trim();
}

/** Existing drafts and purchases retain their stable catalog keys; only the customer-facing designs change. */
export function normalizeAnnouncementLayout(value: unknown): AnnouncementLayout {
  if (value === "split" || value === "ticker") return "ticker";
  if (value === "hairline" || value === "pill") return "pill";
  return "ribbon";
}

function hashAnnouncement(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return `a${(hash >>> 0).toString(36)}`;
}

/** Visible content changes make a previously dismissed announcement reappear. */
export function announcementDismissalSignature(data: PreviewData) {
  const message = localizedAnnouncementText(data.announcement.message, data.locale);
  const details = localizedAnnouncementText(data.announcement.details ?? undefined, data.locale);
  const cta = localizedAnnouncementText(data.announcement.cta.label, data.locale);
  const deadline = data.announcement.schedule?.end ?? "";
  const countdownSignature = data.announcement.schedule?.showCountdown === false
    ? "|countdown-off"
    : "";
  // Versioning deliberately invalidates old dismissal records once, then correctly handles Details
  // being added, edited, or removed without falling back to a previously dismissed legacy hash.
  return hashAnnouncement(`v2|${message}|${details}|${cta}|${deadline}${countdownSignature}`);
}

export function announcementHasMessage(data: PreviewData) {
  return localizedAnnouncementText(data.announcement.message, data.locale).length > 0;
}

export function wasAnnouncementDismissed(signature: string) {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DISMISSAL_KEY) === signature;
  } catch {
    return false;
  }
}

const VARIANTS: Record<AnnouncementLayout, ComponentType<AnnouncementVariantProps>> = {
  ribbon: Ribbon,
  ticker: Ticker,
  pill: Pill,
};

interface AnnouncementBarProps {
  entry: SectionEntry;
  data: PreviewData;
  t: T;
  sample?: boolean;
  /** Builder-only empty-state copy for the full draft preview; publish readiness still requires real copy. */
  showPlaceholder?: boolean;
  /** Reserved for a future public renderer; builder previews intentionally keep dismissal session-local. */
  persistDismissal?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

export function AnnouncementBar({
  entry,
  data,
  t,
  sample = false,
  showPlaceholder = false,
  persistDismissal = false,
  onVisibilityChange,
}: AnnouncementBarProps) {
  const realMsg = localizedAnnouncementText(data.announcement.message, data.locale);
  const realDetails = localizedAnnouncementText(data.announcement.details ?? undefined, data.locale);
  const cta = data.announcement.cta;
  const realCtaLabel = localizedAnnouncementText(cta.label, data.locale);
  const isEmpty = !realMsg.trim();
  const placeholder = isEmpty && (sample || showPlaceholder);
  const signature = announcementDismissalSignature(data);
  const [dismissed, setDismissed] = useState(
    () => persistDismissal && !sample && !placeholder && wasAnnouncementDismissed(signature),
  );
  const [rootNode, setRootNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setDismissed(
      persistDismissal && !sample && !placeholder && wasAnnouncementDismissed(signature),
    );
  }, [persistDismissal, placeholder, sample, signature]);

  const show = (!isEmpty || placeholder) && !dismissed;
  const showDetails = !(isEmpty && sample) && realDetails.length > 0;

  useEffect(() => {
    onVisibilityChange?.(show);
  }, [onVisibilityChange, show]);

  useEffect(() => {
    const element = rootNode;
    if (!show || !element || prefersReducedMotion()) return;
    const animation = element.animate(
      [{ transform: "translateY(-100%)" }, { transform: "translateY(0)" }],
      { duration: 520, easing: "cubic-bezier(0.22,1,0.36,1)" },
    );
    return () => animation.cancel();
  }, [rootNode, show, signature]);

  if (!show) return null;

  // Only the scoped empty-state card is a fully synthetic sample. In the full builder preview,
  // an empty message gets placeholder copy but every real setting must remain observable: CTA
  // enabled/label/link/options and the schedule countdown still come from the working draft.
  const syntheticSample = isEmpty && sample;
  const msg = isEmpty ? t("businessPage.builder.announcement.sampleMessage") : realMsg;
  const ctaLabel = syntheticSample
    ? t("businessPage.builder.announcement.sampleCta")
    : realCtaLabel;
  const showCta = syntheticSample || (cta.enabled && realCtaLabel.trim().length > 0);
  const showArrow = syntheticSample ? true : cta.showArrow;
  const countdownEnd =
    syntheticSample || data.announcement.schedule?.showCountdown === false
      ? null
      : (data.announcement.schedule?.end ?? null);
  const countdownTimezone = syntheticSample
    ? null
    : (data.announcement.schedule?.timezone?.trim() || data.businessTimezone);
  const layout = normalizeAnnouncementLayout(entry.variant);
  const Variant = VARIANTS[layout];
  const rawTone = (entry.config as AnnouncementConfig | undefined)?.tone;
  const tone = rawTone === "offer" ? "offer" : "neutral";

  const dismiss = () => {
    if (persistDismissal && !sample) {
      try {
        window.localStorage.setItem(DISMISSAL_KEY, signature);
      } catch {
        // Storage can be unavailable in privacy-restricted contexts; local state still dismisses the bar.
      }
    }
    setDismissed(true);
    onVisibilityChange?.(false);
  };

  const dismissControl = (
    <AnnoDismiss
      label={t("businessPage.builder.preview.aria.dismissAnnouncement")}
      onDismiss={dismiss}
      sample={sample || placeholder}
    />
  );
  const detailsControl = showDetails ? (
    <AnnoDetailsTrigger label={t("businessPage.builder.announcement.readMore")} />
  ) : null;
  // Avoid two competing links in the compact bar. When long-form Details exist, Read more is the
  // bar action and the configured destination remains available as the modal's footer button.
  const showBarCta = showCta && !showDetails;
  const variantProps: AnnouncementVariantProps = {
    msg,
    ctaLabel,
    ctaUrl: syntheticSample ? "" : cta.url.trim(),
    ctaNewTab: !syntheticSample && cta.newTab,
    showCta: showBarCta,
    showArrow,
    detailsControl,
    dismissControl,
  };
  const className = [
    "mc-anno",
    `mc-anno--${tone}`,
    `mc-anno--lay-${layout}`,
    showDetails && "mc-anno--has-details",
    sample && "mc-anno--sample",
  ]
    .filter(Boolean)
    .join(" ");

  const portalRoot = rootNode?.closest<HTMLElement>(".mc-root") ?? null;

  const announcement = (
    <div
      ref={setRootNode}
      className={className}
      data-preview-section="announcement"
      data-announcement-layout={layout}
      role="region"
      aria-label={t("businessPage.builder.preview.aria.announcement")}
    >
      <Variant {...variantProps} />
      {layout !== "pill" && dismissControl}
    </div>
  );

  return showDetails ? (
    <AnnoDetailsDialog
      anchor={rootNode}
      portalRoot={portalRoot}
      title={msg}
      details={realDetails}
      ctaLabel={ctaLabel}
      ctaUrl={syntheticSample ? "" : cta.url.trim()}
      ctaNewTab={!syntheticSample && cta.newTab}
      showCta={showCta}
      showArrow={showArrow}
      countdownEnd={countdownEnd}
      countdownTimezone={countdownTimezone}
      t={t}
    >
      {announcement}
    </AnnoDetailsDialog>
  ) : announcement;
}
