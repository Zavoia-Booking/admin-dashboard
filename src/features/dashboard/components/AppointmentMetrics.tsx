import { Card, CardContent } from '../../../shared/components/ui/card';
import { Calendar, Activity } from 'lucide-react';

interface AppointmentMetricsProps {
  weeklyAppointments: number;
  monthlyAppointments: number;
  weeklyLoadPercentage: number;
  monthlyLoadPercentage: number;
}

export function AppointmentMetrics({
  weeklyAppointments,
  monthlyAppointments,
  weeklyLoadPercentage,
  monthlyLoadPercentage
}: AppointmentMetricsProps) {

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-foreground-1">Appointment Metrics</h2>

      {/* Weekly & Monthly Overview */}
      <div className="grid grid-cols-4 gap-2">
        {/* This Week */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-info-bg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground-1">{weeklyAppointments}</p>
                <p className="text-[10px] text-foreground-3">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Load */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-warning-bg flex items-center justify-center">
                <Activity className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground-1">{weeklyLoadPercentage}%</p>
                <p className="text-[10px] text-foreground-3">Week Load</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground-1">{monthlyAppointments}</p>
                <p className="text-[10px] text-foreground-3">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Load */}
        <Card className="py-3">
          <CardContent className="p-0 px-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-warning-bg flex items-center justify-center">
                <Activity className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground-1">{monthlyLoadPercentage}%</p>
                <p className="text-[10px] text-foreground-3">Month Load</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
