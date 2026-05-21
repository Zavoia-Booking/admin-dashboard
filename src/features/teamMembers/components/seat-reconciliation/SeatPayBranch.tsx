import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/button';
import { useFormatPrice } from '../../../../shared/hooks/useFormatPrice';

interface PendingPayment {
  status: string;
  clientSecret?: string | null;
  invoiceUrl?: string | null;
  amount: number;
  currency: string;
}

interface SeatPayBranchProps {
  pendingPayment: PendingPayment;
  paymentError: string | null;
  isPayingForSeats: boolean;
  onRetry: () => void;
  onAbort: () => void;
}

export const SeatPayBranch: React.FC<SeatPayBranchProps> = ({
  pendingPayment,
  paymentError,
  isPayingForSeats,
  onRetry,
  onAbort,
}) => {
  const { t } = useTranslation();
  const { formatDecimalValue } = useFormatPrice();

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <div className="rounded-lg border border-warning-border bg-warning-bg p-3">
        <h3 className="mb-1 font-medium text-foreground-1">
          {t('settings:billing.pendingPayment.title')}
        </h3>
        <p className="text-sm text-foreground-3">
          {pendingPayment.status === 'requires_action'
            ? t('settings:billing.pendingPayment.requiresAction')
            : t('settings:billing.pendingPayment.requiresPaymentMethod')}
        </p>
        <p className="mt-1 text-sm font-medium text-foreground-1">
          {t('settings:billing.pendingPayment.amount', {
            amount: formatDecimalValue(pendingPayment.amount, pendingPayment.currency),
            currency: pendingPayment.currency,
          })}
        </p>
      </div>

      {paymentError && (
        <div className="rounded-lg border border-error-border bg-error-bg p-3">
          <p className="text-sm text-error">{paymentError}</p>
        </div>
      )}

      <div className="flex gap-2">
        {pendingPayment.status === 'requires_action' && (
          <Button
            onClick={onRetry}
            disabled={isPayingForSeats}
            rounded="full"
            className="flex-1"
          >
            {isPayingForSeats ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('settings:billing.pendingPayment.retrying')}
              </>
            ) : (
              t('settings:billing.pendingPayment.completePayment')
            )}
          </Button>
        )}
        {pendingPayment.status === 'requires_payment_method' && pendingPayment.invoiceUrl && (
          <Button
            onClick={() => window.open(pendingPayment.invoiceUrl!, '_blank')}
            disabled={isPayingForSeats}
            rounded="full"
            className="flex-1"
          >
            {t('settings:billing.pendingPayment.updatePaymentMethod')}
          </Button>
        )}
        <Button
          onClick={onAbort}
          disabled={isPayingForSeats}
          variant="outline"
          rounded="full"
        >
          {t('settings:billing.pendingPayment.abortPayment')}
        </Button>
      </div>
    </div>
  );
};
