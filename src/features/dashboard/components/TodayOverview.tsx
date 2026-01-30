import { Card, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { 
  DollarSign, 
  CalendarCheck,
  Users,
  Activity
} from 'lucide-react';
import type { AppointmentsByStatus } from '../types';

interface TodayOverviewProps {
  appointments: AppointmentsByStatus;
  revenueToday: number;
  isCurrentlyOpen: boolean;
  staffAvailable?: number;
  staffLoadPercentage?: number;
}

export function TodayOverview({ 
  appointments, 
  revenueToday, 
  isCurrentlyOpen,
  staffAvailable,
  staffLoadPercentage
}: TodayOverviewProps) {
  const totalAppointments = Object.values(appointments).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground-1">Today's Overview</h2>
        <Badge variant={isCurrentlyOpen ? 'default' : 'secondary'} className={`text-xs ${isCurrentlyOpen ? 'bg-success text-white' : ''}`}>
          {isCurrentlyOpen ? 'Open' : 'Closed'}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Total Appointments */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-info-bg flex items-center justify-center">
                <CalendarCheck className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground-1">{totalAppointments}</p>
                <p className="text-[10px] text-foreground-3">Appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-success-bg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground-1">${revenueToday.toLocaleString()}</p>
                <p className="text-[10px] text-foreground-3">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Available */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground-1">{staffAvailable ?? 0}</p>
                <p className="text-[10px] text-foreground-3">Staff Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Load */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-warning-bg flex items-center justify-center">
                <Activity className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground-1">{staffLoadPercentage ?? 0}%</p>
                <p className="text-[10px] text-foreground-3">Location Load</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
