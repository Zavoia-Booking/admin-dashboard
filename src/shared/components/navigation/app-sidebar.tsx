import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Settings2,
  Building2,
  ClipboardList,
  type LucideIcon,
  Calendar,
  UserCircle,
  MapPin,
} from "lucide-react"
import { useLocation } from "react-router-dom"

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { LocationSwitcher } from "../team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "../ui/sidebar"
import { UserRole } from "../../types/auth"

interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  roles: UserRole[]
  items?: {
    title: string
    url: string
  }[]
}

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  location: [
    {
      name: "Acme Inc",
      logo: Building2,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: Users,
      plan: "Startup",
    },
  ],
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: [UserRole.OWNER, UserRole.TEAM_MEMBER],
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
    roles: [UserRole.OWNER, UserRole.TEAM_MEMBER],
  },
  {
    title: "Assignments",
    url: "/assignments",
    icon: ClipboardList,
    roles: [UserRole.OWNER, UserRole.TEAM_MEMBER],
  },
  {
    title: "Team Members",
    url: "/team-members",
    icon: ClipboardList,
    roles: [UserRole.OWNER, UserRole.TEAM_MEMBER],
  },
  {
    title: "Services",
    url: "/services",
    icon: ClipboardList,
    roles: [UserRole.OWNER, UserRole.TEAM_MEMBER],
  },
  {
    title: "Locations",
    url: "/locations",
    icon: MapPin,
    roles: [UserRole.OWNER, UserRole.TEAM_MEMBER],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings2,
    roles: [UserRole.OWNER, UserRole.TEAM_MEMBER],
    items: [
      {
        title: "General",
        url: "/settings/general",
      },
      {
        title: "Profile",
        url: "/settings/profile",
      },
    ],
  },
  {
    title: "Personal Profile",
    url: "/profile",
    icon: UserCircle,
    roles: [UserRole.TEAM_MEMBER],
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const pathname = location.pathname
  
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
      isActive: pathname === item.url || item.items?.some(subItem => pathname === subItem.url),
    }))

  // Commented out for development - don't show loading state
  // if (authStore.isLoading && !authStore.user) {
  //   return (
  //     <div className="h-screen w-64 bg-background border-r flex flex-col items-center justify-center">
  //       <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
  //       <div className="text-sm text-muted-foreground">Loading sidebar...</div>
  //     </div>
  //   );
  // }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <LocationSwitcher location={data.location} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
