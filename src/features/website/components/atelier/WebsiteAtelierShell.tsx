import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import "./website-atelier.css";

interface WebsiteAtelierShellProps {
  desktopHeader: ReactNode;
  mobileHeader: ReactNode;
  children: ReactNode;
}

/**
 * Header + body chrome for /website, rendered inside WebsiteStudioFrame's
 * SidebarInset. The frame (eager, in website.tsx) owns the sidebar and the
 * shell classes; this chunk-side half owns the atelier skin and workspace DOM.
 */
export function WebsiteAtelierShell({
  desktopHeader,
  mobileHeader,
  children,
}: WebsiteAtelierShellProps) {
  const { t } = useTranslation("website");

  return (
    <>
      <a href="#website-builder-main" className="website-atelier-skip-link">
        {t("page.actions.skipToBuilder")}
      </a>
      <h1 className="sr-only">{t("page.title")}</h1>
      <div className="website-atelier-main">
        <header className="website-atelier-topbar">{desktopHeader}</header>
        <header className="website-atelier-mobile-header">{mobileHeader}</header>
        <div className="website-atelier-body">{children}</div>
      </div>
    </>
  );
}
