import { AlertCircle, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface ErrorStateProps {
  /** Feature-specific message; defaults to the generic common:errorState.body */
  body?: string;
  /** Optional heading; the generic common:errorState.title is used only with the generic body. */
  title?: string;
  /** Renders a retry button when provided. Only pass for read/load failures. */
  onRetry?: () => void;
  retryLabel?: string;
  /**
   * `page` sits in the page flow with the page's normal content inset.
   * `pane` fills a split-view detail column without manufacturing a tall panel.
   * `section` stays compact inside an existing surface.
   */
  variant?: "page" | "pane" | "section";
  className?: string;
}

/**
 * Shared load-failure state. One design for every "couldn't load, try again"
 * surface — a compact recovery notice rather than a second empty-state card.
 */
export function ErrorState({
  body,
  title,
  onRetry,
  retryLabel,
  variant = "section",
  className,
}: ErrorStateProps) {
  const { t } = useTranslation("common");
  // A specific body carries the whole message — the generic heading on top of it
  // just repeats "something went wrong", so it only renders when explicitly passed
  // or when the body is the generic default.
  const resolvedTitle = title ?? (body ? null : t("errorState.title"));

  return (
    <div
      role="alert"
      aria-atomic="true"
      className={cn(
        "w-full",
        variant === "page" && "py-1 md:py-2",
        variant === "pane" && "px-1 py-4 md:px-2 md:py-5",
        variant === "section" && "px-1 py-5",
        className,
      )}
    >
      {/* `page` sits directly on the page background, so it carries its own
          card surface; pane/section render inside an existing surface. */}
      <div
        className={cn(
          "flex w-full max-w-[34rem] items-start gap-2.5 text-left",
          variant === "page" &&
            "rounded-xl border border-border bg-surface px-4 py-5 md:px-5 md:py-6",
        )}
      >
        <AlertCircle
          className="mt-0.5 size-4 shrink-0 text-error"
          aria-hidden="true"
        />
        <div className="min-w-0 max-w-[52ch] break-words">
          {resolvedTitle ? (
            <h2 className="text-[15px] font-semibold leading-5 text-foreground-1">
              {resolvedTitle}
            </h2>
          ) : null}
          <p
            className={cn(
              "leading-5",
              resolvedTitle
                ? "mt-1 text-sm text-foreground-2"
                : "text-[15px] font-medium text-foreground-1",
            )}
          >
            {body ?? t("errorState.body")}
          </p>

          {onRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-3 min-h-10 font-medium md:min-h-8"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {retryLabel ?? t("errorState.retry")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
