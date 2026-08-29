import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  ClipboardList,
  FolderKanban,
  Globe,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  Settings2,
  Store,
  UserCircle,
  UserRoundCog,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { usePermissions } from '../../hooks/usePermissions';
import { usePlatform } from '../../hooks/usePlatform';
import { Permission } from '../../lib/permissions';

type MobileNavigationGroup = 'main' | 'more';

interface NavigationSubItemDefinition {
  id: string;
  titleKey: string;
  url: string;
  requiredPermission?: Permission;
  hideUntilOwnerSetupComplete?: boolean;
}

interface NavigationItemDefinition {
  id: string;
  titleKey: string;
  url: string;
  icon: LucideIcon;
  requiredPermission: Permission;
  /**
   * Paints the entry in the brand terracotta instead of the neutral nav ink, so
   * it reads as its own destination rather than one more routine section. Meant
   * for a single standout entry -- more than one and none of them stand out.
   */
  accent?: boolean;
  showSeparatorBefore?: boolean;
  subItems?: readonly NavigationSubItemDefinition[];
  hideSubItemsOnNative?: boolean;
  mobile?: {
    group: MobileNavigationGroup;
    order: number;
    titleKey?: string;
  };
}

export interface DesktopNavigationItem {
  id: string;
  title: string;
  url: string;
  icon: LucideIcon;
  isActive: boolean;
  accent: boolean;
  showSeparatorBefore: boolean;
  items?: Array<{
    id: string;
    title: string;
    url: string;
  }>;
}

export interface MobileNavigationItem {
  id: string;
  title: string;
  url: string;
  icon: LucideIcon;
  isActive: boolean;
  accent: boolean;
}

const NAVIGATION_ITEMS: readonly NavigationItemDefinition[] = [
  {
    id: 'dashboard',
    titleKey: 'sidebar.dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    requiredPermission: Permission.ACCESS_DASHBOARD,
    mobile: { group: 'main', order: 0 },
  },
  {
    id: 'calendar',
    titleKey: 'sidebar.calendar',
    url: '/calendar',
    icon: Calendar,
    requiredPermission: Permission.ACCESS_CALENDAR,
    mobile: { group: 'main', order: 3 },
  },
  {
    id: 'customers',
    titleKey: 'sidebar.customers',
    url: '/customers',
    icon: UserCircle,
    requiredPermission: Permission.ACCESS_CUSTOMERS,
    mobile: { group: 'more', order: 4 },
  },
  {
    id: 'my-assignments',
    titleKey: 'sidebar.teamMember.assignments',
    url: '/my-assignments',
    icon: FolderKanban,
    requiredPermission: Permission.ACCESS_MY_ASSIGNMENTS,
    mobile: { group: 'main', order: 2 },
  },
  {
    id: 'assignments',
    titleKey: 'sidebar.assignments',
    url: '/assignments',
    icon: ClipboardList,
    requiredPermission: Permission.ACCESS_ASSIGNMENTS,
    mobile: {
      group: 'main',
      order: 1,
      titleKey: 'mobileNav.assignments',
    },
  },
  {
    id: 'team-members',
    titleKey: 'sidebar.teamMembers',
    url: '/team-members',
    icon: Users,
    requiredPermission: Permission.ACCESS_TEAM_MEMBERS,
    mobile: { group: 'more', order: 1 },
  },
  {
    id: 'services',
    titleKey: 'sidebar.services',
    url: '/services',
    icon: Briefcase,
    requiredPermission: Permission.ACCESS_SERVICES,
    subItems: [
      {
        id: 'services-all',
        titleKey: 'sidebar.subItems.services.allServices',
        url: '/services?tab=services',
      },
      {
        id: 'services-bundles',
        titleKey: 'sidebar.subItems.services.bundles',
        url: '/services?tab=bundles',
      },
    ],
    mobile: { group: 'more', order: 2 },
  },
  {
    id: 'locations',
    titleKey: 'sidebar.locations',
    url: '/locations',
    icon: MapPin,
    requiredPermission: Permission.ACCESS_LOCATIONS,
    mobile: { group: 'more', order: 3 },
  },
  {
    id: 'marketplace',
    titleKey: 'sidebar.marketplace',
    url: '/marketplace',
    icon: Store,
    requiredPermission: Permission.ACCESS_MARKETPLACE,
    subItems: [
      {
        id: 'marketplace-business',
        titleKey: 'sidebar.subItems.marketplace.business',
        url: '/marketplace?tab=business',
        requiredPermission: Permission.ACCESS_MARKETPLACE_PROFILE,
      },
      {
        id: 'marketplace-locations',
        titleKey: 'sidebar.subItems.marketplace.locations',
        url: '/marketplace?tab=locations',
        requiredPermission: Permission.ACCESS_MARKETPLACE_PORTFOLIO,
      },
      {
        id: 'marketplace-reviews',
        titleKey: 'sidebar.subItems.marketplace.reviews',
        url: '/marketplace?tab=reviews',
        requiredPermission: Permission.ACCESS_MARKETPLACE_REVIEWS,
      },
    ],
    mobile: {
      group: 'main',
      order: 4,
      titleKey: 'mobileNav.marketplace',
    },
  },
  {
    id: 'website',
    titleKey: 'sidebar.website',
    url: '/website',
    icon: Globe,
    requiredPermission: Permission.ACCESS_WEBSITE,
    accent: true,
    mobile: { group: 'more', order: 0 },
  },
  {
    id: 'my-profile',
    titleKey: 'sidebar.teamMember.profile',
    url: '/my-profile',
    icon: UserRoundCog,
    requiredPermission: Permission.ACCESS_MY_PROFILE,
    showSeparatorBefore: true,
    subItems: [
      {
        id: 'my-profile-profile',
        titleKey: 'sidebar.subItems.myProfile.profile',
        url: '/my-profile?tab=profile',
        requiredPermission: Permission.ACCESS_MY_PROFILE_INFO,
      },
      {
        id: 'my-profile-portfolio',
        titleKey: 'sidebar.subItems.myProfile.portfolio',
        url: '/my-profile?tab=portfolio',
        requiredPermission: Permission.ACCESS_MY_PROFILE_PORTFOLIO,
      },
      {
        id: 'my-profile-reviews',
        titleKey: 'sidebar.subItems.myProfile.reviews',
        url: '/my-profile?tab=reviews',
        requiredPermission: Permission.ACCESS_MY_PROFILE_REVIEWS,
      },
    ],
    mobile: { group: 'main', order: 4 },
  },
  {
    id: 'support',
    titleKey: 'sidebar.support',
    url: '/support',
    icon: MessageCircle,
    requiredPermission: Permission.ACCESS_SUPPORT,
    mobile: { group: 'more', order: 5 },
  },
  {
    id: 'my-account',
    titleKey: 'sidebar.teamMember.account',
    url: '/my-account',
    icon: Settings2,
    requiredPermission: Permission.ACCESS_MY_SETTINGS,
    mobile: { group: 'more', order: 7 },
  },
  {
    id: 'account',
    titleKey: 'sidebar.account',
    url: '/account',
    icon: Settings2,
    requiredPermission: Permission.ACCESS_SETTINGS,
    subItems: [
      {
        id: 'account-profile',
        titleKey: 'sidebar.subItems.account.profile',
        url: '/account?tab=profile',
        requiredPermission: Permission.ACCESS_SETTINGS_PROFILE,
      },
      {
        id: 'account-billing',
        titleKey: 'sidebar.subItems.account.billing',
        url: '/account?tab=billing',
        requiredPermission: Permission.ACCESS_SETTINGS_BILLING,
        hideUntilOwnerSetupComplete: true,
      },
    ],
    hideSubItemsOnNative: true,
    mobile: { group: 'more', order: 6 },
  },
];

function matchesPath(url: string, pathname: string, includeDescendants: boolean) {
  const [urlPath] = url.split('?');
  return pathname === urlPath || (includeDescendants && pathname.startsWith(`${urlPath}/`));
}

function matchesUrlWithQuery(url: string, pathname: string, search: string) {
  const [urlPath, urlSearch] = url.split('?');
  if (pathname !== urlPath) return false;
  if (!urlSearch) return !search;

  const expectedParams = new URLSearchParams(urlSearch);
  const currentParams = new URLSearchParams(search);

  for (const [key, value] of expectedParams.entries()) {
    if (currentParams.get(key) !== value) return false;
  }

  return true;
}

/**
 * Builds every navigation surface from one route catalogue while retaining each
 * surface's existing ordering, labels, and active-route semantics.
 */
export function useAppNavigation() {
  const { t } = useTranslation('navigation');
  const { permissions, user } = usePermissions();
  const { isNative } = usePlatform();
  const { pathname, search } = useLocation();

  return useMemo(() => {
    const canAccess = (permission: Permission) => permissions.includes(permission);
    const visibleDefinitions = NAVIGATION_ITEMS.filter((item) => canAccess(item.requiredPermission));

    const desktopItems: DesktopNavigationItem[] = visibleDefinitions.map((item, index) => {
      const visibleSubItems = item.hideSubItemsOnNative && isNative
        ? undefined
        : item.subItems
          ?.filter((subItem) => {
            if (!subItem.requiredPermission || canAccess(subItem.requiredPermission)) {
              return !(
                subItem.hideUntilOwnerSetupComplete
                && user?.role === 'owner'
                && !user.wizardCompleted
              );
            }
            return false;
          })
          .map((subItem) => ({
            id: subItem.id,
            title: t(subItem.titleKey),
            url: subItem.url,
          }));

      return {
        id: item.id,
        title: t(item.titleKey),
        url: item.url,
        icon: item.icon,
        accent: item.accent === true,
        showSeparatorBefore: index > 0 && item.showSeparatorBefore === true,
        items: visibleSubItems,
        isActive:
          pathname === item.url
          || visibleSubItems?.some((subItem) => matchesUrlWithQuery(subItem.url, pathname, search))
          || false,
      };
    });

    const mobileItems = visibleDefinitions
      .filter((item) => item.mobile)
      .map((item) => ({
        id: item.id,
        title: t(item.mobile?.titleKey ?? item.titleKey),
        url: item.url,
        icon: item.icon,
        accent: item.accent === true,
        isActive: matchesPath(item.url, pathname, true),
        group: item.mobile?.group ?? 'more',
        order: item.mobile?.order ?? 0,
      }));

    const toMobileItem = (item: typeof mobileItems[number]): MobileNavigationItem => ({
      id: item.id,
      title: item.title,
      url: item.url,
      icon: item.icon,
      isActive: item.isActive,
      accent: item.accent,
    });

    return {
      desktopItems,
      mobileMainItems: mobileItems
        .filter((item) => item.group === 'main')
        .sort((a, b) => a.order - b.order)
        .map(toMobileItem),
      mobileMoreItems: mobileItems
        .filter((item) => item.group === 'more')
        .sort((a, b) => a.order - b.order)
        .map(toMobileItem),
    } satisfies {
      desktopItems: DesktopNavigationItem[];
      mobileMainItems: MobileNavigationItem[];
      mobileMoreItems: MobileNavigationItem[];
    };
  }, [isNative, pathname, permissions, search, t, user]);
}
