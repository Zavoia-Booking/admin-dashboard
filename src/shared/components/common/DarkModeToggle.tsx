import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "../ui/button"

export function DarkModeToggle() {
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

  return (
    <Button
      variant="ghost"
      onClick={() => toggleDarkMode(!isDark)}
      className="w-full h-full justify-center px-3 py-2 rounded-none hover:bg-sidebar-accent cursor-pointer group-data-[collapsible=icon]:px-0"
    >
      <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
        {isDark ? (
          <Moon className="h-4 w-4 text-sidebar-foreground" />
        ) : (
          <Sun className="h-4 w-4 text-sidebar-foreground" />
        )}
        <span className="text-sm font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden">
          {isDark ? t('theme.dark') : t('theme.light')}
        </span>
      </div>
    </Button>
  )
}

