import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

import { Calendar, Clock, CircleOff } from 'lucide-react';
import { WizardData } from '@/hooks/useSetupWizard';

interface Step4Props {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

const Step4Schedule: React.FC<Step4Props> = ({ data, onUpdate }) => {
  const updateScheduleDay = (dayIndex: number, field: 'open' | 'close' | 'isClosed', value: string | boolean) => {
    const newSchedule = [...data.schedule];
    newSchedule[dayIndex] = { ...newSchedule[dayIndex], [field]: value };
    onUpdate({ schedule: newSchedule });
  };



  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">When are you available?</h3>
          <p className="text-sm text-muted-foreground">Set your working hours and availability</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Working Hours */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Working Hours</Label>
          <div className="space-y-3">
            {data.schedule.map((day, index) => (
              <div key={day.day} className="p-3 bg-muted/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-20 text-sm font-medium shrink-0">{day.day.slice(0, 3)}</div>
                  {day.isClosed ? (
                    <button
                      type="button"
                      className="px-2 py-0 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-medium"
                      onClick={() => updateScheduleDay(index, 'isClosed', false)}
                    >
                      Mark as Open
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="px-2 py-0 rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs font-medium"
                      onClick={() => updateScheduleDay(index, 'isClosed', true)}
                    >
                      Mark as Closed
                    </button>
                  )}
                </div>
                {day.isClosed ? (
                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-full text-red-700 text-sm font-medium">
                      <CircleOff className="h-4 w-4" />
                      Closed
                    </span>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Opening Time</Label>
                      <Input
                        type="time"
                        value={day.open}
                        onChange={(e) => updateScheduleDay(index, 'open', e.target.value)}
                        onClick={(e) => {
                          e.currentTarget.showPicker?.();
                        }}
                        className="h-9 text-center cursor-pointer"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Closing Time</Label>
                      <Input
                        type="time"
                        value={day.close}
                        onChange={(e) => updateScheduleDay(index, 'close', e.target.value)}
                        onClick={(e) => {
                          e.currentTarget.showPicker?.();
                        }}
                        className="h-9 text-center cursor-pointer"
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>




      </div>
    </div>
  );
};

export default Step4Schedule; 