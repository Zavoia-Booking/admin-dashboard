import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Loader2, Users, CreditCard, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card'
import { Button } from '../../../shared/components/ui/button'
import { Separator } from '../../../shared/components/ui/separator'
import { Badge } from '../../../shared/components/ui/badge'
import { getPendingPaymentCost, updateSeats } from '../api'
import type { PendingPaymentCost } from '../types'
import { toast } from 'sonner'
import { loadStripe } from '@stripe/stripe-js'

export default function PendingPaymentPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [pendingCost, setPendingCost] = useState<PendingPaymentCost | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPendingPaymentCost()
  }, [])

  const loadPendingPaymentCost = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getPendingPaymentCost()
      
      if (!data.hasPendingPayments) {
        toast.info('No pending payments found')
        navigate('/team-members')
        return
      }
      
      setPendingCost(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load pending payment information')
      toast.error('Failed to load pending payment information')
    } finally {
      setLoading(false)
    }
  }

  const handlePayNow = async () => {
    if (!pendingCost) return

    try {
      setCheckoutLoading(true)
      // Send new total seats (current + pending)
      const newTotalSeats = pendingCost.newTotalSeats || (pendingCost.currentPaidSeats || 0) + pendingCost.pendingPaymentCount
      
      const response = await updateSeats({
        seats: newTotalSeats,
        successUrl: `${window.location.origin}/subscription-success`,
        cancelUrl: `${window.location.origin}/pending-payment`,
      })

      // Check if payment requires additional authentication
      if (response.requiresAction && response.clientSecret) {
        // Handle client-side payment confirmation
        const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
        
        if (!publishableKey) {
          throw new Error('Stripe publishable key not configured')
        }

        const stripe = await loadStripe(publishableKey)
        if (!stripe) {
          throw new Error('Failed to load Stripe')
        }

        // Confirm the payment - this will open Stripe's payment UI if needed
        const { error } = await stripe.confirmCardPayment(response.clientSecret)

        if (error) {
          toast.error(error.message || 'Payment failed')
          setCheckoutLoading(false)
        } else {
          // Payment confirmed - redirect to success page
          toast.success('Payment confirmed! Team members activated.')
          navigate('/subscription-success')
        }
      } else if (response.url) {
        // Redirect to Stripe payment page (Checkout flow)
        window.location.href = response.url
      } else {
        // Payment completed without additional action
        toast.success('Seats updated successfully!')
        navigate('/team-members')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update seats')
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-muted p-6">
      <div className="w-full max-w-2xl relative">
        {/* Close Button */}
        <button
          onClick={() => navigate('/team-members')}
          className="absolute -top-2 -right-2 z-10 h-10 w-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">Complete Payment</CardTitle>
            <CardDescription className="text-base">
              Pay for pending team member seats to send their invitations
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Loading payment details...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <Button variant="outline" onClick={loadPendingPaymentCost}>
                  Try Again
                </Button>
              </div>
            ) : pendingCost ? (
              <>
                {/* Pending Users List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-amber-600" />
                    Pending Team Members ({pendingCost.pendingPaymentCount})
                  </h3>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                    {pendingCost.pendingUsers.map((user, index) => (
                      <div key={user.id}>
                        {index > 0 && <Separator className="my-3" />}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                              {user.email[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{user.email}</div>
                              <div className="text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {user.role}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-amber-100 text-amber-800">
                            Pending Payment
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    Payment Details
                  </h3>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    {/* Seat Cost */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium">Additional Seats</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {pendingCost.pendingPaymentCount} × {pendingCost.currency}{pendingCost.pricePerSeat.toFixed(2)}/seat
                      </span>
                    </div>

                    <Separator className="my-3" />

                    {/* Total */}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-base font-bold">Total Monthly Cost</span>
                      <span className="text-2xl font-bold text-primary">
                        {pendingCost.currency}{pendingCost.totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Seat Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-900">Current paid seats:</span>
                      <span className="font-semibold text-blue-900">{pendingCost.currentPaidSeats}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-blue-900">Total seats after payment:</span>
                      <span className="font-bold text-blue-900">{pendingCost.newTotalSeats}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handlePayNow}
                    disabled={checkoutLoading}
                    className="flex-1 h-12 text-base font-semibold"
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Pay Now'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/team-members')}
                    disabled={checkoutLoading}
                    className="h-12"
                  >
                    Cancel
                  </Button>
                </div>

                {/* Note */}
                <p className="text-xs text-center text-muted-foreground">
                  After payment, invitations will be sent to all pending team members.
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

