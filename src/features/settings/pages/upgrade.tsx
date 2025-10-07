import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Loader2, CheckCircle2, Users, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card'
import { Button } from '../../../shared/components/ui/button'
import { Separator } from '../../../shared/components/ui/separator'
import { getPricingSummary, createCheckoutSession } from '../api'
import type { PricingSummary } from '../types'
import { toast } from 'sonner'

export default function UpgradePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [pricingSummary, setPricingSummary] = useState<PricingSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPricingSummary()
  }, [])

  const loadPricingSummary = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getPricingSummary()
      setPricingSummary(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load pricing information')
      toast.error('Failed to load pricing information')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async () => {
    if (!pricingSummary) return

    try {
      setCheckoutLoading(true)
      const response = await createCheckoutSession({
        seats: pricingSummary.currentTeamMembersCount > 0 ? pricingSummary.currentTeamMembersCount : undefined,
        successUrl: `${window.location.origin}/subscription-success`,
        cancelUrl: `${window.location.origin}/upgrade`,
      })

      // Redirect to Stripe Checkout
      window.location.href = response.url
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to start checkout')
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-muted p-6">
      <div className="w-full max-w-2xl relative">
        {/* Close Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute -top-2 -right-2 z-10 h-10 w-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">Upgrade Your Plan</CardTitle>
            <CardDescription className="text-base">
              Get full access to all features and unlock your team's potential
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Loading pricing details...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <Button variant="outline" onClick={loadPricingSummary}>
                  Try Again
                </Button>
              </div>
            ) : pricingSummary ? (
              <>
                {/* Pricing Breakdown */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Cost Breakdown
                  </h3>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    {/* Dynamic Breakdown Items */}
                    {pricingSummary.breakdown.map((item, index) => (
                      <div key={index}>
                        {index > 0 && <Separator className="my-3" />}
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-2">
                            {index === 0 ? (
                              <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                            ) : (
                              <Users className="h-4 w-4 text-purple-600 mt-0.5" />
                            )}
                            <div>
                              <div className="text-sm font-medium">{item.description}</div>
                              {item.quantity > 1 && (
                                <div className="text-xs text-muted-foreground">
                                  {item.quantity} × {pricingSummary.currency}{item.unitPrice.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="font-semibold">
                            {pricingSummary.currency}{item.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}

                    <Separator className="my-3" />

                    {/* Total */}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-base font-bold">Total per month</span>
                      <span className="text-2xl font-bold text-primary">
                        {pricingSummary.currency}{pricingSummary.totalMonthlyCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">What's Included</h3>
                  <ul className="space-y-2">
                    {[
                      'Unlimited bookings and appointments',
                      'Advanced calendar management',
                      'Custom branding and domain',
                      'Priority customer support',
                      'Analytics and reporting',
                      'Integration with payment providers',
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleUpgrade}
                    disabled={checkoutLoading}
                    className="flex-1 h-12 text-base font-semibold"
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Upgrade Now'
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
                  You'll be redirected to our secure payment processor to complete your purchase.
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
