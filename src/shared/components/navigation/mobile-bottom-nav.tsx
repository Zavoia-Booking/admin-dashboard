import {
  LayoutDashboard,
  Users,
  Settings2,
  Calendar,
  MapPin,
  Briefcase,
  Store,
  Globe,
  UserCircle,
  MessageCircle,
  ClipboardList,
  FolderKanban,
  UserRoundCog,
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
import { Permission } from '../../lib/permissions';
import { usePermissions } from '../../hooks/usePermissions';

interface BottomNavItem {
  i18nKey: string;
  url: string;
  icon: LucideIcon;
  requiredPermission: Permission;
}

const allMainNavItems: BottomNavItem[] = [
  { i18nKey: 'sidebar.dashboard', url: '/dashboard', icon: LayoutDashboard, requiredPermission: Permission.ACCESS_DASHBOARD },
  { i18nKey: 'mobileNav.assignments', url: '/assignments', icon: ClipboardList, requiredPermission: Permission.ACCESS_ASSIGNMENTS },
  { i18nKey: 'sidebar.teamMember.assignments', url: '/my-assignments', icon: FolderKanban, requiredPermission: Permission.ACCESS_MY_ASSIGNMENTS },
  { i18nKey: 'sidebar.calendar', url: '/calendar', icon: Calendar, requiredPermission: Permission.ACCESS_CALENDAR },
  { i18nKey: 'mobileNav.marketplace', url: '/marketplace', icon: Store, requiredPermission: Permission.ACCESS_MARKETPLACE },
  { i18nKey: 'sidebar.teamMember.profile', url: '/my-profile', icon: UserRoundCog, requiredPermission: Permission.ACCESS_MY_PROFILE },
];

const allMoreNavItems: BottomNavItem[] = [
  // Website joins the More drawer — the five-slot bottom bar stays unchanged.
  { i18nKey: 'sidebar.website', url: '/website', icon: Globe, requiredPermission: Permission.ACCESS_WEBSITE },
  { i18nKey: 'sidebar.teamMembers', url: '/team-members', icon: Users, requiredPermission: Permission.ACCESS_TEAM_MEMBERS },
  { i18nKey: 'sidebar.services', url: '/services', icon: Briefcase, requiredPermission: Permission.ACCESS_SERVICES },
  { i18nKey: 'sidebar.locations', url: '/locations', icon: MapPin, requiredPermission: Permission.ACCESS_LOCATIONS },
  { i18nKey: 'sidebar.customers', url: '/customers', icon: UserCircle, requiredPermission: Permission.ACCESS_CUSTOMERS },
  { i18nKey: 'sidebar.support', url: '/support', icon: MessageCircle, requiredPermission: Permission.ACCESS_SUPPORT },
  { i18nKey: 'sidebar.account', url: '/account', icon: Settings2, requiredPermission: Permission.ACCESS_SETTINGS },
  { i18nKey: 'sidebar.teamMember.account', url: '/my-account', icon: Settings2, requiredPermission: Permission.ACCESS_MY_SETTINGS },
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
  const { hasPermission } = usePermissions();
  const mainNavItems = allMainNavItems.filter(item => hasPermission(item.requiredPermission));
  const moreNavItems = allMoreNavItems.filter(item => hasPermission(item.requiredPermission));
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
          'mobile-nav-drawer fixed left-0 right-0 z-[60] bg-surface border-t border-border shadow-lg overflow-hidden',
          !isDragging && 'transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
          'bottom-[64px] max-h-[calc(100vh-64px)]'
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
              const isActive = pathname === item.url || pathname.startsWith(item.url + '/');
              return (
              <Link
                key={item.i18nKey}
                to={item.url}
                onClick={(e) => {
                  if (isActive) e.preventDefault();
                  setIsOpen(false);
                }}
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
          'fixed inset-0 bg-black/30 z-[55] backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Bottom navigation bar — Airbnb/Apple tab-bar pattern:
       * no background fills, color-only active state, generous vertical padding,
       * hairline border-top (no shadow), icons at 22px, labels at 10px. */}
      <nav
        className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-[60] bg-surface/95 backdrop-blur-md border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch justify-around px-0 pt-1 pb-4">
          {/* Main navigation items */}
          {mainNavItems.map((item) => {
            const isCurrentPath = pathname === item.url || pathname.startsWith(item.url + '/');
            const isActive = !isOpen && isCurrentPath;
            return (
              <Link
                key={item.i18nKey}
                to={item.url}
                onClick={(e) => {
                  if (isCurrentPath) e.preventDefault();
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-1",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground",
                )}
              >
                <span key={isActive ? pathname : undefined} className={isActive ? "animate-tab-icon" : undefined}>
                  <item.icon className="h-6 w-6 shrink-0" />
                </span>
                <span className={cn(
                  "text-[12px] leading-tight truncate max-w-full",
                  isActive ? "font-semibold" : "font-medium",
                )}>
                  {t(item.i18nKey)}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-1",
              isOpen
                ? "text-primary"
                : "text-muted-foreground active:text-foreground",
            )}
          >
            <div className="relative h-6 w-6 shrink-0">
              <X
                className={cn(
                  "absolute inset-0 h-6 w-6 transition-all duration-300",
                  isOpen ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 rotate-90",
                )}
                strokeWidth={2}
              />
              <MoreHorizontal
                className={cn(
                  "absolute inset-0 h-6 w-6 transition-all duration-300",
                  isOpen ? "opacity-0 scale-75 -rotate-90" : "opacity-100 scale-100 rotate-0",
                )}
                strokeWidth={2}
              />
            </div>
            <span className={cn(
              "text-[12px] leading-tight truncate max-w-full",
              isOpen ? "font-semibold" : "font-medium",
            )}>
              {t('mobileNav.more')}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
} 