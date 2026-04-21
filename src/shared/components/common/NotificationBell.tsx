import { Bell } from "lucide-react"
import { useSelector } from "react-redux"
import { useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { RootState } from "../../../app/providers/store"
import { Button } from "../ui/button"

interface NotificationBellProps {
  variant?: "sidebar" | "header"
}

export function NotificationBell({ variant = "sidebar" }: NotificationBellProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation('notifications')
  const unreadCount = useSelector(
    (state: RootState) => state.auth.user?.unreadNotificationsCount ?? 0
  )

  const isActive = location.pathname === "/notifications"

  const handleClick = () => {
    navigate("/notifications")
  }

  if (variant === "header") {
    return (
      <Button
        variant="ghost"
        size="icon"
        rounded="full"
        onClick={handleClick}
        className="h-8 !w-8"
        aria-label={t("title")}
      >
        <div className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-2.5 -right-2.5 flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className={`w-full h-full justify-center px-3 py-2 rounded-none hover:bg-sidebar-accent cursor-pointer group-data-[collapsible=icon]:px-0 relative ${
        isActive ? "bg-sidebar-accent" : ""
      }`}
      aria-label={t("title")}
    >
      <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 relative">
        <div className="relative">
          <Bell className="h-4 w-4 text-sidebar-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </Button>
  )
}
