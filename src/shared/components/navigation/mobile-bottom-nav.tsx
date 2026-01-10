import {
  LayoutDashboard,
  Users,
  Settings2,
  Calendar,
  MapPin,
  Briefcase,
  Store,
  UserCircle,
  MessageCircle,
  ClipboardList,
  MoreHorizontal,
  X,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useState, useEffect, useRef } from 'react';

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
  {
    title: 'Marketplace',
    url: '/marketplace',
    icon: Store,
  },
];

// More menu items (shown in FAB expansion)
const moreNavItems: BottomNavItem[] = [
  {
    title: 'Assignments',
    url: '/assignments',
    icon: ClipboardList,
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
    title: 'Customers',
    url: '/customers',
    icon: UserCircle,
  },
  {
    title: 'Support',
    url: '/support',
    icon: MessageCircle,
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
  const [isOpen, setIsOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);

  // Close drawer when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isOpen) return;
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    setDragY(0);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isOpen) return;
    e.preventDefault(); // Prevent scrolling while dragging
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startYRef.current;
    
    // Only allow dragging down
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    // Close if dragged down more than 100px or 30% of drawer height
    const threshold = 50;
    if (dragY > threshold) {
      setIsOpen(false);
    }
    
    setIsDragging(false);
    setDragY(0);
  };

  return (
    <>
      {/* Custom sliding panel - extends upward from navbar */}
      <div
        ref={drawerRef}
        className={cn(
          'mobile-nav-drawer fixed left-0 right-0 z-40 bg-surface border-t border-border shadow-lg overflow-hidden',
          !isDragging && 'transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
          'bottom-[72px] max-h-[calc(100vh-72px)]'
        )}
        style={{
          transform: isDragging && isOpen 
            ? `translateY(${dragY}px)` 
            : isOpen 
              ? 'translateY(0)' 
              : 'translateY(100%)'
        }}
      >
        {/* Drag handle area */}
        <div 
          className="cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Visual drag handle */}
          <div className="flex flex-col items-center pt-3 pb-2">
            <div className="w-12 h-1.5 rounded-full bg-border-strong" />
          </div>
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-144px)]">
          <div className="px-2 py-2 space-y-2">
            {moreNavItems.map((item, index) => {
              const isActive = pathname === item.url;
              const isLast = index === moreNavItems.length - 1;
              return (
              <Link
                key={item.title}
                to={item.url}
                onClick={() => setIsOpen(false)}
                data-slot="sidebar-menu-button"
                data-active={isActive}
                className={cn(
                  'flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-surface-active font-medium border-border'
                    : 'bg-surface border-border hover:bg-surface-hover text-sidebar-foreground',
                  isLast && 'mb-[5px]'
                )}
              >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-foreground-3" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Backdrop overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/30 z-30 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Bottom navigation bar */}
      <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {/* Main navigation items */}
          {mainNavItems.map((item) => {
            const isActive = pathname === item.url;
            return (
              <Link
                key={item.title}
                to={item.url}
                data-slot="sidebar-menu-button"
                data-active={isActive}
                className={cn(
                  'flex flex-col items-center justify-center py-1.5 px-2.5 rounded-lg transition-all duration-200 flex-1 relative m-0.5',
                  isActive
                    ? 'bg-surface-active font-medium'
                    : 'hover:bg-surface-hover'
                )}
              >
                <item.icon className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium">
                  {item.title}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            data-slot="sidebar-menu-button"
            data-active={isOpen}
            className={cn(
              'flex flex-col items-center justify-center py-1.5 px-2.5 rounded-lg transition-all duration-200 flex-1 relative m-0.5',
              isOpen
                ? 'bg-surface-active font-medium'
                : 'hover:bg-surface-hover'
            )}
          >
            <div className="relative h-6 w-6 mb-1">
              <X 
                className={cn(
                  'absolute inset-0 h-6 w-6 transition-all duration-300',
                  isOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-90'
                )} 
              />
              <MoreHorizontal 
                className={cn(
                  'absolute inset-0 h-6 w-6 transition-all duration-300',
                  isOpen ? 'opacity-0 scale-75 -rotate-90' : 'opacity-100 scale-100 rotate-0'
                )} 
              />
            </div>
            <span className="text-xs font-medium">
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
} 