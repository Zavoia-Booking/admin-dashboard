import { type FC, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "../../../../shared/components/ui/drawer";
import { Button } from "../../../../shared/components/ui/button";
import { SearchInput } from "../../../../shared/components/common/SearchInput";
import { highlightMatches } from "../../../../shared/utils/highlight";
import { cn } from "../../../../shared/lib/utils";

type LineOption = { kind: "service" | "bundle"; id: number; label: string };

function matchesSearch(opt: LineOption, qRaw: string): boolean {
  const q = qRaw.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  const kindWord = opt.kind === "service" ? "service" : "bundle";
  return (
    opt.label.toLowerCase().includes(q) ||
    kindWord.includes(q) ||
    (digits.length > 0 && String(opt.id).includes(digits))
  );
}

export interface MobileServiceBundlePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOptions: { id: number; label: string }[];
  bundleOptions: { id: number; label: string }[];
  serviceIds: number[];
  bundleIds: number[];
  onApply: (next: {
    serviceIds: number[] | undefined;
    bundleIds: number[] | undefined;
  }) => void;
}

/**
 * Full-screen mobile picker for the calendar service/bundle filter. Replaces
 * the desktop absolute-positioned dropdown which breaks inside a drawer.
 * Same selection semantics as desktop: toggling items applies immediately;
 * the footer button just closes the sheet.
 */
export const MobileServiceBundlePicker: FC<MobileServiceBundlePickerProps> = ({
  open,
  onOpenChange,
  serviceOptions,
  bundleOptions,
  serviceIds,
  bundleIds,
  onApply,
}) => {
  const { t } = useTranslation("calendar");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const filteredServices = useMemo(
    () =>
      serviceOptions
        .map((o) => ({ kind: "service" as const, id: o.id, label: o.label }))
        .filter((o) => matchesSearch(o, search)),
    [serviceOptions, search],
  );
  const filteredBundles = useMemo(
    () =>
      bundleOptions
        .map((o) => ({ kind: "bundle" as const, id: o.id, label: o.label }))
        .filter((o) => matchesSearch(o, search)),
    [bundleOptions, search],
  );
  const nothingMatches =
    search.trim() !== "" && filteredServices.length === 0 && filteredBundles.length === 0;

  const hasSelection = serviceIds.length > 0 || bundleIds.length > 0;

  const toggle = (opt: LineOption) => {
    if (opt.kind === "service") {
      const set = new Set(serviceIds);
      if (set.has(opt.id)) set.delete(opt.id);
      else set.add(opt.id);
      const next = [...set].sort((a, b) => a - b);
      onApply({
        serviceIds: next.length ? next : undefined,
        bundleIds: bundleIds.length ? bundleIds : undefined,
      });
    } else {
      const set = new Set(bundleIds);
      if (set.has(opt.id)) set.delete(opt.id);
      else set.add(opt.id);
      const next = [...set].sort((a, b) => a - b);
      onApply({
        serviceIds: serviceIds.length ? serviceIds : undefined,
        bundleIds: next.length ? next : undefined,
      });
    }
  };

  const isSelected = (opt: LineOption) =>
    opt.kind === "service" ? serviceIds.includes(opt.id) : bundleIds.includes(opt.id);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh] flex flex-col">
        <DrawerHeader className="shrink-0 pb-2">
          <DrawerTitle>{t("page.filters.filterByServiceLabel")}</DrawerTitle>
          <DrawerDescription className="sr-only">
            {t("page.filters.searchServicesPlaceholder")}
          </DrawerDescription>
          <div className="pt-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t("page.filters.searchServicesPlaceholder")}
              aria-label={t("page.filters.filterByServiceLabel")}
              className="w-full"
            />
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-auto px-4 pb-2">
          {/* Any service or bundle */}
          <button
            type="button"
            onClick={() => onApply({ serviceIds: undefined, bundleIds: undefined })}
            className={cn(
              "w-full flex items-center gap-2 p-3 rounded-lg text-left",
              !hasSelection && "bg-muted/50",
              "active:bg-muted/70 transition-colors",
            )}
          >
            <SelectedCheck visible={!hasSelection} />
            <span className="min-w-0 flex-1 text-sm font-medium text-foreground-1">
              {t("page.filters.anyServiceOrBundle")}
            </span>
          </button>

          {filteredServices.length > 0 && (
            <div className="mt-3">
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("page.filters.servicesGroup")}
              </div>
              {filteredServices.map((opt) => (
                <button
                  key={`svc-${opt.id}`}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={cn(
                    "w-full flex items-center gap-2 p-3 rounded-lg text-left",
                    isSelected(opt) && "bg-muted/50",
                    "active:bg-muted/70 transition-colors",
                  )}
                >
                  <SelectedCheck visible={isSelected(opt)} />
                  <span className="min-w-0 flex-1 text-sm font-medium text-foreground-1 truncate">
                    {highlightMatches(opt.label, search.trim())}
                  </span>
                </button>
              ))}
            </div>
          )}

          {filteredBundles.length > 0 && (
            <div className="mt-3">
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("page.filters.bundlesGroup")}
              </div>
              {filteredBundles.map((opt) => (
                <button
                  key={`bnd-${opt.id}`}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={cn(
                    "w-full flex items-center gap-2 p-3 rounded-lg text-left",
                    isSelected(opt) && "bg-muted/50",
                    "active:bg-muted/70 transition-colors",
                  )}
                >
                  <SelectedCheck visible={isSelected(opt)} />
                  <span className="min-w-0 flex-1 text-sm font-medium text-foreground-1 truncate">
                    {highlightMatches(opt.label, search.trim())}
                  </span>
                </button>
              ))}
            </div>
          )}

          {nothingMatches && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("page.filters.noMatchingServiceOrBundle")}
            </div>
          )}
        </div>

        <DrawerFooter className="shrink-0">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            {t("page.common.done", { defaultValue: "Done" })}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

function SelectedCheck({ visible }: { visible: boolean }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
      {visible ? (
        <Check
          className="h-4 w-4 text-green-600 dark:text-green-400"
          strokeWidth={2.75}
          aria-hidden
        />
      ) : null}
    </span>
  );
}
