import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { MessageCircle } from 'lucide-react';

export default function SupportPage() {
  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold">Support</h1>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>How can we help you?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Support page coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

