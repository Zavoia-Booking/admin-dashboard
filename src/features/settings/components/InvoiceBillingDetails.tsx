import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Receipt, Info, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Skeleton } from '../../../shared/components/ui/skeleton';
import TextField from '../../../shared/components/forms/fields/TextField';
import SegmentedControl from '../../../shared/components/common/SegmentedControl';
import { updateBillingDetailsApi } from '../../business/api';
import type {
  BillingDetails,
  BillingDetailsSuggestions,
  BillingEntityType,
  UpdateBillingDetailsDTO,
} from '../../business/types';
import {
  INVOICE_BILLING_DETAILS_SECTION_ID,
  useBillingDetailsContext,
} from '../context/BillingDetailsContext';

interface FormState {
  billingEntityType: BillingEntityType;
  legalName: string;
  fiscalCode: string;
  registrationNumber: string;
  billingAddress: string;
  billingCity: string;
  billingCounty: string;
  billingCountryCode: string;
}

const suggestLegalName = (
  type: BillingEntityType,
  suggestions: BillingDetailsSuggestions,
): string => {
  if (type === 'company') {
    return suggestions.businessName?.trim() ?? '';
  }
  const parts = [suggestions.firstName?.trim(), suggestions.lastName?.trim()].filter(Boolean);
  return parts.join(' ');
};

const buildInitialState = (details: BillingDetails): FormState => {
  const type: BillingEntityType = (details.billingEntityType as BillingEntityType) ?? 'company';
  return {
    billingEntityType: type,
    legalName: details.legalName ?? suggestLegalName(type, details.suggestions),
    fiscalCode: details.fiscalCode ?? '',
    registrationNumber: details.registrationNumber ?? '',
    billingAddress: details.billingAddress ?? '',
    billingCity: details.billingCity ?? '',
    billingCounty: details.billingCounty ?? '',
    billingCountryCode: (
      details.billingCountryCode ?? details.suggestions.countryCode ?? ''
    ).toUpperCase(),
  };
};

const snapshotOf = (form: FormState) => JSON.stringify(form);

const InvoiceBillingDetails: React.FC = () => {
  const { t } = useTranslation('settings');
  const { details, isLoading, reload } = useBillingDetailsContext();
  const [form, setForm] = useState<FormState | null>(null);
  const [snapshot, setSnapshot] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!details) return;
    const initial = buildInitialState(details);
    setForm(initial);
    setSnapshot(snapshotOf(initial));
  }, [details]);

  const isDirty = useMemo(
    () => (form ? snapshotOf(form) !== snapshot : false),
    [form, snapshot],
  );
  const isCompany = form?.billingEntityType === 'company';
  const isConfigured = !!details?.billingEntityType;
  const isCountryLocked = !!details?.suggestions.countryCode;

  const isValid = useMemo(() => {
    if (!form) return false;
    const required = [
      form.legalName,
      form.billingAddress,
      form.billingCity,
      form.billingCounty,
      form.billingCountryCode,
    ];
    if (form.billingEntityType === 'company') {
      required.push(form.fiscalCode);
    }
    return required.every((v) => v.trim().length > 0);
  }, [form]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleTypeChange = (value: string) => {
    if (!details) return;
    const nextType = value as BillingEntityType;
    setForm((prev) => {
      if (!prev) return prev;
      const prevSuggestion = suggestLegalName(prev.billingEntityType, details.suggestions);
      const nextSuggestion = suggestLegalName(nextType, details.suggestions);
      const legalName =
        prev.legalName === '' || prev.legalName === prevSuggestion
          ? nextSuggestion
          : prev.legalName;
      return {
        ...prev,
        billingEntityType: nextType,
        legalName,
        ...(nextType === 'person' ? { fiscalCode: '', registrationNumber: '' } : {}),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !isDirty || !isValid || isSubmitting) return;

    const payload: UpdateBillingDetailsDTO = {
      billingEntityType: form.billingEntityType,
      legalName: form.legalName.trim(),
      billingAddress: form.billingAddress.trim(),
      billingCity: form.billingCity.trim(),
      billingCounty: form.billingCounty.trim(),
      billingCountryCode: form.billingCountryCode.trim().toLowerCase(),
    };
    if (form.billingEntityType === 'company') {
      payload.fiscalCode = form.fiscalCode.trim();
      payload.registrationNumber = form.registrationNumber.trim() || undefined;
    }

    setIsSubmitting(true);
    try {
      await updateBillingDetailsApi(payload);
      toast.success(t('billing.invoiceDetails.toastSuccess'));
      await reload();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t('billing.invoiceDetails.toastFailure');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !form) {
    return (
      <Card id={INVOICE_BILLING_DETAILS_SECTION_ID} className="border border-border bg-card shadow-sm mb-12 scroll-mt-24">
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id={INVOICE_BILLING_DETAILS_SECTION_ID} className="border border-border bg-card shadow-sm mb-12 scroll-mt-24">
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-border">
          <div className="p-2 rounded-xl bg-primary/10">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground-1">
              {t('billing.invoiceDetails.title')}
            </h3>
            <p className="text-xs text-foreground-3">
              {t('billing.invoiceDetails.description')}
            </p>
          </div>
        </div>

        {!isConfigured && (
          <div className="flex items-start gap-2 rounded-lg border border-info-border bg-info-bg p-3">
            <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
            <p className="text-xs text-foreground-2">
              {t('billing.invoiceDetails.unconfiguredHint')}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground-1">
              {t('billing.invoiceDetails.entityTypeLabel')}
            </span>
            <SegmentedControl
              value={form.billingEntityType}
              onChange={handleTypeChange}
              options={[
                { value: 'company', label: t('billing.invoiceDetails.company') },
                { value: 'person', label: t('billing.invoiceDetails.person') },
              ]}
              className="w-full max-w-md"
            />
            <p className="text-xs text-foreground-3">
              {isCompany
                ? t('billing.invoiceDetails.companyHint')
                : t('billing.invoiceDetails.personHint')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
            <TextField
              label={
                isCompany
                  ? t('billing.invoiceDetails.legalNameCompany')
                  : t('billing.invoiceDetails.legalNamePerson')
              }
              placeholder={
                isCompany
                  ? t('billing.invoiceDetails.legalNameCompanyPlaceholder')
                  : t('billing.invoiceDetails.legalNamePersonPlaceholder')
              }
              value={form.legalName}
              onChange={(v) => setField('legalName', v)}
              maxLength={255}
              required
            />

            {isCompany && (
              <TextField
                label={t('billing.invoiceDetails.fiscalCode')}
                placeholder={t('billing.invoiceDetails.fiscalCodePlaceholder')}
                value={form.fiscalCode}
                onChange={(v) => setField('fiscalCode', v)}
                maxLength={20}
                required
              />
            )}

            {isCompany && (
              <TextField
                label={t('billing.invoiceDetails.registrationNumber')}
                placeholder={t('billing.invoiceDetails.registrationNumberPlaceholder')}
                value={form.registrationNumber}
                onChange={(v) => setField('registrationNumber', v)}
                maxLength={50}
              />
            )}

            <TextField
              label={t('billing.invoiceDetails.address')}
              placeholder={t(
                form.billingCountryCode === 'RO'
                  ? 'billing.invoiceDetails.addressPlaceholderRo'
                  : 'billing.invoiceDetails.addressPlaceholder',
              )}
              value={form.billingAddress}
              onChange={(v) => setField('billingAddress', v)}
              maxLength={512}
              required
            />

            <TextField
              label={t('billing.invoiceDetails.city')}
              placeholder={t('billing.invoiceDetails.cityPlaceholder')}
              value={form.billingCity}
              onChange={(v) => setField('billingCity', v)}
              maxLength={128}
              required
            />

            <TextField
              label={t('billing.invoiceDetails.county')}
              placeholder={t('billing.invoiceDetails.countyPlaceholder')}
              value={form.billingCounty}
              onChange={(v) => setField('billingCounty', v)}
              maxLength={128}
              required
            />

            <TextField
              label={t('billing.invoiceDetails.countryCode')}
              placeholder={t('billing.invoiceDetails.countryCodePlaceholder')}
              value={form.billingCountryCode}
              onChange={(v) => setField('billingCountryCode', v.toUpperCase().slice(0, 2))}
              maxLength={2}
              disabled={isCountryLocked}
              required
            />
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-border/60">
            <Button
              type="submit"
              disabled={!isDirty || !isValid || isSubmitting}
              className="btn-primary rounded-full px-6 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('buttons.saving')}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{t('billing.invoiceDetails.saveButton')}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default InvoiceBillingDetails;
