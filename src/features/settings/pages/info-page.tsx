import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, CheckCircle2, XCircle, Users, CreditCard, ArrowLeft, Home } from 'lucide-react';
import { InfoPage } from '../../../shared/components/common/InfoPage';

const InfoPageComponent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');

  const getPageConfig = () => {
    switch (type) {
      case 'cancel-removal-success':
        return {
          title: 'Scheduled Cancellation Cancelled',
          description: 'Your seats are no longer scheduled to be removed. They will remain active for your next billing period.',
          icon: CheckCircle,
          iconColor: 'green' as const,
          buttons: [
            {
              label: 'Go to Dashboard',
              onClick: () => navigate('/dashboard'),
              icon: Home,
            },
            {
              label: 'Back to Billing',
              onClick: () => navigate('/settings?tab=billing'),
              variant: 'outline' as const,
              icon: ArrowLeft,
            },
          ],
        };

      case 'subscription-success':
        return {
          title: 'Thank you for your trust!',
          description: 'Your subscription is active. You can now use the application at its full capabilities.',
          icon: CheckCircle2,
          iconColor: 'green' as const,
          buttons: [
            {
              label: 'Go to Dashboard',
              onClick: () => navigate('/dashboard'),
              icon: Home,
            },
            {
              label: 'Back to Billing',
              onClick: () => navigate('/settings?tab=billing'),
              variant: 'outline' as const,
              icon: ArrowLeft,
            },
          ],
        };

      case 'subscription-cancelled':
        return {
          title: 'Subscription cancelled',
          description: 'Your subscription has been cancelled. You will retain access until the end of your current billing period.',
          icon: XCircle,
          iconColor: 'red' as const,
          buttons: [
            {
              label: 'Go to dashboard',
              onClick: () => navigate('/dashboard'),
              icon: Home,
            },
            {
                label: 'Back to billing',
                onClick: () => navigate('/settings?tab=billing'),
                variant: 'outline' as const,
                icon: ArrowLeft,
              },
          ],
        };

      case 'seats-update-success':
        return {
          title: 'Team seats updated',
          description: 'Your subscription has been updated successfully.',
          icon: CheckCircle2,
          iconColor: 'green' as const,
          buttons: [
            {
              label: 'Go to Team Members',
              onClick: () => navigate('/team-members'),
              icon: Users,
            },
            {
              label: 'Go to Billing',
              onClick: () => navigate('/settings?tab=billing'),
              variant: 'outline' as const,
              icon: CreditCard,
            },
          ],
        };

      default:
        return {
          title: 'Page Not Found',
          description: 'The requested page could not be found.',
          icon: XCircle,
          iconColor: 'red' as const,
          buttons: [
            {
              label: 'Go to Dashboard',
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
