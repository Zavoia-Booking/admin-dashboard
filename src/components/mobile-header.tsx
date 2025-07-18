'use client';

import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function MobileHeader() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Get page title based on current path
  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/calendar':
        return 'Calendar';
      case '/team-members':
        return 'Team Members';
      case '/services':
        return 'Services';
      case '/locations':
        return 'Locations';
      case '/profile':
        return 'Profile';
      case '/settings':
        return 'Settings';
      default:
        return 'Planr Admin';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Title */}
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
        </div>

        {/* Right side - Search and Notifications */}
        <div className="flex items-center space-x-2">
          {isSearchOpen ? (
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search..."
                className="w-48 h-9"
                autoFocus
                onBlur={() => setIsSearchOpen(false)}
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
          
          <Button variant="ghost" size="icon" className="h-10 w-10 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </Button>
          
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/shadcn.jpg" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
} 