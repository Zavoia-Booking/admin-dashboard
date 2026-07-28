import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getBillingDetailsApi } from '../../business/api';
import { getErrorMessage } from '../../../shared/utils/error';
import type { BillingDetails } from '../../business/types';
import {
  BillingDetailsContext,
  INVOICE_BILLING_DETAILS_SECTION_ID,
} from './BillingDetailsContext';

export const BillingDetailsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation('settings');
  const [details, setDetails] = useState<BillingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasFetched = useRef(false);
  // True once any load succeeded - decides toast (details on screen) vs the
  // inline error state (nothing to show yet) without a stale-closure read.
  const hasData = useRef(false);

  const reload = useCallback(async () => {
    if (!hasData.current) setIsLoading(true);
    try {
      const data = await getBillingDetailsApi();
      hasData.current = true;
      setDetails(data);
      setLoadError(null);
    } catch (err: unknown) {
      const message = getErrorMessage(err, t('billing.invoiceDetails.loadFailure'));
      if (hasData.current) {
        toast.error(message);
      } else {
        setLoadError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    void reload();
  }, [reload]);

  const ensureConfigured = useCallback((): boolean => {
    if (details?.billingEntityType) return true;

    toast.error(t('billing.invoiceDetails.mustConfigureBeforePaying'));
    if (typeof document !== 'undefined') {
      const el = document.getElementById(INVOICE_BILLING_DETAILS_SECTION_ID);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return false;
  }, [details, t]);

  const value = useMemo(
    () => ({ details, isLoading, loadError, reload, ensureConfigured }),
    [details, isLoading, loadError, reload, ensureConfigured],
  );

  return <BillingDetailsContext.Provider value={value}>{children}</BillingDetailsContext.Provider>;
};
