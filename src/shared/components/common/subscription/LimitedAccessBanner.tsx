import React from 'react';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useCanWrite } from './useCanWrite';

type LimitedAccessBannerProps = {
  className?: string;
};

/**
 * Subtle informational banner shown across the app when the business is not
 * entitled. Deliberately low-key: muted background, small text, info icon,
 * no CTA, no link. Pairs with the per-button WriteGate tooltip so touch
 * users still understand why controls are disabled.
 *
 * Renders nothing when the user is entitled.
 */
export const LimitedAccessBanner: React.FC<LimitedAccessBannerProps> = ({ className }) => {
  const { t } = useTranslation('common');
  const canWrite = useCanWrite();

  if (canWrite) return null;

  return (
    <div className={cn('relative z-10 px-2 py-3 md:px-4', className)}>
      <div
        role="status"
        className="flex items-center gap-2 rounded-md border border-info-border bg-info-bg px-3 py-1.5"
      >
        <Info className="size-3.5 shrink-0 text-black" aria-hidden="true" />
        <span className="text-xs text-black">
          {t('limitedUsage.bannerMessage')}
        </span>
      </div>
    </div>
  );
};

export default LimitedAccessBanner;
