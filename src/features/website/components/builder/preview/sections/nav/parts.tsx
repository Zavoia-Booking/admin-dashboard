import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, X } from "lucide-react";
import { forwardRef, useRef, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "../../../../../../../shared/lib/utils";
import { DISPLAY, MONO } from "../../shared/constants";
import { BookButton } from "../../shared/primitives";
import type { PreviewData, T } from "../../shared/types";

export type NavStyleKey = "editorial" | "capsule" | "split" | "underlay";

export type NavLinkItem = {
  type: string;
  label: string;
};

export type NavVariantViewProps = {
  data: PreviewData;
  t: T;
  name: string;
  mark: string;
  links: NavLinkItem[];
  activeType: string;
  overHero: boolean;
  /** Ink tone while floating over the hero (before frost): "light" (Tumble's warm paper) takes dark ink. */
  overHeroTone?: "light" | "dark";
  ctaFrost?: boolean;
  progress: number;
  sticky: boolean;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  navElementRef: (node: HTMLElement | null) => void;
  portalRoot: HTMLElement | null;
  onNavigate: (type: string) => void;
};

type ChromeStyle = CSSProperties & {
  "--mc-nav-fg": string;
  "--mc-nav-shadow": string;
  "--mc-nav-mark": string;
  "--mc-nav-mark-border": string;
  "--mc-nav-ring": string;
};

const FROST_TINT_AT = 0.32;

/** Shared editorial frost model. Variant files own their composition; this helper only resolves the
 * hero-to-paper palette so every navbar remains legible at the same scroll point. */
export function navChromeStyle({
  overHero,
  overHeroTone = "dark",
  ctaFrost = false,
  progress,
}: Pick<NavVariantViewProps, "overHero" | "overHeroTone" | "ctaFrost" | "progress">): {
  style: ChromeStyle;
  ctaStyle?: CSSProperties;
} {
  const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const tint = overHero
    ? 1 - Math.pow(1 - Math.min(1, progress / FROST_TINT_AT), 3)
    : 1;
  // A warm-paper (light) hero — Tumble — takes dark ink from the very top: the bar still frosts to paper
  // via `tint`, but the ink/mark palette resolves to its paper endpoint (inkTint = 1) the whole way.
  const inkTint = overHero && overHeroTone === "light" ? 1 : tint;
  const blurProgress = overHero ? 1 - (1 - progress) * (1 - progress) : 1;
  const blur = blurProgress > 0.001
    ? `blur(${(18 * blurProgress).toFixed(2)}px) saturate(${(100 + 50 * blurProgress).toFixed(0)}%)`
    : undefined;
  const foreground = overHero
    ? `color-mix(in oklch, #fff, var(--mc-fg) ${percent(inkTint)})`
    : "var(--mc-fg)";
  const textShadow = overHero && inkTint < 1
    ? `0 1px 14px rgba(0,0,0,${(0.35 * (1 - inkTint)).toFixed(3)})`
    : "none";
  const mark = overHero
    ? `color-mix(in oklch, #fff, var(--mc-accent) ${percent(inkTint)})`
    : "var(--mc-accent)";
  const markBorder = overHero
    ? `color-mix(in oklch, rgba(255,255,255,0.6), color-mix(in oklch, var(--mc-accent) 48%, var(--mc-line)) ${percent(inkTint)})`
    : "color-mix(in oklch, var(--mc-accent) 48%, var(--mc-line))";
  const ring = overHero
    ? `color-mix(in oklch, rgba(255,255,255,0.4), rgba(0,0,0,0.1) ${percent(inkTint)})`
    : "rgba(0,0,0,0.1)";

  const style: ChromeStyle = {
    "--mc-nav-fg": foreground,
    "--mc-nav-shadow": textShadow,
    "--mc-nav-mark": mark,
    "--mc-nav-mark-border": markBorder,
    "--mc-nav-ring": ring,
    backgroundColor: overHero
      ? `color-mix(in oklch, var(--mc-bg) ${(82 * tint).toFixed(1)}%, transparent)`
      : "var(--mc-bg)",
    backdropFilter: blur,
    WebkitBackdropFilter: blur,
    boxShadow: overHero
      ? `0 1px 0 color-mix(in oklch, var(--mc-line), transparent ${percent(1 - tint)})`
      : "0 1px 0 var(--mc-line)",
  };

  const ctaStyle = overHero && ctaFrost
    ? {
        background: `color-mix(in oklch, #fff, var(--mc-accent-field) ${percent(tint)})`,
        color: tint < 0.6 ? "var(--mc-ink)" : "var(--mc-on-accent)",
      }
    : undefined;

  return { style, ctaStyle };
}

export function NavBrand({
  data,
  name,
  mark,
  className,
}: {
  data: PreviewData;
  name: string;
  mark: string;
  className?: string;
}) {
  return (
    <span className={cn("mc-nav-brand", className)}>
      {data.logo ? (
        <img className="mc-nav-brand-logo" src={data.logo} alt="" loading="lazy" decoding="async" />
      ) : (
        <span className="mc-nav-brand-mark" aria-hidden style={DISPLAY}>{mark}</span>
      )}
      <span className="mc-nav-wordmark text-balance" style={DISPLAY}>{name}</span>
    </span>
  );
}

export function NavLinks({
  links,
  activeType,
  onNavigate,
  className,
}: {
  links: NavLinkItem[];
  activeType: string;
  onNavigate: (type: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("mc-nav-links", className)}>
      {links.map((link) => (
        <button
          key={link.type}
          type="button"
          className="mc-nav-link"
          data-active={activeType === link.type ? "true" : undefined}
          onClick={() => onNavigate(link.type)}
        >
          {link.label}
        </button>
      ))}
    </div>
  );
}

export function NavBooking({ t, style }: { t: T; style?: CSSProperties }) {
  return <BookButton label={t("businessPage.builder.preview.getStarted")} tone="accent" size="nav" styleOverride={style} />;
}

export function BurgerGlyph({ open }: { open: boolean }) {
  return (
    <span className="mc-nav-burger" data-open={open ? "true" : undefined} aria-hidden>
      <i />
      <i />
    </span>
  );
}

type MenuButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children"> & {
  open: boolean;
  label: string;
  children?: ReactNode;
};

/** Radix `asChild` injects its event handlers and accessibility attributes here, so this primitive must
 * forward both the ref and all native button props to keep every composed trigger functional. */
export const MenuButton = forwardRef<HTMLButtonElement, MenuButtonProps>(function MenuButton({
  open,
  label,
  className,
  children,
  ...buttonProps
}, ref) {
  return (
    <button
      {...buttonProps}
      ref={ref}
      type={buttonProps.type ?? "button"}
      className={cn("mc-nav-menu-button", className)}
      aria-label={label}
      aria-expanded={open}
    >
      {children ?? <BurgerGlyph open={open} />}
    </button>
  );
});

const socialsFor = (data: PreviewData) => [
  data.social.instagram && "Instagram",
  data.social.tiktok && "TikTok",
  data.social.facebook && "Facebook",
  data.social.pinterest && "Pinterest",
  data.social.website && "Website",
].filter((label): label is string => !!label);

export function NavMenuFooter({ data }: { data: PreviewData }) {
  const socials = socialsFor(data);
  if (socials.length === 0) return null;
  return (
    <div className="mc-nav-menu-footer" style={MONO}>
      {socials.map((label) => <span key={label}>{label}</span>)}
    </div>
  );
}

/** Radix owns Escape/focus semantics. The portal stays inside the microsite root so a scaled device preview
 * behaves like an iframe instead of covering the surrounding dashboard. */
export function MobileMenuPortal({
  variant,
  portalRoot,
  data,
  name,
  mark,
  links,
  onNavigate,
  t,
}: {
  variant: "editorial" | "capsule" | "split";
  portalRoot: HTMLElement | null;
  data: PreviewData;
  name: string;
  mark: string;
  links: NavLinkItem[];
  onNavigate: (type: string) => void;
  t: T;
}) {
  const pendingNavigationRef = useRef<string | null>(null);
  if (!portalRoot) return null;
  const cut = Math.max(1, Math.floor(links.length / 2));
  const indexedLink = (link: NavLinkItem, index: number) => (
    <DialogPrimitive.Close asChild key={link.type}>
      <button
        type="button"
        className="mc-nav-menu-link"
        style={{ "--mc-nav-menu-index": index } as CSSProperties}
        onClick={() => {
          pendingNavigationRef.current = link.type;
        }}
      >
        {variant === "editorial" ? (
          <span className="mc-nav-menu-index" style={MONO}>{String(index + 1).padStart(2, "0")}</span>
        ) : null}
        <span className="mc-nav-menu-link-label" style={DISPLAY}>{link.label}</span>
        {variant === "capsule" ? <ArrowRight className="mc-nav-menu-arrow" aria-hidden /> : null}
      </button>
    </DialogPrimitive.Close>
  );

  return (
    <DialogPrimitive.Portal container={portalRoot}>
      <DialogPrimitive.Overlay className={cn("mc-nav-menu-overlay", `mc-nav-menu-overlay--${variant}`)} />
      <DialogPrimitive.Content
        className={cn("mc-nav-menu-surface", `mc-nav-menu-surface--${variant}`)}
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          const targetType = pendingNavigationRef.current;
          if (!targetType) return;
          event.preventDefault();
          pendingNavigationRef.current = null;
          window.requestAnimationFrame(() => onNavigate(targetType));
        }}
      >
        <DialogPrimitive.Title className="sr-only">
          {t("businessPage.sections.nav.label")}
        </DialogPrimitive.Title>
        <div className="mc-nav-menu-head">
          <NavBrand data={data} name={name} mark={mark} className="mc-nav-brand--menu" />
          <DialogPrimitive.Close asChild>
            <button type="button" className="mc-nav-menu-close" aria-label={t("businessPage.builder.preview.closeMenu")}>
              <X aria-hidden />
            </button>
          </DialogPrimitive.Close>
        </div>

        {variant === "split" ? (
          <div className="mc-nav-menu-split">
            <div className="mc-nav-menu-split-group">
              {links.slice(0, cut).map((link, index) => indexedLink(link, index))}
            </div>
            <div className="mc-nav-menu-seam">
              <i aria-hidden />
              <span style={DISPLAY}>{name}</span>
              <i aria-hidden />
            </div>
            <div className="mc-nav-menu-split-group">
              {links.slice(cut).map((link, index) => indexedLink(link, index + cut))}
            </div>
          </div>
        ) : (
          <div className="mc-nav-menu-list">
            {links.map(indexedLink)}
          </div>
        )}

        <DialogPrimitive.Close asChild>
          <button
            type="button"
            className="mc-nav-menu-book"
            style={{ "--mc-nav-menu-index": links.length } as CSSProperties}
          >
            <span>{t("businessPage.builder.preview.bookNow")}</span>
            <ArrowRight aria-hidden />
          </button>
        </DialogPrimitive.Close>
        <NavMenuFooter data={data} />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export { DialogPrimitive };
