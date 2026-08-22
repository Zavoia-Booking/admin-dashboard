import React, { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  UserCircle,
  Pencil,
  X,
  Mail,
  Phone,
  ArrowUpRight,
  Calendar,
  Loader2,
  History,
  GitMerge,
  Check,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components/ui/button';
import { PersonAvatar } from '../../../shared/components/common/PersonAvatar';
import { Badge } from '../../../shared/components/ui/badge';
import { cn } from '../../../shared/lib/utils';
import {
  Dialog,
  DialogPortal,
  DialogTitle,
} from '../../../shared/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from '../../../shared/components/ui/drawer';
import { useIsMobile } from '../../../shared/hooks/use-mobile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../shared/components/ui/alert-dialog';
import { DashedDivider } from '../../../shared/components/common/DashedDivider';
import { CollapsibleFormSection } from '../../../shared/components/forms/CollapsibleFormSection';
import { getStatusBadge } from '../../calendar/components/utils';
import { formatActivityTimelineDateTime } from '../../calendar/timezone';
import { getCalendarTimezone } from '../../calendar/selectors';
import { Skeleton } from '../../../shared/components/ui/skeleton';
import type { Customer, RecentActivityItem } from '../../../shared/types/customer';

interface CustomerDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  isLoading: boolean;
  onEdit: () => void;
  onViewHistory?: () => void;
  onMerge?: () => void;
  isMerging?: boolean;
  hasOverlayOpen?: boolean;
}

const inlineLinkClass =
  'inline-flex min-w-0 max-w-full items-center gap-0.5 !font-normal text-foreground-2 transition-colors duration-200 hover:text-primary dark:text-foreground-2 dark:hover:text-primary';

function getSourceBadge(source: Customer['source'], label: string) {
  const styles: Record<string, string> = {
    manual: 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100',
    marketplace: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
    import: 'border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100',
  };
  const dots: Record<string, string> = {
    manual: 'bg-blue-500',
    marketplace: 'bg-emerald-500',
    import: 'bg-violet-500',
  };
  if (!styles[source]) return null;
  return (
    <Badge className={cn('whitespace-nowrap', styles[source])}>
      <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', dots[source])} aria-hidden />
      {label}
    </Badge>
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

const DIALOG_CURSOR = '[&_*]:cursor-default [&_a]:!cursor-pointer [&_a_*]:!cursor-pointer [&_button]:!cursor-pointer [&_button_*]:!cursor-pointer';

const COLLAPSIBLE_OUTER_CLASS = 'border border-border p-3 md:p-4 rounded-2xl bg-surface md:bg-transparent';

const CustomerDetailsPopup: React.FC<CustomerDetailsPopupProps> = ({
  isOpen,
  onClose,
  customer: selectedCustomer,
  isLoading: isFetching,
  onEdit,
  onViewHistory,
  onMerge,
  isMerging = false,
  hasOverlayOpen = false,
}) => {
  const { t } = useTranslation('customers');
  const mergeBenefits = [
    t('details.duplicate.benefit1'),
    t('details.duplicate.benefit2'),
    t('details.duplicate.benefit3'),
  ];
  const [notesOpen, setNotesOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(true);
  const [duplicateOpen, setDuplicateOpen] = useState(true);
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);
  const isMobile = useIsMobile();
  /* The page clears its selection the moment it closes this panel, so on mobile
   * — where the sheet stays mounted to slide out — the content would flip to
   * the loading skeleton on the way down. Keep showing the customer that was on
   * screen until the sheet is gone. */
  const [lastCustomer, setLastCustomer] = useState(selectedCustomer);
  if (selectedCustomer && selectedCustomer !== lastCustomer) setLastCustomer(selectedCustomer);
  const customer = isOpen ? selectedCustomer : lastCustomer;
  const isLoading = isOpen && isFetching;
  const calendarTimezone = useSelector(getCalendarTimezone);
  const timezone = (calendarTimezone && String(calendarTimezone).trim()) || 'UTC';

  const displayName = customer
    ? [customer.firstName, customer.lastName].filter(Boolean).join(' ')
    : '';

  const isMerged = customer?.status === 'merged';
  const canEdit = customer?.source === 'manual' && !isMerged;

  const panel = (
    <>
    {/* Header */}
    <div className={cn('relative shrink-0 px-5 pb-0 md:px-6', isMobile ? 'pt-3' : 'pt-5')}>
      <div className="flex items-center gap-4 pr-[4.5rem] sm:pr-52">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/50 dark:bg-muted/30"
          aria-hidden
        >
          <UserCircle className="h-6 w-6 text-foreground-1" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="min-w-0 truncate text-lg font-semibold leading-snug text-foreground-1">
              {t('details.title')}
            </h2>
          </div>
        </div>
      </div>

      {/* Top-right actions */}
      <div className="absolute right-3 top-4 flex items-center gap-2 sm:right-4 sm:top-5">
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            rounded="full"
            onClick={onEdit}
            className="group h-8 px-3 text-foreground-3 hover:text-foreground-1"
          >
            <Pencil
              className="mr-1.5 h-3.5 w-3.5 shrink-0 transition-colors duration-200 group-hover:text-primary"
              aria-hidden
            />
            {t('details.edit')}
          </Button>
        )}
        {/* Mobile has the drag handle and the backdrop; an X on a bottom sheet
            reads as a desktop dialog and is the first thing focus lands on. */}
        <button
          type="button"
          onClick={onClose}
          hidden={isMobile}
          className={cn(
            'h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground opacity-70 transition-[opacity,color]',
            isMobile ? 'hidden' : 'flex',
            'hover:opacity-100 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:pointer-events-none',
          )}
          aria-label={t('details.close')}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <DashedDivider marginTop="mt-0" paddingTop="pt-3" className="mb-4" dashPattern="1 1" />
    </div>

    {/* Body */}
    <div
      className={cn(
        'min-h-0 flex-1 overflow-y-auto bg-muted/20 scrollbar-hide px-4 py-3 dark:bg-background/50 md:px-6 md:py-4',
        isMobile && 'pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
      )}
    >
      {isLoading || !customer ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-white p-3 dark:bg-card md:p-5">
            <div className="flex items-center gap-4 border-b border-border-subtle pb-4">
              <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
            <div className="divide-y divide-border-subtle">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-6 py-3.5">
                  <Skeleton className="h-3.5 w-20 shrink-0" />
                  <Skeleton className="h-3.5 w-44" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border p-3 md:p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Duplicate detected section */}
          {customer.hasConflict && !isMerged && (
            <CollapsibleFormSection
              title={t('details.duplicate.title')}
              compact
              description={t('details.duplicate.description')}
              open={duplicateOpen}
              onOpenChange={setDuplicateOpen}
              className={COLLAPSIBLE_OUTER_CLASS}
            >
              <p className="text-sm leading-relaxed text-foreground-2">
                {t('details.duplicate.explanation')}
              </p>

              <ul className="mt-2.5 space-y-1.5">
                {mergeBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-xs text-foreground-3">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    {benefit}
                  </li>
                ))} 
              </ul>

              {onMerge && (
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    rounded="full"
                    onClick={() => setShowMergeConfirm(true)}
                    disabled={isMerging}
                    className="gap-1.5"
                  >
                    {isMerging ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {t('details.duplicate.resolving')}
                      </>
                    ) : (
                      <>
                        <GitMerge className="h-3.5 w-3.5" />
                        {t('details.duplicate.resolveButton')}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CollapsibleFormSection>
          )}

          {/* Customer info card */}
          <div
            className={cn(
              'relative rounded-2xl border border-border bg-white shadow-sm',
              'transition-all duration-300 hover:border-border-strong',
              'dark:bg-neutral-900/30 dark:bg-card',
            )}
          >
            <div className="relative p-3 md:p-5">
              {/* Avatar + name + contact */}
              <div className="relative border-b border-border-subtle pb-4">
                {customer.hasConflict && !isMerged && (
                  <div className="mb-3 flex justify-end sm:hidden">
                    <Badge className="whitespace-nowrap border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
                      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                      {t('details.duplicate.badge')}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <PersonAvatar
                    id={customer.id ?? customer.email ?? ''}
                    firstName={customer.firstName}
                    lastName={customer.lastName}
                    profileImage={customer.profileImage}
                    className="h-11 w-11 ring-1 ring-border-subtle"
                    initialsClassName="text-sm font-semibold"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold capitalize leading-tight text-foreground-1">
                      {displayName}
                    </p>
                  </div>
                  {customer.hasConflict && !isMerged && (
                    <Badge className="hidden shrink-0 whitespace-nowrap border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 sm:inline-flex">
                      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                      {t('details.duplicate.badge')}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Key-value rows */}
              <dl className="divide-y divide-border-subtle text-sm">
                <div className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[minmax(7.5rem,9.5rem)_minmax(0,1fr)] sm:items-start sm:gap-x-6">
                  <dt className="font-medium text-foreground-3 sm:pt-0.5">{t('details.email')}</dt>
                  <dd className="min-w-0 font-semibold text-foreground-1">
                    {customer.email ? (
                      <a
                        href={`mailto:${customer.email}`}
                        className={cn(inlineLinkClass, 'py-0.5 gap-2 text-foreground-1 !font-semibold')}
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0 text-foreground-3" aria-hidden />
                        <span className="min-w-0 truncate">{customer.email}</span>
                        <ArrowUpRight className="h-3 w-3 shrink-0 text-primary" aria-hidden />
                      </a>
                    ) : (
                      <span className="text-foreground-3 font-normal">{t('details.notProvided')}</span>
                    )}
                  </dd>
                </div>

                <div className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[minmax(7.5rem,9.5rem)_minmax(0,1fr)] sm:items-start sm:gap-x-6">
                  <dt className="font-medium text-foreground-3 sm:pt-0.5">{t('details.phone')}</dt>
                  <dd className="min-w-0 font-semibold text-foreground-1">
                    {customer.phone ? (
                      <a
                        href={`tel:${customer.phone.replace(/\s/g, '')}`}
                        className={cn(inlineLinkClass, 'py-0.5 gap-2 text-foreground-1 !font-semibold')}
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0 text-foreground-3" aria-hidden />
                        <span className="min-w-0 truncate">{customer.phone}</span>
                        <ArrowUpRight className="h-3 w-3 shrink-0 text-primary" aria-hidden />
                      </a>
                    ) : (
                      <span className="text-foreground-3 font-normal">{t('details.notProvided')}</span>
                    )}
                  </dd>
                </div>

                <div className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[minmax(7.5rem,9.5rem)_minmax(0,1fr)] sm:items-start sm:gap-x-6">
                  <dt className="font-medium text-foreground-3 sm:pt-0.5">{t('details.source')}</dt>
                  <dd className="min-w-0">
                    {getSourceBadge(customer.source, t({ manual: 'details.sourceManual', marketplace: 'details.sourceMarketplace', import: 'details.sourceImport' }[customer.source] ?? ''))}
                  </dd>
                </div>

                <div className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[minmax(7.5rem,9.5rem)_minmax(0,1fr)] sm:items-start sm:gap-x-6">
                  <dt className="font-medium text-foreground-3 sm:pt-0.5">{t('details.customerSince')}</dt>
                  <dd className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-foreground-3" aria-hidden />
                      <span className="font-semibold text-foreground-1">
                        {formatDate(customer.createdAt)}
                      </span>
                    </div>
                  </dd>
                </div>

              </dl>
            </div>
          </div>

          {/* Notes card */}
          {customer.notes && (
            <CollapsibleFormSection
              title={t('details.notes.title')}
              compact
              description={t('details.notes.description')}
              open={notesOpen}
              onOpenChange={setNotesOpen}
              className={COLLAPSIBLE_OUTER_CLASS}
            >
              <p className="text-sm leading-relaxed text-foreground-2 whitespace-pre-wrap">
                {customer.notes}
              </p>
            </CollapsibleFormSection>
          )}

          {/* Recent activity */}
          {customer.recentActivity && customer.recentActivity.length > 0 && (
            <CollapsibleFormSection
              title={t('details.activity.title')}
              compact
              description={t('details.activity.description')}
              open={activityOpen}
              onOpenChange={setActivityOpen}
              className={COLLAPSIBLE_OUTER_CLASS}
            >
              <ul className="m-0 list-none p-0" role="list">
                {customer.recentActivity.map((item: RecentActivityItem, index: number) => {
                  const isLast = index === customer.recentActivity!.length - 1;
                  return (
                    <li key={`${item.type}-${item.date}-${index}`} className="list-none">
                      <div
                        className={cn(
                          'flex items-start gap-3',
                          !isLast && 'pb-3',
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
                              className="mt-1 h-6 w-px shrink-0 bg-border dark:bg-border-strong/80"
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
                                {getStatusBadge(item.status, t)}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs leading-snug text-foreground-3 dark:text-foreground-2">
                            {formatActivityTimelineDateTime(item.date, timezone)}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {onViewHistory && (
                <div className="mt-3 flex justify-center border-t border-border-subtle pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    rounded="full"
                    onClick={onViewHistory}
                    className="group gap-1.5 text-foreground-3 hover:text-foreground-1"
                  >
                    <History className="h-3.5 w-3.5 transition-colors group-hover:text-primary" />
                    {t('details.activity.seeHistory')}
                  </Button>
                </div>
              )}
            </CollapsibleFormSection>
          )}
        </div>
      )}
    </div>
    </>
  );

  /* Resolve duplicate confirmation dialog */
  const mergeConfirmDialog = (
    <AlertDialog open={showMergeConfirm} onOpenChange={setShowMergeConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('details.mergeDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('details.mergeDialog.description', { name: displayName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isMerging}>{t('details.mergeDialog.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onMerge?.();
              setShowMergeConfirm(false);
            }}
            disabled={isMerging}
          >
            {isMerging ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('details.duplicate.resolving')}
              </>
            ) : (
              t('details.mergeDialog.confirm')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Mobile gets a bottom sheet, not a centred card: a 90vh dialog pinned to the
  // middle of a phone screen leaves the close button out of thumb reach and
  // reads as a desktop popup. Same content, native-feeling container — the
  // pattern [AppointmentGroupDialog] already uses. Sitting at z-70 (like the
  // desktop dialog) keeps it above the bottom nav (z-60) and below the history
  // and edit sliders (z-75/80) that open on top of it.
  if (isMobile) {
    // Mounted while closed on purpose: returning null would cut the sheet's
    // slide-out animation, which is the whole point of a drawer.
    return (
      <>
        <Drawer
          open={isOpen}
          onOpenChange={(open) => {
            // A slider opened on top owns the gesture; closing the sheet under
            // it would strand the slider over an empty page.
            if (!open && !hasOverlayOpen) onClose();
          }}
          autoFocus
        >
          <DrawerContent
            className={cn(
              // `!max-h` beats the direction-scoped 85vh in [DrawerContent]: dvh keeps the
              // sheet honest while a mobile browser toolbar collapses.
              '!z-[70] !max-h-[85dvh] overflow-hidden bg-white dark:bg-surface',
              DIALOG_CURSOR,
            )}
            overlayClassName="!z-[65]"
            // Focus has to enter the sheet — Vaul would otherwise leave it on
            // the trigger, which Radix then buries in an aria-hidden subtree —
            // but it must not land on the first button and light up its focus
            // ring. Park it on the panel itself, as [ManageServicesSheet] does.
            tabIndex={-1}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              (event.currentTarget as HTMLElement | null)?.focus?.();
            }}
          >
            <DrawerTitle className="sr-only">{t('details.title')}</DrawerTitle>
            {panel}
          </DrawerContent>
        </Drawer>
        {mergeConfirmDialog}
      </>
    );
  }

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} modal={false}>
        <DialogPortal>
          <div className="fixed inset-0 z-[70] bg-black/50" onClick={() => { if (!hasOverlayOpen) onClose(); }} />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            className={cn(
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200',
              'fixed left-[50%] top-[50%] z-[70] flex w-[calc(100%-2rem)] max-w-3xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%]',
              'flex-col overflow-hidden rounded-2xl border border-border bg-white p-0 shadow-lg dark:bg-surface',
              'focus:outline-none focus-visible:outline-none',
              DIALOG_CURSOR,
            )}
          >
            <DialogTitle className="sr-only">{t('details.title')}</DialogTitle>
            {panel}
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
      {mergeConfirmDialog}
    </>
  );
};

export default CustomerDetailsPopup;
