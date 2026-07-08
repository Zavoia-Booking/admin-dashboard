import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../../../../shared/components/ui/card';
import { Switch } from '../../../../shared/components/ui/switch';
import { updateMarketplaceVisibility } from '../api';
import { translateMessageCode } from '../../../../shared/utils/error';

export interface MarketplaceVisibilitySectionProps {
  hidden: boolean;
  onChanged: (hidden: boolean) => void;
}

/**
 * Marketplace opt-out toggle. Only rendered for dashboard users (no active
 * business membership) — team members are always visible through their
 * business listing, and the backend rejects hiding for them anyway.
 */
export function MarketplaceVisibilitySection({ hidden, onChanged }: MarketplaceVisibilitySectionProps) {
  const { t } = useTranslation('myProfile');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      const response = await updateMarketplaceVisibility(checked);
      onChanged(response.hiddenFromMarketplace);
      toast.success(checked ? t('visibility.hiddenToast') : t('visibility.visibleToast'));
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || t('visibility.updateFailed');
      const translatedMessage = Array.isArray(message)
        ? translateMessageCode(message[0])
        : translateMessageCode(message);
      toast.error(translatedMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const Icon = hidden ? EyeOff : Eye;

  return (
    <div className="max-w-5xl mb-8">
      <Card className="border-none sm:border shadow-none sm:shadow-sm bg-transparent sm:bg-white dark:sm:bg-surface overflow-hidden">
        <CardContent className="p-0 sm:p-4">
          <div className="flex items-start justify-between gap-4 px-2.5 sm:px-0">
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 mt-0.5 shrink-0 text-foreground-3 dark:text-foreground-2" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground-2">{t('visibility.title')}</p>
                <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                  {hidden ? t('visibility.hiddenDescription') : t('visibility.visibleDescription')}
                </p>
              </div>
            </div>
            <Switch
              checked={hidden}
              onCheckedChange={handleToggle}
              disabled={isUpdating}
              aria-label={t('visibility.title')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MarketplaceVisibilitySection;
