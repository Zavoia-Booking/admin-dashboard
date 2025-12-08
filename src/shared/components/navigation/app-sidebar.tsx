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
import { UserRole } from "../../types/auth"

interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  roles: UserRole[]
  showSeparatorBefore?: boolean
  items?: {
    title: string
    url: string
  }[]
}

// Navigation items structure - titles will be translated in the component
const getNavItems = (t: (key: string) => string): NavItem[] => [
  {
    title: t("sidebar.dashboard"),
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: [UserRole.OWNER, UserRole.TEAM_MEMBER],
  },
  {
    title: t("sidebar.calendar"),
    url: "/calendar",
    icon: Calendar,
    roles: [UserRole.OWNER, UserRole.TEAM_MEMBER],
  },
  {
    title: t("sidebar.assignments"),
    url: "/assignments",
    icon: ClipboardList,
    roles: [UserRole.OWNER, UserRole.TEAM_MEMBER],
    items: [
      {
        title: t("sidebar.subItems.assignments.teamMembers"),
        url: "/assignments?tab=team_members",
      },
      {
        title: t("sidebar.subItems.assignments.services"),
        url: "/assignments?tab=services",
      },
      {
        title: t("sidebar.subItems.assignments.locations"),
        url: "/assignments?tab=locations",
      },
    ],
  },
  {
    title: t("sidebar.teamMembers"),
    url: "/team-members",
    icon: Users,
    roles: [UserRole.OWNER, UserRole.TEAM_MEMBER],
  },
  {
    title: t("sidebar.services"),
    url: "/services",
    icon: Briefcase,
    roles: [UserRole.OWNER, UserRole.TEAM_MEMBER],
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
    roles: [UserRole.OWNER, UserRole.TEAM_MEMBER],
  },
  {
    title: t("sidebar.customers"),
    url: "/customers",
    icon: UserCircle,
    roles: [UserRole.OWNER, UserRole.TEAM_MEMBER],
  },
  {
    title: t("sidebar.marketplace"),
    url: "/marketplace",
    icon: Store,
    roles: [UserRole.OWNER, UserRole.TEAM_MEMBER],
    items: [
      {
        title: t("sidebar.subItems.marketplace.profile"),
        url: "/marketplace?tab=profile",
      },
      {
        title: t("sidebar.subItems.marketplace.portfolio"),
        url: "/marketplace?tab=portfolio",
      },
      {
        title: t("sidebar.subItems.marketplace.promotions"),
        url: "/marketplace?tab=promotions",
      },
      {
        title: t("sidebar.subItems.marketplace.bookingSettings"),
        url: "/marketplace?tab=booking-settings",
      },
    ],
  },
  {
    title: t("sidebar.support"),
    url: "/support",
    icon: MessageCircle,
    roles: [UserRole.OWNER, UserRole.TEAM_MEMBER],
    showSeparatorBefore: true,
  },
  {
    title: t("sidebar.settings"),
    url: "/settings",
    icon: Settings2,
    roles: [UserRole.OWNER, UserRole.TEAM_MEMBER],
    items: [
      {
        title: t("sidebar.subItems.settings.profile"),
        url: "/settings?tab=profile",
      },
      {
        title: t("sidebar.subItems.settings.billing"),
        url: "/settings?tab=billing",
      },
      {
        title: t("sidebar.subItems.settings.advanced"),
        url: "/settings?tab=advanced",
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
  
  // Get user data from Redux store
  const user = useSelector((state: RootState) => state.auth.user)
  const isAuthLoading = useSelector((state: RootState) => state.auth.isLoading)
  
  // Get translated navigation items
  const navItems = getNavItems(t)
  
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
  
  // Filter navigation items based on user's role
  const filteredNavItems = navItems
    .filter(() => {
      // Commented out for development - show all items without authentication
      return true;
      
      // Always show dashboard as fallback
      // if (item.url === "/dashboard") return true;
      
      // Show all items for admin role
      // if (authStore.user?.role === UserRole.ADMIN) return true;
      
      // Otherwise, check if user has the required role
      // return item.roles.includes(authStore.user?.role as UserRole)
    })
    .map(item => ({
      ...item,
      isActive: pathname === item.url || item.items?.some(subItem => isUrlActive(subItem.url)),
    }))

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
      
      {/* Language and Dark Mode Controls */}
      <div className="grid grid-cols-2 gap-0 border-t border-border-strong group-data-[collapsible=icon]:grid-cols-1 group-data-[collapsible=icon]:gap-0">
        <div className="flex items-center justify-center w-full border-b-0 group-data-[collapsible=icon]:border-b border-border-strong">
          <DarkModeToggle />
        </div>
        <div className="flex items-center justify-center w-full border-l border-border-strong group-data-[collapsible=icon]:border-l-0">
          <LanguageSwitcher />
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
