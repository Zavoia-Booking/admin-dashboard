import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { selectCurrentUser } from '../../auth/selectors'
import { Clock, ArrowRight } from 'lucide-react'
import { usePlatform } from '../../../shared/hooks/usePlatform'

/* Same flat-surface, single-icon, pill-CTA recipe as SubscriptionInfo's
   Banner, kept in the brand terracotta rather than a semantic tone. */
export default function TrialBanner() {
  const { t } = useTranslation('teamMembers')
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)
  const { isNative } = usePlatform()

  // Check trial status using entitlements
  const isTrial = user?.entitlements?.status === 'trial'
  const isExpired = user?.entitlements?.status === 'expired'
  const daysRemaining = user?.entitlements?.daysRemaining || 0

  // Don't show banner if not in trial, expired, or running natively
  // (native hides upgrade CTAs to comply with Apple 3.1.1 / 3.1.3(a) / Play Store policy)
  if (!isTrial || isExpired || isNative) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3 min-w-0">
        <Clock className="h-4 w-4 shrink-0 mt-0.5 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground-1">{t('trialBanner.title')}</p>
          <p className="text-[13px] text-foreground-2">
            {t('trialBanner.daysRemaining', { count: daysRemaining })}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate('/account?tab=billing')}
        className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover md:w-auto"
      >
        {t('trialBanner.upgradeNow')}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

