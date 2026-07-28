import { toast } from "sonner";
import { Button } from "./button";

interface UndoToastOptions {
  title: string;
  description?: string;
  undoLabel: string;
  onUndo: () => void;
  duration?: number;
}

/** One-line "action done — Undo" toast card shared by the builder and setup wizard. */
export const showUndoToast = ({ title, description, undoLabel, onUndo, duration = 5000 }: UndoToastOptions) => {
  toast.custom(
    (toastId) => (
      <div className="flex w-[min(420px,calc(100vw-2rem))] items-center justify-between gap-5 rounded-md border border-border bg-surface px-4 py-3 shadow-sm">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground-1">{title}</p>
          {description ? (
            <p className="mt-1 truncate text-xs text-foreground-3 dark:text-foreground-2">{description}</p>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          rounded="default"
          className="h-8 shrink-0 px-3 text-xs font-semibold"
          onClick={() => {
            onUndo();
            toast.dismiss(toastId);
          }}
        >
          {undoLabel}
        </Button>
      </div>
    ),
    { duration },
  );
};
