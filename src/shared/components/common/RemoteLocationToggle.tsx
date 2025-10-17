import React from 'react';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Wifi } from 'lucide-react';

export interface RemoteLocationToggleProps {
  isRemote: boolean;
  onChange: (isRemote: boolean) => void;
  label?: string;
  descriptionOn?: string;
  descriptionOff?: string;
  className?: string;
  id?: string;
}

export const RemoteLocationToggle: React.FC<RemoteLocationToggleProps> = ({
  isRemote,
  onChange,
  label = 'I offer remote/online services',
  descriptionOn = "Meetings happen outside Bookaroo. Add your Zoom/Meet/Teams link or instructions, and choose the correct timezone so clients join at the right time.",
  descriptionOff = 'Turn on if you take sessions via Zoom, Google Meet, Teams, etc.',
  className = '',
  id = 'isRemote',
}) => {
  return (
    <div
      className={`${
        isRemote
          ? 'rounded-lg border border-blue-200 bg-blue-50 p-4'
          : 'bg-accent/20 border border-accent/30 rounded-lg p-4'
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <Wifi className={`h-5 w-5 mt-0.5 ${isRemote ? 'text-blue-600' : 'text-primary'}`} />
          <div>
            <Label htmlFor={id} className="text-sm font-medium">
              {label}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {isRemote ? descriptionOn : descriptionOff}
            </p>
          </div>
        </div>
        <Switch
          id={id}
          checked={isRemote}
          onCheckedChange={onChange}
          className={`!h-5 !w-9 !min-h-0 !min-w-0 cursor-pointer ${
            isRemote ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
      </div>
    </div>
  );
};

export default RemoteLocationToggle;

