import {
  MoreHorizontal,
  X,
  ChevronRight,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { cn } from '../../lib/utils';
import { applyTheme } from '../../lib/theme';
import { useRef, useState } from 'react';
import { logoutRequestAction } from '../../../features/auth/actions';
import { useAppNavigation } from './navigation-model';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from '../ui/drawer';
import { requestGuardedUnsavedAction } from '../../hooks/useUnsavedChangesBlocker';
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible';
import { preloadRoute } from '../../utils/routePreload';
import { languages } from '../common/languages';

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { i18n, t } = useTranslation('navigation');
  const dispatch = useDispatch();
  const { mobileMainItems, mobileMoreItems } = useAppNavigation();
  const [isOpen, setIsOpen] = useState(false);
  // Native keyboard covers the tab bar (like native apps) instead of pushing it up.
  const keyboardVisible = useKeyboardVisible();

  // Close on route change (drawer links also close eagerly on tap; this covers
  // back/forward). Render-phase adjustment, not an effect, so the close lands
  // in the same commit as the new route.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const firstMoreItemRef = useRef<HTMLAnchorElement>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
  };

  // resolvedLanguage, not language: the browser detector can yield full
  // locales like 'ro-RO' that never match the bare codes in the list.
  const currentLang = languages.find(l => l.code === i18n.resolvedLanguage) || languages[0];

  const cycleLang = () => {
    const idx = languages.findIndex(l => l.code === i18n.resolvedLanguage);
    const next = languages[(idx + 1) % languages.length];
    i18n.changeLanguage(next.code);
  };

  const moreIsActive = isOpen || mobileMoreItems.some((item) => item.isActive);
  const activeMainIndex = mobileMainItems.findIndex((item) => item.isActive);
  const indicatorIndex = moreIsActive ? mobileMainItems.length : activeMainIndex;
  const tabCount = mobileMainItems.length + 1;

  const handleLogout = () => {
    setIsOpen(false);
    requestGuardedUnsavedAction(() => dispatch(logoutRequestAction.request()));
  };

  return (
    <Drawer
      autoFocus
      direction="bottom"
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <DrawerContent
        overlayClassName="z-[55] bg-black/30 motion-reduce:animate-none"
        className="mobile-nav-drawer z-[59] max-h-[calc(100dvh-64px-env(safe-area-inset-bottom))] overflow-hidden rounded-t-none border-border bg-surface shadow-lg motion-reduce:!transition-none [&>div:first-child]:mt-3 [&>div:first-child]:h-1.5 [&>div:first-child]:w-12"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (firstMoreItemRef.current ?? themeButtonRef.current)?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          moreButtonRef.current?.focus();
        }}
      >
        <DrawerTitle className="sr-only">{t('mobileNav.more')}</DrawerTitle>
        <DrawerDescription className="sr-only">
          {t('mobileNav.navigation')}
        </DrawerDescription>
        <div className="max-h-[calc(100dvh-144px-env(safe-area-inset-bottom))] overflow-y-auto">
          <div className="px-2 py-2 space-y-2">
            {mobileMoreItems.map((item, index) => {
              const isActive = item.isActive;
              return (
                <Link
                  key={item.id}
                  ref={index === 0 ? firstMoreItemRef : undefined}
                  to={item.url}
                  onPointerDown={() => preloadRoute(item.url)}
                  onClick={(e) => {
                    if (isActive) e.preventDefault();
                    setIsOpen(false);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  data-slot="sidebar-menu-button"
                  data-active={isActive}
                  className={cn(
                    'flex min-h-11 items-center justify-between gap-3 rounded-lg border px-4 py-3 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-focus/40 motion-reduce:transition-none',
                    isActive
                      ? 'bg-surface-active font-medium border-border'
                      : 'bg-surface border-border hover:bg-surface-hover text-sidebar-foreground',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="size-4" aria-hidden />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <ChevronRight className="size-4 text-foreground-3" aria-hidden />
                </Link>
              );
            })}

            {/* Dark mode & Language controls */}
            <div className="flex gap-2">
              <button
                ref={themeButtonRef}
                type="button"
                onClick={toggleDarkMode}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 outline-none transition-colors duration-150 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus/40 motion-reduce:transition-none"
              >
                {isDark ? (
                  <Moon className="size-4" aria-hidden />
                ) : (
                  <Sun className="size-4" aria-hidden />
                )}
                <span className="font-medium text-sm">
                  {isDark ? t('theme.dark') : t('theme.light')}
                </span>
              </button>

              <button
                type="button"
                onClick={cycleLang}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 outline-none transition-colors duration-150 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus/40 motion-reduce:transition-none"
              >
                {currentLang.flag}
                <span className="font-medium text-sm">{currentLang.name}</span>
              </button>
            </div>

            {/* Log out */}
            <button
              type="button"
              onClick={handleLogout}
              className="mb-[5px] flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 outline-none transition-colors duration-150 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus/40 motion-reduce:transition-none"
            >
              <LogOut className="size-4" aria-hidden />
              <span className="font-medium text-sm">{t('sidebar.logOut')}</span>
            </button>
          </div>
        </div>
      </DrawerContent>

      {/* Bottom navigation bar — Airbnb/Apple tab-bar pattern:
       * no background fills, color-only active state, generous vertical padding,
       * hairline border-top (no shadow), icons at 22px, labels at 10px. */}
      <nav
        aria-label={t('mobileNav.navigation')}
        className={cn(
          "mobile-bottom-nav fixed bottom-0 left-0 right-0 z-[60] border-t border-border bg-surface",
          keyboardVisible && "hidden",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 flex">
          <div
            className={cn(
              "flex justify-center transition-transform duration-[240ms] ease-[var(--ease-out-strong)] motion-reduce:transition-none",
              indicatorIndex === -1 && "opacity-0",
            )}
            style={{
              width: `${100 / tabCount}%`,
              transform: `translateX(${Math.max(indicatorIndex, 0) * 100}%)`,
            }}
          >
            <span className="animate-tab-indicator mt-[-1px] h-[3.5px] w-6 rounded-full bg-primary" />
          </div>
        </div>
        <div className="flex items-stretch justify-around px-0 pt-1 pb-3 pt-2">
          {/* Main navigation items */}
          {mobileMainItems.map((item) => {
            const isCurrentPath = item.isActive;
            const isActive = !isOpen && isCurrentPath;
            return (
              <Link
                key={item.id}
                to={item.url}
                // Press lands ~100ms before the click: enough to have the
                // chunk in flight if the idle warm hasn't reached it yet.
                onPointerDown={() => preloadRoute(item.url)}
                onClick={(e) => {
                  if (isCurrentPath) e.preventDefault();
                }}
                aria-current={isCurrentPath ? 'page' : undefined}
                data-slot="sidebar-menu-button"
                data-active={isCurrentPath}
                className={cn(
                  "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus/40",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground",
                )}
              >
                <span key={isActive ? pathname : undefined} className={isActive ? "animate-tab-icon motion-reduce:animate-none" : undefined}>
                  <item.icon className="size-6 shrink-0" aria-hidden />
                </span>
                <span className={cn(
                  "text-[12px] leading-tight truncate max-w-full",
                  isActive ? "font-semibold" : "font-medium",
                )}>
                  {item.title}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <DrawerTrigger asChild>
            <button
              ref={moreButtonRef}
              type="button"
              data-active={moreIsActive}
              className={cn(
                "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus/40",
                moreIsActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground",
              )}
            >
              <span className="relative size-6 shrink-0" aria-hidden>
                <X
                  className={cn(
                    "absolute inset-0 size-6 transition-[opacity,transform] duration-200 motion-reduce:transition-none",
                    isOpen ? "scale-100 rotate-0 opacity-100" : "scale-75 rotate-90 opacity-0",
                  )}
                  strokeWidth={2}
                />
                <MoreHorizontal
                  className={cn(
                    "absolute inset-0 size-6 transition-[opacity,transform] duration-200 motion-reduce:transition-none",
                    isOpen ? "-rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100",
                  )}
                  strokeWidth={2}
                />
              </span>
              <span className={cn(
                "max-w-full truncate text-[12px] leading-tight",
                moreIsActive ? "font-semibold" : "font-medium",
              )}>
                {t('mobileNav.more')}
              </span>
            </button>
          </DrawerTrigger>
        </div>
      </nav>
    </Drawer>
  );
}
