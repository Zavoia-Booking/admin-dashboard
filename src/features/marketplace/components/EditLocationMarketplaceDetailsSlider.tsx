import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { BaseSlider } from "../../../shared/components/common/BaseSlider";
import { FormFooter } from "../../../shared/components/forms/FormFooter";
import { EditLocationMarketplaceDetailsSliderSkeleton } from "./EditLocationMarketplaceDetailsSliderSkeleton";
import { ChipMultiSelect } from "../../../shared/components/forms/fields/ChipMultiSelect";
import { cn } from "../../../shared/lib/utils";
import { useLocationTagDictionaries } from "../hooks/useLocationTagDictionaries";
import type { ChipOption } from "../hooks/useLocationTagDictionaries";
import { useLocationMarketplaceTags } from "../hooks/useLocationMarketplaceTags";
import type { LocationMarketplaceTags } from "../api";

interface EditLocationMarketplaceDetailsSliderProps {
  isOpen: boolean;
  onClose: () => void;
  location: { id: number; name: string } | null;
}

const arraysShallowEqual = (a: number[], b: number[]) => {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
};

const isDraftDirty = (
  saved: LocationMarketplaceTags,
  draft: LocationMarketplaceTags,
): boolean => {
  return (
    !arraysShallowEqual(saved.amenityTagIds, draft.amenityTagIds) ||
    !arraysShallowEqual(
      saved.paymentMethodTagIds,
      draft.paymentMethodTagIds,
    ) ||
    !arraysShallowEqual(saved.languageTagIds, draft.languageTagIds)
  );
};

// Frontend display order overriding the DB seed order. Ordered by likelihood
// of selection across Zavoia's verticals (beauty, fitness, wellness,
// healthcare, home, restaurants, tutoring) and the Romania-first market.
// Slugs absent from a list fall to the end in DB order — robust to future
// dictionary additions without code changes.
const CHIP_PRIORITY: Record<string, string[]> = {
  amenities: [
    "wifi",
    "air-conditioning",
    "parking-onsite",
    "parking-street",
    "kid-friendly",
    "pet-friendly",
    "outdoor-seating",
    "private-treatment-room",
    "bike-parking",
    "showers",
    "lockers",
  ],
  paymentMethods: [
    "card",
    "cash",
    "apple-pay",
    "google-pay",
    "bank-transfer",
    "corporate-invoice",
  ],
  // Languages: common 6 are pinned via COMMON_LANGUAGE_SLUGS; this list orders
  // the long-tail extras prioritizing relevance to a RO-based business
  // (regional neighbors, large diaspora languages, then Nordic/Baltic/etc).
  languages: [
    "pt",
    "hu",
    "pl",
    "ru",
    "uk",
    "tr",
    "nl",
    "el",
    "bg",
    "sr",
    "hr",
    "sv",
    "da",
    "no",
    "fi",
    "cs",
    "sk",
    "sl",
    "et",
    "lv",
    "lt",
  ],
};

const sortByChipPriority = <T extends { slug: string }>(
  chips: T[],
  group: keyof typeof CHIP_PRIORITY,
): T[] => {
  const order = CHIP_PRIORITY[group];
  if (!order) return chips;
  const rank = new Map(order.map((slug, i) => [slug, i]));
  return [...chips].sort((a, b) => {
    const ai = rank.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
    const bi = rank.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
};

// Six languages most owners pick first. Pinned at the head of the inline chip
// row so the 90% case (1–3 European languages) is one click. The rest of the
// 27-item dictionary lives behind the "More languages" trigger.
const COMMON_LANGUAGE_SLUGS = ["en", "ro", "de", "fr", "it", "es"];

// Shared chip styling so language chips and the "More" trigger chip read as
// members of the same family as ChipMultiSelect's chips. Keep this in lockstep
// with ChipMultiSelect's button class block — both must share height, radius,
// weight, and easing for visual cohesion.
const chipClass = (variant: "default" | "selected", extra?: string) =>
  cn(
    "relative inline-flex items-center !min-h-0 h-8 px-3.5 rounded-full border text-[13px] cursor-pointer",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-200",
    "ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/50",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    variant === "default" &&
      "border-border bg-surface text-foreground-2 font-medium hover:border-border-strong hover:bg-surface-hover hover:text-foreground-1",
    variant === "selected" &&
      "border-foreground-1/15 bg-foreground-1/[0.04] text-foreground-1 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-foreground-1/25 dark:bg-foreground-1/[0.08] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-foreground-1/[0.06]",
    extra,
  );

// Small floating check badge — mirrors the existing `Pill` selected affordance
// used elsewhere in the dashboard so chips stay visually consistent across
// the app. Animates in/out with a subtle spring on toggle.
const ChipCheckBadge: React.FC<{ visible: boolean }> = ({ visible }) => (
  <span
    aria-hidden="true"
    className={cn(
      "absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 dark:bg-success shadow-sm flex items-center justify-center",
      "transition-[opacity,transform] duration-200",
      "ease-[cubic-bezier(0.34,1.56,0.64,1)]",
      visible ? "opacity-100 scale-100" : "opacity-0 scale-50 pointer-events-none",
    )}
  >
    <svg
      className="h-2.5 w-2.5 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  </span>
);

interface SectionHeaderProps {
  title: string;
  helper?: string;
  selectedCount: number;
  countLabel: (count: number) => string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  helper,
  selectedCount,
  countLabel,
}) => (
  <header className="space-y-1.5">
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="text-lg font-semibold tracking-tight text-foreground-1">
        {title}
      </h3>
      {selectedCount > 0 && (
        <span className="text-xs font-medium text-foreground-3 tabular-nums shrink-0">
          {countLabel(selectedCount)}
        </span>
      )}
    </div>
    {helper && (
      <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
        {helper}
      </p>
    )}
  </header>
);

// Language picker. Pins 6 common languages (en/ro/de/fr/it/es) inline so the
// 90% case (1–3 European languages) is one click. Any selected language that
// falls outside the common set stays visible after the pinned row even when
// collapsed. Clicking the "More languages" toggle expands the remaining 21
// language chips inline — no popover, same chip vocabulary throughout.
interface LanguagePickerProps {
  options: ChipOption[];
  selected: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  moreLabel: string;
  lessLabel: string;
}

const LanguagePicker: React.FC<LanguagePickerProps> = ({
  options,
  selected,
  onChange,
  disabled,
  moreLabel,
  lessLabel,
}) => {
  const [expanded, setExpanded] = useState(false);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  // Common chips render in fixed order; extras come from the long tail of
  // non-common languages. When collapsed, only the selected extras are shown
  // so the owner's choices remain visible.
  const { commonChips, extras } = useMemo(() => {
    const commonSlugSet = new Set(COMMON_LANGUAGE_SLUGS);
    const bySlug = new Map(options.map((o) => [o.slug, o]));
    const common = COMMON_LANGUAGE_SLUGS
      .map((slug) => bySlug.get(slug))
      .filter((o): o is ChipOption => Boolean(o));
    const ex = options.filter((o) => !commonSlugSet.has(o.slug));
    return { commonChips: common, extras: ex };
  }, [options]);

  // Selected extras stay always visible inline so the owner doesn't lose sight
  // of their picks; unselected extras live in the collapsible block below.
  const selectedExtras = extras.filter((o) => selectedSet.has(o.id));
  const unselectedExtras = extras.filter((o) => !selectedSet.has(o.id));

  const toggle = (id: number) => {
    if (disabled) return;
    if (selectedSet.has(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const renderChip = (opt: ChipOption) => {
    const isSelected = selectedSet.has(opt.id);
    return (
      <button
        key={opt.id}
        type="button"
        onClick={() => toggle(opt.id)}
        disabled={disabled}
        aria-pressed={isSelected}
        className={chipClass(isSelected ? "selected" : "default")}
      >
        {opt.label}
        <ChipCheckBadge visible={isSelected} />
      </button>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {commonChips.map(renderChip)}
        {selectedExtras.map(renderChip)}
      </div>

      {/* Collapsible row of the remaining (unselected) languages. The
          grid-template-rows trick animates height from 0 to auto smoothly
          without measuring DOM — pure CSS, interruptible. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300",
          "ease-[cubic-bezier(0.32,0.72,0,1)]",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
        aria-hidden={!expanded}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap gap-3 pt-3">
            {unselectedExtras.map(renderChip)}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        disabled={disabled}
        aria-expanded={expanded}
        className={cn(
          "inline-flex items-center gap-1 mt-3 text-sm font-medium cursor-pointer",
          "text-foreground-3 hover:text-foreground-1",
          "transition-colors duration-150",
          "focus:outline-none focus-visible:underline",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        {expanded ? lessLabel : moreLabel}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            "ease-[cubic-bezier(0.16,1,0.3,1)]",
            expanded && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
    </div>
  );
};

export const EditLocationMarketplaceDetailsSlider: React.FC<
  EditLocationMarketplaceDetailsSliderProps
> = ({ isOpen, onClose, location }) => {
  const { t } = useTranslation("locationMarketplaceDetails");
  const { dictionaries, isLoading: dictsLoading, error: dictsError } =
    useLocationTagDictionaries();
  const {
    tags: savedTags,
    isLoading: tagsLoading,
    isSaving,
    loadError,
    save,
  } = useLocationMarketplaceTags(isOpen ? (location?.id ?? null) : null);

  const [draft, setDraft] = useState<LocationMarketplaceTags>(savedTags);

  useEffect(() => {
    setDraft(savedTags);
  }, [savedTags, isOpen]);

  const isDirty = useMemo(
    () => isDraftDirty(savedTags, draft),
    [savedTags, draft],
  );

  const countLabel = (count: number) =>
    t("slider.selectedCount", { count });

  // One memo that applies the frontend display order to every group. All
  // downstream consumers (chip render, partition memos, language picker) read
  // from this sorted shape so the DB seed order is irrelevant at render time.
  const sortedDictionaries = useMemo(() => {
    if (!dictionaries) return null;
    return {
      amenities: sortByChipPriority(dictionaries.amenities, "amenities"),
      paymentMethods: sortByChipPriority(
        dictionaries.paymentMethods,
        "paymentMethods",
      ),
      languages: sortByChipPriority(dictionaries.languages, "languages"),
    };
  }, [dictionaries]);

  const handleSave = async () => {
    if (!location?.id) return;
    try {
      await save({
        amenityTagIds: draft.amenityTagIds,
        paymentMethodTagIds: draft.paymentMethodTagIds,
        languageTagIds: draft.languageTagIds,
      });
      toast.success(t("slider.savedToast"));
      onClose();
    } catch {
      toast.error(t("slider.saveError"));
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const isLoading = dictsLoading || tagsLoading;
  const hasError = !!loadError || !!dictsError;

  const sectionClass = "space-y-4 py-9 first:pt-0 last:pb-0";

  return (
    <>
      <BaseSlider
        isOpen={isOpen}
        onClose={handleCancel}
        title={t("slider.title")}
        subtitle={t("slider.subtitle")}
        contentClassName="bg-surface scrollbar-hide"
        footer={
          <FormFooter
            onCancel={handleCancel}
            onSubmit={handleSave}
            cancelLabel={t("slider.cancel")}
            submitLabel={t("slider.save")}
            disabled={!isDirty || isLoading || hasError}
            isLoading={isSaving}
          />
        }
      >
        <div className="h-full flex flex-col cursor-default">
          <div className="flex-1 overflow-y-auto p-1 py-6 pt-0 md:p-6 md:pt-0 bg-surface">
            <div className="max-w-2xl mx-auto cursor-default pt-2">
              {hasError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive mb-6">
                  {t("slider.loadError")}
                </div>
              )}

              {isLoading && (
                <EditLocationMarketplaceDetailsSliderSkeleton />
              )}

              {!isLoading && sortedDictionaries && (
                <div className="divide-y divide-border/30">
                  <section className={sectionClass}>
                    <SectionHeader
                      title={t("sections.amenities.title")}
                      helper={t("sections.amenities.helper")}
                      selectedCount={draft.amenityTagIds.length}
                      countLabel={countLabel}
                    />
                    <ChipMultiSelect
                      options={sortedDictionaries.amenities}
                      selected={draft.amenityTagIds}
                      onChange={(ids) =>
                        setDraft((d) => ({ ...d, amenityTagIds: ids }))
                      }
                      disabled={isSaving}
                    />
                  </section>

                  <section className={sectionClass}>
                    <SectionHeader
                      title={t("sections.paymentMethods.title")}
                      helper={t("sections.paymentMethods.helper")}
                      selectedCount={draft.paymentMethodTagIds.length}
                      countLabel={countLabel}
                    />
                    <ChipMultiSelect
                      options={sortedDictionaries.paymentMethods}
                      selected={draft.paymentMethodTagIds}
                      onChange={(ids) =>
                        setDraft((d) => ({ ...d, paymentMethodTagIds: ids }))
                      }
                      disabled={isSaving}
                    />
                  </section>

                  <section className={sectionClass}>
                    <SectionHeader
                      title={t("sections.languages.title")}
                      helper={t("sections.languages.helper")}
                      selectedCount={draft.languageTagIds.length}
                      countLabel={countLabel}
                    />
                    <LanguagePicker
                      options={sortedDictionaries.languages}
                      selected={draft.languageTagIds}
                      onChange={(ids) =>
                        setDraft((d) => ({ ...d, languageTagIds: ids }))
                      }
                      moreLabel={t("sections.languages.moreLabel")}
                      lessLabel={t("sections.languages.lessLabel")}
                      disabled={isSaving}
                    />
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </BaseSlider>
    </>
  );
};

export default EditLocationMarketplaceDetailsSlider;
