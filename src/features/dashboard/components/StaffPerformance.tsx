import { Card, CardContent } from '../../../shared/components/ui/card';
import { Avatar, AvatarFallback } from '../../../shared/components/ui/avatar';
import { Progress } from '../../../shared/components/ui/progress';
import { 
  Star,
  Clock
} from 'lucide-react';
import type { StaffMember } from '../types';

interface StaffPerformanceProps {
  staffPerformance: StaffMember[];
}

export function StaffPerformance({
  staffPerformance
}: StaffPerformanceProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getUtilizationPercentage = (booked: number, available: number) => {
    if (available === 0) return 0;
    return Math.round((booked / available) * 100);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground-1">Staff Performance</h2>

      {/* Staff Performance List */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {staffPerformance.map((staff) => {
              const utilization = getUtilizationPercentage(staff.bookedMinutes, staff.availableMinutes);
              
              return (
                <div key={staff.id} className="p-4 rounded-lg bg-surface-hover border border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-sm bg-primary/10 text-primary">
                          {getInitials(staff.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground-1">{staff.name}</p>
                        <p className="text-sm text-foreground-3">{staff.role}</p>
                      </div>
                    </div>
                    {staff.rating && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-warning-bg border border-warning-border">
                        <Star className="h-4 w-4 text-warning fill-warning" />
                        <span className="text-sm font-semibold text-warning">{staff.rating}</span>
                        <span className="text-xs text-warning/70">({staff.reviewCount})</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">

                    {/* Booked Time */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-foreground-3">
                        <Clock className="h-3 w-3" />
                        <span>Booked</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground-1">
                        {Math.floor(staff.bookedMinutes / 60)}h {staff.bookedMinutes % 60}m
                      </p>
                    </div>

                    {/* Utilization */}
                    <div className="space-y-1">
                      <p className="text-xs text-foreground-3">Utilization</p>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={utilization} 
                          className={`h-2 flex-1 ${
                            utilization >= 80 ? '[&>[data-slot=indicator]]:bg-success' :
                            utilization >= 50 ? '[&>[data-slot=indicator]]:bg-warning' :
                            '[&>[data-slot=indicator]]:bg-error'
                          }`}
                        />
                        <span className={`text-sm font-semibold ${
                          utilization >= 80 ? 'text-success' :
                          utilization >= 50 ? 'text-warning' :
                          'text-error'
                        }`}>
                          {utilization}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
