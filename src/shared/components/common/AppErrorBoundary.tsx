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

  // A crash during the first mount can render this fallback before i18next's
  // deferred init finishes — t() would echo raw keys and ignore defaultValue.
  // Until init, text() serves the English fallback; on init, re-render.
  private handleI18nInitialized = () => this.forceUpdate();

  componentDidMount() {
    i18n.on("initialized", this.handleI18nInitialized);
  }

  componentWillUnmount() {
    i18n.off("initialized", this.handleI18nInitialized);
  }

  private text(key: string, fallback: string): string {
    return i18n.isInitialized ? i18n.t(key, { defaultValue: fallback }) : fallback;
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
            {this.text("common:errorState.title", "Something went wrong")}
          </h1>
        </div>
        <p className="mt-1.5 max-w-sm text-balance text-sm leading-relaxed text-foreground-2">
          {this.text("common:errorState.crashBody", "An unexpected error occurred. Reload the page to continue.")}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-surface-hover px-3 text-sm font-medium text-foreground-1 shadow-xs outline-none hover:border-border-strong hover:bg-surface-active focus-visible:ring-2 focus-visible:ring-ring/50 md:min-h-9"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          {this.text("common:errorState.reload", "Reload page")}
        </button>
      </div>
    );
  }
}
