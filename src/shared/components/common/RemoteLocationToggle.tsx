import React from 'react';
import { useTranslation } from 'react-i18next';
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
  label,
  descriptionOn,
  descriptionOff,
  className = '',
  id = 'isRemote',
}) => {
  const { t } = useTranslation('common');
  const displayLabel = label ?? t('remoteLocation.label');
  const displayDescriptionOn = descriptionOn ?? t('remoteLocation.descriptionOn');
  const displayDescriptionOff = descriptionOff ?? t('remoteLocation.descriptionOff');
  return (
    <div
      className={`${
        isRemote
          ? 'rounded-lg border border-info-300 bg-info-100 p-4'
          : 'bg-surface-active dark:bg-neutral-900 border border-border rounded-lg p-4'
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Wifi className={`h-6 w-6 shrink-0 ${isRemote ? 'text-info' : 'text-primary'}`} />
          <Label htmlFor={id} className={`text-base font-medium cursor-pointer ${isRemote ? 'text-neutral-900' : ''}`}>
            {displayLabel}
          </Label>
        </div>
        <Switch
          id={id}
          checked={isRemote}
          onCheckedChange={onChange}
          className="!h-5 !w-9 !min-h-0 !min-w-0 cursor-pointer"
        />
      </div>
      <p className={`text-sm ${isRemote ? 'text-neutral-900' : 'text-foreground-3 dark:text-foreground-2'}`}>
        {isRemote ? displayDescriptionOn : displayDescriptionOff}
      </p>
    </div>
  );
};

export default RemoteLocationToggle;

