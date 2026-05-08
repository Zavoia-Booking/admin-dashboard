import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "../ui/button"

type DarkModeToggleVariant = "sidebar" | "floating" | "embedded"

interface DarkModeToggleProps {
  /**
   * Visual variant.
   * - "sidebar" (default): full-width row, used inside the app sidebar.
   * - "floating": standalone compact pill (border + backdrop blur) matching
   *   LanguageSwitcher's floating variant.
   * - "embedded": bare icon trigger (no border / bg / shadow) for use inside
   *   a parent container that provides the chrome.
   */
  variant?: DarkModeToggleVariant
}

export function DarkModeToggle({ variant = "sidebar" }: DarkModeToggleProps = {}) {
  const [isDark, setIsDark] = React.useState(false)
  const { t } = useTranslation('navigation')

  // Check system preference on mount
  React.useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [])

  const toggleDarkMode = (checked: boolean) => {
    setIsDark(checked)
    if (checked) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const isSidebar = variant === "sidebar"
  const isCompact = variant === "floating" || variant === "embedded"

  const triggerClassName =
    variant === "floating"
      ? "h-9 w-9 p-0 rounded-md border border-border/60 bg-background/70 backdrop-blur-sm shadow-sm hover:bg-accent hover:border-border cursor-pointer"
      : variant === "embedded"
      ? "h-full w-9 p-0 rounded-none border-0 bg-transparent shadow-none hover:bg-accent cursor-pointer"
      : "w-full h-full justify-center px-3 py-2 rounded-none hover:bg-sidebar-accent cursor-pointer group-data-[collapsible=icon]:px-0"

  const iconClassName = isSidebar ? "h-4 w-4 text-sidebar-foreground" : "h-4 w-4"

  return (
    <Button
      variant="ghost"
      onClick={() => toggleDarkMode(!isDark)}
      aria-label={isDark ? t('theme.light') : t('theme.dark')}
      className={triggerClassName}
    >
      {isCompact ? (
        isDark ? <Sun className={iconClassName} /> : <Moon className={iconClassName} />
      ) : (
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
          {isDark ? (
            <Moon className={iconClassName} />
          ) : (
            <Sun className={iconClassName} />
          )}
          <span className="text-sm font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            {isDark ? t('theme.dark') : t('theme.light')}
          </span>
        </div>
      )}
    </Button>
  )
}

