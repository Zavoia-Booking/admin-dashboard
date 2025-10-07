import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { selectCurrentUser } from '../../auth/selectors'
import { Button } from '../../../shared/components/ui/button'
import { AlertCircle, Clock } from 'lucide-react'

export default function TrialBanner() {
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)

  // Only show banner if user has a trial end date
  if (!user?.subscription?.trialEndsAt) {
    return null
  }

  const trialEndDate = new Date(user.subscription.trialEndsAt)
  const now = new Date()
  const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Don't show if trial has ended
  if (daysRemaining <= 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Trial Period Active</h3>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-sm text-gray-600">
              You have <span className="font-semibold text-orange-600">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</span> remaining in your trial. 
              Upgrade now to continue using all features.
            </p>
          </div>
        </div>
        <Button 
          onClick={() => navigate('/upgrade')}
          className="bg-orange-600 hover:bg-orange-700 text-white whitespace-nowrap"
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  )
}

