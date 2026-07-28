import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../app/providers/store";
import { selectBusinessAction, dismissBusinessSelectorModal } from "../actions";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../../shared/lib/utils";
import {
  modalScrim,
  modalPanel,
  modalEyebrow,
  modalTitleCompact,
  modalBody,
} from "../../../shared/components/ui/modal-tokens";
import { ChevronRight, X } from "lucide-react";
import { Spinner } from "../../../shared/components/ui/spinner";
import { useTranslation } from "react-i18next";
import { requestGuardedUnsavedAction } from "../../../shared/hooks/useUnsavedChangesBlocker";
import { getAvatarBgColor } from "../../setupWizard/components/StepTeam";

const initialsFor = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "?";

export default function BusinessSelectorModal() {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const dispatch = useDispatch();
  const businessSelection = useSelector((s: RootState) => s.auth.businessSelectionRequired);
  const isLoading = useSelector((s: RootState) => s.auth.isLoading);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);

  const handleSelectBusiness = (businessId: number) => {
    if (!businessSelection?.selectionToken) return;

    requestGuardedUnsavedAction(() => {
      setSelectedBusinessId(businessId);
      dispatch(
        selectBusinessAction.request({
          selectionToken: businessSelection.selectionToken,
          businessId,
        })
      );
    });
  };

  const handleClose = () => {
    dispatch(dismissBusinessSelectorModal());
  };

  const isOpen = !!businessSelection;

  if (!businessSelection) return null;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => { if (!open && !isLoading) handleClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={modalScrim} />
        <DialogPrimitive.Content className={cn(modalPanel, "text-left")}>
          <div className={cn(modalEyebrow, "pr-8")}>{t('businessSelector.eyebrow')}</div>
          <DialogPrimitive.Title className={cn(modalTitleCompact, "pr-8")}>
            {t('businessSelector.title')}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description asChild>
            <p className={cn(modalBody, "mt-3")}>{t('businessSelector.description')}</p>
          </DialogPrimitive.Description>

          <div className="mt-6 space-y-2">
            {businessSelection.businesses.map((business) => {
              const isThisBusinessLoading = isLoading && selectedBusinessId === business.id;
              return (
                <button
                  key={business.id}
                  type="button"
                  onClick={() => handleSelectBusiness(business.id)}
                  disabled={isLoading}
                  className={cn(
                    "group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border-strong px-3.5 py-3 text-left transition-all duration-150",
                    "hover:bg-neutral-100 active:scale-[0.99] dark:hover:bg-surface-hover",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30",
                    "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
                  )}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-900/5 text-[13px] font-semibold text-neutral-800"
                    style={{ backgroundColor: getAvatarBgColor(business.name) }}
                  >
                    {initialsFor(business.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold text-neutral-900 dark:text-foreground-1">
                      {business.name}
                    </div>
                    <div className="truncate text-[13px] text-neutral-500 dark:text-foreground-3">
                      {t(`businessSelector.roles.${business.role}`, { defaultValue: business.role.replace(/_/g, ' ') })}
                    </div>
                  </div>
                  {isThisBusinessLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400 transition-transform duration-150 group-hover:translate-x-0.5 dark:text-foreground-3" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Rendered last so the first business row is focused first, not the close button; kept top-right via absolute. */}
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            aria-label={tc('aria.close')}
            className={cn(
              "absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg",
              "text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800",
              "dark:text-foreground-3 dark:hover:bg-surface-hover dark:hover:text-foreground-1",
              "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
