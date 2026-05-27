import React from "react";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { cn } from "../../../shared/lib/utils";

/**
 * Loading skeleton for `EditLocationMarketplaceDetailsSlider`.
 *
 * Mirrors the slider's real layout — six sections separated by hairlines,
 * each with a title + helper text + a flex-wrap chip row. The Audience and
 * Values sections render with their sub-group rail treatment (border-l on the
 * left) so the perceived layout is stable when chips actually paint.
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

const SubGroupBlock: React.FC<{ widths: string[] }> = ({ widths }) => (
  <div className="space-y-2 border-l-2 border-foreground-1/10 pl-4">
    <Skeleton className="h-3 w-20" />
    <ChipRow widths={widths} />
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

      {/* Access & inclusivity */}
      <section className={sectionClass}>
        <SectionHeader />
        <div className="space-y-7">
          <SubGroupBlock widths={["w-24", "w-24", "w-24"]} />
          <SubGroupBlock widths={["w-32"]} />
        </div>
      </section>

      {/* Business identity */}
      <section className={sectionClass}>
        <SectionHeader />
        <div className="space-y-7">
          <SubGroupBlock
            widths={["w-32", "w-28", "w-28", "w-36", "w-40"]}
          />
          <SubGroupBlock
            widths={["w-36", "w-28", "w-24", "w-28", "w-32", "w-28"]}
          />
        </div>
      </section>

      {/* Accessibility */}
      <section className={sectionClass}>
        <SectionHeader />
        <ChipRow
          widths={[
            "w-32",
            "w-32",
            "w-32",
            "w-36",
            "w-40",
            "w-36",
            "w-32",
            "w-44",
            "w-40",
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
