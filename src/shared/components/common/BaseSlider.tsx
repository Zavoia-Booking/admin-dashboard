import React, { useState, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface BaseSliderProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
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
  footer
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
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA' || 
        target.closest('button') || target.closest('input') || target.closest('textarea') || 
        target.closest('[role="button"]') || target.closest('[role="switch"]') ||
        target.closest('[role="combobox"]') || target.closest('[role="listbox"]') ||
        target.closest('[role="option"]')) {
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
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
          backdropClassName
        )}
        onClick={onClose}
      />
      
      {/* Sliding Panel */}
      <div 
        className={cn(
          "fixed top-0 h-full bg-background z-70",
          // Mobile: full width, slides from right
          "left-0 w-full",
          // Desktop: half width, positioned on right side
          "md:left-auto md:right-0 md:w-1/2",
          !isDragging ? 'transition-transform duration-300 ease-out' : '',
          isOpen && shouldAnimate ? 'translate-x-0' : 'translate-x-full',
          panelClassName,
          className
        )}
        style={{
          transform: isDragging 
            ? `translateX(${dragOffset}px)` 
            : undefined
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="flex flex-col h-full">
          {/* Header - Hidden on desktop */}
          <div className={cn(
            "flex items-center p-2 border-b bg-card/50 relative",
            "md:hidden", // Hide on desktop
            headerClassName
          )}>
            {showBackButton && (
              <div className="bg-muted rounded-full p-1.5">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="rounded-full hover:bg-muted-foreground/10"
                  style={{ height: '2rem', width: '2rem', minHeight: '2rem', minWidth: '2rem' }}
                >
                  <ArrowLeft className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            <h2 className="text-lg font-semibold text-foreground absolute left-1/2 transform -translate-x-1/2">
              {title}
            </h2>
            
            {/* Header Actions */}
            <div className="ml-auto">
              {headerActions}
            </div>
          </div>
          
          {/* Content - Full width/height on desktop, normal on mobile */}
          <div className={cn(
            "overflow-y-auto",
            // Mobile: flex-1 with padding
            "flex-1 p-4",
            // Desktop: full width and height, no padding (content handles its own spacing)
            "md:w-full md:h-full md:p-0",
            contentClassName
          )}>
            {children}
          </div>

          {/* Footer - Hidden on desktop */}
          {footer && (
            <div className={cn(
              "border-t bg-card/50 p-4",
              "md:hidden", // Hide on desktop
              footerClassName
            )}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}; 