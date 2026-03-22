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
  Moon,
  Sun,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { cn } from '../../lib/utils';
import { useState, useEffect, useRef } from 'react';
import { logoutRequestAction } from '../../../features/auth/actions';

interface BottomNavItem {
  i18nKey: string;
  url: string;
  icon: LucideIcon;
}

const mainNavItems: BottomNavItem[] = [
  { i18nKey: 'sidebar.dashboard', url: '/dashboard', icon: LayoutDashboard },
  { i18nKey: 'sidebar.calendar', url: '/calendar', icon: Calendar },
  { i18nKey: 'sidebar.marketplace', url: '/marketplace', icon: Store },
];

const moreNavItems: BottomNavItem[] = [
  { i18nKey: 'sidebar.assignments', url: '/assignments', icon: ClipboardList },
  { i18nKey: 'sidebar.teamMembers', url: '/team-members', icon: Users },
  { i18nKey: 'sidebar.services', url: '/services', icon: Briefcase },
  { i18nKey: 'sidebar.locations', url: '/locations', icon: MapPin },
  { i18nKey: 'sidebar.customers', url: '/customers', icon: UserCircle },
  { i18nKey: 'sidebar.support', url: '/support', icon: MessageCircle },
  { i18nKey: 'sidebar.settings', url: '/settings', icon: Settings2 },
];

const USFlag = () => (
  <svg width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="15" rx="2" fill="#B22234"/>
    <rect y="1" width="20" height="1" fill="white"/>
    <rect y="3" width="20" height="1" fill="white"/>
    <rect y="5" width="20" height="1" fill="white"/>
    <rect y="7" width="20" height="1" fill="white"/>
    <rect y="9" width="20" height="1" fill="white"/>
    <rect y="11" width="20" height="1" fill="white"/>
    <rect y="13" width="20" height="1" fill="white"/>
    <rect width="8" height="8" fill="#3C3B6E"/>
  </svg>
);

const ROFlag = () => (
  <svg width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="15" rx="2" fill="#FCD116"/>
    <rect width="6.67" height="15" rx="2" fill="#002B7F"/>
    <rect x="13.33" width="6.67" height="15" rx="2" fill="#CE1126"/>
  </svg>
);

const languages = [
  { code: 'en', name: 'English', flag: <USFlag /> },
  { code: 'ro', name: 'Română', flag: <ROFlag /> },
];

export function MobileBottomNav() {
  const location = useLocation();
  const pathname = location.pathname;
  const { i18n, t } = useTranslation('navigation');
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const cycleLang = () => {
    const idx = languages.findIndex(l => l.code === i18n.language);
    const next = languages[(idx + 1) % languages.length];
    i18n.changeLanguage(next.code);
  };

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
          'mobile-nav-drawer fixed left-0 right-0 z-50 bg-surface border-t border-border shadow-lg overflow-hidden',
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
            {moreNavItems.map((item) => {
              const isActive = pathname === item.url;
              return (
              <Link
                key={item.i18nKey}
                to={item.url}
                onClick={() => setIsOpen(false)}
                data-slot="sidebar-menu-button"
                data-active={isActive}
                className={cn(
                  'flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-surface-active font-medium border-border'
                    : 'bg-surface border-border hover:bg-surface-hover text-sidebar-foreground',
                )}
              >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{t(item.i18nKey)}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-foreground-3" />
                </Link>
              );
            })}

            {/* Dark mode & Language controls */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-all duration-200 cursor-pointer"
              >
                {isDark ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                <span className="font-medium text-sm">
                  {isDark ? t('theme.dark') : t('theme.light')}
                </span>
              </button>

              <button
                type="button"
                onClick={cycleLang}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-all duration-200 cursor-pointer"
              >
                {currentLang.flag}
                <span className="font-medium text-sm">{currentLang.name}</span>
              </button>
            </div>

            {/* Log out */}
            <button
              type="button"
              onClick={() => dispatch(logoutRequestAction.request())}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-[5px] rounded-lg border border-border bg-surface hover:bg-surface-hover transition-all duration-200 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium text-sm">{t('sidebar.logOut')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/30 z-40 backdrop-blur-sm transition-opacity duration-300',
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
                key={item.i18nKey}
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
                  {t(item.i18nKey)}
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
              {t('mobileNav.more')}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
} 