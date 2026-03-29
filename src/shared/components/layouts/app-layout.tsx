import React, { useEffect } from 'react';
import { MobileBottomNav } from '../navigation/mobile-bottom-nav';
import { AppSidebar } from '../navigation/app-sidebar';
import { SidebarInset, SidebarProvider } from '../ui/sidebar';
import { useIsMobile } from '../../hooks/use-mobile';
import { Breadcrumbs } from '../Breadcrumbs';
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs';

interface AppLayoutProps {
  children: React.ReactNode;
  /** Optional class for the main content container (e.g. calendar uses md:max-w-[1400px]) */
  contentClassName?: string;
  /** Optional content to render on the right side of the mobile breadcrumb header (replaces notification bell) */
  headerRightContent?: React.ReactNode;
}

export function AppLayout({ children, contentClassName, headerRightContent }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const breadcrumbs = useBreadcrumbs();

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
          <main className={`flex-1 bg-transparent overflow-y-auto ${isMobile ? 'pb-20' : 'pb-0'} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
            <div className={`w-full bg-transparent max-w-full content-container ${contentClassName ?? 'md:max-w-220'}`}>
              <div className="sticky top-0 z-30 md:hidden">
                <Breadcrumbs items={breadcrumbs} rightContent={headerRightContent} />
              </div>
              <div className="px-2 py-4 md:px-4">
                {children}
              </div>
            </div>
          </main>
          {isMobile && <MobileBottomNav />}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}