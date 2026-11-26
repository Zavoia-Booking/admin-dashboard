import { useTranslation } from "react-i18next";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { IndustrySelectorSkeleton } from "./IndustrySelector";

function HelperSkeleton({ text }: { text: string }) {
  return (
    <p className="text-sm">
      <span className="box-decoration-clone rounded bg-border text-transparent">{text}</span>
    </p>
  );
}

export default function BusinessInfoSkeleton({ useAccountEmail = true }: { useAccountEmail?: boolean }) {
  const { t } = useTranslation("setupWizard", { keyPrefix: "stepBusinessInfo" });

  return (
    <div className="grid gap-2" aria-hidden="true">
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-full md:h-10" />
        <div className="h-5" />
      </div>

      <div className="grid gap-4">
        <div className="rounded-lg border border-border bg-surface-active p-4 dark:border-border-strong dark:bg-surface">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-32 max-w-full" />
              <div className="mt-1">
                <HelperSkeleton text={t(useAccountEmail ? "useAccountEmailOn" : "useAccountEmailOff")} />
              </div>
            </div>
            <Skeleton className="h-11 w-20 shrink-0 rounded-full md:h-8" />
          </div>
          <div className="flex h-8 items-center gap-1.5 pt-3">
            <Skeleton className="size-4 shrink-0" />
            <Skeleton className="h-4 w-44 max-w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <div className="h-5" />
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-4 w-40 max-w-full" />
          <Skeleton className="h-4 w-10 shrink-0" />
        </div>
        <Skeleton className="h-28 w-full sm:h-24" />
        <div className="h-5" />
      </div>

      <div className="space-y-3 pt-4">
        <Skeleton className="h-4 w-24" />
        <HelperSkeleton text={t("industryHelper")} />
        <IndustrySelectorSkeleton />
      </div>

      <div className="space-y-2 pt-4">
        <Skeleton className="h-4 w-28" />
        <HelperSkeleton text={t("currencyHelper")} />
        <div className="space-y-2 pt-2">
          <Skeleton className="h-12 w-full md:h-10" />
          <div className="h-5" />
        </div>
      </div>

      <div className="space-y-2 pt-4">
        <Skeleton className="h-4 w-28" />
        <HelperSkeleton text={t("countryHelper")} />
        <Skeleton className="h-11 w-full" />
      </div>

      <div className="space-y-2 pt-4">
        <Skeleton className="h-4 w-28" />
        <HelperSkeleton text={t("timezoneHelper")} />
        <Skeleton className="h-11 w-full" />
      </div>

      <div className="space-y-2 pt-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
