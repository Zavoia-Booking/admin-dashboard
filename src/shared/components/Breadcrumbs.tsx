import React, { useMemo } from 'react';
import type { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { NotificationBell } from './common/NotificationBell';

export type BreadcrumbItemType = {
  label: string;
  path?: string; // If no path, it's the current page (not clickable)
  icon?: React.ReactNode;
};

interface BreadcrumbsProps {
  items: BreadcrumbItemType[];
  rightContent?: React.ReactNode;
  /** When provided, replaces the breadcrumb's last-item label (used on mobile to
   *  show context-specific titles like the current month name in calendar). */
  titleOverride?: string;
  /** When provided, replaces the title area entirely with custom JSX (e.g. a
   *  location dropdown on the dashboard). Takes precedence over titleOverride
   *  and onPrev/onNext date-nav. */
  titleContent?: React.ReactNode;
  /** Optional page-scoped prev/next actions rendered as small muted chevrons
   *  flanking the title. Kept visually subordinate to the back-button (smaller,
   *  muted color, tighter spacing) so they read as "nudge date" not "go back". */
  onPrev?: () => void;
  onNext?: () => void;
  /** Drops the bottom shadow so the breadcrumb visually merges with whatever
   *  is sticky-pinned directly below it (e.g. a ResponsiveTabs header on
   *  tabbed pages). Without this, the shadow reads as a hard divider. */
  flush?: boolean;
}

const BELL_ROUTES = new Set([
  '/dashboard',
  '/calendar',
  '/assignments',
  '/my-assignments',
  '/team-members',
  '/customers',
  '/services',
  '/locations',
  '/marketplace',
  '/my-profile',
]);

/** True bottom-nav tab roots (not including "More" menu items, which are one
 *  step removed and benefit from the back button for intra-More navigation).
 *  Per Apple HIG / Material / Airbnb: only real tab roots hide the back button. */
const TOP_LEVEL_ROUTES = new Set([
  '/dashboard',
  '/assignments',
  '/my-assignments',
  '/calendar',
  '/marketplace',
  '/my-profile',
]);

function isTopLevel(pathname: string): boolean {
  if (TOP_LEVEL_ROUTES.has(pathname)) return true;
  // /dashboard/:locationId is also a tab root — the locationId is just a
  // selected-location indicator, not a deeper navigation level.
  if (pathname.startsWith('/dashboard/')) return true;
  return false;
}

const SETTINGS_BELL_TABS = new Set(['billing', 'advanced']);

function shouldShowBell(pathname: string, search: string): boolean {
  if (BELL_ROUTES.has(pathname) || pathname.startsWith('/dashboard/')) return true;

  if (pathname === '/settings') {
    const tab = new URLSearchParams(search).get('tab');
    return tab !== null && SETTINGS_BELL_TABS.has(tab);
  }

  return false;
}

export const Breadcrumbs: FC<BreadcrumbsProps> = ({ items, rightContent, titleOverride, titleContent, onPrev, onNext, flush }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();

  const current = items[items.length - 1];
  const displayLabel = titleOverride ?? current?.label;
  const hasDateNav = !!onPrev || !!onNext;
  const isTopLevelRoute = isTopLevel(location.pathname);
  const showBell = useMemo(
    () => shouldShowBell(location.pathname, location.search),
    [location.pathname, location.search],
  );

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className={`bg-surface px-1 py-1 ${flush ? '' : 'shadow-sm'}`}>
      <div className="flex items-center gap-3 px-2">
        {!isTopLevelRoute && (
          <Button
            variant="ghost"
            size="icon"
            rounded="full"
            onClick={handleBack}
            className="h-8 !w-8 shrink-0"
            aria-label={t('aria.back')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {titleContent ? (
          <div className="min-w-0 flex-1">
            {titleContent}
          </div>
        ) : hasDateNav ? (
          <div className="flex min-w-0 flex-1 items-center gap-0.5">
            {onPrev && (
              <Button
                variant="ghost"
                size="icon"
                rounded="full"
                onClick={onPrev}
                className="!h-7 !w-7 !min-h-7 !min-w-7 !p-0 shrink-0 active:scale-95 transition-transform"
                aria-label={t('aria.previous')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <span className="min-w-0 truncate text-base font-semibold text-foreground-1">
              {displayLabel}
            </span>
            {onNext && (
              <Button
                variant="ghost"
                size="icon"
                rounded="full"
                onClick={onNext}
                className="!h-7 !w-7 !min-h-7 !min-w-7 !p-0 shrink-0 active:scale-95 transition-transform"
                aria-label={t('aria.next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <span className="min-w-0 flex-1 truncate text-lg font-semibold text-foreground-1">
            {displayLabel}
          </span>
        )}

        {rightContent ? (
          <div className="shrink-0">
            {rightContent}
          </div>
        ) : showBell ? (
          <div className="shrink-0">
            <NotificationBell variant="header" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

