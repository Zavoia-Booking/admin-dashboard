import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { selectCurrentUser } from '../../auth/selectors'
import { Button } from '../../../shared/components/ui/button'
import { AlertCircle, Clock } from 'lucide-react'
import { usePlatform } from '../../../shared/hooks/usePlatform'

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
    <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-amber-50 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground-1">{t('trialBanner.title')}</h3>
              <AlertCircle className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm text-foreground-3">
              {t('trialBanner.daysRemaining', { count: daysRemaining })}
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate('/account?tab=billing')}
          className="bg-primary hover:bg-primary-hover text-white whitespace-nowrap"
        >
          {t('trialBanner.upgradeNow')}
        </Button>
      </div>
    </div>
  )
}

