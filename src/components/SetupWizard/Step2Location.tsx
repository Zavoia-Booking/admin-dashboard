import React from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { MapPin, Wifi } from 'lucide-react';
import { WizardData } from '../../hooks/useSetupWizard';

interface Step2Props {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

const Step2Location: React.FC<Step2Props> = ({ data, onUpdate }) => {
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
              checked={data.isRemote}
              onCheckedChange={(checked) => onUpdate({ isRemote: checked })}
              className={`!h-5 !w-9 !min-h-0 !min-w-0 ${data.isRemote ? 'bg-green-500' : 'bg-red-500'}`}
            />
          </div>
        </div>

        {/* Physical Location */}
        {!data.isRemote && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
                Business Address *
              </Label>
              <Input
                id="address"
                value={data.address}
                onChange={(e) => onUpdate({ address: e.target.value })}
                placeholder="123 Main Street"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium">
                City *
              </Label>
              <Input
                id="city"
                value={data.city}
                onChange={(e) => onUpdate({ city: e.target.value })}
                placeholder="New York, NY"
                className="h-11"
              />
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

        {data.isRemote && (
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
        )}
      </div>
    </div>
  );
};

export default Step2Location; 