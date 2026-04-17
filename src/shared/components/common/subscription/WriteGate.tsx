import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { useCanWrite } from './useCanWrite';

type WriteGateProps = {
  /**
   * Single child element. When the user cannot write, the child is cloned with
   * `disabled` + aria-disabled and wrapped in a hover tooltip. When the user
   * can write, the child is returned unchanged.
   *
   * The child MUST accept `disabled` and standard DOM props.
   */
  children: React.ReactElement<{ disabled?: boolean; 'aria-disabled'?: boolean }>;
};

/**
 * Disables a write-affordance child when the business is not entitled and
 * wraps it in a hover tooltip. No click/tap feedback — disabled means inert.
 * The global LimitedAccessBanner is the always-visible explanation for
 * touch users who can't hover.
 */
export const WriteGate: React.FC<WriteGateProps> = ({ children }) => {
  const { t } = useTranslation('common');
  const canWrite = useCanWrite();

  if (canWrite) return children;

  const message = t('limitedUsage.disabledTooltip');

  const blocked = React.cloneElement(children, {
    disabled: true,
    'aria-disabled': true,
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex" aria-disabled="true" aria-label={message}>
          {blocked}
        </span>
      </TooltipTrigger>
      <TooltipContent>{message}</TooltipContent>
    </Tooltip>
  );
};

export default WriteGate;
