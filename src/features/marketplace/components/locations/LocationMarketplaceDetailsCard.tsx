import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import type { LocationWithAssignments } from "../../types";
import { setLocationMarketplaceTagsAction } from "../../actions";
import { useLocationTagDictionaries } from "../../hooks/useLocationTagDictionaries";
import { EditLocationMarketplaceDetailsSlider } from "../EditLocationMarketplaceDetailsSlider";
import { Button } from "../../../../shared/components/ui/button";
import { Skeleton } from "../../../../shared/components/ui/skeleton";
import { cn } from "../../../../shared/lib/utils";

interface LocationMarketplaceDetailsCardProps {
  location: LocationWithAssignments;
}

const TAG_GROUPS = [
  { ids: "amenityTagIds", dict: "amenities" },
  { ids: "paymentMethodTagIds", dict: "paymentMethods" },
  { ids: "languageTagIds", dict: "languages" },
] as const;

/**
 * Amenities, payment methods and languages for one location: a summary of what
 * is saved and one button that opens the details slider.
 */
export function LocationMarketplaceDetailsCard({
  location,
}: LocationMarketplaceDetailsCardProps) {
  const dispatch = useDispatch();
  const { t } = useTranslation("marketplace");
  const { t: tDetails } = useTranslation("locationMarketplaceDetails");
  const { dictionaries, isLoading } = useLocationTagDictionaries();
  const [isEditing, setIsEditing] = useState(false);
  const titleId = `marketplace-details-title-${location.id}`;

  const groups = TAG_GROUPS.map((group) => {
    const ids = location[group.ids] ?? [];
    const selected = new Set(ids);
    const labels = (dictionaries?.[group.dict] ?? [])
      .filter((option) => selected.has(option.id))
      .map((option) => option.label);
    return { key: group.dict, ids, labels };
  });
  const hasAny = groups.some((group) => group.ids.length > 0);

  return (
    <>
      <section
        className="rounded-2xl border border-border bg-surface px-4 py-4 shadow-sm md:px-5 md:py-5"
        aria-labelledby={titleId}
      >
        {/* Below lg the button goes under the summary; from lg it sits top right. */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-6">
          <div className="min-w-0">
            <h3
              id={titleId}
              className="text-lg font-semibold tracking-tight text-foreground-1"
            >
              {t("locations.workspace.marketplaceDetails")}
            </h3>
            {!hasAny && (
              <p className="mt-1.5 text-pretty text-sm leading-6 text-foreground-3 dark:text-foreground-2">
                {t("locations.workspace.marketplaceDetailsEmpty")}
              </p>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className={cn(
              "group h-11 w-full justify-between gap-3 rounded-xl border border-border px-4 text-sm font-semibold text-foreground-1 hover:border-border-strong hover:text-primary max-lg:order-last sm:w-auto sm:justify-self-start lg:justify-self-end",
              !hasAny && "text-primary",
            )}
          >
            {hasAny
              ? t("locations.workspace.editDetails")
              : t("locations.workspace.addDetails")}
            <ChevronRight
              className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </Button>

          {hasAny && (
            <dl className="space-y-3 border-t border-border-subtle pt-4 lg:col-span-2">
              {groups.map((group) => (
                <div
                  key={group.key}
                  className="sm:grid sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-x-6"
                >
                  <dt className="text-sm font-medium leading-6 text-foreground-3 dark:text-foreground-2">
                    {tDetails(`sections.${group.key}.title`)}
                  </dt>
                  <dd className="text-pretty text-sm leading-6 text-foreground-1">
                    {group.ids.length === 0 ? (
                      <span className="text-foreground-3 dark:text-foreground-2">
                        {t("locations.workspace.noneAdded")}
                      </span>
                    ) : group.labels.length > 0 ? (
                      group.labels.join(", ")
                    ) : isLoading ? (
                      <Skeleton className="mt-1 h-4 w-40 max-w-full" />
                    ) : (
                      tDetails("slider.selectedCount", { count: group.ids.length })
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <EditLocationMarketplaceDetailsSlider
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        location={{ id: location.id, name: location.name }}
        onSaved={(tags) =>
          dispatch(
            setLocationMarketplaceTagsAction({ locationId: location.id, ...tags }),
          )
        }
      />
    </>
  );
}

export default LocationMarketplaceDetailsCard;
