import { Card, CardContent } from '../../../shared/components/ui/card';
import { Activity } from 'lucide-react';

interface RevenueAnalyticsProps {
  revenueThisWeek: number;
  revenueThisMonth: number;
  weeklyLoadPercentage: number;
  monthlyLoadPercentage: number;
}

export function RevenueAnalytics({
  revenueThisWeek,
  revenueThisMonth,
  weeklyLoadPercentage,
  monthlyLoadPercentage
}: RevenueAnalyticsProps) {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-foreground-1">Revenue Analytics</h2>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* This Week */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="space-y-0.5">
              <p className="text-[10px] text-foreground-3">This Week</p>
              <p className="text-lg font-bold text-foreground-1">{formatCurrency(revenueThisWeek)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Load */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-warning-bg flex items-center justify-center">
                <Activity className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground-1">{weeklyLoadPercentage}%</p>
                <p className="text-[10px] text-foreground-3">Week Load</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="space-y-0.5">
              <p className="text-[10px] text-foreground-3">This Month</p>
              <p className="text-lg font-bold text-foreground-1">{formatCurrency(revenueThisMonth)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Load */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-warning-bg flex items-center justify-center">
                <Activity className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground-1">{monthlyLoadPercentage}%</p>
                <p className="text-[10px] text-foreground-3">Month Load</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
