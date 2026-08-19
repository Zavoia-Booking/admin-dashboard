import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../../../shared/components/layouts/app-layout';
import { PageHeader } from '../../../../shared/components/layouts/PageHeader';
import { Button } from '../../../../shared/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '../../../../shared/hooks/use-mobile';
import MyAccountContent from '../components/MyAccountContent';

export default function MyAccountPage() {
  const { t } = useTranslation('myAccount');
  const isMobile = useIsMobile();
  const [isDirty, setIsDirty] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = () => {
    (document.getElementById('my-account-form') as HTMLFormElement | null)?.requestSubmit();
  };

  const isDisabled = !isDirty || isSaving;

  const SaveButton = (
    <Button
      type="button"
      onClick={handleSave}
      className="group btn-primary !min-h-0 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all duration-300 font-bold flex items-center gap-2 !h-10 md:!h-11 !px-4 md:!px-6 md:-mt-4 text-xs md:text-sm !w-auto !min-w-34 md:!w-44"
      disabled={isDisabled}
    >
      {isSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>
            {t('buttons.saving')}
            <span className="inline-block w-4 text-left animate-pulse" aria-hidden>
              ...
            </span>
          </span>
        </>
      ) : (
        <span>{t('buttons.saveChanges')}</span>
      )}
    </Button>
  );

  const HeaderSaveButton = (
    <Button
      type="button"
      onClick={handleSave}
      className="group btn-primary !min-h-0 !h-8 px-3 rounded-full text-sm shadow-sm active:scale-95 flex items-center gap-1.5"
      disabled={isDisabled}
    >
      {isSaving ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span>{t('buttons.saving')}</span>
        </>
      ) : (
        <span>{t('buttons.saveChanges')}</span>
      )}
    </Button>
  );

  return (
    <AppLayout headerRightContent={isMobile ? HeaderSaveButton : undefined}>
      <PageHeader title={t('page.title')} rightContent={SaveButton} />
      <MyAccountContent
        onDirtyChange={setIsDirty}
        onSavingChange={setIsSaving}
      />
    </AppLayout>
  );
}
