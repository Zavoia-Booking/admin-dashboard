import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Avatar, AvatarFallback } from '../../../shared/components/ui/avatar';
import { 
  CheckCircle,
  XCircle,
  MapPin
} from 'lucide-react';
import type { StaffMember } from '../types';

interface CalendarAvailabilityProps {
  staffAvailabilityToday: StaffMember[];
  isOpen247: boolean;
  isCurrentlyOpen: boolean;
}

export function CalendarAvailability({
  staffAvailabilityToday,
  isOpen247,
  isCurrentlyOpen
}: CalendarAvailabilityProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground-1">Calendar & Availability</h2>

      {/* Open/Closed Status */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                isCurrentlyOpen ? 'bg-success-bg' : 'bg-error-bg'
              }`}>
                <MapPin className={`h-6 w-6 ${isCurrentlyOpen ? 'text-success' : 'text-error'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground-1">Location Status</p>
                  <Badge className={isCurrentlyOpen ? 'bg-success' : 'bg-error'}>
                    {isCurrentlyOpen ? 'Open' : 'Closed'}
                  </Badge>
                </div>
                {isOpen247 && (
                  <p className="text-sm text-foreground-3">Open 24/7</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Availability Today */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-foreground-1">Staff Availability Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {staffAvailabilityToday.map((staff) => (
              <div 
                key={staff.id}
                className={`p-3 rounded-lg border ${
                  staff.isOnDuty 
                    ? 'bg-success-bg border-success-border' 
                    : 'bg-surface-hover border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={`text-sm ${
                      staff.isOnDuty 
                        ? 'bg-success/20 text-success' 
                        : 'bg-surface-active text-foreground-3'
                    }`}>
                      {getInitials(staff.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground-1 truncate">{staff.name}</p>
                    <p className="text-xs text-foreground-3 truncate">{staff.role}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {staff.isOnDuty ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-xs text-success font-medium">Working</span>
                      <span className="text-xs text-success">• {staff.appointmentsToday} appts</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-foreground-3" />
                      <span className="text-xs text-foreground-3 font-medium">Off Today</span>
                    </>
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
