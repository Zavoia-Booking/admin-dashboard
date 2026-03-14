import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';

interface AppointmentDistribution {
  pending: number;
  confirmed: number;
  completed: number;
  no_show: number;
  cancelled: number;
}

interface BusinessHealthSummaryWidgetProps {
  weeklyLoadPercentage: number;
  monthlyLoadPercentage: number;
  weeklyDistribution: AppointmentDistribution;
  monthlyDistribution: AppointmentDistribution;
  totalReviews: number;
  monthlyAppointments: number;
}

type Severity = 'warning' | 'info' | 'success' | 'neutral';

interface Observation {
  text: string;
  severity: Severity;
}

const SEVERITY_STYLES: Record<Severity, { dot: string; text: string; bg: string }> = {
  warning: { dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning-bg border-warning-border' },
  info: { dot: 'bg-info', text: 'text-info', bg: 'bg-info-bg border-info-border' },
  success: { dot: 'bg-success', text: 'text-success', bg: 'bg-success-bg border-success-border' },
  neutral: { dot: 'bg-foreground-3', text: 'text-foreground-2', bg: 'bg-surface-hover border-border-subtle' },
};

function deriveObservations(
  props: BusinessHealthSummaryWidgetProps,
  t: (key: string, opts?: Record<string, number>) => string
): Observation[] {
  const {
    weeklyLoadPercentage,
    monthlyLoadPercentage,
    monthlyDistribution,
    totalReviews,
  } = props;

  const observations: Observation[] = [];

  // 1. Utilization insight
  const avgLoad = (weeklyLoadPercentage + monthlyLoadPercentage) / 2;
  if (avgLoad < 20) {
    observations.push({
      text: t('businessHealth.lowUtilization'),
      severity: 'warning',
    });
  } else if (avgLoad < 50) {
    observations.push({
      text: t('businessHealth.moderateUtilization'),
      severity: 'info',
    });
  } else if (avgLoad >= 80) {
    observations.push({
      text: t('businessHealth.highCapacity'),
      severity: 'success',
    });
  } else {
    observations.push({
      text: t('businessHealth.healthyUtilization'),
      severity: 'success',
    });
  }

  // 2. Appointment pipeline state
  const monthlyTotal = Object.values(monthlyDistribution).reduce((a, b) => a + b, 0);
  if (monthlyTotal === 0) {
    observations.push({
      text: t('businessHealth.noAppointmentsMonth'),
      severity: 'neutral',
    });
  } else if (monthlyDistribution.completed === 0 && monthlyTotal > 0) {
    observations.push({
      text: t('businessHealth.confirmedNotCompleted'),
      severity: 'info',
    });
  } else if (monthlyDistribution.completed === monthlyTotal) {
    observations.push({
      text: t('businessHealth.allCompleted'),
      severity: 'success',
    });
  } else {
    const cancelRate = monthlyTotal > 0
      ? Math.round((monthlyDistribution.cancelled / monthlyTotal) * 100)
      : 0;
    if (cancelRate > 20) {
      observations.push({
        text: t('businessHealth.elevatedCancelRate', { pct: cancelRate }),
        severity: 'warning',
      });
    } else {
      const completedPct = Math.round((monthlyDistribution.completed / monthlyTotal) * 100);
      observations.push({
        text: t('businessHealth.completedPct', { pct: completedPct }),
        severity: completedPct > 50 ? 'success' : 'info',
      });
    }
  }

  // 3. Review activity
  if (totalReviews === 0) {
    observations.push({
      text: t('businessHealth.noReviewActivity'),
      severity: 'neutral',
    });
  } else if (totalReviews < 5) {
    observations.push({
      text: totalReviews === 1
        ? t('businessHealth.earlyReviewData', { count: totalReviews })
        : t('businessHealth.earlyReviewDataPlural', { count: totalReviews }),
      severity: 'info',
    });
  } else {
    observations.push({
      text: t('businessHealth.reviewsCollected', { count: totalReviews }),
      severity: 'success',
    });
  }

  return observations.slice(0, 3);
}

export function BusinessHealthSummaryWidget(props: BusinessHealthSummaryWidgetProps) {
  const { t } = useTranslation('dashboard');
  const observations = deriveObservations(props, t);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Activity className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-3">
            {t('businessHealth.title')}
          </p>
          <p className="text-[9px] text-foreground-3 mt-0.5">{t('businessHealth.subtitle')}</p>
        </div>
      </div>

      {/* Observations */}
      <div className="flex flex-col gap-2 flex-1">
        {observations.map((obs, i) => {
          const styles = SEVERITY_STYLES[obs.severity];
          return (
            <div
              key={i}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${styles.bg}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${styles.dot}`} />
              <p className={`text-xs leading-relaxed ${styles.text}`}>{obs.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
