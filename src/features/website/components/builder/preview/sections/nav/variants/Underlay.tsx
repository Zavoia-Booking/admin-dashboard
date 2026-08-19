import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { cn } from "../../../../../../../../shared/lib/utils";
import { DISPLAY, MONO } from "../../../shared/constants";
import { useReducedMotion } from "../../../shared/hooks";
import {
  BurgerGlyph,
  NavBrand,
  NavMenuFooter,
  navChromeStyle,
  type NavVariantViewProps,
} from "../parts";

import "./underlay.css";

/** Underlay — a restrained top bar; opening reveals a paper navigation behind the translated page. */
export function Underlay(props: NavVariantViewProps) {
  const motionFrameRef = useRef(0);
  // The shared hook, not the bare OS preference: the at-rest desktop mock must also jump-cut this slide —
  // easing the whole page sideways there re-rasterises past the phone's tile budget and checkerboards.
  const reducedMotion = useReducedMotion();
  const chrome = navChromeStyle(props);
  const menuLabel = props.t(
    props.menuOpen
      ? "businessPage.builder.preview.closeMenu"
      : "businessPage.builder.preview.menu",
  );

  useLayoutEffect(() => {
    const root = props.portalRoot;
    if (!root) return;
    root.classList.add("mc-nav-underlay-active");
    if (!root.style.getPropertyValue("--mc-underlay-progress")) {
      root.style.setProperty("--mc-underlay-progress", "0");
    }
    return () => {
      if (motionFrameRef.current) window.cancelAnimationFrame(motionFrameRef.current);
      motionFrameRef.current = 0;
      root.classList.remove("mc-nav-underlay-active");
      root.classList.remove("mc-nav-underlay-engaged");
      root.style.removeProperty("--mc-underlay-progress");
    };
  }, [props.portalRoot]);

  useLayoutEffect(() => {
    const root = props.portalRoot;
    if (!root) return;
    if (motionFrameRef.current) window.cancelAnimationFrame(motionFrameRef.current);
    motionFrameRef.current = 0;

    const target = props.menuOpen ? 1 : 0;
    // "Engaged" = open or still animating. The page-slide machinery (transform + will-change on the whole
    // page flow) applies only under this class, so a parked underlay never keeps the page promoted.
    if (target === 1) root.classList.add("mc-nav-underlay-engaged");
    const settle = () => {
      if (target === 0) root.classList.remove("mc-nav-underlay-engaged");
    };
    const current = Number.parseFloat(root.style.getPropertyValue("--mc-underlay-progress"));
    const from = Number.isFinite(current) ? current : 1 - target;
    if (reducedMotion || Math.abs(target - from) < 0.0001) {
      root.style.setProperty("--mc-underlay-progress", String(target));
      settle();
      return;
    }

    const duration = props.menuOpen ? 660 : 520;
    const startedAt = performance.now();
    const update = (now: number) => {
      const elapsed = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      const progress = from + (target - from) * eased;
      root.style.setProperty("--mc-underlay-progress", progress.toFixed(4));
      if (elapsed < 1) motionFrameRef.current = window.requestAnimationFrame(update);
      else {
        motionFrameRef.current = 0;
        settle();
      }
    };
    motionFrameRef.current = window.requestAnimationFrame(update);
    return () => {
      if (motionFrameRef.current) window.cancelAnimationFrame(motionFrameRef.current);
      motionFrameRef.current = 0;
    };
  }, [props.menuOpen, props.portalRoot, reducedMotion]);

  return (
    <DialogPrimitive.Root open={props.menuOpen} onOpenChange={props.setMenuOpen} modal={false}>
      <nav
        ref={props.navElementRef}
        data-preview-section="nav"
        data-nav-variant="underlay"
        className={cn(
          "mc-site-nav mc-nav-underlay",
          props.sticky ? "mc-site-nav--sticky" : "mc-site-nav--inline",
          props.menuOpen && "mc-nav-underlay--open",
        )}
        style={chrome.style}
      >
        <NavBrand data={props.data} name={props.name} mark={props.mark} />
        <DialogPrimitive.Trigger asChild>
          <button type="button" className="mc-nav-underlay-toggle" aria-expanded={props.menuOpen} aria-label={menuLabel}>
            <span className="mc-nav-underlay-toggle-label" style={MONO}>{props.t("businessPage.builder.preview.menu")}</span>
            <BurgerGlyph open={props.menuOpen} />
          </button>
        </DialogPrimitive.Trigger>
      </nav>

      {props.portalRoot ? (
        <DialogPrimitive.Portal forceMount container={props.portalRoot}>
          <DialogPrimitive.Content
            forceMount
            className="mc-nav-underlay-panel"
            aria-describedby={undefined}
            aria-hidden={!props.menuOpen}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
          >
            <DialogPrimitive.Title className="sr-only">
              {props.t("businessPage.sections.nav.label")}
            </DialogPrimitive.Title>
            <div className="mc-nav-underlay-list">
              {props.links.map((link) => (
                <DialogPrimitive.Close asChild key={link.type}>
                  <button
                    type="button"
                    className="mc-nav-underlay-link"
                    tabIndex={props.menuOpen ? 0 : -1}
                    onClick={() => props.onNavigate(link.type)}
                  >
                    <span style={DISPLAY}>{link.label}</span>
                  </button>
                </DialogPrimitive.Close>
              ))}
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="mc-nav-underlay-link mc-nav-underlay-link--book"
                  tabIndex={props.menuOpen ? 0 : -1}
                >
                  <span style={DISPLAY}>{props.t("businessPage.builder.preview.servicesBook")}</span>
                  <ArrowRight aria-hidden />
                </button>
              </DialogPrimitive.Close>
            </div>
            <NavMenuFooter data={props.data} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      ) : null}
    </DialogPrimitive.Root>
  );
}
