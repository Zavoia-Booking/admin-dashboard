import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { 
  Scissors,
  Package,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { ServiceStats } from '../types';

interface ServicesAnalyticsProps {
  topServices: ServiceStats[];
  servicesByBookingType: { single: number; bundle: number };
}

export function ServicesAnalytics({
  topServices,
  servicesByBookingType
}: ServicesAnalyticsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalBookings = servicesByBookingType.single + servicesByBookingType.bundle;
  const singlePercentage = Math.round((servicesByBookingType.single / totalBookings) * 100);
  const bundlePercentage = Math.round((servicesByBookingType.bundle / totalBookings) * 100);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground-1">Services Analytics</h2>

      {/* Booking Type Breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="py-4">
          <CardContent className="p-0 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-info-bg flex items-center justify-center">
                  <Scissors className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground-1">{servicesByBookingType.single}</p>
                  <p className="text-sm text-foreground-3">Single Services</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-info-bg text-info border-info-border">
                {singlePercentage}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="p-0 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground-1">{servicesByBookingType.bundle}</p>
                  <p className="text-sm text-foreground-3">Bundle Bookings</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {bundlePercentage}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Booked Services */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            Most Booked Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topServices.slice(0, 6).map((service, index) => (
              <div 
                key={service.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-surface-hover border border-border"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold
                    ${index === 0 ? 'bg-primary/10 text-primary' : 
                      index === 1 ? 'bg-info/10 text-info' : 
                      index === 2 ? 'bg-success/10 text-success' : 
                      'bg-surface-active text-foreground-3'}`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground-1 truncate">{service.name}</p>
                      {service.bookingType === 'bundle' && (
                        <Badge variant="secondary" className="text-xs">Bundle</Badge>
                      )}
                    </div>
                    <p className="text-xs text-foreground-3">{service.categoryName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground-1">{service.appointmentCount}</p>
                    <p className="text-xs text-foreground-3">bookings</p>
                  </div>
                  <div className="text-right min-w-20">
                    <p className="text-sm font-semibold text-success">{formatCurrency(service.revenue)}</p>
                    <p className="text-xs text-foreground-3">revenue</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Availability */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Service Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {topServices.map((service) => (
              <div 
                key={service.id}
                className={`p-3 rounded-lg border ${
                  service.isEnabled 
                    ? 'bg-surface border-border' 
                    : 'bg-surface-hover border-border opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground-1 truncate">{service.name}</p>
                    <p className="text-xs text-foreground-3">{service.categoryName}</p>
                  </div>
                  {service.isEnabled ? (
                    <div className="flex items-center gap-1 text-success">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-foreground-3">
                      <XCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Disabled</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
