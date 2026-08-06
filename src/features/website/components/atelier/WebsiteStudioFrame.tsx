import type { ReactNode } from "react";
import { AppSidebar } from "../../../../shared/components/navigation/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "../../../../shared/components/ui/sidebar";

/**
 * Eager outer chrome for /website: mounts the app sidebar exactly once, so the
 * Suspense swaps (chunk skeleton → draft skeleton → workspace) reconcile inside
 * SidebarInset instead of remounting the rail — remounting is what made the
 * entry collapse flicker. Layout falls back to Tailwind because the atelier
 * skin (.website-atelier*) only attaches once the lazy chunk's CSS arrives.
 */
export function WebsiteStudioFrame({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      collapseOnMount
      className="website-atelier website-atelier-shell h-dvh overflow-hidden"
    >
      <AppSidebar />
      <SidebarInset
        id="website-builder-main"
        tabIndex={-1}
        className="min-h-0 min-w-0 overflow-hidden"
      >
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
