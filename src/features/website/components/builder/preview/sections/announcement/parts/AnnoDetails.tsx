import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { findScrollParent } from "../../../shared/util";
import type { T } from "../../../shared/types";
import { AnnoCta } from "./AnnoCta";
import { AnnoCountdown } from "./AnnoCountdown";
import "./details.css";

const VIEWPORT_CLEAR_DELAY_MS = 180;

const clearViewportVariables = (root: HTMLElement) => {
  root.style.removeProperty("--mc-anno-overlay-top");
  root.style.removeProperty("--mc-anno-overlay-height");
  root.style.removeProperty("--mc-anno-overlay-center");
  root.style.removeProperty("--mc-anno-overlay-bottom");
};

/**
 * Measures the visible preview viewport in the microsite's logical (unscaled) pixels. Portalling to the
 * microsite root keeps the dialog inside phone/tablet previews instead of covering the dashboard shell.
 */
function useAnnouncementDialogViewport({
  open,
  anchor,
  portalRoot,
}: {
  open: boolean;
  anchor: HTMLElement | null;
  portalRoot: HTMLElement | null;
}) {
  const clearTimerRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchor || !portalRoot) return;
    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }

    const scrollParent = findScrollParent(anchor);
    let frame = 0;
    const syncViewport = () => {
      frame = 0;
      const rootRect = portalRoot.getBoundingClientRect();
      const rootWidth = portalRoot.offsetWidth;
      const rootScale = rootWidth > 0 ? rootRect.width / rootWidth : 1;
      const safeRootScale = Number.isFinite(rootScale) && rootScale > 0 ? rootScale : 1;

      let logicalTop: number;
      let logicalHeight: number;
      if (scrollParent) {
        const scrollRect = scrollParent.getBoundingClientRect();
        const previewScale = scrollParent.clientWidth > 0
          ? scrollRect.width / scrollParent.clientWidth
          : safeRootScale;
        const safeScale = Number.isFinite(previewScale) && previewScale > 0
          ? previewScale
          : safeRootScale;
        logicalTop = Math.max(0, (scrollRect.top - rootRect.top) / safeScale);
        logicalHeight = scrollParent.clientHeight;
      } else {
        // A standalone microsite may use the document as its scroller. Keep the same preview-local portal,
        // but align it to the portion of the root currently visible in the browser viewport.
        const visualTop = Math.max(0, -rootRect.top);
        const visualBottom = Math.min(rootRect.height, window.innerHeight - rootRect.top);
        logicalTop = visualTop / safeRootScale;
        logicalHeight = Math.max(0, visualBottom - visualTop) / safeRootScale;
      }

      const rootHeight = Math.max(portalRoot.scrollHeight, portalRoot.offsetHeight);
      const boundedHeight = Math.max(0, Math.min(logicalHeight, rootHeight - logicalTop));
      const logicalBottom = Math.max(0, rootHeight - logicalTop - boundedHeight);
      portalRoot.style.setProperty("--mc-anno-overlay-top", `${logicalTop}px`);
      portalRoot.style.setProperty("--mc-anno-overlay-height", `${boundedHeight}px`);
      portalRoot.style.setProperty(
        "--mc-anno-overlay-center",
        `${logicalTop + boundedHeight / 2}px`,
      );
      portalRoot.style.setProperty("--mc-anno-overlay-bottom", `${logicalBottom}px`);
    };
    const queueSync = () => {
      if (!frame) frame = window.requestAnimationFrame(syncViewport);
    };

    const previousOverflow = scrollParent?.style.overflowY ?? "";
    const previousScrollBehavior = scrollParent?.style.scrollBehavior ?? "";
    const frozenScrollTop = scrollParent?.scrollTop ?? 0;
    if (scrollParent) {
      scrollParent.style.scrollBehavior = "auto";
      scrollParent.scrollTo({ top: frozenScrollTop, behavior: "auto" });
      scrollParent.style.overflowY = "hidden";
    }
    syncViewport();

    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(queueSync);
    observer?.observe(portalRoot);
    if (scrollParent) {
      observer?.observe(scrollParent);
      scrollParent.addEventListener("scroll", queueSync, { passive: true });
    } else {
      window.addEventListener("scroll", queueSync, { passive: true });
    }
    window.addEventListener("resize", queueSync);

    return () => {
      observer?.disconnect();
      if (scrollParent) {
        scrollParent.removeEventListener("scroll", queueSync);
        scrollParent.style.overflowY = previousOverflow;
        scrollParent.style.scrollBehavior = previousScrollBehavior;
      } else {
        window.removeEventListener("scroll", queueSync);
      }
      window.removeEventListener("resize", queueSync);
      if (frame) window.cancelAnimationFrame(frame);
      clearTimerRef.current = window.setTimeout(() => {
        clearViewportVariables(portalRoot);
        clearTimerRef.current = null;
      }, VIEWPORT_CLEAR_DELAY_MS);
    };
  }, [anchor, open, portalRoot]);

  useLayoutEffect(() => () => {
    if (clearTimerRef.current !== null) window.clearTimeout(clearTimerRef.current);
    if (portalRoot) clearViewportVariables(portalRoot);
  }, [portalRoot]);
}

export function AnnoDetailsTrigger({ label }: { label: string }) {
  return (
    <DialogPrimitive.Trigger asChild>
      <button type="button" className="mc-anno-more">
        {label}
      </button>
    </DialogPrimitive.Trigger>
  );
}

/** Owns open state so removing Details fully unmounts the dialog and cannot leave a stale reopen state. */
export function AnnoDetailsDialog({
  children,
  anchor,
  portalRoot,
  title,
  details,
  ctaLabel,
  ctaUrl,
  ctaNewTab,
  showCta,
  showArrow,
  countdownEnd,
  countdownTimezone,
  t,
}: {
  children: ReactNode;
  anchor: HTMLElement | null;
  portalRoot: HTMLElement | null;
  title: string;
  details: string;
  ctaLabel: string;
  ctaUrl: string;
  ctaNewTab: boolean;
  showCta: boolean;
  showArrow: boolean;
  countdownEnd: string | null;
  countdownTimezone: string | null;
  t: T;
}) {
  const [open, setOpen] = useState(false);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      {children}
      <AnnoDetailsPortal
        open={open}
        anchor={anchor}
        portalRoot={portalRoot}
        title={title}
        details={details}
        ctaLabel={ctaLabel}
        ctaUrl={ctaUrl}
        ctaNewTab={ctaNewTab}
        showCta={showCta}
        showArrow={showArrow}
        countdownEnd={countdownEnd}
        countdownTimezone={countdownTimezone}
        t={t}
      />
    </DialogPrimitive.Root>
  );
}

export function AnnoDetailsPortal({
  open,
  anchor,
  portalRoot,
  title,
  details,
  ctaLabel,
  ctaUrl,
  ctaNewTab,
  showCta,
  showArrow,
  countdownEnd,
  countdownTimezone,
  t,
}: {
  open: boolean;
  anchor: HTMLElement | null;
  portalRoot: HTMLElement | null;
  title: string;
  details: string;
  ctaLabel: string;
  ctaUrl: string;
  ctaNewTab: boolean;
  showCta: boolean;
  showArrow: boolean;
  countdownEnd: string | null;
  countdownTimezone: string | null;
  t: T;
}) {
  useAnnouncementDialogViewport({ open, anchor, portalRoot });
  if (!portalRoot) return null;

  return (
    <DialogPrimitive.Portal container={portalRoot}>
      <DialogPrimitive.Overlay className="mc-anno-details-overlay" />
      <DialogPrimitive.Content
        className="mc-anno-details-panel"
        aria-describedby={undefined}
      >
        <header className="mc-anno-details-head">
          <DialogPrimitive.Title className="mc-anno-details-title">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close asChild>
            <button
              type="button"
              className="mc-anno-details-close"
              aria-label={t("businessPage.builder.announcement.closeDetails")}
            >
              <X aria-hidden strokeWidth={1.8} />
            </button>
          </DialogPrimitive.Close>
        </header>
        <AnnoCountdown end={countdownEnd} timezone={countdownTimezone} t={t} />
        <DialogPrimitive.Description asChild>
          <div className="mc-anno-details-body">{details}</div>
        </DialogPrimitive.Description>
        {showCta ? (
          <footer className="mc-anno-details-actions">
            <AnnoCta
              label={ctaLabel}
              url={ctaUrl}
              newTab={ctaNewTab}
              showArrow={showArrow}
              appearance="dialog"
            />
          </footer>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
