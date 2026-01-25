import { PlusCircle, Tag, Percent, Layers2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../../../shared/components/ui/badge';
import { getCurrencyDisplay } from '../../../../shared/utils/currency';
import type { AssignedBundle } from '../types';

interface MyAssignmentBundleRowProps {
  bundle: AssignedBundle;
  currency?: string;
}

export function MyAssignmentBundleRow({
  bundle,
  currency = 'eur',
}: MyAssignmentBundleRowProps) {
  const { t } = useTranslation('myAssignments');
  const currencyDisplay = getCurrencyDisplay(currency);
  const CurrencyIcon = currencyDisplay.icon;

  // Get price type badge info
  const getPriceTypeBadge = () => {
    switch (bundle.priceType) {
      case 'sum':
        return {
          label: t('bundles.priceType.sum'),
          icon: PlusCircle,
          color: '#dbeafe', // Light blue
        };
      case 'fixed':
        return {
          label: t('bundles.priceType.fixed'),
          icon: Tag,
          color: '#d1fae5', // Light green
        };
      case 'discount':
        return {
          label: t('bundles.priceType.discount'),
          icon: Percent,
          color: '#fed7aa', // Light amber/orange
        };
      default:
        return null;
    }
  };

  const priceTypeBadge = getPriceTypeBadge();
  const BadgeIcon = priceTypeBadge?.icon;

  return (
    <div className="group flex items-start rounded-lg gap-4 px-4 py-4 md:py-3 w-full border border-border-strong md:border-border bg-white dark:bg-surface">
      {/* Zone 1: Identity & Context (Left Side) */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Row 1: Bundle Name */}
        <div className="flex items-center justify-between mb-0 gap-2 md:gap-48 min-w-0">
          <span className="font-medium text-sm text-foreground-1 truncate">
            {bundle.bundleName}
          </span>
        </div>

        {/* Row 2: Price Type Badge + Service Count + Price */}
        <div className="flex mt-3 items-center justify-between gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Price type badge */}
            {priceTypeBadge && (
              <Badge
                variant="secondary"
                className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                style={{ backgroundColor: priceTypeBadge.color }}
              >
                {bundle.priceType === 'discount' && bundle.discountPercentage ? (
                  <>
                    <span className="text-neutral-900">
                      {bundle.discountPercentage}
                    </span>
                    {BadgeIcon && <BadgeIcon className="-ml-0.5 h-3 w-3" />}
                    <span className="text-neutral-900">
                      {t('bundles.priceType.discount')}
                    </span>
                  </>
                ) : (
                  <>
                    {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
                    <span className="text-neutral-900">{priceTypeBadge.label}</span>
                  </>
                )}
              </Badge>
            )}

            {/* Service count */}
            <div className="flex items-center gap-1 text-xs bg-secondary rounded-full px-2 py-0.5 text-foreground-2 dark:text-foreground-2">
              <Layers2 className="h-3.5 w-3.5" />
              <span>
                {bundle.serviceCount}{' '}
                {bundle.serviceCount === 1
                  ? t('bundles.serviceCount.one')
                  : t('bundles.serviceCount.other')}
              </span>
            </div>
          </div>

          {/* Price - Big, bold, easy to read */}
          <div className="flex items-center justify-start gap-0.5 min-w-18 shrink-0">
            {CurrencyIcon ? (
              <CurrencyIcon className="h-3 w-3 text-foreground-1" />
            ) : (
              <span className="text-sm text-foreground-1">
                {currencyDisplay.symbol}
              </span>
            )}
            <span className="text-sm font-semibold text-foreground-1">
              {bundle.calculatedDisplayPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
