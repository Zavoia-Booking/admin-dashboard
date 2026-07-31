import React from "react";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { cn } from "../../../shared/lib/utils";

/**
 * Loading skeleton for `EditLocationMarketplaceDetailsSlider`.
 *
 * Mirrors the slider's real layout — three sections separated by hairlines,
 * each with a title + helper text + a flex-wrap chip row.
 *
 * Chip widths vary on purpose so the skeleton doesn't read as a uniform grid;
 * the rhythm matches the real label-length distribution per section.
 *
 * Pattern follows `LocationsListSkeleton.tsx`.
 */

const sectionClass = "space-y-4 py-9 first:pt-0 last:pb-0";

const ChipRow: React.FC<{ widths: string[] }> = ({ widths }) => (
  <div className="flex flex-wrap gap-3">
    {widths.map((w, i) => (
      <Skeleton key={i} className={cn("h-8 rounded-full", w)} />
    ))}
  </div>
);

const SectionHeader: React.FC = () => (
  <header className="space-y-1.5">
    <Skeleton className="h-6 w-40" />
    <Skeleton className="h-4 w-3/5" />
  </header>
);

export const EditLocationMarketplaceDetailsSliderSkeleton: React.FC = () => {
  return (
    <div className="divide-y divide-border/30">
      {/* Amenities */}
      <section className={sectionClass}>
        <SectionHeader />
        <ChipRow
          widths={[
            "w-24",
            "w-32",
            "w-36",
            "w-32",
            "w-28",
            "w-28",
            "w-24",
            "w-32",
            "w-40",
            "w-20",
            "w-20",
          ]}
        />
      </section>

      {/* Payment methods */}
      <section className={sectionClass}>
        <SectionHeader />
        <ChipRow
          widths={["w-32", "w-16", "w-20", "w-24", "w-28", "w-32"]}
        />
      </section>

      {/* Languages */}
      <section className={sectionClass}>
        <SectionHeader />
        <ChipRow
          widths={["w-20", "w-24", "w-20", "w-20", "w-20", "w-24"]}
        />
        <Skeleton className="h-4 w-32 mt-3" />
      </section>
    </div>
  );
};

export default EditLocationMarketplaceDetailsSliderSkeleton;
