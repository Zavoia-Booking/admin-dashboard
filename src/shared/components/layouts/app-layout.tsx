'use client';

import React from 'react';
import { MobileBottomNav } from '../navigation/mobile-bottom-nav';
import { MobileHeader } from '../navigation/mobile-header';
import { AppSidebar } from '../navigation/app-sidebar';
import { SidebarInset, SidebarProvider } from '../ui/sidebar';
import { useIsMobile } from '../../hooks/use-mobile';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar: on desktop it's a persistent rail; on mobile it's a sheet controlled via trigger */}
        <AppSidebar />

        <SidebarInset>
          {isMobile && <MobileHeader />}
          <main className={`flex-1 overflow-y-auto ${isMobile ? 'pb-20' : 'pb-0'} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
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