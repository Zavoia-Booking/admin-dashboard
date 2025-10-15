import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card'
import { Button } from '../../../shared/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

export default function SubscriptionSuccessPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-svh flex items-center justify-center bg-muted p-6">
      <div className="w-full max-w-lg">
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Thank you for your trust!</CardTitle>
            <CardDescription>
              Your subscription is active. You can now use the application at its full capabilities.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


