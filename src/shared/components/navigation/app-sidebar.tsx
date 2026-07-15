import * as React from "react"
import { LogOut } from "lucide-react"
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
import { usePermissions } from "../../hooks/usePermissions"
import { NotificationBell } from "../common/NotificationBell"
import { useAppNavigation } from "./navigation-model"
import { requestGuardedUnsavedAction } from "../../hooks/useUnsavedChangesBlocker"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation('navigation')
  const { state } = useSidebar()
  const dispatch = useDispatch()
  const { user } = usePermissions()
  const { desktopItems } = useAppNavigation()

  // Get user data from Redux store
  const isAuthLoading = useSelector((state: RootState) => state.auth.isLoading)

  const isCollapsed = state === 'collapsed'

  const handleLogout = () => {
    requestGuardedUnsavedAction(() => dispatch(logoutRequestAction.request()))
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
        <NavMain items={desktopItems} />
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
