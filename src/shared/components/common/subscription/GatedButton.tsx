import * as React from 'react';
import { Button } from '../../ui/button';
import { WriteGate } from './WriteGate';

type ButtonProps = React.ComponentProps<typeof Button>;

/**
 * Drop-in replacement for <Button> on write-affordances that should be
 * automatically disabled + tooltipped when the business is not entitled.
 *
 * Use for "Add X" / "Create Y" / "Delete Z" top-level triggers on feature
 * pages. Do NOT use on settings, support, account self-service, or logout.
 */
export const GatedButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => (
    <WriteGate>
      <Button ref={ref} {...props} />
    </WriteGate>
  ),
);

GatedButton.displayName = 'GatedButton';

export default GatedButton;
