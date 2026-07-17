import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../../../../../../../../shared/lib/utils";
import { findScrollParent } from "../../../shared/util";
import {
  DialogPrimitive,
  MenuButton,
  MobileMenuPortal,
  NavBooking,
  NavBrand,
  NavLinks,
  type NavVariantViewProps,
} from "../parts";

import "./capsule.css";

/** Capsule — a wide transparent lockup that pulls inward into one dark-glass pill as the page scrolls. */
export function Capsule(props: NavVariantViewProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);
  const [navNode, setNavNode] = useState<HTMLElement | null>(null);
  const captureNav = useCallback((node: HTMLElement | null) => {
    setNavNode((current) => (current === node ? current : node));
    props.navElementRef(node);
  }, [props.navElementRef]);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell || !navNode) return;
    const scrollParent = findScrollParent(navNode);
    if (!scrollParent) return;
    scrollParentRef.current = scrollParent;
    let contentWidth = 0;
    let fullWidth = 0;
    let frame = 0;

    const measure = () => {
      const previousWidth = shell.style.width;
      const previousProgress = shell.style.getPropertyValue("--mc-cap-progress");
      shell.style.width = "max-content";
      shell.style.setProperty("--mc-cap-progress", "0");
      contentWidth = shell.offsetWidth;
      shell.style.width = previousWidth;
      if (previousProgress) shell.style.setProperty("--mc-cap-progress", previousProgress);
      else shell.style.removeProperty("--mc-cap-progress");

      const navStyle = window.getComputedStyle(navNode);
      fullWidth = Math.max(
        0,
        navNode.clientWidth
          - Number.parseFloat(navStyle.paddingLeft || "0")
          - Number.parseFloat(navStyle.paddingRight || "0"),
      );
    };

    const apply = () => {
      frame = 0;
      const compact = navNode.clientWidth <= 980;
      const distance = Math.max(1, scrollParent.clientHeight * 0.55);
      const progress = !props.overHero || compact
        ? 1
        : Math.max(0, Math.min(1, scrollParent.scrollTop / distance));
      shell.style.setProperty("--mc-cap-progress", progress.toFixed(4));

      if (compact) {
        shell.style.removeProperty("width");
        return;
      }
      const targetWidth = Math.min(contentWidth + 24, fullWidth);
      shell.style.width = `${fullWidth + (targetWidth - fullWidth) * progress}px`;
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(apply);
    };
    const refresh = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      measure();
      apply();
    };

    refresh();
    scrollParent.addEventListener("scroll", schedule, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(refresh);
    observer?.observe(navNode);
    observer?.observe(scrollParent);
    return () => {
      scrollParent.removeEventListener("scroll", schedule);
      observer?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      shell.style.removeProperty("width");
      shell.style.removeProperty("--mc-cap-progress");
      if (scrollParentRef.current === scrollParent) scrollParentRef.current = null;
    };
  }, [navNode, props.data.logo, props.links, props.name, props.overHero]);

  const syncMenuOrigin = useCallback(() => {
    const shell = shellRef.current;
    const root = props.portalRoot;
    if (!shell || !root || !navNode) return;
    const scrollParent = scrollParentRef.current ?? findScrollParent(navNode);
    if (!scrollParent) return;
    const shellRect = shell.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const scrollRect = scrollParent.getBoundingClientRect();
    const scale = scrollParent.clientWidth > 0 ? scrollRect.width / scrollParent.clientWidth : 1;
    const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
    const viewportTop = (scrollRect.top - rootRect.top) / safeScale;
    const viewportLeft = (scrollRect.left - rootRect.left) / safeScale;
    const top = (shellRect.top - rootRect.top) / safeScale;
    const left = (shellRect.left - rootRect.left) / safeScale;
    const width = shellRect.width / safeScale;
    const height = shellRect.height / safeScale;
    const viewportBottom = (scrollRect.bottom - rootRect.top) / safeScale;
    const maxHeight = Math.max(height, viewportBottom - top - 12);
    const phone = scrollParent.clientWidth <= 600;
    const targetWidth = phone
      ? Math.max(width, scrollParent.clientWidth - 16)
      : Math.min(720, Math.max(width, scrollParent.clientWidth - 48));
    const targetLeft = phone
      ? viewportLeft + (scrollParent.clientWidth - targetWidth) / 2
      : viewportLeft + (scrollParent.clientWidth - targetWidth) / 2;
    const targetTop = top;
    const phoneVerticalInset = Math.max(0, top - viewportTop);
    const targetHeight = phone
      ? Math.max(height, viewportBottom - top - phoneVerticalInset)
      : Math.min(maxHeight, 640, Math.max(520, scrollParent.clientHeight * 0.66));
    root.style.setProperty("--mc-cap-menu-top", `${top}px`);
    root.style.setProperty("--mc-cap-menu-left", `${left}px`);
    root.style.setProperty("--mc-cap-menu-width", `${width}px`);
    root.style.setProperty("--mc-cap-menu-origin-height", `${height}px`);
    root.style.setProperty("--mc-cap-menu-max-height", `${maxHeight}px`);
    root.style.setProperty("--mc-cap-menu-target-top", `${targetTop}px`);
    root.style.setProperty("--mc-cap-menu-target-left", `${targetLeft}px`);
    root.style.setProperty("--mc-cap-menu-target-width", `${targetWidth}px`);
    root.style.setProperty("--mc-cap-menu-target-height", `${targetHeight}px`);
  }, [navNode, props.portalRoot]);

  useLayoutEffect(() => {
    if (!props.menuOpen) return;
    syncMenuOrigin();
    const frame = window.requestAnimationFrame(syncMenuOrigin);
    return () => window.cancelAnimationFrame(frame);
  }, [props.menuOpen, syncMenuOrigin]);

  useLayoutEffect(() => {
    const root = props.portalRoot;
    return () => {
      root?.style.removeProperty("--mc-cap-menu-top");
      root?.style.removeProperty("--mc-cap-menu-left");
      root?.style.removeProperty("--mc-cap-menu-width");
      root?.style.removeProperty("--mc-cap-menu-origin-height");
      root?.style.removeProperty("--mc-cap-menu-max-height");
      root?.style.removeProperty("--mc-cap-menu-target-top");
      root?.style.removeProperty("--mc-cap-menu-target-left");
      root?.style.removeProperty("--mc-cap-menu-target-width");
      root?.style.removeProperty("--mc-cap-menu-target-height");
    };
  }, [props.portalRoot]);

  const menuLabel = props.t(
    props.menuOpen
      ? "businessPage.builder.preview.closeMenu"
      : "businessPage.builder.preview.menu",
  );
  return (
    <DialogPrimitive.Root open={props.menuOpen} onOpenChange={props.setMenuOpen} modal={false}>
      <nav
        ref={captureNav}
        data-preview-section="nav"
        data-nav-variant="capsule"
        className={cn(
          "mc-site-nav mc-nav-capsule",
          props.sticky ? "mc-site-nav--sticky" : "mc-site-nav--inline",
          props.menuOpen && "mc-nav-capsule--open",
        )}
      >
        <div ref={shellRef} className="mc-nav-capsule-shell">
          <NavBrand data={props.data} name={props.name} mark={props.mark} />
          <span className="mc-nav-capsule-spacer" aria-hidden />
          <NavLinks
            links={props.links}
            activeType={props.activeType}
            onNavigate={props.onNavigate}
            className="mc-nav-capsule-links"
          />
          <span className="mc-nav-capsule-booking">
            <NavBooking t={props.t} />
          </span>
          <DialogPrimitive.Trigger asChild>
            <MenuButton open={props.menuOpen} label={menuLabel} className="mc-nav-capsule-toggle" />
          </DialogPrimitive.Trigger>
        </div>
      </nav>
      <MobileMenuPortal
        variant="capsule"
        portalRoot={props.portalRoot}
        data={props.data}
        name={props.name}
        mark={props.mark}
        links={props.links}
        onNavigate={props.onNavigate}
        t={props.t}
      />
    </DialogPrimitive.Root>
  );
}
