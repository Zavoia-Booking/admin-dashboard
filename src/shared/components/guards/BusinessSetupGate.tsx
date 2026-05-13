import type { PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { selectCurrentUser } from '../../../features/auth/selectors';
import BusinessSetupPrompt from '../common/BusinessSetupPrompt';

interface BusinessSetupGateProps extends PropsWithChildren {
  eyebrow?: string;
  title?: string;
  message?: string;
  ctaLabel?: string;
  navigateTo?: string;
}

export default function BusinessSetupGate({
  children,
  eyebrow,
  title,
  message,
  ctaLabel,
  navigateTo = '/welcome',
}: BusinessSetupGateProps) {
  const user = useSelector(selectCurrentUser);
  const { t } = useTranslation('common');

  if (!user?.businessId) {
    const isOwner = user?.role === 'owner' || user?.role === 'OWNER' || user?.role === 'Owner';
    const resolvedEyebrow = isOwner
      ? (eyebrow ?? t('businessSetupGate.ownerEyebrow'))
      : (eyebrow ?? t('businessSetupGate.restrictedEyebrow'));
    const resolvedTitle = isOwner
      ? (title ?? t('businessSetupGate.ownerTitle'))
      : (title ?? t('businessSetupGate.restrictedTitle'));
    const resolvedMessage = isOwner
      ? (message ?? t('businessSetupGate.ownerMessage'))
      : (message ?? t('businessSetupGate.restrictedMessage'));
    const resolvedCta = isOwner ? (ctaLabel ?? t('businessSetupGate.ownerCta')) : undefined;
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="max-w-2xl w-full">
          <BusinessSetupPrompt
            eyebrow={resolvedEyebrow}
            title={resolvedTitle}
            message={resolvedMessage}
            ctaLabel={resolvedCta}
            onClickNavigateTo={navigateTo}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


