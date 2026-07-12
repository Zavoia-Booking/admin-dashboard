import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Home, 
  Calendar,
  MapPin,
  Settings,
  ClipboardList,
  Users,
  User,
  Store,
  Globe,
  Headphones,
  LayoutDashboard,
} from 'lucide-react';
import type { BreadcrumbItemType } from '../components/Breadcrumbs';

// Route to translation key mapping
const routeToKey: Record<string, string> = {
  '/dashboard': 'breadcrumbs.dashboard',
  '/calendar': 'breadcrumbs.calendar',
  '/locations': 'breadcrumbs.locations',
  '/services': 'breadcrumbs.services',
  '/assignments': 'breadcrumbs.assignments',
  '/my-assignments': 'breadcrumbs.assignments',
  '/team-members': 'breadcrumbs.teamMembers',
  '/customers': 'breadcrumbs.customers',
  '/marketplace': 'breadcrumbs.marketplace',
  '/website': 'breadcrumbs.website',
  '/my-profile': 'breadcrumbs.marketplace',
  '/support': 'breadcrumbs.support',
  '/account': 'breadcrumbs.account',
  '/my-account': 'breadcrumbs.account',
};

const routeIcons: Record<string, React.ReactNode> = {
  '/dashboard': <LayoutDashboard className="w-4 h-4" />,
  '/calendar': <Calendar className="w-4 h-4" />,
  '/locations': <MapPin className="w-4 h-4" />,
  '/services': <Settings className="w-4 h-4" />,
  '/assignments': <ClipboardList className="w-4 h-4" />,
  '/my-assignments': <ClipboardList className="w-4 h-4" />,
  '/team-members': <Users className="w-4 h-4" />,
  '/customers': <User className="w-4 h-4" />,
  '/marketplace': <Store className="w-4 h-4" />,
  '/website': <Globe className="w-4 h-4" />,
  '/my-profile': <Store className="w-4 h-4" />,
  '/support': <Headphones className="w-4 h-4" />,
  '/account': <Settings className="w-4 h-4" />,
  '/my-account': <Settings className="w-4 h-4" />,
};

export function useBreadcrumbs(): BreadcrumbItemType[] {
  const location = useLocation();
  const { t } = useTranslation('navigation');

  return useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItemType[] = [];

    // Always start with Home
    breadcrumbs.push({
      label: t('breadcrumbs.home'),
      path: '/dashboard',
      icon: <Home className="w-4 h-4" />,
    });

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Check if this is a dynamic parameter (number or UUID)
      const isId = !isNaN(Number(segment)) || segment.match(/^[0-9a-f-]{36}$/i);

      if (isId) {
        // It's an ID - create a detail breadcrumb
        const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        const parentKey = routeToKey[parentPath];
        const parentLabel = parentKey ? t(parentKey) : t('breadcrumbs.detail');
        
        breadcrumbs.push({
          label: `${parentLabel} #${segment}`,
          // Don't make the detail page clickable if it's the current page
          path: isLast ? undefined : currentPath,
        });
      } else {
        // It's a regular route
        const key = routeToKey[currentPath];
        const icon = routeIcons[currentPath];
        
        if (key) {
          breadcrumbs.push({
            label: t(key),
            path: isLast ? undefined : currentPath, // Current page is not clickable
            icon,
          });
        }
      }
    });

    return breadcrumbs;
  }, [location.pathname, t]);
}
