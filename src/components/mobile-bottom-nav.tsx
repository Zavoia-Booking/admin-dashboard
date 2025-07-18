'use client';

import {
  LayoutDashboard,
  Users,
  Settings2,
  Calendar,
  MapPin,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface BottomNavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

const bottomNavItems: BottomNavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Calendar',
    url: '/calendar',
    icon: Calendar,
  },
  {
    title: 'Team',
    url: '/team-members',
    icon: Users,
  },
  {
    title: 'Services',
    url: '/services',
    icon: Briefcase,
  },
  {
    title: 'Locations',
    url: '/locations',
    icon: MapPin,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings2,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex items-center justify-around px-2 py-2">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.url;
          return (
            <a
              key={item.title}
              href={item.url}
              className={cn(
                'flex flex-col items-center justify-center w-full py-2 px-1 rounded-lg transition-colors duration-200',
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <item.icon className={cn('h-6 w-6 mb-1', isActive ? 'text-blue-600' : 'text-gray-500')} />
              <span className={cn('text-xs font-medium', isActive ? 'text-blue-600' : 'text-gray-500')}>
                {item.title}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
} 