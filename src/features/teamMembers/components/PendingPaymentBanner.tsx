import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { selectTeamMembersSummary } from '../selectors'
import { Button } from '../../../shared/components/ui/button'
import { AlertCircle, CreditCard } from 'lucide-react'

export default function PendingPaymentBanner() {
  const navigate = useNavigate()
  const summary = useSelector(selectTeamMembersSummary)

  // Only show banner if there are members with pending payment
  if (!summary || summary.pendingPayment === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Payment Required</h3>
              <CreditCard className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-sm text-gray-600">
              You have <span className="font-semibold text-amber-600">{summary.pendingPayment} team {summary.pendingPayment === 1 ? 'member' : 'members'}</span> awaiting payment. 
              Complete the payment to send their invitations.
            </p>
          </div>
        </div>
        <Button 
          onClick={() => navigate('/pending-payment')}
          className="bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap"
        >
          Pay Now
        </Button>
      </div>
    </div>
  )
}

