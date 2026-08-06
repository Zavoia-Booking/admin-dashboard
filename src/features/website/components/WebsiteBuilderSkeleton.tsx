import { useTranslation } from "react-i18next";
import { Skeleton } from "../../../shared/components/ui/skeleton";

/** Workspace placeholder mirroring the builder's real layout: editor panel +
 * preview stage on desktop (≥920px), stacked cards + preview peek on phones.
 * Rendered inside the atelier shell while the draft loads, and by the
 * full-page skeleton below — same geometry, so the loading stages and the
 * loaded workspace read as one. App tokens only — it must also render before
 * the atelier chunk (and its CSS) has loaded. */
export function WebsiteBuilderSkeletonCanvas() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden min-[920px]:grid min-[920px]:grid-cols-[332px_minmax(0,1fr)]">
      <div className="flex min-h-0 flex-col gap-2 overflow-hidden p-3 min-[920px]:gap-2.5 min-[920px]:border-r min-[920px]:border-border min-[920px]:bg-surface min-[920px]:px-3.5 min-[920px]:pb-6 min-[920px]:pt-4">
        <div className="mb-2 flex items-center gap-2.5 min-[920px]:mb-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-2.5 w-20" />
          </div>
          <Skeleton className="size-[30px] rounded-lg" />
        </div>
        <Skeleton className="h-[52px] w-full rounded-[11px]" />
        <Skeleton className="h-[52px] w-full rounded-[11px]" />
        <Skeleton className="h-[52px] w-full rounded-[11px]" />
        <Skeleton className="h-[52px] w-full rounded-[11px]" />
        <Skeleton className="h-[52px] w-full rounded-[11px]" />
        <Skeleton className="hidden h-[52px] w-full rounded-[11px] min-[920px]:block" />
        <Skeleton className="mt-1 aspect-[16/10] w-full rounded-2xl min-[920px]:hidden" />
      </div>
      <div className="hidden min-h-0 flex-col min-[920px]:flex">
        <div className="flex h-[46px] shrink-0 items-center gap-2.5 pl-2.5 pr-[18px]">
          <Skeleton className="h-[26px] w-[30px] rounded-lg" />
          <Skeleton className="h-3 w-24" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-[30px] w-[94px] rounded-[10px]" />
          </div>
        </div>
        <div className="min-h-0 flex-1 px-5 pb-5">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** /website loading state while the atelier chunk loads, rendered inside
 * WebsiteStudioFrame's SidebarInset (the frame owns the sidebar — this must
 * not mount its own, or the rail remounts and flickers). Header rail mirrors
 * the atelier header geometry. */
export function WebsiteBuilderSkeleton() {
  const { t } = useTranslation("website");

  return (
    <div
      role="status"
      aria-label={t("page.status.loading")}
      className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background"
    >
      <div className="flex h-[calc(54px+env(safe-area-inset-top))] shrink-0 items-end border-b border-border px-3 pb-2.5 pt-[env(safe-area-inset-top)] min-[920px]:h-[61px] min-[920px]:items-center min-[920px]:px-4 min-[920px]:pb-0">
        <div className="flex w-full items-center gap-2.5 min-[920px]:hidden">
          <Skeleton className="size-8 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-20" />
          </div>
          <Skeleton className="size-[34px] rounded-[9px]" />
          <Skeleton className="hidden h-8 w-[72px] rounded-[9px] min-[768px]:block" />
        </div>
        <div className="hidden w-full items-center gap-3 min-[920px]:flex">
          <Skeleton className="size-[30px] rounded-[9px]" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-28 rounded-full" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-8 w-[104px] rounded-[9px]" />
            <Skeleton className="h-8 w-[78px] rounded-[9px]" />
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <WebsiteBuilderSkeletonCanvas />
      </div>
    </div>
  );
}
