import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Settings2,
  Building2,
  ClipboardList,
  type LucideIcon,
  Calendar,
} from "lucide-react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { LocationSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { UserRole, Permission } from "@/types/auth"
import { useClientContext } from "@/contexts/clientContext"

interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  roles: UserRole[]
  permissions?: Permission[]
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
    roles: ['admin', 'business_owner', 'business_manager', 'specialist'],
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
    roles: ['admin', 'business_owner', 'business_manager', 'specialist'],
  },
  {
    title: "Specialists",
    url: "/specialists",
    icon: Users,
    roles: ['admin', 'business_owner', 'business_manager'],
  },
  {
    title: "Services",
    url: "/services",
    icon: ClipboardList,
    roles: ['admin', 'specialist'],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings2,
    roles: ['admin', 'business_owner'],
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
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: { user } } = useClientContext()
  const pathname = usePathname()

  // Filter navigation items based on user's role
  const filteredNavItems = navItems
    .filter(item => {
      // Check if user has the required role
      if (!user) return false
      return item.roles.includes(user.role as UserRole)
    })
    .map(item => ({
      ...item,
      isActive: pathname === item.url || item.items?.some(subItem => pathname === subItem.url),
    }))

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
