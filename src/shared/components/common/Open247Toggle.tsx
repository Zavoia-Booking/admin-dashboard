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
      className={`${open247 ? 'rounded-lg border border-info-300 bg-info-100 p-4' : 'bg-surface-active dark:bg-neutral-900 border border-border rounded-lg p-4'} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Clock className={`h-6 w-6 shrink-0 ${open247 ? 'text-info' : 'text-primary'}`} />
          <div>
            <Label htmlFor={id} className={`text-base font-medium ${open247 ? 'text-neutral-900' : ''}`}>Open 24/7</Label>
            <p className={`text-sm mt-1 ${open247 ? 'text-neutral-900' : 'text-foreground-3 dark:text-foreground-2'}`}>
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


