/**
 * Route chunk warming.
 *
 * Every route in App.tsx is `React.lazy`, and they all share one Suspense
 * boundary whose fallback is a full-screen spinner. So the first navigation to
 * a flow in a session tears down the whole shell — sidebar, header, bottom nav
 * — shows a centred spinner while the chunk downloads, then rebuilds it. That
 * teardown is what reads as a flicker, and it is worst on the heaviest chunks
 * (the website builder).
 *
 * Warming a chunk before the user navigates means the lazy component is already
 * resolved, so the navigation never suspends and the fallback never renders.
 * `import()` is memoized by the bundler runtime, so calling these repeatedly is
 * free and they resolve to the exact same chunks the `lazy()` calls use — keep
 * the specifiers identical to the ones in App.tsx.
 */
const ROUTE_PRELOADERS: Record<string, () => Promise<unknown>> = {
  "/dashboard": () => import("../../features/dashboard/pages/Dashboard"),
  "/calendar": () => import("../../features/calendar/pages/calendar"),
  "/assignments": () => import("../../features/assignments/pages/assignments"),
  "/marketplace": () => import("../../features/marketplace/pages/marketplace"),
  // The /website route module is a thin wrapper that lazy-loads the real
  // builder; warm both, or the first visit still suspends into a loader.
  "/website": () =>
    Promise.all([
      import("../../features/website/pages/website"),
      import("../../features/website/pages/website-atelier"),
    ]),
  // Heaviest chunk (settings + billing in one); warm it before the long tail.
  "/account": () => import("../../features/settings/pages/settings"),
  "/locations": () => import("../../features/locations/pages/locations"),
  "/services": () => import("../../features/services/pages/services"),
  "/team-members": () => import("../../features/teamMembers/pages/team-members"),
  "/customers": () => import("../../features/customers/pages/customers"),
  "/notifications": () =>
    import("../../features/notifications/pages/notifications"),
  "/support": () => import("../../features/support/pages/support"),
  "/my-assignments": () =>
    import("../../features/team-member-pages/myAssignments/pages/my-assignments"),
  "/my-profile": () =>
    import("../../features/team-member-pages/myProfile/pages/my-profile"),
  "/my-account": () =>
    import("../../features/team-member-pages/myAccount/pages/my-account"),
};

/**
 * Warm the chunk behind a nav target, matching on the first path segment so
 * `/dashboard/12` warms the same chunk as `/dashboard`. Safe to call on every
 * hover/press: unknown targets are ignored and repeats are no-ops.
 */
export function preloadRoute(url: string) {
  const segment = url.split("?")[0].split("/")[1] ?? "";
  void ROUTE_PRELOADERS[`/${segment}`]?.().catch(() => undefined);
}

/**
 * Warm every main flow, one at a time. Sequential on purpose: a parallel burst
 * would compete for bandwidth with whatever the landing page is still fetching,
 * which is the opposite of the point.
 */
export async function warmMainRoutes() {
  for (const load of Object.values(ROUTE_PRELOADERS)) {
    try {
      await load();
    } catch {
      // Offline, or a stale chunk after a deploy. Navigation still works: it
      // falls back to loading on demand, and the router surfaces chunk 404s.
    }
  }
}
