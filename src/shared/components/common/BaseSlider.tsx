import React, { useRef } from "react";
import { Drawer as VaulDrawer } from "vaul";
import { ChevronLeft, X as XIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "../ui/button";
import { DashedDivider } from "./DashedDivider";
import { cn } from "../../lib/utils";
import { ignoreToastPointerDown } from "../../lib/toastInteraction";
import { PortalContainerContext } from "../../contexts/PortalContainerContext";
import { useKeyboardVisible } from "../../hooks/useKeyboardVisible";

/**
 * Slide-in panel built on Vaul (right-direction drawer).
 *
 * Why Vaul:
 * - Gesture physics (drag-to-close, velocity detection, rubber-banding) are handled correctly.
 * - Apple-spring open/close animation on mobile WebView.
 * - Focus management, ESC to close, backdrop click — all handled.
 * - Removes ~200 lines of custom gesture code that was race-prone on low-end Android.
 *
 * Public API (props) is preserved so every existing caller — AddAppointmentSlider,
 * CreateBlockDrawer, CalendarSettingsSheet, etc. — works unchanged.
 */

interface BaseSliderProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  showBackButton?: boolean;
  /** @deprecated Vaul owns gesture thresholds — kept for API compatibility. */
  dragThreshold?: number;
  /** @deprecated Vaul owns gesture thresholds — kept for API compatibility. */
  maxDragDistance?: number;
  backdropClassName?: string;
  panelClassName?: string;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
}

export const BaseSlider: React.FC<BaseSliderProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-foreground-1",
  children,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  showBackButton = true,
  backdropClassName,
  panelClassName,
  headerActions,
  footer,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  // Native keyboard covers the footer (like the bottom nav) instead of pushing it up.
  const keyboardVisible = useKeyboardVisible();

  return (
    <VaulDrawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      direction="right"
      // Move focus into the slider on open. Without it, Vaul leaves focus on
      // the trigger button — Radix then marks the page root with
      // `aria-hidden` and the browser blocks the still-focused trigger that
      // now sits inside a hidden subtree. Same fix already applied to
      // [ReviewsFiltersSheet], [SortSelect], and [ManageServicesSheet].
      autoFocus
      // Keep the backdrop dismissible; the rest of the a11y/escape handling is Vaul's default.
      dismissible
      // Disable Vaul's built-in keyboard repositioning — it applies inline
      // style.height and style.bottom on visualViewport resize, which fights
      // with our CSS and causes cropping/gaps on Android WebView.
      repositionInputs={false}
    >
      <VaulDrawer.Portal>
        {/* Backdrop */}
        <VaulDrawer.Overlay
          className={cn(
            "fixed inset-0 z-[75] bg-black/30",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            backdropClassName,
          )}
        />

        {/* Sliding panel */}
        <VaulDrawer.Content
          ref={panelRef}
          onPointerDownOutside={ignoreToastPointerDown()}
          className={cn(
            "fixed z-[80] bg-surface outline-none",
            // Mobile: full width, flush to the right edge, full height.
            "right-0 top-0 bottom-0 h-full w-full",
            // Desktop: right-aligned sheet with padding + rounded corners.
            "md:top-4 md:bottom-4 md:right-4 md:h-[calc(100vh-2rem)] md:w-1/2 md:max-w-2xl md:rounded-xl md:shadow-lg md:border md:border-border",
            // Overflow is managed by the inner flex container so focus rings on controls
            // inside the panel aren't clipped.
            "flex flex-col overflow-hidden",
            panelClassName,
            className,
          )}
        >
          <PortalContainerContext.Provider value={panelRef}>
            {/* Header — mobile: back button; desktop: close button */}
            <div
              className={cn(
                "relative flex flex-col bg-surface",
                // Mobile panel is edge-to-edge (top-0), so the status bar inset
                // (stable var survives keyboard-open env() collapse) + breathing room.
                "pt-[max(1rem,calc(var(--safe-area-top-stable,env(safe-area-inset-top,0px))+0.5rem))] pb-4 px-0 md:p-6 md:pt-6",
                headerClassName,
              )}
            >
              <div className="flex items-center gap-3">
                {showBackButton && (
                  <>
                    <div className="md:hidden">
                      <Button
                        variant="ghost"
                        size="icon"
                        rounded="full"
                        onClick={onClose}
                        className="h-8 !w-8"
                      >
                        <ChevronLeft />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="hidden md:flex absolute right-4 top-4 h-8 w-8 rounded-md hover:bg-surface-hover active:bg-surface-active"
                    >
                      <XIcon className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </>
                )}

                {Icon && (
                  <div className="hidden md:flex flex-shrink-0 items-stretch self-stretch">
                    <div className="flex items-center justify-center rounded-full border border-border-strong bg-surface aspect-square h-full min-w-[2.5rem]">
                      <Icon className={cn("h-6 w-6", iconColor)} />
                    </div>
                  </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col justify-center cursor-default text-left">
                  {/* Vaul/Radix require a Title for a11y; visually styled like the rest of the header. */}
                  <VaulDrawer.Title asChild>
                    <h2 className="text-lg font-semibold text-foreground-1 cursor-default">
                      {title}
                    </h2>
                  </VaulDrawer.Title>
                  {subtitle ? (
                    <VaulDrawer.Description asChild>
                      <p className="text-sm hidden md:block text-foreground-3 dark:text-foreground-2 leading-relaxed mt-1.5 cursor-default">
                        {subtitle}
                      </p>
                    </VaulDrawer.Description>
                  ) : (
                    // Radix warns if no Description is present; hidden one satisfies a11y without rendering.
                    <VaulDrawer.Description className="sr-only">{title}</VaulDrawer.Description>
                  )}
                </div>

                <div className="ml-auto">{headerActions}</div>
              </div>

              <DashedDivider marginTop="mt-3" className="pt-0 md:pt-3" dashPattern="1 1" />
            </div>

            {/* Scrollable body */}
            <div
              className={cn(
                "flex flex-col overflow-y-auto",
                "flex-1 p-3",
                "md:w-full md:h-full md:p-0 md:flex-1",
                contentClassName,
              )}
            >
              <div className="flex-1">{children}</div>
            </div>

            {/* Sticky footer — always sibling of the scroll area so it pins to
             *  the bottom of the panel on both mobile and desktop. Padding is
             *  compact on mobile; desktop keeps the original px-6 / pb-2. */}
            {footer && (
              <div
                className={cn(
                  "flex flex-col bg-surface shrink-0 z-100",
                  keyboardVisible && "hidden",
                  footerClassName,
                )}
              >
                <DashedDivider
                  marginTop="mt-0"
                  className="mb-0"
                  paddingTop="pt-0 md:pt-4"
                  dashPattern="1 1"
                />
                {/* Mobile: clear the gesture bar (env inset) with a small floor on web. */}
                <div className="px-3 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] md:px-6 md:pb-2">{footer}</div>
              </div>
            )}
          </PortalContainerContext.Provider>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
};
