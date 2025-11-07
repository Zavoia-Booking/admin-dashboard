import { useLocation } from 'react-router-dom';
import { SidebarTrigger } from '../ui/sidebar';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export function MobileHeader() {
  const location = useLocation();
  const pathname = location.pathname;

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
        return 'Admin';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Menu + Title */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-10 w-10" />
          <h1 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
        </div>

        {/* Right side - Language switcher and Location switcher (hidden on Locations page) */}
        <div className="flex items-center space-x-2">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
} 