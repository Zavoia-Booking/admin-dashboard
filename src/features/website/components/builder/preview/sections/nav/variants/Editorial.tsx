import { cn } from "../../../../../../../../shared/lib/utils";
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

import "./editorial.css";

/** Editorial — the lookbook baseline: brand left, section links centered, booking action right. */
export function Editorial(props: NavVariantViewProps) {
  const chrome = navChromeStyle(props);
  const menuLabel = props.t(
    props.menuOpen
      ? "businessPage.builder.preview.closeMenu"
      : "businessPage.builder.preview.menu",
  );

  return (
    <DialogPrimitive.Root open={props.menuOpen} onOpenChange={props.setMenuOpen} modal>
      <nav
        ref={props.navElementRef}
        data-preview-section="nav"
        data-nav-variant="editorial"
        data-nav-scrolled={props.overHero && props.progress >= 1 ? "true" : undefined}
        className={cn(
          "mc-site-nav mc-nav-editorial",
          props.sticky ? "mc-site-nav--sticky" : "mc-site-nav--inline",
        )}
        style={chrome.style}
      >
        <NavBrand data={props.data} name={props.name} mark={props.mark} />
        <NavLinks
          links={props.links}
          activeType={props.activeType}
          onNavigate={props.onNavigate}
          className="mc-nav-editorial-links"
        />
        <div className="mc-nav-editorial-actions">
          <NavBooking t={props.t} style={chrome.ctaStyle} />
          <DialogPrimitive.Trigger asChild>
            <MenuButton open={props.menuOpen} label={menuLabel} className="mc-nav-editorial-toggle" />
          </DialogPrimitive.Trigger>
        </div>
      </nav>
      <MobileMenuPortal
        variant="editorial"
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
