'use client';

import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { MobileHeader } from '@/components/mobile-header';
import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Mobile Header */}
      <MobileHeader />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="px-4 py-4">
          {children}
        </div>
      </main>
      
      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
} 