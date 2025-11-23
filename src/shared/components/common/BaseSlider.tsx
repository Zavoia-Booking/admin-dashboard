import React, { useState, useRef } from "react";
import { ChevronLeft, X as XIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "../ui/button";
import { DashedDivider } from "./DashedDivider";
import { cn } from "../../lib/utils";

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
  dragThreshold?: number;
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
  dragThreshold = 100,
  maxDragDistance = 300,
  backdropClassName,
  panelClassName,
  headerActions,
  footer,
}) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Handle animation timing
  React.useEffect(() => {
    if (isOpen) {
      // Ensure component is in closed state first, then animate
      setShouldAnimate(false);
      const timer = setTimeout(() => setShouldAnimate(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(false);
    }
  }, [isOpen]);

  // Swipe gesture handling
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const isMouseDown = useRef<boolean>(false);

  const handleStart = (clientX: number, target: HTMLElement) => {
    // Don't start drag on form elements
    if (
      target.tagName === "INPUT" ||
      target.tagName === "BUTTON" ||
      target.tagName === "TEXTAREA" ||
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest('[role="button"]') ||
      target.closest('[role="switch"]') ||
      target.closest('[role="combobox"]') ||
      target.closest('[role="listbox"]') ||
      target.closest('[role="option"]')
    ) {
      return;
    }

    touchStartX.current = clientX;
    touchCurrentX.current = clientX;
    setIsDragging(true);
    isMouseDown.current = true;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging && !isMouseDown.current) return;

    touchCurrentX.current = clientX;
    const diff = touchCurrentX.current - touchStartX.current;

    // Only allow rightward swipes (positive diff)
    if (diff > 0) {
      setDragOffset(Math.min(diff, maxDragDistance));
    }
  };

  const handleEnd = () => {
    if (!isDragging && !isMouseDown.current) return;

    const diff = touchCurrentX.current - touchStartX.current;

    // If swiped more than threshold, close the slider
    if (diff > dragThreshold) {
      onClose();
    }

    // Reset drag state
    setIsDragging(false);
    setDragOffset(0);
    isMouseDown.current = false;
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    handleStart(e.touches[0].clientX, target);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    handleEnd();
  };

  // Mouse events for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    handleStart(e.clientX, target);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    handleEnd();
  };

  return (
    <>
      {/* Backdrop - Overlay on both mobile and desktop */}
      <div
        className={cn(
          "fixed inset-0 z-60 transition-opacity duration-300 mb-0",
          "bg-black/30",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
          backdropClassName
        )}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div
        className={cn(
          "fixed bg-surface z-70 overflow-hidden",
          // Mobile: full width, slides from right
          "top-0 left-0 h-full w-full",
          // Desktop: positioned on right side with spacing and rounded corners
          "md:top-4 md:bottom-4 md:right-4 md:left-auto md:h-[calc(100vh-2rem)] md:w-1/2 md:max-w-2xl md:rounded-xl md:shadow-lg md:border md:border-border",
          !isDragging ? "transition-transform duration-300 ease-out" : "",
          // On desktop, translate by 100% + 1rem (16px) to account for right-4 spacing
          isOpen && shouldAnimate
            ? "translate-x-0"
            : "translate-x-full md:translate-x-[calc(100%+1rem)]",
          panelClassName,
          className
        )}
        style={{
          transform: isDragging ? `translateX(${dragOffset}px)` : undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="flex flex-col h-full md:h-full overflow-hidden">
          {/* Header - Mobile: back button, Desktop: close button */}
          <div
            className={cn(
              "flex flex-col bg-surface relative",
              "p-4 md:p-6",
              headerClassName
            )}
          >
            <div className="flex items-center gap-3">
              {showBackButton && (
                <>
                  {/* Mobile: back button */}
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
                  {/* Desktop: close button */}
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

              {/* Icon */}
              {Icon && (
                <div className="hidden md:flex flex-shrink-0 items-stretch self-stretch">
                  <div className="flex items-center justify-center rounded-full border border-border-strong bg-surface aspect-square h-full min-w-[2.5rem]">
                    <Icon className={cn("h-6 w-6", iconColor)} />
                  </div>
                </div>
              )}

              <div className="flex-1 min-w-0 flex flex-col justify-center cursor-default text-left">
                <h2 className="text-lg font-semibold text-foreground-1 cursor-default">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm hidden md:block text-foreground-3 dark:text-foreground-2 leading-relaxed mt-1.5 cursor-default">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Header Actions */}
              <div className="ml-auto">{headerActions}</div>
            </div>

            {/* Dotted Divider */}
            <DashedDivider
              marginTop="mt-3"
              className="pt-0 md:pt-3"
              dashPattern="1 1"
            />
          </div>

          {/* Content - Full width/height on desktop, normal on mobile */}
          <div
            className={cn(
              "overflow-y-auto flex flex-col",
              // Mobile: flex-1 with padding
              "flex-1 p-3",
              // Desktop: full width and height, no padding (content handles its own spacing)
              "md:w-full md:h-full md:p-0",
              contentClassName
            )}
          >
            <div className="flex-1">{children}</div>

            {/* Footer - Show on both mobile and desktop, scrolls with content */}
            {footer && (
              <div
                className={cn("bg-surface", "px-0 md:px-6", footerClassName)}
              >
                {/* Dotted Divider */}
                <DashedDivider
                  marginTop="mt-0"
                  className="mb-0 md:mb-6"
                  paddingTop="pt-0"
                  dashPattern="1 1"
                />
                {footer}
              </div>
            )}
          </div>

          {/* Bottom padding - Always visible, sticky at bottom */}
          <div className="hidden md:block h-6 bg-surface shrink-0" />
        </div>
      </div>
    </>
  );
};
