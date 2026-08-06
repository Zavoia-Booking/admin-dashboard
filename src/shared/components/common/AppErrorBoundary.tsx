import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import i18n from "../../lib/i18n";

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

    return (
      <div
        role="alert"
        aria-atomic="true"
        className="flex min-h-dvh flex-col items-center justify-center px-6 pb-[10vh] text-center"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="size-5 shrink-0 text-error" aria-hidden="true" />
          <h1 className="text-lg font-semibold tracking-tight text-foreground-1">
            {i18n.t("common:errorState.title", { defaultValue: "Something went wrong" })}
          </h1>
        </div>
        <p className="mt-1.5 max-w-sm text-balance text-sm leading-relaxed text-foreground-2">
          {i18n.t("common:errorState.crashBody", {
            defaultValue: "An unexpected error occurred. Reload the page to continue.",
          })}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-surface-hover px-3 text-sm font-medium text-foreground-1 shadow-xs outline-none hover:border-border-strong hover:bg-surface-active focus-visible:ring-2 focus-visible:ring-ring/50 md:min-h-9"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          {i18n.t("common:errorState.reload", { defaultValue: "Reload page" })}
        </button>
      </div>
    );
  }
}
