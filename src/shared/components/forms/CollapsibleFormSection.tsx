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
  description?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  iconBgColor?: string;
  iconColor?: string;
  /** Tighter trigger + spacing for dense panels (e.g. appointment details). */
  compact?: boolean;
  /** When opened by the user, scroll the nearest scrollable ancestor so the expanded section is visible. */
  scrollIntoViewOnOpen?: boolean;
}

function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
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
  scrollIntoViewOnOpen = false,
}) => {
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef(false);
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

  const handleOpenChange = useCallback(
    (next: boolean) => {
      pendingScrollRef.current = scrollIntoViewOnOpen && next;
      onOpenChange(next);
    },
    [onOpenChange, scrollIntoViewOnOpen],
  );

  // Scroll in step with the expand animation: target where the section's bottom will land once
  // fully open, but never push its header above the top of the scroll area.
  useEffect(() => {
    if (!expandStarted || !pendingScrollRef.current) return;
    pendingScrollRef.current = false;
    const root = rootRef.current;
    const scroller = getScrollParent(root);
    if (!root || !scroller) return;
    const rootRect = root.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    const remaining = (innerRef.current?.offsetHeight ?? 0) - (contentRef.current?.offsetHeight ?? 0);
    const overflowBottom = rootRect.bottom + remaining - scrollerRect.bottom;
    const maxDelta = rootRect.top - scrollerRect.top;
    const delta = Math.min(overflowBottom, maxDelta);
    if (delta > 0) scroller.scrollBy({ top: delta, behavior: 'smooth' });
  }, [expandStarted]);

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange} defaultOpen={defaultOpen}>
      <div ref={rootRef} className={cn(compact ? 'space-y-2' : 'space-y-4', className)}>
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
                {description != null && description !== '' && (
                  <p
                    className={cn(
                      'mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-foreground-3 dark:text-foreground-2',
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
