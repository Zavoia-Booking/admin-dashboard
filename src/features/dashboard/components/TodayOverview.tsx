import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { useFormatPrice } from '../../../shared/hooks/useFormatPrice';
import {
  DollarSign,
  CalendarCheck,
  Users,
  Activity
} from 'lucide-react';

interface TodayOverviewProps {
  appointments: number;
  /** Revenue in integer minor units (cents) — formatted via shared util. */
  revenue: number;
  /** Business currency code (e.g. `'RON'`, `'EUR'`). */
  currency: string;
  staffAvailable: number;
  staffLoadPercentage: number;
}

export function TodayOverview({
  appointments,
  revenue,
  currency,
  staffAvailable,
  staffLoadPercentage,
}: TodayOverviewProps) {
  const { t } = useTranslation('dashboard');
  const { formatPrice } = useFormatPrice();

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground-1">{t('todayOverview.todaysOverview')}</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Total Appointments */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-info-bg flex items-center justify-center">
                <CalendarCheck className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground-1">{appointments}</p>
                <p className="text-[10px] text-foreground-3">{t('todayOverview.appointments')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-success-bg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground-1">{formatPrice(revenue, currency)}</p>
                <p className="text-[10px] text-foreground-3">{t('todayOverview.revenue')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Available */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground-1">{staffAvailable}</p>
                <p className="text-[10px] text-foreground-3">{t('todayOverview.staffAvailable')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Load */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-warning-bg flex items-center justify-center">
                <Activity className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground-1">{staffLoadPercentage}%</p>
                <p className="text-[10px] text-foreground-3">{t('todayOverview.locationLoad')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
