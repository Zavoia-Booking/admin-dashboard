import { useTranslation } from 'react-i18next';
import { DollarSign, AlertCircle, Info } from 'lucide-react';

interface RevenueSnapshotWidgetProps {
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
}

function formatCurrency(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'ro' ? 'ro-RO' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInsight(
  today: number,
  week: number,
  month: number,
  t: (key: string) => string
): { text: string; type: 'warning' | 'info' | 'neutral' } {
  if (today === 0 && week === 0 && month === 0) {
    return { text: t('revenue.noRevenueYet'), type: 'neutral' };
  }
  if (today === 0) {
    return { text: t('revenue.noRevenueToday'), type: 'warning' };
  }
  if (month > 0 && week < month * 0.1) {
    return { text: t('revenue.revenueOutsideWeek'), type: 'info' };
  }
  return { text: t('revenue.noBaseline'), type: 'neutral' };
}

export function RevenueSnapshotWidget({
  revenueToday,
  revenueThisWeek,
  revenueThisMonth,
}: RevenueSnapshotWidgetProps) {
  const { t, i18n } = useTranslation('dashboard');
  const insight = getInsight(revenueToday, revenueThisWeek, revenueThisMonth, t);
  const locale = i18n.language;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-success-bg flex items-center justify-center">
          <DollarSign className="h-3.5 w-3.5 text-success" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-3">{t('revenue.title')}</p>
      </div>

      {/* Hero: monthly */}
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground-3">{t('revenue.thisMonth')}</p>
        <p className="text-4xl font-bold text-foreground-1 tabular-nums leading-none mt-1">
          {formatCurrency(revenueThisMonth, locale)}
        </p>
      </div>

      {/* Sub-metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl bg-surface-hover border border-border-subtle">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-foreground-3">{t('revenue.today')}</p>
          <p className="text-base font-bold text-foreground-1 tabular-nums mt-0.5">
            {formatCurrency(revenueToday, locale)}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-surface-hover border border-border-subtle">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-foreground-3">{t('revenue.thisWeek')}</p>
          <p className="text-base font-bold text-foreground-1 tabular-nums mt-0.5">
            {formatCurrency(revenueThisWeek, locale)}
          </p>
        </div>
      </div>

      {/* Insight */}
      <div className="flex items-start gap-1.5 border-t border-border-subtle pt-2">
        {insight.type === 'warning' ? (
          <AlertCircle className="h-3 w-3 text-warning mt-0.5 shrink-0" />
        ) : (
          <Info className="h-3 w-3 text-foreground-3 mt-0.5 shrink-0" />
        )}
        <p className={`text-[10px] leading-relaxed ${insight.type === 'warning' ? 'text-warning' : 'text-foreground-3'}`}>
          {insight.text}
        </p>
      </div>
    </div>
  );
}
