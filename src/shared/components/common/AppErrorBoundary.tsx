import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import i18n from "../../lib/i18n";

/** A lazy route chunk 404'd — almost always a stale tab open across a deploy. */
export function isStaleChunkError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk \S+ failed|ChunkLoadError/i.test(
    msg,
  );
}

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: unknown;
}

/**
 * Last-resort crash screen wrapping the whole tree (main.tsx). Deliberately
 * primitive — no hooks, no router, no shared components — so it can render no
 * matter what broke. Route-level crashes are handled by the styled
 * RouteErrorFallback in App.tsx; this only shows when that layer itself fails.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("Uncaught application error:", error, info.componentStack);
  }

  render() {
    if (this.state.error === null) return this.props.children;

    const stale = isStaleChunkError(this.state.error);
    const title = stale
      ? i18n.t("common:errorState.updateTitle", { defaultValue: "A new version is available" })
      : i18n.t("common:errorState.title", { defaultValue: "Something went wrong" });
    const body = stale
      ? i18n.t("common:errorState.updateBody", { defaultValue: "Reload the page to continue." })
      : i18n.t("common:errorState.crashBody", {
          defaultValue: "An unexpected error occurred. Reload the page to continue.",
        });

    return (
      <div
        role="alert"
        aria-atomic="true"
        className="flex min-h-dvh items-center justify-center px-4 py-8"
      >
        <div className="flex w-full max-w-[34rem] items-start gap-2.5 rounded-xl border border-border bg-surface px-4 py-5 text-left md:px-5 md:py-6">
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-error"
            aria-hidden="true"
          />
          <div className="min-w-0 max-w-[52ch] break-words">
            <h1 className="text-[15px] font-semibold leading-5 text-foreground-1">
              {title}
            </h1>
            <p className="mt-1 text-sm leading-5 text-foreground-2">{body}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-surface-hover px-3 text-sm font-medium text-foreground-1 shadow-xs outline-none hover:border-border-strong hover:bg-surface-active focus-visible:ring-2 focus-visible:ring-ring/50 md:min-h-8"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {i18n.t("common:errorState.reload", { defaultValue: "Reload page" })}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
