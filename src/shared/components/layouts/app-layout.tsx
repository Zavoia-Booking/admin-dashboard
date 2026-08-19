import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppSidebar } from '../navigation/app-sidebar';
import { SidebarInset, SidebarProvider } from '../ui/sidebar';
import { useIsMobile } from '../../hooks/use-mobile';
import { Breadcrumbs } from '../Breadcrumbs';
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs';
import { LimitedAccessBanner } from '../common/subscription/LimitedAccessBanner';
import { HeaderRightSlotProvider, useHeaderRightSlotValue, useHeaderTitleSlotValue } from './HeaderRightSlot';
import { APP_SCROLL_CONTAINER_ATTR } from '../../utils/scroll';

interface AppLayoutProps {
  children: React.ReactNode;
  /** Optional class for the main content container (e.g. calendar uses md:max-w-[1400px]) */
  contentClassName?: string;
  /** Optional content to render on the right side of the mobile breadcrumb header (replaces notification bell) */
  headerRightContent?: React.ReactNode;
  /**
   * Set on pages whose children render a sticky-header tab component
   * (ResponsiveTabs with stickyHeader). When true, AppLayout does not render
   * the LimitedAccessBanner — each tab is expected to render its own banner
   * at the top of its content so it sits under the tab header on every
   * viewport.
   */
  tabbedPage?: boolean;
  noPadding?: boolean;
  /** Optional override for the breadcrumb header title (mobile). */
  headerTitleOverride?: string;
  /** Optional custom JSX rendered in place of the breadcrumb title (mobile).
   *  Takes precedence over headerTitleOverride. Used by the dashboard to host
   *  the location dropdown in the header. */
  headerTitleContent?: React.ReactNode;
  /** Optional page-scoped prev/next handlers — render as muted chevrons next to
   *  the breadcrumb title (mobile). Used by the calendar page for day/week/month nav. */
  headerPrevAction?: () => void;
  headerNextAction?: () => void;
  /** Drops the mobile breadcrumb header entirely. For a top-level flow whose
   *  page carries its own primary action, the bar has nothing left to say — the
   *  bottom nav already names the flow. The safe-area inset is still filled so
   *  content cannot run under the status bar on native. */
  headerHidden?: boolean;
}

export function AppLayout(props: AppLayoutProps) {
  return (
    <HeaderRightSlotProvider>
      <AppLayoutInner {...props} />
    </HeaderRightSlotProvider>
  );
}

function AppLayoutInner({ children, contentClassName, headerRightContent, noPadding, tabbedPage, headerTitleOverride, headerTitleContent, headerPrevAction, headerNextAction, headerHidden }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const breadcrumbs = useBreadcrumbs();
  const location = useLocation();
  const slotRightContent = useHeaderRightSlotValue();
  const effectiveRightContent = headerRightContent ?? slotRightContent ?? undefined;
  const slotTitleContent = useHeaderTitleSlotValue();
  const effectiveTitleContent = headerTitleContent ?? slotTitleContent ?? undefined;

  useEffect(() => {
    // remove the inline background colors set in index.html
    const docEl = document.documentElement;
    const body = document.body;

    docEl.style.backgroundColor = '';
    body.style.backgroundColor = '';
  }, []);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-transparent">
        {/* Sidebar: on desktop it's a persistent rail; on mobile it's a sheet controlled via trigger */}
        <AppSidebar />

        <SidebarInset>
          <main
            {...{ [APP_SCROLL_CONTAINER_ATTR]: '' }}
            className={`flex-1 bg-transparent overflow-y-auto ${isMobile ? 'pb-19' : 'pb-0'} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
          >
            <div className={`w-full bg-transparent max-w-full content-container ${contentClassName ?? 'md:max-w-220'}`}>
              <div
                // Shadow lives on this wrapper, not the Breadcrumbs box: on
                // native the box top sits below the status-bar filler, and its
                // shadow halo would paint a faint seam across the filler.
                className={`sticky top-0 z-50 md:hidden bg-surface ${!headerHidden && !tabbedPage ? 'shadow-sm' : ''}`}
                // Stable var, not raw env(): env() collapses to 0 while the
                // Android keyboard is open (see shared/lib/safeArea.ts).
                style={{ paddingTop: "var(--safe-area-top-stable, env(safe-area-inset-top))" }}
              >
                {/* Even when hidden, the wrapper above stays mounted: it fills
                    the status-bar/notch inset on native, which content would
                    otherwise scroll under. */}
                {!headerHidden && (
                  <Breadcrumbs
                    items={breadcrumbs}
                    rightContent={effectiveRightContent}
                    titleOverride={headerTitleOverride}
                    titleContent={effectiveTitleContent}
                    onPrev={headerPrevAction}
                    onNext={headerNextAction}
                  />
                )}
              </div>
              {!tabbedPage && <LimitedAccessBanner />}
              <div
                key={isMobile ? location.pathname : undefined}
                className={`${noPadding ? '' : 'px-2 py-4 md:px-4'} animate-route-enter`}
              >
                {children}
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}