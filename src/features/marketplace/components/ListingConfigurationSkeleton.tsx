import {
  Card,
  CardContent,
  CardHeader,
} from "../../../shared/components/ui/card";
import { Skeleton } from "../../../shared/components/ui/skeleton";

export function ListingConfigurationSkeleton() {
  return (
    <>
      {/* ResponsiveTabs skeleton - uses CSS media queries to match exact positioning */}
      <div className="space-y-6 bg-transparent max-w-256 -mx-2 -mt-8 md:mx-0 md:mt-0 md:absolute md:top-0 md:left-0 md:right-0">
        {/* Tabs Header skeleton */}
        <div className="w-full h-[68px] md:h-[61px] sticky md:static z-40 md:z-auto top-11 md:top-auto bg-surface md:bg-transparent p-0 md:pt-4 md:pl-4 md:pr-4 pt-4.5 px-4 md:border-b md:border-border-strong">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-0">
            {/* Tabs skeleton - mobile pill style, desktop underline style */}
            <div className="relative flex items-stretch w-full md:w-auto gap-1 md:gap-4 rounded-full md:rounded-none bg-sidebar md:bg-transparent p-1 md:p-0 h-10 md:h-auto">
              {/* Mobile: 3 pill skeletons */}
              <Skeleton className="flex-1 md:hidden h-8 rounded-full" />
              <Skeleton className="flex-1 md:hidden h-8 rounded-full" />
              <Skeleton className="flex-1 md:hidden h-8 rounded-full" />
              {/* Desktop: 3 text skeletons */}
              <Skeleton className="hidden md:block h-5 w-24 my-2" />
              <Skeleton className="hidden md:block h-5 w-24 my-2" />
              <Skeleton className="hidden md:block h-5 w-24 my-2" />
            </div>

            {/* Save button skeleton (rightContent) - positioned absolutely on mobile */}
            <div className="absolute md:static -top-8.5 md:top-auto right-4 md:right-auto w-1/2 sm:w-auto flex justify-end items-center">
              <Skeleton className="rounded-full h-10 md:h-11 w-24 md:w-40" />
            </div>
          </div>
        </div>

        {/* Tab Content skeleton */}
        <div className="outline-none pl-4 pr-4 md:pr-0">
          <div className="space-y-6 animate-pulse">
            {/* Profile/Visibility Card Skeleton */}
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-10 rounded-full" />
                </div>
              </CardContent>
            </Card>

            {/* Form Section Skeleton */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent className="space-y-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-5 w-10 rounded-full" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
