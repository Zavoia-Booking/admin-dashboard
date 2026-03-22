import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, CheckCircle2, XCircle, Users, CreditCard, ArrowLeft, Home, MessageSquare } from 'lucide-react';
import { InfoPage } from '../../../shared/components/common/InfoPage';
import { useTranslation } from 'react-i18next';

const InfoPageComponent: React.FC = () => {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');

  const getPageConfig = () => {
    switch (type) {
      case 'cancel-removal-success':
        return {
          title: t('infoPages.cancelRemovalSuccess.title'),
          description: t('infoPages.cancelRemovalSuccess.description'),
          icon: CheckCircle,
          iconColor: 'green' as const,
          buttons: [
            {
              label: t('infoPages.cancelRemovalSuccess.goToDashboard'),
              onClick: () => navigate('/dashboard'),
              icon: Home,
            },
            {
              label: t('infoPages.cancelRemovalSuccess.backToBilling'),
              onClick: () => navigate('/settings?tab=billing'),
              variant: 'outline' as const,
              icon: ArrowLeft,
            },
          ],
        };

      case 'subscription-success':
        return {
          title: t('infoPages.subscriptionSuccess.title'),
          description: t('infoPages.subscriptionSuccess.description'),
          icon: CheckCircle2,
          iconColor: 'green' as const,
          buttons: [
            {
              label: t('infoPages.subscriptionSuccess.goToDashboard'),
              onClick: () => navigate('/dashboard'),
              icon: Home,
            },
            {
              label: t('infoPages.subscriptionSuccess.backToBilling'),
              onClick: () => navigate('/settings?tab=billing'),
              variant: 'outline' as const,
              icon: ArrowLeft,
            },
          ],
        };

      case 'subscription-cancelled':
        return {
          title: t('infoPages.subscriptionCancelled.title'),
          description: t('infoPages.subscriptionCancelled.description'),
          icon: XCircle,
          iconColor: 'red' as const,
          buttons: [
            {
              label: t('infoPages.subscriptionCancelled.goToDashboard'),
              onClick: () => navigate('/dashboard'),
              icon: Home,
            },
            {
              label: t('infoPages.subscriptionCancelled.backToBilling'),
              onClick: () => navigate('/settings?tab=billing'),
              variant: 'outline' as const,
              icon: ArrowLeft,
            },
          ],
        };

      case 'seats-update-success':
        return {
          title: t('infoPages.seatsUpdateSuccess.title'),
          description: t('infoPages.seatsUpdateSuccess.description'),
          icon: CheckCircle2,
          iconColor: 'green' as const,
          buttons: [
            {
              label: t('infoPages.seatsUpdateSuccess.goToTeamMembers'),
              onClick: () => navigate('/team-members'),
              icon: Users,
            },
            {
              label: t('infoPages.seatsUpdateSuccess.goToBilling'),
              onClick: () => navigate('/settings?tab=billing'),
              variant: 'outline' as const,
              icon: CreditCard,
            },
          ],
        };

      case 'sms-purchase-success':
        return {
          title: t('infoPages.smsPurchaseSuccess.title'),
          description: t('infoPages.smsPurchaseSuccess.description'),
          icon: MessageSquare,
          iconColor: 'green' as const,
          buttons: [
            {
              label: t('infoPages.smsPurchaseSuccess.goToDashboard'),
              onClick: () => navigate('/dashboard'),
              icon: Home,
            },
            {
              label: t('infoPages.smsPurchaseSuccess.backToBilling'),
              onClick: () => navigate('/settings?tab=billing'),
              variant: 'outline' as const,
              icon: ArrowLeft,
            },
          ],
        };

      default:
        return {
          title: t('infoPages.notFound.title'),
          description: t('infoPages.notFound.description'),
          icon: XCircle,
          iconColor: 'red' as const,
          buttons: [
            {
              label: t('infoPages.notFound.goToDashboard'),
              onClick: () => navigate('/dashboard'),
              icon: Home,
            },
          ],
        };
    }
  };

  const config = getPageConfig();

  return (
    <InfoPage
      title={config.title}
      description={config.description}
      icon={config.icon}
      iconColor={config.iconColor}
      buttons={config.buttons}
    />
  );
};

export default InfoPageComponent;
