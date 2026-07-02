import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Settings2,
  ClipboardList,
  type LucideIcon,
  Calendar,
  MapPin,
  Briefcase,
  LogOut,
  MessageCircle,
  UserCircle,
  Store,
  FolderKanban,
  UserRoundCog,
} from "lucide-react"
import { useLocation } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { useTranslation } from "react-i18next"
import type { RootState } from "../../../app/providers/store"
import { logoutRequestAction } from "../../../features/auth/actions"

import { NavMain } from "./nav-main"
import { CompanyLogo } from "./CompanyLogo"
import { LanguageSwitcher } from "../common/LanguageSwitcher"
import { DarkModeToggle } from "../common/DarkModeToggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "../ui/sidebar"
import { Permission } from "../../lib/permissions"
import { usePermissions } from "../../hooks/usePermissions"
import { usePlatform } from "../../hooks/usePlatform"
import { NotificationBell } from "../common/NotificationBell"

interface NavSubItem {
  title: string
  url: string
  requiredPermission?: Permission // Optional: if not set, inherits from parent
}

interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  requiredPermission: Permission
  showSeparatorBefore?: boolean
  items?: NavSubItem[]
}

// Navigation items structure - titles will be translated in the component
const getNavItems = (t: (key: string) => string, isNative: boolean): NavItem[] => [
  {
    title: t("sidebar.dashboard"),
    url: "/dashboard",
    icon: LayoutDashboard,
    requiredPermission: Permission.ACCESS_DASHBOARD,
  },
  {
    title: t("sidebar.calendar"),
    url: "/calendar",
    icon: Calendar,
    requiredPermission: Permission.ACCESS_CALENDAR,
  },
  {
    title: t("sidebar.customers"),
    url: "/customers",
    icon: UserCircle,
    requiredPermission: Permission.ACCESS_CUSTOMERS,
  },
  // =========================================
  // Team Member Only Routes
  // =========================================
  {
    title: t("sidebar.teamMember.assignments"),
    url: "/my-assignments",
    icon: FolderKanban,
    requiredPermission: Permission.ACCESS_MY_ASSIGNMENTS,
  },
  // =========================================
  // Owner Only Routes
  // =========================================
  {
    title: t("sidebar.assignments"),
    url: "/assignments",
    icon: ClipboardList,
    requiredPermission: Permission.ACCESS_ASSIGNMENTS,
  },
  {
    title: t("sidebar.teamMembers"),
    url: "/team-members",
    icon: Users,
    requiredPermission: Permission.ACCESS_TEAM_MEMBERS,
  },
  {
    title: t("sidebar.services"),
    url: "/services",
    icon: Briefcase,
    requiredPermission: Permission.ACCESS_SERVICES,
    items: [
      {
        title: t("sidebar.subItems.services.allServices"),
        url: "/services?tab=services",
      },
      {
        title: t("sidebar.subItems.services.bundles"),
        url: "/services?tab=bundles",
      },
    ],
  },
  {
    title: t("sidebar.locations"),
    url: "/locations",
    icon: MapPin,
    requiredPermission: Permission.ACCESS_LOCATIONS,
  },
  {
    title: t("sidebar.marketplace"),
    url: "/marketplace",
    icon: Store,
    requiredPermission: Permission.ACCESS_MARKETPLACE,
    items: [
      {
        title: t("sidebar.subItems.marketplace.business"),
        url: "/marketplace?tab=business",
        requiredPermission: Permission.ACCESS_MARKETPLACE_PROFILE,
      },
      {
        title: t("sidebar.subItems.marketplace.website"),
        url: "/marketplace?tab=website",
        requiredPermission: Permission.ACCESS_MARKETPLACE_PROFILE,
      },
      {
        title: t("sidebar.subItems.marketplace.locations"),
        url: "/marketplace?tab=locations",
        requiredPermission: Permission.ACCESS_MARKETPLACE_PORTFOLIO,
      },
      {
        title: t("sidebar.subItems.marketplace.reviews"),
        url: "/marketplace?tab=reviews",
        requiredPermission: Permission.ACCESS_MARKETPLACE_REVIEWS,
      },
    ],
  },
  // Team Member Marketplace Profile (before Support)
  {
    title: t("sidebar.teamMember.profile"),
    url: "/my-profile",
    icon: UserRoundCog,
    requiredPermission: Permission.ACCESS_MY_PROFILE,
    showSeparatorBefore: true,
    items: [
      {
        title: t("sidebar.subItems.myProfile.profile"),
        url: "/my-profile?tab=profile",
        requiredPermission: Permission.ACCESS_MY_PROFILE_INFO,
      },
      {
        title: t("sidebar.subItems.myProfile.portfolio"),
        url: "/my-profile?tab=portfolio",
        requiredPermission: Permission.ACCESS_MY_PROFILE_PORTFOLIO,
      },
      {
        title: t("sidebar.subItems.myProfile.reviews"),
        url: "/my-profile?tab=reviews",
        requiredPermission: Permission.ACCESS_MY_PROFILE_REVIEWS,
      },
    ],
  },
  {
    title: t("sidebar.support"),
    url: "/support",
    icon: MessageCircle,
    requiredPermission: Permission.ACCESS_SUPPORT,
  },
  // Team Member Account (after Support)
  {
    title: t("sidebar.teamMember.account"),
    url: "/my-account",
    icon: Settings2,
    requiredPermission: Permission.ACCESS_MY_SETTINGS,
  },
  // Owner Account
  {
    title: t("sidebar.account"),
    url: "/account",
    icon: Settings2,
    requiredPermission: Permission.ACCESS_SETTINGS,
    items: isNative ? undefined : [
      {
        title: t("sidebar.subItems.account.profile"),
        url: "/account?tab=profile",
        requiredPermission: Permission.ACCESS_SETTINGS_PROFILE,
      },
      {
        title: t("sidebar.subItems.account.billing"),
        url: "/account?tab=billing",
        requiredPermission: Permission.ACCESS_SETTINGS_BILLING,
      },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const pathname = location.pathname
  const search = location.search
  const { t } = useTranslation('navigation')
  const { state } = useSidebar()
  const dispatch = useDispatch()
  const { hasPermission, user } = usePermissions()
  const { isNative } = usePlatform()

  // Get user data from Redux store
  const isAuthLoading = useSelector((state: RootState) => state.auth.isLoading)

  // Get translated navigation items
  const navItems = getNavItems(t, isNative)
  
  const isCollapsed = state === 'collapsed'
  
  // Helper function to check if a URL matches the current location
  const isUrlActive = (url: string): boolean => {
    const [urlPath, urlSearch] = url.split('?')
    if (pathname !== urlPath) return false
    
    if (!urlSearch) {
      // If no query params in URL, check if current location also has no query params
      return !search || search === ''
    }
    
    // Parse query parameters
    const urlParams = new URLSearchParams(urlSearch)
    const currentParams = new URLSearchParams(search)
    
    // Check if all URL params match current params
    for (const [key, value] of urlParams.entries()) {
      if (currentParams.get(key) !== value) {
        return false
      }
    }
    
    return true
  }
  
  // Filter navigation items based on user's permissions
  const filteredNavItems = navItems
    .filter(item => {
      // Check if user has the required permission for this nav item
      return hasPermission(item.requiredPermission)
    })
    .map((item, index) => {
      // Filter sub-items based on permissions
      const filteredSubItems = item.items?.filter(subItem => {
        // Owners that haven't finished the setup wizard have no businessId yet,
        // so the billing endpoints would 404. Hide the entry for them.
        if (
          subItem.url === '/account?tab=billing' &&
          user?.role === 'owner' &&
          !user?.wizardCompleted
        ) {
          return false
        }
        // If sub-item has a specific permission, check it
        // Otherwise, it inherits access from the parent item
        if (subItem.requiredPermission) {
          return hasPermission(subItem.requiredPermission)
        }
        return true
      })

      return {
        ...item,
        // Don't show separator on the first visible item (nothing above it to separate from)
        showSeparatorBefore: index === 0 ? false : item.showSeparatorBefore,
        items: filteredSubItems,
        isActive: pathname === item.url || filteredSubItems?.some(subItem => isUrlActive(subItem.url)),
      }
    })

  const handleLogout = () => {
    dispatch(logoutRequestAction.request())
  }

  // Memoize logo props to prevent unnecessary re-renders
  const logoUrl = React.useMemo(() => user?.business?.logo ?? null, [user?.business?.logo])
  const companyName = React.useMemo(() => user?.business?.name ?? null, [user?.business?.name])
  const isLogoLoading = React.useMemo(() => isAuthLoading && !user, [isAuthLoading, user])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-0 border-b border-border-strong h-[61px]">
        {isCollapsed ? (
          <div className="flex items-center justify-center w-full h-full">
            <SidebarTrigger className="h-8 w-8" />
          </div>
        ) : (
          <div className="flex items-center justify-between w-full h-full min-w-0 overflow-hidden">
            <div className="flex-1 min-w-0 overflow-hidden">
              <CompanyLogo 
                logoUrl={logoUrl}
                companyName={companyName}
                isLoading={isLogoLoading}
              />
            </div>
            <div className="pr-2 flex-shrink-0">
              <SidebarTrigger className="h-8 w-8" />
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <NavMain items={filteredNavItems} />
      </SidebarContent>
      
      {/* Notifications, Language and Dark Mode Controls */}
      <div className="grid grid-cols-3 gap-0 border-t border-border-strong group-data-[collapsible=icon]:grid-cols-1 group-data-[collapsible=icon]:gap-0">
        <div className="flex items-center justify-center w-full border-b-0 group-data-[collapsible=icon]:border-b border-border-strong">
          <DarkModeToggle />
        </div>
        <div className="flex items-center justify-center w-full border-l border-border-strong group-data-[collapsible=icon]:border-l-0">
          <LanguageSwitcher />
        </div>
        <div className="flex items-center justify-center w-full border-l border-border-strong group-data-[collapsible=icon]:border-l-0 group-data-[collapsible=icon]:border-b border-b-0">
          <NotificationBell />
        </div>
      </div>
      
      <SidebarFooter className="border-t border-border-strong bg-muted/50 p-0">
        {/* Logout Button */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout} 
              tooltip={t("sidebar.logOut")}
              className="w-full h-full py-3 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 cursor-pointer justify-center rounded-none group-data-[collapsible=icon]:w-full! group-data-[collapsible=icon]:h-auto! group-data-[collapsible=icon]:px-0! group-data-[collapsible=icon]:py-3!"
            >
              <LogOut className="h-4 w-4 group-data-[collapsible=icon]:mx-auto" />
              <span className="font-medium group-data-[collapsible=icon]:hidden">{t("sidebar.logOut")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
