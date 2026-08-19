import { useEffect, useRef, type MutableRefObject, type ReactNode } from "react";
import { EllipsisVertical, LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "../../../../shared/components/ui/drawer";

export interface MobileMoreItem {
  key: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  /** Shown under the label while disabled, so the row explains itself instead of just greying out. */
  disabledReason?: string | null;
  /** Always-visible caption under the label (unlike disabledReason). Gives a row more visual
   * weight than a same-tone neighbor without needing a different color. */
  hint?: string | null;
  tone?: "default" | "danger";
}

interface WebsiteMobileMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MobileMoreItem[];
  /** Spinner on the trigger while a menu-initiated request (e.g. unpublish) is in flight. */
  busy?: boolean;
}

/** Runs the chosen action once the sheet content has unmounted, i.e. after its exit animation. */
function RunAfterClose({ pendingRef }: { pendingRef: MutableRefObject<(() => void) | null> }) {
  useEffect(
    () => () => {
      const action = pendingRef.current;
      pendingRef.current = null;
      action?.();
    },
    [pendingRef],
  );
  return null;
}

/**
 * Phone counterpart of the header's "more" dropdown: same actions as a bottom sheet
 * (house pattern for compact menus, and out of the way of top-anchored toasts).
 * The chosen action runs after the sheet has closed so an action that opens its own
 * overlay doesn't stack on a sheet mid-exit.
 */
export function WebsiteMobileMoreSheet({
  open,
  onOpenChange,
  items,
  busy = false,
}: WebsiteMobileMoreSheetProps) {
  const { t } = useTranslation("website");
  const pendingRef = useRef<(() => void) | null>(null);
  const primary = items.filter((item) => item.tone !== "danger");
  const danger = items.filter((item) => item.tone === "danger");

  const select = (item: MobileMoreItem) => {
    if (item.disabled) return;
    pendingRef.current = item.onSelect;
    onOpenChange(false);
  };

  const renderRow = (item: MobileMoreItem) => (
    <button
      key={item.key}
      type="button"
      className="website-atelier-focus atelier-more-sheet__row"
      data-tone={item.tone ?? "default"}
      disabled={item.disabled}
      onClick={() => select(item)}
    >
      <span className="atelier-more-sheet__icon" aria-hidden>
        {item.icon}
      </span>
      <span className="atelier-more-sheet__text">
        <span className="atelier-more-sheet__label">{item.label}</span>
        {item.disabled && item.disabledReason ? (
          <span className="atelier-more-sheet__hint">{item.disabledReason}</span>
        ) : item.hint ? (
          <span className="atelier-more-sheet__hint">{item.hint}</span>
        ) : null}
      </span>
    </button>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label={t("page.actions.more")}
          className="website-atelier-focus website-atelier-press grid size-11 shrink-0 place-items-center rounded-[9px] text-[var(--atelier-muted)] hover:bg-[var(--atelier-field)]"
        >
          {busy ? (
            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <EllipsisVertical className="size-4" strokeWidth={1.8} aria-hidden />
          )}
        </button>
      </DrawerTrigger>
      <DrawerContent
        overlayClassName="z-[79] bg-[rgb(23_22_20/45%)] backdrop-blur-[2px]"
        className="website-atelier atelier-more-sheet z-[80] max-h-[85dvh]"
      >
        <RunAfterClose pendingRef={pendingRef} />
        <DrawerTitle className="sr-only">{t("page.actions.more")}</DrawerTitle>
        <DrawerDescription className="sr-only">{t("page.actions.more")}</DrawerDescription>
        <div className="atelier-more-sheet__list">
          {primary.map(renderRow)}
          {primary.length > 0 && danger.length > 0 ? (
            <span className="atelier-more-sheet__seam" aria-hidden />
          ) : null}
          {danger.flatMap((item, index) =>
            index === 0
              ? [renderRow(item)]
              : [
                  <span
                    key={`${item.key}-seam`}
                    className="atelier-more-sheet__seam"
                    aria-hidden
                  />,
                  renderRow(item),
                ],
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
