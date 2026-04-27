import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { History, Loader2, MapPin, Clock, ChevronDown, Download } from 'lucide-react';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { Button } from '../../../shared/components/ui/button';
import { cn } from '../../../shared/lib/utils';
import { getStatusBadge } from '../../calendar/components/utils';
import { formatActivityTimelineDateTime } from '../../calendar/timezone';
import { getCalendarTimezone } from '../../calendar/selectors';
import { fetchAllCustomerHistoryApi, fetchCustomerHistoryApi } from '../api';
import { buildCustomerHistoryPdfBlob } from '../buildCustomerHistoryPdf';
import { priceFromStorage } from '../../../shared/utils/currency';
import type {
  FullActivityItem,
  AppointmentActivityMetadata,
  MilestoneActivityMetadata,
  CustomersPagination,
} from '../../../shared/types/customer';

function sanitizeFilenameSegment(value: string | undefined): string {
  if (!value) return '';
  return value
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildHistoryPdfFilename(
  customerId: number,
  firstName: string | undefined,
  lastName: string | undefined,
): string {
  const first = sanitizeFilenameSegment(firstName);
  const last = sanitizeFilenameSegment(lastName);
  if (first && last) return `${first}-${last}.pdf`;
  if (first) return `${first}.pdf`;
  if (last) return `${last}.pdf`;
  return `customer-${customerId}.pdf`;
}

interface CustomerHistorySliderProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number | null;
  /** Used for download filename: firstName-lastName.pdf */
  customerFirstName?: string;
  customerLastName?: string;
  elevated?: boolean;
}

const HISTORY_PAGE_SIZE = 20;

function isAppointmentMetadata(
  item: FullActivityItem,
): item is FullActivityItem & { metadata: AppointmentActivityMetadata } {
  return item.type === 'appointment';
}

function isMilestoneMetadata(
  item: FullActivityItem,
): item is FullActivityItem & { metadata: MilestoneActivityMetadata } {
  return item.type === 'milestone';
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatPrice(price: number, currency: string): string {
  const value = priceFromStorage(price, currency);
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(value);
}

function getSourceLabel(source: string): string {
  switch (source) {
    case 'manual':
      return 'Manually added';
    case 'marketplace':
      return 'Via marketplace';
    case 'import':
      return 'Imported';
    default:
      return source;
  }
}

const CustomerHistorySlider: React.FC<CustomerHistorySliderProps> = ({
  isOpen,
  onClose,
  customerId,
  customerFirstName,
  customerLastName,
  elevated,
}) => {
  const { t, i18n } = useTranslation('customers');
  const calendarTimezone = useSelector(getCalendarTimezone);
  const timezone = (calendarTimezone && String(calendarTimezone).trim()) || 'UTC';

  const [items, setItems] = useState<FullActivityItem[]>([]);
  const [pagination, setPagination] = useState<CustomersPagination | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isDownloadingHistory, setIsDownloadingHistory] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const loadHistory = useCallback(
    async (offset: number, append: boolean) => {
      if (!customerId) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoadingInitial(true);
        }

        const response = await fetchCustomerHistoryApi(customerId, {
          offset,
          limit: HISTORY_PAGE_SIZE,
        });

        if (controller.signal.aborted) return;

        if (append) {
          setItems((prev) => [...prev, ...response.data]);
        } else {
          setItems(response.data);
        }
        setPagination(response.pagination);
      } catch {
        if (controller.signal.aborted) return;
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingInitial(false);
          setIsLoadingMore(false);
        }
      }
    },
    [customerId],
  );

  useEffect(() => {
    if (isOpen && customerId) {
      loadHistory(0, false);
    }
    if (!isOpen) {
      setItems([]);
      setPagination(null);
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [isOpen, customerId, loadHistory]);

  const handleLoadMore = () => {
    if (!pagination || !pagination.hasMore || isLoadingMore) return;
    loadHistory(pagination.offset + pagination.limit, true);
  };

  const handleDownloadHistory = async () => {
    if (!customerId || isDownloadingHistory) return;

    try {
      setIsDownloadingHistory(true);
      const allItems = await fetchAllCustomerHistoryApi(customerId);
      const nameParts = [customerFirstName, customerLastName].map((s) => s?.trim()).filter(Boolean);
      const heading =
        nameParts.length > 0
          ? `${t('details.history.pdf.heading')} — ${nameParts.join(' ')}`
          : t('details.history.pdf.heading');
      const generatedAt = new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(new Date());
      const pdfBlob = buildCustomerHistoryPdfBlob(allItems, {
        timezone,
        locale: i18n.language,
        heading,
        translations: {
          headingDefault: t('details.history.pdf.heading'),
          emptyState: t('details.history.pdf.emptyState'),
          locationLabel: t('details.history.pdf.location'),
          durationLabel: t('details.history.pdf.duration'),
          priceLabel: t('details.history.pdf.price'),
          sourceLabel: t('details.history.pdf.source'),
          sourceManual: t('details.sourceManual'),
          sourceMarketplace: t('details.sourceMarketplace'),
          sourceImport: t('details.sourceImport'),
          typeAppointment: t('details.history.pdf.typeAppointment'),
          typeMilestone: t('details.history.pdf.typeMilestone'),
          metaLine: t('details.history.pdf.metaLine', {
            date: generatedAt,
            count: allItems.length,
          }),
          pageFooter: t('details.history.pdf.pageFooter'),
        },
      });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = buildHistoryPdfFilename(customerId, customerFirstName, customerLastName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(pdfUrl);
    } catch (err) {
      const description =
        err instanceof Error && err.message
          ? err.message
          : t('details.history.downloadFailedDescription');
      toast.error(t('details.history.downloadFailed'), { description });
    } finally {
      setIsDownloadingHistory(false);
    }
  };

  return (
    <BaseSlider
      isOpen={isOpen}
      onClose={onClose}
      title="Customer history"
      subtitle="Full activity timeline for this customer."
      icon={History}
      iconColor="text-foreground-1"
      contentClassName="bg-surface scrollbar-hide"
      {...(elevated && {
        backdropClassName: 'z-[80]',
        panelClassName: 'z-[90]',
      })}
    >
      <div className="p-4 md:p-5">
        <div className="-mt-1 mb-3 flex justify-end md:mb-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            rounded="full"
            onClick={handleDownloadHistory}
            disabled={!customerId || isDownloadingHistory}
            className="inline-flex !h-8 !min-h-8 items-center gap-1.5 px-3.5 text-xs font-medium text-primary hover:bg-primary/10 focus-visible:ring-focus/60 md:text-sm"
          >
            {isDownloadingHistory ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Download history</span>
          </Button>
        </div>
        {isLoadingInitial ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <History className="mb-3 h-8 w-8 text-foreground-3/50" />
            <p className="text-sm font-medium text-foreground-2">No activity yet</p>
            <p className="mt-1 text-xs text-foreground-3">
              Appointments and milestones will appear here.
            </p>
          </div>
        ) : (
          <>
            <ul className="m-0 list-none p-0" role="list">
              {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                  <li key={`${item.type}-${item.date}-${index}`} className="list-none">
                    <div
                      className={cn(
                        'flex items-start gap-3',
                        !isLast && 'pb-4',
                      )}
                    >
                      <div className="flex w-[15px] shrink-0 flex-col items-center pt-0.5">
                        <div
                          className={cn(
                            'h-3 w-3 shrink-0 rounded-full border-2 bg-background',
                            isLast
                              ? 'border-border dark:border-neutral-400/80'
                              : 'border-primary/40',
                          )}
                          aria-hidden
                        />
                        {!isLast && (
                          <div
                            className="mt-1 flex-1 min-h-6 w-px shrink-0 bg-border dark:bg-border-strong/80"
                            aria-hidden
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium leading-snug text-foreground-1">
                            {item.label}
                          </span>
                          {item.type === 'appointment' && item.status && (
                            <span className="shrink-0 [&_*]:text-[10px]">
                              {getStatusBadge(item.status)}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs leading-snug text-foreground-3 dark:text-foreground-2">
                          {formatActivityTimelineDateTime(item.date, timezone)}
                        </div>

                        {isAppointmentMetadata(item) && (
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-3">
                            {item.metadata.locationName && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {item.metadata.locationName}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(item.metadata.duration)}
                            </span>
                            <span>
                              {formatPrice(item.metadata.price, item.metadata.currency)}
                            </span>
                          </div>
                        )}

                        {isMilestoneMetadata(item) && (
                          <div className="mt-1 text-xs text-foreground-3">
                            {getSourceLabel(item.metadata.source)}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {pagination?.hasMore && (
              <div className="mt-4 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  rounded="full"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="group h-auto w-[60%] gap-1.5 border-border px-4 py-1.5 dark:bg-surface dark:border-border dark:hover:border-border-strong dark:text-foreground-1 md:w-1/3"
                >
                  {isLoadingMore ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Load more</span>
                      <ChevronDown className="h-3.5 w-3.5 mt-0.5 text-foreground-3 group-hover:text-foreground-1 transition-colors" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {pagination && (
              <p className="mt-3 text-center text-xs text-foreground-3">
                Showing {items.length} of {pagination.total}
              </p>
            )}
          </>
        )}
      </div>
    </BaseSlider>
  );
};

export default CustomerHistorySlider;
