import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../../../shared/components/ui/badge';
import { DashedDivider } from '../../../../shared/components/common/DashedDivider';
import { getCurrencyDisplay } from '../../../../shared/utils/currency';
import { getReadableTextColor } from '../../../../shared/utils/color';
import { cn } from '../../../../shared/lib/utils';
import type { AssignedService } from '../types';

interface MyAssignmentServiceRowProps {
  service: AssignedService;
  currency?: string;
}

export function MyAssignmentServiceRow({
  service,
  currency = 'eur',
}: MyAssignmentServiceRowProps) {
  const { t } = useTranslation('myAssignments');
  const currencyDisplay = getCurrencyDisplay(currency);
  const CurrencyIcon = currencyDisplay.icon;

  const categoryBg = service.category?.color || undefined;
  const categoryTextColor = categoryBg
    ? getReadableTextColor(categoryBg)
    : undefined;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  return (
    <div
      className={cn(
        'group flex items-start rounded-lg gap-4 px-4 py-4 md:py-3 pt-0 w-full border border-border-strong md:border-border bg-white dark:bg-surface',
        service.hasCustomOverride &&
          'border-l-3 border-l-primary/60 md:border-l-primary/60'
      )}
    >
      {/* Zone 1: Identity & Context (Left Side) */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Row 1: Service Name */}
        <div className="flex items-center justify-between mb-0 gap-2 md:gap-48 min-w-0 pb-3 md:pb-3">
          <span className="font-medium text-sm text-foreground-1 truncate">
            {service.name}
          </span>
        </div>

        {/* Row 2: Category Pill + Price & Duration */}
        <div
          className={cn(
            'flex items-center justify-between gap-2',
            service.hasCustomOverride && 'md:mb-2 mb-3'
          )}
        >
          <div>
            {service.category?.name && (
              <span
                className="inline-flex items-center max-w-28 rounded-full px-2 py-0.5 text-[10px] font-medium border border-border-subtle overflow-hidden"
                style={{
                  backgroundColor: categoryBg,
                  borderColor: categoryBg || undefined,
                  color: categoryTextColor,
                }}
              >
                <span className="truncate">{service.category.name}</span>
              </span>
            )}
          </div>

          {/* Price & Duration - Big, bold, easy to read */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center justify-start gap-0.5 min-w-18">
              {CurrencyIcon ? (
                <CurrencyIcon className="h-3 w-3 text-foreground-1" />
              ) : (
                <span className="text-sm text-foreground-1">
                  {currencyDisplay.symbol}
                </span>
              )}
              <span className="text-sm font-semibold text-foreground-1">
                {service.displayPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-w-20">
              <Clock className="h-3 w-3 text-foreground-1" />
              <span className="text-sm font-semibold text-foreground-1">
                {formatDuration(service.duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Default values (only if custom override) */}
        {service.hasCustomOverride &&
          service.defaultDisplayPrice !== undefined &&
          service.defaultDuration !== undefined && (
            <div className="">
              <DashedDivider
                marginTop="mt-0"
                className="mb-2"
                paddingTop="pt-0"
                dashPattern="1 1"
              />
              <div className="flex items-center justify-between mt-4 md:mt-0">
                <p className="text-xs flex text-foreground-3 dark:text-foreground-2">
                  <span className="font-medium">
                    {t('services.defaultLabel')}:
                  </span>{' '}
                  <span className="text-foreground-3 dark:text-foreground-2 -mr-0.5 ml-1 flex items-center">
                    {CurrencyIcon ? (
                      <CurrencyIcon className="h-3 w-3" />
                    ) : (
                      <span className="mr-0.5">{currencyDisplay.symbol}</span>
                    )}
                  </span>
                  <span className="text-foreground-3 mr-1.5 dark:text-foreground-2">
                    {service.defaultDisplayPrice.toFixed(2)}
                  </span>{' '}
                  •{' '}
                  <span className="text-foreground-3 ml-0.5 dark:text-foreground-2">
                    {formatDuration(service.defaultDuration)}
                  </span>
                </p>
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 shrink-0"
                >
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className="text-neutral-900 dark:text-foreground-1">
                    {t('services.badge.custom')}
                  </span>
                </Badge>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
