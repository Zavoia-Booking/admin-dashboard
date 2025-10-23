import {
  LayoutDashboard,
  Users,
  Settings2,
  Calendar,
  MapPin,
  Briefcase,
  MoreHorizontal,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';

interface BottomNavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

// Main nav items (always visible)
const mainNavItems: BottomNavItem[] = [
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
];

// More menu items (shown in FAB expansion)
const moreNavItems: BottomNavItem[] = [
  {
    title: 'Assignments',
    url: '/assignments',
    icon: Briefcase,
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
  const location = useLocation();
  const pathname = location.pathname;
  const [isExpanded, setIsExpanded] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsExpanded(false);
  }, [pathname]);

  // Calculate position for each item in the vertical stack
  const getItemPosition = (index: number) => {
    const spacing = 80; // Vertical spacing between items
    
    return {
      y: -(index + 1) * spacing, // Stack upward
    };
  };

  return (
    <>
      {/* Backdrop overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Floating action buttons (expanded items) */}
      {isExpanded && (
        <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-4">
          {moreNavItems.map((item, index) => {
            const isActive = pathname === item.url;
            
            return (
              <Link
                key={item.title}
                to={item.url}
                className={cn(
                  'flex items-center gap-3 transition-all duration-300 ease-out',
                  'animate-in fade-in slide-in-from-bottom'
                )}
                style={{
                  transitionDelay: `${index * 50}ms`,
                }}
              >
                {/* Label (on the left) */}
                <span
                  className={cn(
                    'text-sm font-medium px-3 py-2 rounded-full bg-white shadow-lg whitespace-nowrap',
                    isActive ? 'text-blue-600' : 'text-gray-700'
                  )}
                >
                  {item.title}
                </span>
                {/* Icon button (on the right) */}
                <div
                  className={cn(
                    'w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <item.icon className="h-6 w-6" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around px-4 py-2">
          {/* Main navigation items */}
          {mainNavItems.map((item) => {
            const isActive = pathname === item.url;
            return (
              <Link
                key={item.title}
                to={item.url}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors duration-200',
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                <item.icon className={cn('h-6 w-6 mb-1', isActive ? 'text-blue-600' : 'text-gray-500')} />
                <span className={cn('text-xs font-medium', isActive ? 'text-blue-600' : 'text-gray-500')}>
                  {item.title}
                </span>
              </Link>
            );
          })}

          {/* More FAB button (on the right) */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all duration-300',
              isExpanded
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <div
              className={cn(
                'h-6 w-6 mb-1 transition-transform duration-300',
                isExpanded && 'rotate-45'
              )}
            >
              {isExpanded ? (
                <X className="h-6 w-6 text-blue-600" />
              ) : (
                <MoreHorizontal className="h-6 w-6" />
              )}
            </div>
            <span className={cn('text-xs font-medium', isExpanded ? 'text-blue-600' : 'text-gray-500')}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
} 