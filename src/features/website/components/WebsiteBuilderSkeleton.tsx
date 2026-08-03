import { useTranslation } from "react-i18next";
import { Skeleton } from "../../../shared/components/ui/skeleton";

/** Editor-column placeholder matching the builder's list layout. Rendered inside
 * the atelier shell while the draft loads, and by the full-page skeleton below —
 * same column, same paddings, so the two loading stages read as one. */
export function WebsiteBuilderSkeletonCanvas() {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-2xl" />
    </div>
  );
}

/** Full-page /website loading state: header rail + editor column. App tokens
 * only — it renders before the atelier chunk (and its CSS) has loaded. */
export function WebsiteBuilderSkeleton() {
  const { t } = useTranslation("website");

  return (
    <div
      role="status"
      aria-label={t("page.status.loading")}
      className="flex h-dvh w-full flex-col overflow-hidden bg-background"
    >
      <div className="flex h-[calc(54px+env(safe-area-inset-top))] shrink-0 items-end border-b border-border px-3 pb-2.5 pt-[env(safe-area-inset-top)] min-[920px]:h-[61px] min-[920px]:items-center min-[920px]:px-4 min-[920px]:pb-0">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="hidden h-8 w-20 rounded-full min-[920px]:block" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-3 min-[920px]:p-5">
        <WebsiteBuilderSkeletonCanvas />
      </div>
    </div>
  );
}
