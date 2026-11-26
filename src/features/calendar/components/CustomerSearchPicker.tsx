import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { PersonAvatar } from '../../../shared/components/common/PersonAvatar';
import { cn } from '../../../shared/lib/utils';
import { SliderSectionHeader } from '../../../shared/components/forms/SliderSectionHeader';
import { addCustomerApi } from '../../customers/api';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { translateMessageCode } from '../../../shared/utils/error';
import type { CustomerDisplay } from './addAppointmentSliderHelpers';
import { getCustomerDisplayLabel } from './addAppointmentSliderHelpers';
import QuickCreateCustomerForm from './QuickCreateCustomerForm';
import { CustomerSearchPopover, type CustomerSearchResult } from './CustomerSearchPopover';
import './addAppointmentSliderPopover.css';
import '../../../shared/components/forms/CollapsibleFormSection.css';

const QUICK_CREATE_ANIMATION_MS = 350;
const DUPLICATE_EMAIL_CODE = 'BUSINESS_CUSTOMER.E02';

/** A 409 for a duplicate email; carries the existing customer when the API provides it. */
function getDuplicateEmailConflict(
  error: unknown,
): { existingCustomer: CustomerSearchResult | null } | null {
  if (!isAxiosError(error) || error.response?.status !== 409) return null;
  const data = error.response.data as
    | { message?: string | string[]; details?: { existingCustomer?: CustomerSearchResult } }
    | undefined;
  const messages = Array.isArray(data?.message) ? data.message : [data?.message];
  if (!messages.includes(DUPLICATE_EMAIL_CODE)) return null;
  const existing = data?.details?.existingCustomer;
  return { existingCustomer: existing && typeof existing.id === 'number' ? existing : null };
}

interface CustomerSelectedCardProps {
  display: CustomerDisplay | null;
  isEditMode: boolean;
  onClear?: () => void;
}

interface CustomerSearchPickerProps {
  isOpen: boolean;
  isEditMode: boolean;
  selectedCustomer: CustomerDisplay | null;
  onSelectCustomer: (customer: CustomerSearchResult) => void;
  onClearCustomer: () => void;
}

function CustomerSelectedCard({ display, isEditMode, onClear }: CustomerSelectedCardProps) {
  const { t } = useTranslation('calendar');
  const avatarId = display?.id ?? display?.email?.trim() ?? '';

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border dark:border-border bg-white dark:bg-surface px-4 py-3">
      <PersonAvatar
        id={avatarId}
        firstName={display?.firstName}
        lastName={display?.lastName}
        className="h-10 w-10"
        initialsClassName="text-sm font-medium"
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-base truncate text-foreground-1">
          {getCustomerDisplayLabel(display, t, isEditMode)}
        </div>
        {display?.email && (
          <div className="text-sm text-foreground-3 dark:text-foreground-2 truncate mt-0.5">{display.email}</div>
        )}
        {display?.phone && (
          <div className="text-sm text-foreground-3 dark:text-foreground-2 truncate">{display.phone}</div>
        )}
        {isEditMode && (
          <div className="text-xs text-foreground-3 dark:text-foreground-2 mt-1">
            {t('page.customerSearch.lockedForEdit')}
          </div>
        )}
      </div>
      {!isEditMode && onClear && (
        <Button
          variant="ghost"
          rounded="full"
          size="sm"
          onClick={onClear}
          className="shrink-0 !min-h-0 h-7 !px-3 border border-border group-hover:border-border-strong text-foreground-3 dark:text-foreground-2 hover:text-primary dark:hover:text-primary group-hover:text-primary group-hover:bg-info-100/20 dark:hover:bg-muted-foreground/10 dark:group-hover:bg-muted-foreground/10 cursor-pointer"
        >
          <span className="text-xs text-foreground-3 group-hover:text-foreground-1">{t('page.customerSearch.change')}</span>
          <ChevronRight className="h-3 w-3 pt-0.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
        </Button>
      )}
    </div>
  );
}

const CustomerSearchPicker: React.FC<CustomerSearchPickerProps> = ({
  isOpen,
  isEditMode,
  selectedCustomer,
  onSelectCustomer,
  onClearCustomer,
}) => {
  const { t } = useTranslation('calendar');
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateRendered, setQuickCreateRendered] = useState(false);
  const [quickCreateClosing, setQuickCreateClosing] = useState(false);
  const [quickCreateSubmitting, setQuickCreateSubmitting] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<CustomerSearchResult | null>(null);

  const quickCreateCollapsibleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowQuickCreate(false);
    setQuickCreateRendered(false);
    setQuickCreateClosing(false);
    setQuickCreateSubmitting(false);
    setExistingCustomer(null);
  }, [isOpen]);

  useEffect(() => {
    if (!showQuickCreate) setExistingCustomer(null);
  }, [showQuickCreate]);

  const updateQuickCreateHeight = useCallback(() => {
    const el = quickCreateCollapsibleRef.current;
    if (!el) return;
    el.style.setProperty('--radix-collapsible-content-height', `${el.scrollHeight}px`);
  }, []);

  useEffect(() => {
    let closeTimer: ReturnType<typeof setTimeout> | null = null;
    if (showQuickCreate) {
      setQuickCreateRendered(true);
      setQuickCreateClosing(false);
      return;
    }
    if (quickCreateRendered) {
      updateQuickCreateHeight();
      setQuickCreateClosing(true);
      closeTimer = setTimeout(() => {
        setQuickCreateRendered(false);
        setQuickCreateClosing(false);
      }, QUICK_CREATE_ANIMATION_MS);
    }
    return () => {
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [showQuickCreate, quickCreateRendered, updateQuickCreateHeight]);

  useEffect(() => {
    if (!quickCreateRendered || quickCreateClosing) return;
    const frame = requestAnimationFrame(() => {
      updateQuickCreateHeight();
    });
    return () => cancelAnimationFrame(frame);
  }, [quickCreateRendered, quickCreateClosing, updateQuickCreateHeight]);

  const handleSelectCustomer = useCallback((customer: CustomerSearchResult) => {
    onSelectCustomer(customer);
  }, [onSelectCustomer]);

  const handleQuickCreateSubmit = useCallback(
    async (payload: { firstName: string; lastName?: string; email?: string; phone?: string }) => {
      setQuickCreateSubmitting(true);
      setExistingCustomer(null);
      try {
        const newCustomer = await addCustomerApi(payload);
        onSelectCustomer(newCustomer);
        setShowQuickCreate(false);
        toast.success(t('page.appointments.customer.customerCreated'));
      } catch (error) {
        const duplicate = getDuplicateEmailConflict(error);
        if (duplicate?.existingCustomer) {
          setExistingCustomer(duplicate.existingCustomer);
        } else if (duplicate) {
          toast.error(translateMessageCode(DUPLICATE_EMAIL_CODE));
        } else {
          toast.error(t('page.appointments.customer.customerCreateFailed'));
        }
      } finally {
        setQuickCreateSubmitting(false);
      }
    },
    [onSelectCustomer],
  );

  const handleUseExistingCustomer = useCallback((customer: CustomerSearchResult) => {
    onSelectCustomer(customer);
    setShowQuickCreate(false);
  }, [onSelectCustomer]);

  const handleQuickCreateEmailChange = useCallback(() => {
    setExistingCustomer(null);
  }, []);

  return (
    <div className="space-y-5 mb-4">
      <SliderSectionHeader
        title={t('page.appointments.customer.client')}
        description={t('page.appointments.customer.clientDescription')}
      />

      {isEditMode ? (
        <CustomerSelectedCard display={selectedCustomer} isEditMode />
      ) : selectedCustomer ? (
        <CustomerSelectedCard display={selectedCustomer} isEditMode={false} onClear={onClearCustomer} />
      ) : (
        <div className="space-y-2">
          <CustomerSearchPopover
            onSelectCustomer={handleSelectCustomer}
            resetTrigger={isOpen}
            rightSlot={({ closePopover }) => (
              !quickCreateRendered ? (
                <Button
                  type="button"
                  variant="outline"
                  rounded="full"
                  className="h-11 shrink-0 !px-6 border-border-strong text-foreground-1 group w-full sm:w-auto"
                  onClick={() => {
                    closePopover();
                    setShowQuickCreate(true);
                  }}
                >
                  <span className="text-primary text-xl leading-none font-semibold transition-transform duration-400 ease-out group-hover:scale-125">+</span>
                  <span>{t('page.customerSearch.newCustomer')}</span>
                </Button>
              ) : null
            )}
          />

          {quickCreateRendered && (
            <div
              ref={quickCreateCollapsibleRef}
              data-slot="collapsible-content"
              data-state={quickCreateClosing ? 'closed' : 'open'}
              className={cn(
                "add-appointment-quick-create overflow-hidden",
                quickCreateClosing ? "h-0" : "h-auto",
              )}
            >
              <QuickCreateCustomerForm
                onSubmit={handleQuickCreateSubmit}
                onBack={() => setShowQuickCreate(false)}
                loading={quickCreateSubmitting}
                existingCustomer={existingCustomer}
                onUseExistingCustomer={handleUseExistingCustomer}
                onEmailChange={handleQuickCreateEmailChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSearchPicker;
