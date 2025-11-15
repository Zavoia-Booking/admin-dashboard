import * as React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible"
import { Link } from "react-router-dom"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "../ui/sidebar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    showSeparatorBefore?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const [openPopovers, setOpenPopovers] = React.useState<Record<string, boolean>>({})

  const handlePopoverChange = (itemTitle: string, open: boolean) => {
    setOpenPopovers(prev => ({ ...prev, [itemTitle]: open }))
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const popoverOpen = openPopovers[item.title] ?? false
          
          return (
            <React.Fragment key={item.title}>
              {item.showSeparatorBefore && <SidebarSeparator className="my-2" />}
              {item.items && item.items.length > 0 ? (
                isCollapsed ? (
                  // Show popover when collapsed
                  <Popover open={popoverOpen} onOpenChange={(open) => handlePopoverChange(item.title, open)}>
                    <SidebarMenuItem>
                      <PopoverTrigger asChild>
                        <SidebarMenuButton 
                          tooltip={item.title}
                          isActive={item.isActive}
                          className="transition-all duration-200 sidebar-menu-button-compact cursor-pointer"
                        >
                          {item.icon && <item.icon className="h-4 w-4" />}
                          <span className="font-medium group-data-[collapsible=icon]:hidden">{item.title}</span>
                        </SidebarMenuButton>
                      </PopoverTrigger>
                      <PopoverContent 
                        side="bottom" 
                        align="start"
                        className="!w-50 md:!w-50 p-0 bg-sidebar border-sidebar-border"
                        sideOffset={4}
                      >
                        <div className="py-2">
                          <div className="mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 px-2.5 relative">
                            {/* Vertical line that doesn't extend to edges */}
                            <div className="absolute left-0 top-1 bottom-1 w-px bg-sidebar-border" />
                            {item.items.map((subItem) => (
                              <Link
                                key={subItem.title}
                                to={subItem.url}
                                onClick={() => handlePopoverChange(item.title, false)}
                                className="text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground text-sm relative z-10"
                              >
                                <span>{subItem.title}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </SidebarMenuItem>
                  </Popover>
                ) : (
                // Show collapsible when expanded
                <Collapsible
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton 
                        tooltip={item.title}
                        isActive={item.isActive}
                        className="transition-all duration-200 px-3 py-3.5 sidebar-menu-button-compact cursor-pointer"
                      >
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span className="font-medium group-data-[collapsible=icon]:hidden">{item.title}</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <Link to={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
                )
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title}
                    isActive={item.isActive}
                    className="transition-all duration-200"
                  >
                    <Link to={item.url}>
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span className="font-medium group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </React.Fragment>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
