import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getBillingDetailsApi } from '../../business/api';
import type { BillingDetails } from '../../business/types';
import {
  BillingDetailsContext,
  INVOICE_BILLING_DETAILS_SECTION_ID,
} from './BillingDetailsContext';

export const BillingDetailsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation('settings');
  const [details, setDetails] = useState<BillingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);

  const reload = useCallback(async () => {
    try {
      const data = await getBillingDetailsApi();
      setDetails(data);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t('billing.invoiceDetails.loadFailure');
      toast.error(message);
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
    () => ({ details, isLoading, reload, ensureConfigured }),
    [details, isLoading, reload, ensureConfigured],
  );

  return <BillingDetailsContext.Provider value={value}>{children}</BillingDetailsContext.Provider>;
};
