import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../../../shared/components/layouts/app-layout';
import { PageHeader } from '../../../../shared/components/layouts/PageHeader';
import { Button } from '../../../../shared/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import MyAccountContent from '../components/MyAccountContent';

export default function MyAccountPage() {
  const { t } = useTranslation('myAccount');
  const [isDirty, setIsDirty] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = () => {
    (document.getElementById('my-account-form') as HTMLFormElement | null)?.requestSubmit();
  };

  const SaveButton = (
    <Button
      type="button"
      onClick={handleSave}
      className="group btn-primary !min-h-0 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all duration-300 font-bold flex items-center gap-2 !h-10 md:!h-11 !px-4 md:!px-6 md:-mt-4 text-xs md:text-sm !w-auto !min-w-34 md:!w-44"
      disabled={!isDirty || isSaving}
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
        <>
          <span>{t('buttons.saveChanges')}</span>
          <Save className="hidden md:inline h-4 w-4" />
        </>
      )}
    </Button>
  );

  return (
    <AppLayout headerRightContent={SaveButton}>
      <PageHeader title={t('page.title')} rightContent={SaveButton} />
      <MyAccountContent
        onDirtyChange={setIsDirty}
        onSavingChange={setIsSaving}
      />
    </AppLayout>
  );
}
