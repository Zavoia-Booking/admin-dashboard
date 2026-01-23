import { Card, CardContent } from "../../../shared/components/ui/card";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { DashedDivider } from "../../../shared/components/common/DashedDivider";

export function MarketplaceSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-0 space-y-6 cursor-default animate-pulse">
      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Main Hero / Header Card Skeleton */}
        <div className="md:col-span-3 relative bg-surface border border-border rounded-xl p-4 overflow-hidden flex flex-col justify-between gap-8 shadow-sm">
          <div className="flex flex-col gap-6 w-full">
            {/* Header Row: Avatar + Title */}
            <div className="flex flex-row items-center gap-5 text-left">
              <Skeleton className="h-14 w-14 md:h-16 md:w-16 rounded-full shrink-0" />
              <Skeleton className="h-8 md:h-10 w-3/4" />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Skeleton className="h-4 md:h-5 w-full" />
              <Skeleton className="h-4 md:h-5 w-5/6" />
            </div>
          </div>

          {/* Bottom Row: Badges + Button */}
          <div className="w-full">
            <DashedDivider marginTop="mt-0" paddingTop="pb-6" />
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-7 w-32 rounded-full" />
                <Skeleton className="h-7 w-36 rounded-full" />
              </div>
              <Skeleton className="h-8 w-full md:w-52 rounded-full" />
            </div>
          </div>
        </div>

        {/* Catalog Card Skeleton */}
        <Card className="md:col-span-1 bg-surface border-border rounded-xl p-0 shadow-sm">
          <CardContent className="h-full p-4 md:pt-8 flex flex-col gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
            <div className="space-y-6 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Identity Preview Skeleton */}
        <Card className="md:col-span-2 border-border rounded-xl p-0">
          <CardContent className="h-full p-4 flex flex-col justify-start gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-2 mt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>

        {/* Benefit Cards Skeleton */}
        <Card className="md:col-span-1 bg-surface border-border rounded-xl p-0 min-h-[160px]">
          <CardContent className="p-4 space-y-4">
            <Skeleton className="h-4 w-2/3" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 bg-surface border-border rounded-xl p-0 min-h-[160px]">
          <CardContent className="p-4 space-y-4">
            <Skeleton className="h-4 w-2/3" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </CardContent>
        </Card>

        {/* Revenue Card Skeleton */}
        <Card className="md:col-span-4 bg-surface border-border rounded-xl p-0">
          <CardContent className="h-full p-4 py-6 flex flex-col md:flex-row items-start justify-between gap-12">
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 md:h-10 w-3/4" />
              <Skeleton className="h-4 md:h-5 w-full" />
              <Skeleton className="h-4 md:h-5 w-2/3" />
            </div>
            <div className="bg-base p-6 w-full md:w-64 rounded-xl border border-border shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-2/3" />
                <div className="h-px bg-border" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            </div>
            <Skeleton className="h-8 w-full md:hidden rounded-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
