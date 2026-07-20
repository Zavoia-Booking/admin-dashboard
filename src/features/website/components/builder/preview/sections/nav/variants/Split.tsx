import { cn } from "../../../../../../../../shared/lib/utils";
import { MONO } from "../../../shared/constants";
import {
  DialogPrimitive,
  MenuButton,
  MobileMenuPortal,
  NavBooking,
  NavBrand,
  NavLinks,
  navChromeStyle,
  type NavVariantViewProps,
} from "../parts";

import "./split.css";

/** Split — links flank a centered wordmark; the mobile composition opens around a ruled center seam. */
export function Split(props: NavVariantViewProps) {
  const chrome = navChromeStyle(props);
  const cut = Math.ceil(props.links.length / 2);
  const menuLabel = props.t(
    props.menuOpen
      ? "businessPage.builder.preview.closeMenu"
      : "businessPage.builder.preview.menu",
  );

  return (
    <DialogPrimitive.Root open={props.menuOpen} onOpenChange={props.setMenuOpen} modal={false}>
      <nav
        ref={props.navElementRef}
        data-preview-section="nav"
        data-nav-variant="split"
        className={cn(
          "mc-site-nav mc-nav-split",
          props.sticky ? "mc-site-nav--sticky" : "mc-site-nav--inline",
        )}
        style={chrome.style}
      >
        <div className="mc-nav-split-desktop mc-nav-split-side mc-nav-split-side--left">
          <NavLinks links={props.links.slice(0, cut)} activeType={props.activeType} onNavigate={props.onNavigate} />
        </div>
        <NavBrand data={props.data} name={props.name} mark={props.mark} className="mc-nav-split-brand" />
        <div className="mc-nav-split-desktop mc-nav-split-side mc-nav-split-side--right">
          <NavLinks links={props.links.slice(cut)} activeType={props.activeType} onNavigate={props.onNavigate} />
          <NavBooking t={props.t} style={chrome.ctaStyle} />
        </div>

        <div className="mc-nav-split-mobile">
          <div className="mc-nav-split-mobile-seam">
            <i aria-hidden />
            <NavBrand data={props.data} name={props.name} mark={props.mark} />
            <i aria-hidden />
          </div>
          <DialogPrimitive.Trigger asChild>
            <MenuButton open={props.menuOpen} label={menuLabel} className="mc-nav-split-toggle">
              <span style={MONO}>{props.t("businessPage.builder.preview.menu")}</span>
              <span aria-hidden className="mc-nav-split-updown">↕</span>
            </MenuButton>
          </DialogPrimitive.Trigger>
        </div>
      </nav>
      <MobileMenuPortal
        variant="split"
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
