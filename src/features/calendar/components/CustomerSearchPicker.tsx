import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Avatar, AvatarFallback } from '../../../shared/components/ui/avatar';
import { cn } from '../../../shared/lib/utils';
import { SliderSectionHeader } from '../../../shared/components/forms/SliderSectionHeader';
import { addCustomerApi } from '../../customers/api';
import { toast } from 'sonner';
import type { CustomerDisplay } from './addAppointmentSliderHelpers';
import { getCustomerDisplayLabel, getCustomerInitials } from './addAppointmentSliderHelpers';
import QuickCreateCustomerForm from './QuickCreateCustomerForm';
import { getAvatarBgColor } from '../../setupWizard/components/StepTeam';
import { CustomerSearchPopover, type CustomerSearchResult } from './CustomerSearchPopover';
import './addAppointmentSliderPopover.css';
import '../../../shared/components/forms/CollapsibleFormSection.css';

const QUICK_CREATE_ANIMATION_MS = 350;

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
  const avatarColorKey =
    display?.email?.trim() ||
    `${display?.firstName ?? ''}-${display?.lastName ?? ''}-${display?.phone ?? ''}`;

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border dark:border-border bg-white dark:bg-surface px-4 py-3">
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarFallback
          className="text-sm font-medium"
          style={{ backgroundColor: getAvatarBgColor(avatarColorKey) }}
        >
          {getCustomerInitials(display, isEditMode ? 'W' : 'C')}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-base truncate text-foreground-1">
          {getCustomerDisplayLabel(display, isEditMode)}
        </div>
        {display?.email && (
          <div className="text-sm text-foreground-3 dark:text-foreground-2 truncate mt-0.5">{display.email}</div>
        )}
        {display?.phone && (
          <div className="text-sm text-foreground-3 dark:text-foreground-2 truncate">{display.phone}</div>
        )}
        {isEditMode && (
          <div className="text-xs text-foreground-3 dark:text-foreground-2 mt-1">
            Customer cannot be changed for existing appointments.
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
          <span className="text-xs text-foreground-3 group-hover:text-foreground-1">Change</span>
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

  const quickCreateCollapsibleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowQuickCreate(false);
    setQuickCreateRendered(false);
    setQuickCreateClosing(false);
    setQuickCreateSubmitting(false);
  }, [isOpen]);

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
      try {
        const newCustomer = await addCustomerApi(payload);
        onSelectCustomer(newCustomer);
        setShowQuickCreate(false);
        toast.success(t('page.appointments.customer.customerCreated'));
      } catch {
        toast.error(t('page.appointments.customer.customerCreateFailed'));
      } finally {
        setQuickCreateSubmitting(false);
      }
    },
    [onSelectCustomer],
  );

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
                  className="h-11 shrink-0 !px-6 border-border-strong text-foreground-1 group"
                  onClick={() => {
                    closePopover();
                    setShowQuickCreate(true);
                  }}
                >
                  <span className="text-primary text-xl leading-none font-semibold transition-transform duration-400 ease-out group-hover:scale-125">+</span>
                  <span>New Customer</span>
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
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSearchPicker;
