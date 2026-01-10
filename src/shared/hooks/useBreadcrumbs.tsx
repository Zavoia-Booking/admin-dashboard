import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { 
  Home, 
  Calendar,
  MapPin,
  Settings,
  ClipboardList,
  Users,
  User,
  Store,
  Headphones,
  LayoutDashboard,
} from 'lucide-react';
import type { BreadcrumbItemType } from '../components/Breadcrumbs';

// Breadcrumb configuration for routes
const routeConfig: Record<string, { label: string; icon?: React.ReactNode }> = {
  '/dashboard': { label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  '/calendar': { label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
  '/locations': { label: 'Locations', icon: <MapPin className="w-4 h-4" /> },
  '/services': { label: 'Services', icon: <Settings className="w-4 h-4" /> },
  '/assignments': { label: 'Assignments', icon: <ClipboardList className="w-4 h-4" /> },
  '/team-members': { label: 'Team Members', icon: <Users className="w-4 h-4" /> },
  '/customers': { label: 'Customers', icon: <User className="w-4 h-4" /> },
  '/marketplace': { label: 'Marketplace', icon: <Store className="w-4 h-4" /> },
  '/support': { label: 'Support', icon: <Headphones className="w-4 h-4" /> },
  '/settings': { label: 'Settings', icon: <Settings className="w-4 h-4" /> },
};

export function useBreadcrumbs(): BreadcrumbItemType[] {
  const location = useLocation();
  const params = useParams();

  return useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItemType[] = [];

    // Always start with Home
    breadcrumbs.push({
      label: 'Home',
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
        const parentConfig = routeConfig[parentPath];
        
        breadcrumbs.push({
          label: `${parentConfig?.label || 'Detail'} #${segment}`,
          // Don't make the detail page clickable if it's the current page
          path: isLast ? undefined : currentPath,
        });
      } else {
        // It's a regular route
        const config = routeConfig[currentPath];
        
        if (config) {
          breadcrumbs.push({
            label: config.label,
            path: isLast ? undefined : currentPath, // Current page is not clickable
            icon: config.icon,
          });
        }
      }
    });

    return breadcrumbs;
  }, [location.pathname, params]);
}

