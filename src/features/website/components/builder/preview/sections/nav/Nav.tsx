import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { sectionLinkLabelKey } from "../../shared/sectionLinks";
import { findScrollParent, prefersReducedMotion } from "../../shared/util";
import type { NavVariantProps } from "./types";
import type { NavLinkItem, NavStyleKey, NavVariantViewProps } from "./parts";

import "./base.css";

import { Editorial } from "./variants/Editorial";
import { Capsule } from "./variants/Capsule";
import { Split } from "./variants/Split";
import { Underlay } from "./variants/Underlay";

/** Nav frost over the hero: scroll distance to full blur. LivePreview drives the frost `progress` off this. */
export const FROST_DIST = 240;

/** `default` is the persisted catalog id for Editorial. Retired source ids remain safe renderer aliases. */
export function normalizeNavStyle(value: string | undefined): NavStyleKey {
  if (!value || value === "default" || value === "editorial" || value === "index" || value === "sidebar" || value === "dock") {
    return "editorial";
  }
  if (value === "capsule" || value === "split" || value === "underlay") return value;
  return "editorial";
}

const VARIANTS: Record<NavStyleKey, (props: NavVariantViewProps) => React.ReactNode> = {
  editorial: Editorial,
  capsule: Capsule,
  split: Split,
  underlay: Underlay,
};

/** Dispatches the selected navigation style and owns only cross-variant behavior: scroll spy, scoped
 * section navigation, preview-local scroll locking, and cleanup when the preview/device changes. */
export function Nav(props: NavVariantProps) {
  const variant = normalizeNavStyle(props.layout.find((section) => section.type === "nav")?.variant);
  const name = props.data.businessName || props.t("businessPage.builder.preview.businessNamePlaceholder");
  const mark = name.trim().charAt(0).toUpperCase() || "•";
  const links = useMemo<NavLinkItem[]>(
    () => props.layout.flatMap((section) => {
      const labelKey = sectionLinkLabelKey(section.type);
      return section.visible && labelKey
        ? [{ type: section.type, label: props.t(labelKey) }]
        : [];
    }),
    [props.layout, props.t],
  );
  const [activeType, setActiveType] = useState(links[0]?.type ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [navNode, setNavNode] = useState<HTMLElement | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);
  const smoothScrollTargetRef = useRef<number | null>(null);

  const navElementRef = useCallback((node: HTMLElement | null) => {
    scrollParentRef.current = node ? findScrollParent(node) : null;
    setNavNode((current) => (current === node ? current : node));
    setPortalRoot((current) => {
      const root = node?.closest<HTMLElement>(".mc-root") ?? null;
      return current === root ? current : root;
    });
    if (typeof props.navRef === "function") props.navRef(node);
    else if (props.navRef) props.navRef.current = node;
  }, [props.navRef]);

  useEffect(() => {
    if (!links.some((link) => link.type === activeType)) setActiveType(links[0]?.type ?? "");
  }, [activeType, links]);

  useEffect(() => {
    if (!navNode) return;
    const scrollParent = scrollParentRef.current ?? findScrollParent(navNode);
    if (!scrollParent) return;

    const cancelSmoothScroll = () => {
      if (smoothScrollTargetRef.current === null) return;
      smoothScrollTargetRef.current = null;
      const currentTop = scrollParent.scrollTop;
      const previousScrollBehavior = scrollParent.style.scrollBehavior;
      scrollParent.style.scrollBehavior = "auto";
      scrollParent.scrollTo({ top: currentTop, behavior: "auto" });
      scrollParent.style.scrollBehavior = previousScrollBehavior;
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch" || event.pointerType === "pen" || event.target === scrollParent) {
        cancelSmoothScroll();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) {
        cancelSmoothScroll();
      }
    };
    const onScroll = () => {
      const target = smoothScrollTargetRef.current;
      if (target !== null && Math.abs(scrollParent.scrollTop - target) <= 1) {
        smoothScrollTargetRef.current = null;
      }
    };

    scrollParent.addEventListener("wheel", cancelSmoothScroll, { passive: true });
    scrollParent.addEventListener("touchstart", cancelSmoothScroll, { passive: true });
    scrollParent.addEventListener("pointerdown", onPointerDown, { passive: true });
    scrollParent.addEventListener("keydown", onKeyDown);
    scrollParent.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scrollParent.removeEventListener("wheel", cancelSmoothScroll);
      scrollParent.removeEventListener("touchstart", cancelSmoothScroll);
      scrollParent.removeEventListener("pointerdown", onPointerDown);
      scrollParent.removeEventListener("keydown", onKeyDown);
      scrollParent.removeEventListener("scroll", onScroll);
    };
  }, [navNode]);

  // Match the design source's `past-hero` state: after 60% of one preview viewport the
  // transparent hero chrome resolves into the compact frosted paper bar.
  useEffect(() => {
    if (!navNode || !props.overHero) {
      setPastHero(false);
      return;
    }
    const scrollParent = scrollParentRef.current ?? findScrollParent(navNode);
    if (!scrollParent) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const compactPreview = (portalRoot?.clientWidth ?? 0) <= 980;
      const threshold = compactPreview ? 72 : scrollParent.clientHeight * 0.6;
      const next = scrollParent.scrollTop > threshold;
      setPastHero((current) => (current === next ? current : next));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    scrollParent.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scrollParent.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [navNode, portalRoot, props.overHero]);

  useEffect(() => {
    if (!navNode || !portalRoot || links.length === 0) return;
    const scrollParent = findScrollParent(navNode);
    if (!scrollParent) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const threshold = scrollParent.getBoundingClientRect().top + navNode.offsetHeight + 48;
      let next = links[0]?.type ?? "";
      const sections = Array.from(
        portalRoot.querySelectorAll<HTMLElement>(".mc-page-flow > [data-preview-section]"),
      );
      for (const section of sections) {
        const type = section.dataset.previewSection;
        if (!type || !links.some((link) => link.type === type)) continue;
        if (section.getBoundingClientRect().top <= threshold) next = type;
      }
      setActiveType((current) => (current === next ? current : next));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    scrollParent.addEventListener("scroll", onScroll, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onScroll);
    observer?.observe(portalRoot);
    return () => {
      scrollParent.removeEventListener("scroll", onScroll);
      observer?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [links, navNode, portalRoot]);

  const onNavigate = useCallback((type: string) => {
    if (!navNode || !portalRoot) return;
    const target = Array.from(
      portalRoot.querySelectorAll<HTMLElement>(".mc-page-flow > [data-preview-section]"),
    ).find((section) => section.dataset.previewSection === type);
    const scrollParent = scrollParentRef.current ?? findScrollParent(navNode);
    if (!target || !scrollParent) return;
    const scrollRect = scrollParent.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const previewScale = scrollParent.clientWidth > 0
      ? scrollRect.width / scrollParent.clientWidth
      : 1;
    const safeScale = Number.isFinite(previewScale) && previewScale > 0 ? previewScale : 1;
    const scrollTop = scrollParent.scrollTop
      + (targetRect.top - scrollRect.top) / safeScale
      - navNode.offsetHeight;
    const targetScrollTop = Math.min(
      Math.max(0, scrollParent.scrollHeight - scrollParent.clientHeight),
      Math.max(0, scrollTop),
    );
    const reducedMotion = prefersReducedMotion();
    smoothScrollTargetRef.current = reducedMotion ? null : targetScrollTop;
    scrollParent.scrollTo({ top: targetScrollTop, behavior: reducedMotion ? "auto" : "smooth" });
    setActiveType(type);
  }, [navNode, portalRoot]);

  useEffect(() => {
    setMenuOpen(false);
  }, [variant]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useLayoutEffect(() => {
    if (!navNode || !portalRoot) return;
    portalRoot.classList.toggle("mc-nav-underlay-open", menuOpen && variant === "underlay");
    const scrollParent = findScrollParent(navNode);
    const clearOverlayViewport = () => {
      portalRoot.style.removeProperty("--mc-nav-overlay-top");
      portalRoot.style.removeProperty("--mc-nav-overlay-height");
    };
    if (!menuOpen || !scrollParent) {
      const closeTimer = variant === "underlay"
        ? window.setTimeout(clearOverlayViewport, 520)
        : 0;
      if (variant !== "underlay") clearOverlayViewport();
      return () => {
        if (closeTimer) window.clearTimeout(closeTimer);
        clearOverlayViewport();
        portalRoot.classList.remove("mc-nav-underlay-open");
      };
    }

    // A fixed portal would escape the scaled preview and cover the dashboard viewport. Anchor the overlay
    // absolutely to the exact visible rectangle of this preview's own scroll container instead. DOM rects
    // are visual pixels while these CSS variables live in the preview's unscaled coordinate system, so the
    // offset must be divided by the preview scale. Without that conversion a scrolled phone/tablet clips the
    // menu header and exposes the page beneath the bottom edge.
    const syncOverlayViewport = () => {
      const scrollRect = scrollParent.getBoundingClientRect();
      const rootRect = portalRoot.getBoundingClientRect();
      const previewScale = scrollParent.clientWidth > 0
        ? scrollRect.width / scrollParent.clientWidth
        : 1;
      const safeScale = Number.isFinite(previewScale) && previewScale > 0 ? previewScale : 1;
      const logicalTop = (scrollRect.top - rootRect.top) / safeScale;
      portalRoot.style.setProperty("--mc-nav-overlay-top", `${logicalTop}px`);
      portalRoot.style.setProperty("--mc-nav-overlay-height", `${scrollParent.clientHeight}px`);
    };
    const previousOverflow = scrollParent.style.overflowY;
    const previousScrollBehavior = scrollParent.style.scrollBehavior;
    const frozenScrollTop = scrollParent.scrollTop;
    smoothScrollTargetRef.current = null;
    scrollParent.style.scrollBehavior = "auto";
    scrollParent.scrollTo({ top: frozenScrollTop, behavior: "auto" });
    scrollParent.style.overflowY = "hidden";
    syncOverlayViewport();

    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(syncOverlayViewport);
    observer?.observe(scrollParent);
    scrollParent.addEventListener("scroll", syncOverlayViewport, { passive: true });
    return () => {
      observer?.disconnect();
      scrollParent.removeEventListener("scroll", syncOverlayViewport);
      portalRoot.classList.remove("mc-nav-underlay-open");
      if (variant !== "underlay") clearOverlayViewport();
      scrollParent.style.overflowY = previousOverflow;
      scrollParent.style.scrollBehavior = previousScrollBehavior;
    };
  }, [menuOpen, navNode, portalRoot, variant]);

  useEffect(() => {
    if (!portalRoot || variant === "underlay") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 980) setMenuOpen(false);
    });
    observer.observe(portalRoot);
    return () => observer.disconnect();
  }, [portalRoot, variant]);

  const Variant = VARIANTS[variant];
  const effectiveProgress = props.overHero && variant === "editorial"
    ? (pastHero ? 1 : 0)
    : props.progress;
  return (
    <Variant
      {...props}
      progress={effectiveProgress}
      name={name}
      mark={mark}
      links={links}
      activeType={activeType}
      sticky={props.sticky ?? true}
      menuOpen={menuOpen}
      setMenuOpen={setMenuOpen}
      navElementRef={navElementRef}
      portalRoot={portalRoot}
      onNavigate={onNavigate}
    />
  );
}
