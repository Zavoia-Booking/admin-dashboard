import type { ReactNode } from "react";
import { toast, type ExternalToast } from "sonner";
import { cn } from "../../shared/lib/utils";

type WebsiteToastTone = "neutral" | "success" | "info" | "warning" | "error";
type WebsiteToastMessage = ReactNode | (() => ReactNode);

const DURATION_BY_TONE: Record<WebsiteToastTone, number> = {
  neutral: 5000,
  success: 4000,
  info: 5000,
  warning: 6000,
  error: 7000,
};

function websiteToastOptions(
  tone: WebsiteToastTone,
  options: ExternalToast = {},
): ExternalToast {
  const duration = options.duration ?? (
    options.action
      ? Math.max(DURATION_BY_TONE[tone], 6000)
      : DURATION_BY_TONE[tone]
  );

  return {
    ...options,
    duration,
    closeButton: options.closeButton ?? true,
    className: cn("website-toast", `website-toast--${tone}`, options.className),
  };
}

interface WebsiteToastApi {
  (message: WebsiteToastMessage, options?: ExternalToast): string | number;
  message: (message: WebsiteToastMessage, options?: ExternalToast) => string | number;
  success: (message: WebsiteToastMessage, options?: ExternalToast) => string | number;
  info: (message: WebsiteToastMessage, options?: ExternalToast) => string | number;
  warning: (message: WebsiteToastMessage, options?: ExternalToast) => string | number;
  error: (message: WebsiteToastMessage, options?: ExternalToast) => string | number;
  dismiss: (id?: string | number) => string | number;
  getToasts: typeof toast.getToasts;
}

const neutral = (message: WebsiteToastMessage, options?: ExternalToast) =>
  toast.message(message, websiteToastOptions("neutral", options));

/**
 * One presentation boundary for every transient Website Builder message. It keeps
 * severity timing, dismissal, action sizing, and route-scoped styling from drifting
 * between sagas, hooks, and editor components.
 */
export const websiteToast: WebsiteToastApi = Object.assign(neutral, {
  message: neutral,
  success: (message: WebsiteToastMessage, options?: ExternalToast) =>
    toast.success(message, websiteToastOptions("success", options)),
  info: (message: WebsiteToastMessage, options?: ExternalToast) =>
    toast.info(message, websiteToastOptions("info", options)),
  warning: (message: WebsiteToastMessage, options?: ExternalToast) =>
    toast.warning(message, websiteToastOptions("warning", options)),
  error: (message: WebsiteToastMessage, options?: ExternalToast) =>
    toast.error(message, websiteToastOptions("error", options)),
  dismiss: (id?: string | number) => toast.dismiss(id),
  getToasts: () => toast.getToasts(),
});
