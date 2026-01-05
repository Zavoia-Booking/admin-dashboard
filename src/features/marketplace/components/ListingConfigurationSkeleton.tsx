import { Card, CardContent, CardHeader } from "../../../shared/components/ui/card";
import { Skeleton } from "../../../shared/components/ui/skeleton";

export function ListingConfigurationSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Tabs Skeleton */}
      <div className="flex border-b border-border mb-6 overflow-x-auto no-scrollbar">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="px-4 py-3 border-b-2 border-transparent">
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>

      <div className="space-y-6">
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
  );
}

