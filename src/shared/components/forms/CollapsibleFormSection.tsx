import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Collapsible, CollapsibleTrigger } from '../ui/collapsible';
import { useIsMobile } from '../../hooks/use-mobile';
import { cn } from '../../lib/utils';
import './CollapsibleFormSection.css';

/** Uses global collapsible.css ([data-slot="collapsible-content"]) - same as CategoryAccordion / ManageServicesSheet */
const ANIMATION_MS = 300;

export interface CollapsibleFormSectionProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  iconBgColor?: string;
  iconColor?: string;
  /** Tighter trigger + spacing for dense panels (e.g. appointment details). */
  compact?: boolean;
}

export const CollapsibleFormSection: React.FC<CollapsibleFormSectionProps> = ({
  icon: Icon,
  title,
  description,
  open,
  onOpenChange,
  children,
  className = '',
  iconBgColor = 'bg-primary/10 dark:bg-primary/20',
  iconColor = 'text-primary',
  defaultOpen = false,
  compact = false,
}) => {
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const [expandStarted, setExpandStarted] = useState(false);
  const wasOpenRef = useRef(false);
  if (open) wasOpenRef.current = true;
  const contentRendered = open || closing || wasOpenRef.current;

  const updateHeight = useCallback(() => {
    const outer = contentRef.current;
    if (!outer) return;
    const inner = innerRef.current;
    const height = inner ? inner.offsetHeight : outer.scrollHeight;
    outer.style.setProperty('--radix-collapsible-content-height', `${height}px`);
  }, []);

  useEffect(() => {
    if (open) {
      setClosing(false);
      setExpandStarted(false);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open && !closing && contentRef.current) {
      updateHeight();
      setClosing(true);
    }
  }, [open, closing, updateHeight]);

  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => {
      setClosing(false);
      wasOpenRef.current = false;
    }, ANIMATION_MS);
    return () => clearTimeout(t);
  }, [closing]);

  useLayoutEffect(() => {
    if (contentRendered && !closing) {
      updateHeight();
      if (open && !expandStarted) {
        const raf = requestAnimationFrame(() => setExpandStarted(true));
        return () => cancelAnimationFrame(raf);
      }
    }
  }, [contentRendered, closing, open, expandStarted, updateHeight]);

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
      <div className={cn(compact ? 'space-y-2' : 'space-y-4', className)}>
        <CollapsibleTrigger className="w-full cursor-pointer mb-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:ring-offset-0 rounded-md focus-visible:border transition-colors">
          <div
            className={cn(
              'flex items-center justify-between gap-3',
              compact ? 'pb-1' : 'pb-2',
            )}
          >
            <div className={cn('flex items-center', compact ? 'gap-2' : 'gap-3')}>
              {Icon && (
                <div
                  className={cn(
                    'rounded-xl',
                    compact ? 'p-1.5' : 'p-2',
                    iconBgColor,
                  )}
                >
                  <Icon
                    className={cn(iconColor, compact ? 'h-4 w-4' : 'h-5 w-5')}
                  />
                </div>
              )}
              <div className="text-left">
                <h3
                  className={cn(
                    'font-semibold text-foreground-1',
                    compact ? 'text-sm' : 'text-base',
                  )}
                >
                  {title}
                </h3>
                {description && (
                  <p
                    className={cn(
                      'text-foreground-3 dark:text-foreground-2 mt-0.5',
                      compact ? 'text-xs' : 'text-sm',
                    )}
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>
            {open ? (
              <ChevronUp
                className={`${isMobile ? 'h-8 w-8' : compact ? 'h-4 w-4' : 'h-5 w-5'} text-foreground-3 dark:text-foreground-2 shrink-0`}
              />
            ) : (
              <ChevronDown
                className={`${isMobile ? 'h-8 w-8' : compact ? 'h-4 w-4' : 'h-5 w-5'} text-foreground-3 dark:text-foreground-2 shrink-0`}
              />
            )}
          </div>
        </CollapsibleTrigger>
        {open && contentRendered ? (
          <div
            className={cn(
              'w-full shrink-0',
              compact ? 'pt-3 pb-3' : 'pt-4 pb-5',
            )}
            aria-hidden
          >
            <div className="w-full border-t border-border dark:border-border-strong" />
          </div>
        ) : null}
        {contentRendered && (
          <div
            ref={contentRef}
            data-slot="collapsible-content"
            data-state={closing ? 'closed' : 'open'}
            className={cn(
              'overflow-hidden relative',
              open && !closing && !expandStarted && 'collapsible-form-section-before-expand'
            )}
          >
            {/* Inner is absolute so it doesn't give the outer height - animation controls height */}
            <div ref={innerRef} className="absolute inset-x-0 top-0">
              {children}
            </div>
          </div>
        )}
      </div>
    </Collapsible>
  );
};

export default CollapsibleFormSection;
