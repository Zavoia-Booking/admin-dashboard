import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useTranslation } from "react-i18next";
import { CheckCheck, EllipsisVertical, LoaderCircle, Trash2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "../../../shared/components/ui/drawer";
import { cn } from "../../../shared/lib/utils";

interface NotificationsMoreSheetProps {
  onDeleteAll: () => void;
  onMarkAllRead: () => void;
  /** Mirrors the desktop toolbar: the mark-all row only exists while something is unread. */
  showMarkAllRead: boolean;
  /** Spinner on the kebab while a sheet-initiated request is in flight. */
  busy?: boolean;
}

/** Runs the chosen action once the sheet content has unmounted, i.e. after its
 *  exit animation — so "Delete all" opens its confirm dialog on a settled screen
 *  instead of stacking over a drawer mid-close. */
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

const ROW_CLASS =
  "flex min-h-[50px] w-full cursor-pointer items-center gap-3.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium outline-none transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-focus/40 motion-reduce:transition-none";

/**
 * Phone counterpart of the list toolbar's two bulk actions. On mobile the toolbar
 * is hidden and these live behind a kebab in the sticky header, opposite the title.
 * Same recipe as the website studio's WebsiteMobileMoreSheet: borderless rows with
 * the destructive one split off below a seam, and z-indexes above the fixed bottom
 * nav (z-[60]) — at the default z-50 the nav paints over the sheet's lower rows.
 */
export function NotificationsMoreSheet({
  onDeleteAll,
  onMarkAllRead,
  showMarkAllRead,
  busy = false,
}: NotificationsMoreSheetProps) {
  const { t } = useTranslation("notifications");
  const [open, setOpen] = useState(false);
  const pendingRef = useRef<(() => void) | null>(null);

  const select = (action: () => void) => {
    pendingRef.current = action;
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} repositionInputs={false}>
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label={t("moreActions")}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground-2 outline-none transition-colors hover:bg-surface-hover hover:text-foreground-1 focus-visible:ring-2 focus-visible:ring-focus/40"
        >
          {busy ? (
            <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <EllipsisVertical className="h-4 w-4" aria-hidden />
          )}
        </button>
      </DrawerTrigger>

      <DrawerContent overlayClassName="z-[79]" className="z-[80] max-h-[85dvh]">
        <RunAfterClose pendingRef={pendingRef} />
        <DrawerTitle className="sr-only">{t("moreActions")}</DrawerTitle>
        <DrawerDescription className="sr-only">{t("moreActions")}</DrawerDescription>

        <div className="flex flex-col px-2 pt-1 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {showMarkAllRead && (
            <>
              <button
                type="button"
                className={cn(ROW_CLASS, "text-foreground-1 hover:bg-surface-hover active:bg-surface-active")}
                onClick={() => select(onMarkAllRead)}
              >
                <CheckCheck className="h-4 w-4 shrink-0 text-success" aria-hidden />
                {t("markAllAsRead")}
              </button>
              <span aria-hidden className="mx-3 my-1.5 block h-px bg-border-subtle" />
            </>
          )}

          <button
            type="button"
            className={cn(ROW_CLASS, "text-error hover:bg-error/[0.07] active:bg-error/[0.07]")}
            onClick={() => select(onDeleteAll)}
          >
            <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
            {t("deleteAllLoaded")}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
