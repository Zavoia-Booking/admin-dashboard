import { createContext, useContext } from 'react';
import type { BillingDetails } from '../../business/types';

export const INVOICE_BILLING_DETAILS_SECTION_ID = 'invoice-billing-details';

export interface BillingDetailsContextValue {
  details: BillingDetails | null;
  isLoading: boolean;
  /** Set when the initial load failed and there are no details to show. */
  loadError: string | null;
  reload: () => Promise<void>;
  /**
   * Returns true when invoice billing details are saved. When not saved,
   * scrolls the page to the billing-details section and surfaces a toast so
   * the user understands they must complete that form before paying.
   */
  ensureConfigured: () => boolean;
}

export const BillingDetailsContext = createContext<BillingDetailsContextValue | null>(null);

export const useBillingDetailsContext = (): BillingDetailsContextValue => {
  const ctx = useContext(BillingDetailsContext);
  if (!ctx) {
    throw new Error('useBillingDetailsContext must be used within a BillingDetailsProvider');
  }
  return ctx;
};
