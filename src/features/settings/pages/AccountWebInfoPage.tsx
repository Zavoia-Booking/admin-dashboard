import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InfoPage } from '../../../shared/components/common/InfoPage';

const WEB_URL = 'https://staging-app.zavoia.com';

const AccountWebInfoPage: React.FC = () => {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();

  return (
    <InfoPage
      title={t('accountWebInfo.title')}
      description={t('accountWebInfo.description')}
      icon={Globe}
      iconColor="blue"
      buttons={[
        {
          label: t('accountWebInfo.openWebsite'),
          onClick: () => window.open(WEB_URL, '_blank'),
          icon: Globe,
        },
        {
          label: t('accountWebInfo.backHome'),
          onClick: () => navigate('/'),
          variant: 'outline',
          icon: ArrowLeft,
        },
      ]}
    />
  );
};

export default AccountWebInfoPage;
