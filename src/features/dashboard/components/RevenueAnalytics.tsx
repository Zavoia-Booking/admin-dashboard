import { Card, CardContent } from '../../../shared/components/ui/card';

interface RevenueAnalyticsProps {
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  averageTicketValue: number;
}

export function RevenueAnalytics({
  revenueThisWeek,
  revenueThisMonth,
  revenueLastMonth,
  averageTicketValue
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

        {/* This Month */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="space-y-0.5">
              <p className="text-[10px] text-foreground-3">This Month</p>
              <p className="text-lg font-bold text-foreground-1">{formatCurrency(revenueThisMonth)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Last Month */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="space-y-0.5">
              <p className="text-[10px] text-foreground-3">Last Month</p>
              <p className="text-lg font-bold text-foreground-1">{formatCurrency(revenueLastMonth)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Average Ticket */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="space-y-0.5">
              <p className="text-[10px] text-foreground-3">Avg. Booking Cost</p>
              <p className="text-lg font-bold text-foreground-1">${averageTicketValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
