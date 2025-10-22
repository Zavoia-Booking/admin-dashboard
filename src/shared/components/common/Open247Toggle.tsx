import React from 'react';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Clock } from 'lucide-react';

export interface Open247ToggleProps {
  open247: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  id?: string;
}

const Open247Toggle: React.FC<Open247ToggleProps> = ({ open247, onChange, className = '', id = 'open247' }) => {
  return (
    <div
      className={`${open247 ? 'rounded-lg border border-blue-300 bg-blue-50 p-4' : 'bg-accent/80 border border-accent/30 rounded-lg p-4'} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Clock className={`h-6 w-6 shrink-0 ${open247 ? 'text-blue-600' : 'text-primary'}`} />
          <div>
            <Label htmlFor={id} className="text-base font-medium">Open 24/7</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {open247
                ? 'Open all day, every day. Daily hours are turned off.'
                : 'Set your daily hours below. Turn this on if you’re open 24/7.'}
            </p>
          </div>
        </div>
        <Switch
          id={id}
          checked={open247}
          onCheckedChange={onChange}
          className="self-start mt-0.5 !h-5 !w-9 !min-h-0 !min-w-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default Open247Toggle;


