import { AppLayout } from '../../../../shared/components/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/card';

export default function MyAssignmentsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-4 w-full border-b border-border-strong hidden md:block">
          <h1 className="px-4 pb-3 text-sm font-medium text-foreground md:text-2xl">
            My Assignments
          </h1>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Your Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              My Assignments page coming soon...
            </p>
            {/* Tabs: Services, Bundles, Locations */}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
