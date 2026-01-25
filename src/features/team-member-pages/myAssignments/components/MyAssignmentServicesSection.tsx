import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, ChevronDown } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/button';
import { Badge } from '../../../../shared/components/ui/badge';
import { MyAssignmentServiceRow } from './MyAssignmentServiceRow';
import type { AssignedService } from '../types';

interface MyAssignmentServicesSectionProps {
  services: AssignedService[];
  currency?: string;
}

const MAX_VISIBLE_SERVICES = 5;

export function MyAssignmentServicesSection({
  services,
  currency = 'eur',
}: MyAssignmentServicesSectionProps) {
  const { t } = useTranslation('myAssignments');
  const [showAllServices, setShowAllServices] = useState(false);
  const collapsibleRef = useRef<HTMLDivElement>(null);

  // Stats
  const enabledCount = services.length;
  const withCustomCount = services.filter((s) => s.hasCustomOverride).length;

  // Collapsible logic
  const hasMoreServices = services.length > MAX_VISIBLE_SERVICES;
  const visibleServices = services.slice(0, MAX_VISIBLE_SERVICES);
  const hiddenServices = services.slice(MAX_VISIBLE_SERVICES);

  // Measure height for animation
  useEffect(() => {
    const el = collapsibleRef.current;
    if (!el || !hasMoreServices) return;
    const fullHeight = Array.from(el.children).reduce(
      (acc, child) => acc + (child as HTMLElement).offsetHeight,
      0
    );
    el.style.setProperty(
      '--radix-collapsible-content-height',
      `${fullHeight}px`
    );
  }, [services, hasMoreServices]);

  return (
    <div className="space-y-4 mb-0 md:mb-4">
      {/* Header */}
      <div className="space-y-1.5 py-2">
        <h3 className="text-lg font-semibold text-foreground-1">
          {t('services.title')}
        </h3>
        <div className="flex items-start gap-1.5 text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-foreground-3 dark:text-foreground-2" />
          <span>{t('services.description')}</span>
        </div>
      </div>

      {/* Stats badges */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {enabledCount > 0 && (
            <Badge
              variant="secondary"
              className="text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800"
            >
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="font-semibold text-neutral-900 dark:text-foreground-1">
                {enabledCount}
              </span>
              <span className="text-neutral-900 dark:text-foreground-1">
                {t('services.stats.assigned')}
              </span>
            </Badge>
          )}
          {withCustomCount > 0 && (
            <Badge
              variant="secondary"
              className="text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800"
            >
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="font-semibold text-neutral-900 dark:text-foreground-1">
                {withCustomCount}
              </span>
              <span className="text-neutral-900 dark:text-foreground-1">
                {t('services.stats.customized')}
              </span>
            </Badge>
          )}
        </div>
      </div>

      {/* Services list */}
      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-5">
          {/* Abstract cards illustration - smaller and more compact */}
          <div className="relative w-full max-w-xs h-28 text-left">
            {/* Subtle background glow */}
            <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-b from-primary/5 dark:from-primary/10 via-transparent to-transparent blur-xl opacity-40 dark:opacity-30" />

            {/* back cards - smaller */}
            <div className="absolute inset-x-6 top-0.5 h-16 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-border shadow-md opacity-60 rotate-[-12deg] blur-[0.5px]" />
            <div className="absolute inset-x-3 top-4 h-18 rounded-xl bg-neutral-50 dark:bg-neutral-900/70 border border-border shadow-lg opacity-75 rotate-[8deg] blur-[0.5px]" />

            {/* front skeleton card - compact service card preview */}
            <div className="absolute inset-x-0 top-2 h-20 rounded-xl bg-surface dark:bg-neutral-900 border border-border shadow-lg overflow-hidden">
              <div className="h-full w-full px-3 py-2.5 flex flex-col gap-2">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-neutral-300 dark:bg-neutral-800 flex-shrink-0" />
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="h-3 w-28 rounded bg-neutral-300 dark:bg-neutral-800" />
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-12 rounded-full bg-neutral-300/80 dark:bg-neutral-800/80" />
                        <div className="h-2 w-10 rounded-full bg-neutral-300/70 dark:bg-neutral-800/70" />
                      </div>
                    </div>
                  </div>
                  <div className="h-4 w-12 rounded bg-neutral-300 dark:bg-neutral-800 flex-shrink-0" />
                </div>

                {/* Badge row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="h-3.5 w-16 rounded-full bg-neutral-300/90 dark:bg-neutral-800/90" />
                  <div className="h-3.5 w-12 rounded-full bg-neutral-300/80 dark:bg-neutral-800/80" />
                </div>
              </div>
            </div>
          </div>

          {/* Copy with better spacing */}
          <div className="space-y-2 max-w-md px-4">
            <h3 className="text-lg font-semibold text-foreground-1">
              {t('services.emptyState.title')}
            </h3>
            <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
              {t('services.emptyState.description')}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleServices.map((service) => (
            <MyAssignmentServiceRow
              key={service.id}
              service={service}
              currency={currency}
            />
          ))}

          {hasMoreServices && (
            <>
              <div
                ref={collapsibleRef}
                data-slot="collapsible-content"
                data-state={showAllServices ? 'open' : 'closed'}
                className={`space-y-2 overflow-hidden ${
                  showAllServices ? 'h-auto' : 'h-0'
                }`}
              >
                {hiddenServices.map((service) => (
                  <MyAssignmentServiceRow
                    key={service.id}
                    service={service}
                    currency={currency}
                  />
                ))}
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  rounded="full"
                  onClick={() => setShowAllServices(!showAllServices)}
                  className="group h-auto px-4 py-1.5 gap-1.5 border-border w-[60%] md:w-1/3 dark:bg-surface dark:border-border dark:hover:border-border-strong dark:group-hover:text-primary dark:text-foreground-1 dark:hover:bg-surface"
                >
                  <span>
                    {showAllServices
                      ? t('services.buttons.showLess')
                      : t('services.buttons.showMore', {
                          count: services.length - MAX_VISIBLE_SERVICES,
                        })}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 mt-0.5 text-foreground-3 dark:text-foreground-1 group-hover:text-foreground-1 transition-transform ${
                      showAllServices ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
