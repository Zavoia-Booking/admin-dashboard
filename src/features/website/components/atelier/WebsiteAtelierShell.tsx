import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "../../../../shared/components/navigation/app-sidebar";
import { MobileBottomNav } from "../../../../shared/components/navigation/mobile-bottom-nav";
import {
  SidebarInset,
  SidebarProvider,
} from "../../../../shared/components/ui/sidebar";
import { useIsMobile } from "../../../../shared/hooks/use-mobile";
import "./website-atelier.css";

interface WebsiteAtelierShellProps {
  desktopHeader: ReactNode;
  mobileHeader: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Full-height shell used only by /website. Navigation is the same shared dashboard
 * navigation rendered everywhere else; only the page workspace is Atelier-specific.
 */
export function WebsiteAtelierShell({
  desktopHeader,
  mobileHeader,
  children,
  className,
}: WebsiteAtelierShellProps) {
  const { t } = useTranslation("website");
  // Navigation follows the shared dashboard breakpoint. The builder itself retains its wider
  // 920px compact presentation, but it must never invent a route-specific navigation mode.
  const isMobile = useIsMobile();

  return (
    <SidebarProvider
      collapseOnMount
      className={`website-atelier website-atelier-shell${className ? ` ${className}` : ""}`}
    >
      <AppSidebar />
      <SidebarInset
        id="website-builder-main"
        tabIndex={-1}
        className="min-h-0 min-w-0 overflow-hidden"
      >
        <a href="#website-builder-main" className="website-atelier-skip-link">
          {t("page.actions.skipToBuilder")}
        </a>
        <h1 className="sr-only">{t("page.title")}</h1>
        <div className="website-atelier-main">
          <header className="website-atelier-topbar">{desktopHeader}</header>
          <header className="website-atelier-mobile-header">{mobileHeader}</header>
          <div className="website-atelier-body">{children}</div>
        </div>
        {isMobile ? <MobileBottomNav /> : null}
      </SidebarInset>
    </SidebarProvider>
  );
}
