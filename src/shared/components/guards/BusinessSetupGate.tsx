import type { PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../features/auth/selectors';
import BusinessSetupPrompt from '../common/BusinessSetupPrompt';

interface BusinessSetupGateProps extends PropsWithChildren {
  title?: string;
  message?: string;
  ctaLabel?: string;
  navigateTo?: string;
}

export default function BusinessSetupGate({
  children,
  title,
  message,
  ctaLabel,
  navigateTo = '/welcome',
}: BusinessSetupGateProps) {
  const user = useSelector(selectCurrentUser);

  if (!user?.businessId) {
    const isOwner = user?.role === 'owner' || user?.role === 'OWNER' || user?.role === 'Owner';
    const resolvedTitle = isOwner ? (title ?? 'Complete your business setup') : (title ?? 'Business unavailable');
    const resolvedMessage = isOwner
      ? (message ?? 'Before inviting team members, creating services, or adding locations, please finish setting up your business information.')
      : (message ?? 'Your access to this business appears to be inactive. You may have been removed from the business or the business was deleted. Please contact the business administrator.');
    const resolvedCta = isOwner ? (ctaLabel ?? 'Finish business setup') : undefined;
    return (
      <div className="max-w-2xl mx-auto">
        <BusinessSetupPrompt
          title={resolvedTitle}
          message={resolvedMessage}
          ctaLabel={resolvedCta}
          onClickNavigateTo={navigateTo}
        />
      </div>
    );
  }

  return <>{children}</>;
}


