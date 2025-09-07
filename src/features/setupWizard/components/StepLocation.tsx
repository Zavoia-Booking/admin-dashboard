import React, { useEffect } from 'react';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { MapPin, Wifi } from 'lucide-react';
import type { WizardData } from '../../../shared/hooks/useSetupWizard';
import { useForm } from 'react-hook-form';
import type { WorkingHours } from '../../../shared/types/location';
import type { StepProps } from '../types';

const StepLocation: React.FC<StepProps> = ({ data, onUpdate }) => {
  const { register, watch, setValue, reset } = useForm<WizardData>({ defaultValues: data });

  useEffect(() => {
    reset(data);
  }, [data, reset]);

  useEffect(() => {
    const sub = watch((values) => onUpdate(values as Partial<WizardData>));
    return () => sub?.unsubscribe?.();
  }, [watch, onUpdate]);

  const currentWorkingHours = (watch('location') as any)?.workingHours as WorkingHours;

  const updateWorkingHours = (day: keyof WorkingHours, field: 'open' | 'close' | 'isOpen', value: string | boolean) => {
    const updated: WorkingHours = {
      ...currentWorkingHours,
      [day]: {
        ...currentWorkingHours[day],
        [field]: value as any,
      },
    } as WorkingHours;
    const current = watch();
    reset({
      ...current,
      location: {
        ...(current as any).location,
        workingHours: updated,
      },
    } as any);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Where do you serve customers?</h3>
          <p className="text-sm text-muted-foreground">Help customers find and visit your business</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Remote Services Toggle */}
        <div className="bg-accent/20 border border-accent/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wifi className="h-5 w-5 text-primary" />
              <div>
                <Label htmlFor="isRemote" className="text-sm font-medium">
                  I offer remote/online services
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Video calls, consultations, virtual training, etc.
                </p>
              </div>
            </div>
            <Switch
              id="isRemote"
              checked={!!(watch('location') as any)?.isRemote}
              onCheckedChange={(checked) => setValue('location.isRemote' as any, checked, { shouldDirty: true, shouldTouch: true })}
              className={`!h-5 !w-9 !min-h-0 !min-w-0 ${((watch('location') as any)?.isRemote) ? 'bg-green-500' : 'bg-red-500'}`}
            />
          </div>
        </div>

        {/* Physical Location */}
        {!((watch('location') as any)?.isRemote) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location.name" className="text-sm font-medium">
                Location Name *
              </Label>
              <Input id="location.name" placeholder="Main Location" className="h-11" {...register('location.name' as any)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location.address" className="text-sm font-medium">
                Address *
              </Label>
              <Input id="location.address" placeholder="123 Main Street" className="h-11" {...register('location.address' as any)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location.email" className="text-sm font-medium">Location Email *</Label>
                <Input id="location.email" type="email" placeholder="frontdesk@business.com" className="h-11" {...register('location.email' as any)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location.phone" className="text-sm font-medium">Location Phone *</Label>
                <Input id="location.phone" type="tel" placeholder="+1 555 123 4567" className="h-11" {...register('location.phone' as any)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location.description" className="text-sm font-medium">Description</Label>
              <Input id="location.description" placeholder="Describe this location (optional)" className="h-11" {...register('location.description' as any)} />
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium">Working Hours</Label>
              <div className="space-y-3">
                {(Object.entries(currentWorkingHours) as [keyof WorkingHours, WorkingHours['monday']][]).map(([day, hours]) => (
                  <div key={day} className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-20 text-sm font-medium shrink-0 capitalize">{String(day).slice(0, 3)}</div>
                      {hours.isOpen ? (
                        <button
                          type="button"
                          className="px-2 py-0 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-medium"
                          onClick={() => updateWorkingHours(day, 'isOpen', false)}
                        >
                          Mark as Closed
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="px-2 py-0 rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs font-medium"
                          onClick={() => updateWorkingHours(day, 'isOpen', true)}
                        >
                          Mark as Open
                        </button>
                      )}
                    </div>
                    {hours.isOpen ? (
                      <>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Opening Time</Label>
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => updateWorkingHours(day, 'open', e.target.value)}
                            onClick={(e) => {
                              (e.currentTarget as any).showPicker?.();
                            }}
                            className="h-9 text-center cursor-pointer"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Closing Time</Label>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => updateWorkingHours(day, 'close', e.target.value)}
                            onClick={(e) => {
                              (e.currentTarget as any).showPicker?.();
                            }}
                            className="h-9 text-center cursor-pointer"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-center">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-full text-red-700 text-sm font-medium">
                          Closed
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 border border-muted rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Google Maps Integration
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {`We'll automatically create a map pin for your business location to help customers find you easily.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {((watch('location') as any)?.isRemote) && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Wifi className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-800 mb-1">
                    Perfect for remote services!
                  </p>
                  <p className="text-xs text-emerald-700">
                    Your customers will be able to book online sessions and video consultations directly through your booking page.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location.name" className="text-sm font-medium">Online Location Name *</Label>
                <Input id="location.name" placeholder="Online" className="h-11" {...register('location.name' as any)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location.timezone" className="text-sm font-medium">Timezone *</Label>
                <Input id="location.timezone" placeholder="America/New_York" className="h-11" {...register('location.timezone' as any)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location.email" className="text-sm font-medium">Contact Email</Label>
                <Input id="location.email" type="email" placeholder="support@business.com" className="h-11" {...register('location.email' as any)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location.phone" className="text-sm font-medium">Contact Phone</Label>
                <Input id="location.phone" type="tel" placeholder="+1 555 123 4567" className="h-11" {...register('location.phone' as any)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Working Hours</Label>
              <div className="space-y-3">
                {(Object.entries(currentWorkingHours) as [keyof WorkingHours, WorkingHours['monday']][]).map(([day, hours]) => (
                  <div key={day} className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-20 text-sm font-medium shrink-0 capitalize">{String(day).slice(0, 3)}</div>
                      {hours.isOpen ? (
                        <button
                          type="button"
                          className="px-2 py-0 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-medium"
                          onClick={() => updateWorkingHours(day, 'isOpen', false)}
                        >
                          Mark as Closed
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="px-2 py-0 rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs font-medium"
                          onClick={() => updateWorkingHours(day, 'isOpen', true)}
                        >
                          Mark as Open
                        </button>
                      )}
                    </div>
                    {hours.isOpen ? (
                      <>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Opening Time</Label>
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => updateWorkingHours(day, 'open', e.target.value)}
                            onClick={(e) => {
                              (e.currentTarget as any).showPicker?.();
                            }}
                            className="h-9 text-center cursor-pointer"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Closing Time</Label>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => updateWorkingHours(day, 'close', e.target.value)}
                            onClick={(e) => {
                              (e.currentTarget as any).showPicker?.();
                            }}
                            className="h-9 text-center cursor-pointer"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-center">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-full text-red-700 text-sm font-medium">
                          Closed
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepLocation; 