import React from 'react';
import { MobileBottomNav } from '../navigation/mobile-bottom-nav';
import { AppSidebar } from '../navigation/app-sidebar';
import { SidebarInset, SidebarProvider } from '../ui/sidebar';
import { useIsMobile } from '../../hooks/use-mobile';
import { Breadcrumbs } from '../Breadcrumbs';
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const breadcrumbs = useBreadcrumbs();

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        {/* Sidebar: on desktop it's a persistent rail; on mobile it's a sheet controlled via trigger */}
        <AppSidebar />

        <SidebarInset>
          <main className={`flex-1 overflow-y-auto ${isMobile ? 'pb-20' : 'pb-0'} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
            <div className="sticky top-0 z-10 bg-gray-50 px-4 pt-4 pb-2">
              <Breadcrumbs items={breadcrumbs} />
            </div>
            <div className="px-4 py-4">
              {children}
            </div>
          </main>
          {isMobile && <MobileBottomNav />}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}