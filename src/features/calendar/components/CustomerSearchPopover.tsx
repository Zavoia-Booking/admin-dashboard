import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import type { Customer } from "../../../shared/types/customer";
import { SearchInput } from "../../../shared/components/common/SearchInput";
import { Popover, PopoverAnchor, PopoverContent } from "../../../shared/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "../../../shared/components/ui/command";
import { PersonAvatar } from "../../../shared/components/common/PersonAvatar";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { cn } from "../../../shared/lib/utils";
import { searchCustomersForPickerApi } from "../../customers/api";
import { highlightMatches } from "../../../shared/utils/highlight";
import "./addAppointmentSliderPopover.css";

export type CustomerSearchResult = Pick<Customer, "id" | "firstName" | "lastName" | "email" | "phone">;

interface CustomerSearchPopoverProps {
  onSelectCustomer: (customer: CustomerSearchResult) => void;
  resetTrigger?: unknown;
  rightSlot?: (controls: { closePopover: () => void }) => ReactNode;
  /** When true, auto-focus the search input on mount (useful for mobile overlays). */
  autoFocus?: boolean;
  /** Extra className for the results PopoverContent (e.g. to override z-index). */
  popoverClassName?: string;
  /** External ref to the search input — allows parent to focus it synchronously on tap. */
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const CUSTOMER_PICKER_PAGE_SIZE = 10;

export function CustomerSearchPopover({ onSelectCustomer, resetTrigger, rightSlot, autoFocus, popoverClassName, inputRef: externalInputRef }: CustomerSearchPopoverProps) {
  const { t } = useTranslation('calendar');
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerLoadingMore, setCustomerLoadingMore] = useState(false);
  const [customerSearchCompleted, setCustomerSearchCompleted] = useState(false);
  const [customerHasMore, setCustomerHasMore] = useState(false);
  const [customerOffset, setCustomerOffset] = useState(0);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [panelClosing, setPanelClosing] = useState(false);
  const panelCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const internalInputRef = useRef<HTMLInputElement>(null);
  const customerSearchInputRef = externalInputRef ?? internalInputRef;
  const customerSearchAnchorRef = useRef<HTMLDivElement>(null);
  const customerSearchRequestIdRef = useRef(0);
  const customerSearchAbortRef = useRef<AbortController | null>(null);
  const customerAppendInFlightRef = useRef(false);

  const normalizeCustomerSearch = useCallback((query: string) => query.trim().replace(/\s+/g, " "), []);

  // Auto-focus the search input when requested (mobile search overlay).
  // Focus on resetTrigger change so it fires each time the overlay opens,
  // not just on first mount.
  useEffect(() => {
    if (autoFocus && resetTrigger) {
      // requestAnimationFrame keeps focus within the user gesture on mobile
      requestAnimationFrame(() => {
        customerSearchInputRef.current?.focus({ preventScroll: true });
      });
    }
  }, [autoFocus, resetTrigger]);

  const startPanelClosing = useCallback(() => {
    setPanelClosing(true);
    if (panelCloseTimerRef.current) clearTimeout(panelCloseTimerRef.current);
    panelCloseTimerRef.current = setTimeout(() => {
      setPanelClosing(false);
      panelCloseTimerRef.current = null;
    }, 250);
  }, []);

  const closePopover = useCallback(() => {
    setCustomerOpen(false);
    startPanelClosing();
  }, [startPanelClosing]);

  const handlePopoverOpenChange = useCallback((open: boolean) => {
    setCustomerOpen(open);
    if (!open) startPanelClosing();
  }, [startPanelClosing]);

  useEffect(() => {
    return () => {
      if (panelCloseTimerRef.current) clearTimeout(panelCloseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setCustomerSearch("");
    setCustomerResults([]);
    setCustomerLoading(false);
    setCustomerLoadingMore(false);
    setCustomerSearchCompleted(false);
    setCustomerHasMore(false);
    setCustomerOffset(0);
    setCustomerOpen(false);
    customerSearchRequestIdRef.current = 0;
    customerSearchAbortRef.current?.abort();
    customerSearchAbortRef.current = null;
    customerAppendInFlightRef.current = false;
  }, [resetTrigger]);

  const searchCustomers = useCallback(
    async (query: string, append: boolean = false) => {
      const normalizedQuery = normalizeCustomerSearch(query);
      if (normalizedQuery.length < 2) {
        customerSearchRequestIdRef.current += 1;
        customerSearchAbortRef.current?.abort();
        customerSearchAbortRef.current = null;
        customerAppendInFlightRef.current = false;
        setCustomerResults([]);
        setCustomerLoading(false);
        setCustomerLoadingMore(false);
        setCustomerSearchCompleted(false);
        setCustomerHasMore(false);
        setCustomerOffset(0);
        return;
      }

      const requestId = customerSearchRequestIdRef.current + 1;
      customerSearchRequestIdRef.current = requestId;
      if (append && customerAppendInFlightRef.current) return;
      customerSearchAbortRef.current?.abort();
      const abortController = new AbortController();
      customerSearchAbortRef.current = abortController;
      const nextOffset = append ? customerOffset : 0;

      if (append) {
        customerAppendInFlightRef.current = true;
        setCustomerLoadingMore(true);
      } else {
        customerAppendInFlightRef.current = false;
        setCustomerLoading(true);
        setCustomerSearchCompleted(false);
      }

      try {
        const response = await searchCustomersForPickerApi(
          {
            search: normalizedQuery,
            offset: nextOffset,
            limit: CUSTOMER_PICKER_PAGE_SIZE,
          },
          { signal: abortController.signal },
        );

        if (requestId !== customerSearchRequestIdRef.current) return;
        const newData = response.data ?? [];
        setCustomerResults((prev) => {
          if (!append) return newData;
          const existingIds = new Set(prev.map((item) => item.id));
          const deduped = newData.filter((item) => !existingIds.has(item.id));
          return [...prev, ...deduped];
        });
        const page = response.pagination;
        setCustomerHasMore(!!page?.hasMore);
        setCustomerOffset((page?.offset ?? nextOffset) + (page?.limit ?? CUSTOMER_PICKER_PAGE_SIZE));
      } catch (error: any) {
        if (requestId !== customerSearchRequestIdRef.current) return;
        const cancelled = error?.code === "ERR_CANCELED" || error?.name === "CanceledError";
        if (!cancelled && !append) {
          setCustomerResults([]);
          setCustomerHasMore(false);
          setCustomerOffset(0);
        }
      } finally {
        if (append) {
          customerAppendInFlightRef.current = false;
        }
        if (requestId === customerSearchRequestIdRef.current) {
          setCustomerLoading(false);
          setCustomerLoadingMore(false);
          setCustomerSearchCompleted(true);
        }
      }
    },
    [customerOffset, normalizeCustomerSearch],
  );

  const handleCustomerSearchChange = useCallback(
    (value: string) => {
      const normalized = normalizeCustomerSearch(value);
      setCustomerSearch(value);
      if (normalized.length < 2) {
        setCustomerOpen(false);
        customerSearchRequestIdRef.current += 1;
        customerSearchAbortRef.current?.abort();
        customerSearchAbortRef.current = null;
        customerAppendInFlightRef.current = false;
        setCustomerLoading(false);
        setCustomerLoadingMore(false);
        setCustomerSearchCompleted(false);
        setCustomerResults([]);
        setCustomerHasMore(false);
        setCustomerOffset(0);
      }
    },
    [normalizeCustomerSearch],
  );

  const handleCustomerSearchDebounced = useCallback(
    (value: string) => {
      const normalized = normalizeCustomerSearch(value);
      if (normalized.length < 2) {
        setCustomerOpen(false);
        customerAppendInFlightRef.current = false;
        setCustomerLoading(false);
        setCustomerLoadingMore(false);
        setCustomerSearchCompleted(false);
        setCustomerResults([]);
        setCustomerHasMore(false);
        setCustomerOffset(0);
        return;
      }
      setCustomerOpen(true);
      setCustomerLoading(true);
      setCustomerSearchCompleted(false);
      setCustomerLoadingMore(false);
      setCustomerHasMore(false);
      setCustomerOffset(0);
      customerAppendInFlightRef.current = false;
      void searchCustomers(normalized, false);
    },
    [normalizeCustomerSearch, searchCustomers],
  );

  const handleCustomerListScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (customerLoading || customerLoadingMore || customerAppendInFlightRef.current || !customerHasMore) return;
      const target = event.currentTarget;
      const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 24;
      if (!nearBottom) return;
      const normalized = normalizeCustomerSearch(customerSearch);
      if (normalized.length < 2) return;
      void searchCustomers(normalized, true);
    },
    [customerLoading, customerLoadingMore, customerHasMore, normalizeCustomerSearch, customerSearch, searchCustomers],
  );

  const highlightedCustomerSearch = useMemo(
    () => normalizeCustomerSearch(customerSearch),
    [normalizeCustomerSearch, customerSearch],
  );
  const hasCustomerSearchQuery = highlightedCustomerSearch.length >= 2;
  const showCustomerSearchPopoverShell =
    (customerOpen || panelClosing) &&
    (customerLoading ||
      customerLoadingMore ||
      customerResults.length > 0 ||
      (customerSearchCompleted && hasCustomerSearchQuery));

  const handleSelectCustomer = useCallback(
    (customer: CustomerSearchResult) => {
      onSelectCustomer(customer);
      setCustomerOpen(false);
      setCustomerSearch("");
    },
    [onSelectCustomer],
  );

  return (
      <Popover open={customerOpen} onOpenChange={handlePopoverOpenChange}>
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <PopoverAnchor asChild>
          <div
            ref={customerSearchAnchorRef}
            className="flex-1 min-w-0 cursor-text outline-none focus:outline-none"
            onClick={() => customerSearchInputRef.current?.focus()}
          >
            <SearchInput
              ref={customerSearchInputRef}
              placeholder={t('page.appointments.customer.searchPlaceholder')}
              value={customerSearch}
              onChange={handleCustomerSearchChange}
              onDebouncedChange={handleCustomerSearchDebounced}
              onFocus={() => {
                if (normalizeCustomerSearch(customerSearch).length >= 2) {
                  setTimeout(() => setCustomerOpen(true), 0);
                }
              }}
              className="w-full"
              inputClassName={cn(
                "border-border hover:border-border-strong focus-visible:border-border-strong focus-visible:ring-0",
                showCustomerSearchPopoverShell &&
                  "!rounded-b-none !rounded-t-[22px] border-x border-t border-b-0 border-border-strong shadow-none",
              )}
            />
          </div>
        </PopoverAnchor>
        {rightSlot?.({ closePopover })}
      </div>
      <PopoverContent
        className={cn(
          "w-[var(--radix-popover-trigger-width)] md:w-[var(--radix-popover-trigger-width)] box-border -mt-px border border-t-0 bg-surface dark:bg-neutral-900 shadow-none p-0 z-[80] rounded-t-none rounded-b-[22px]",
          "add-appointment-popover-expand",
          showCustomerSearchPopoverShell ? "border-border-strong dark:border-border-strong" : "border-input dark:border-border",
          popoverClassName,
        )}
        side="bottom"
        align="start"
        sideOffset={0}
        avoidCollisions={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          const target = e.target as Node | null;
          if (!target) return;
          if (customerSearchAnchorRef.current?.contains(target)) {
            e.preventDefault();
          }
        }}
      >
        <Command shouldFilter={false}>
          <CommandList className="max-h-72 overflow-y-auto" onScroll={handleCustomerListScroll}>
            {customerLoading && customerResults.length === 0 && (
              <div className="space-y-0">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!customerLoading && customerSearchCompleted && customerSearch.length >= 2 && customerResults.length === 0 && (
              <CommandEmpty>{t('page.customerSearch.noneFound')}</CommandEmpty>
            )}
            {!customerLoading && customerResults.length > 0 && (
              <CommandGroup>
                {customerResults.map((customer, index) => {
                  return (
                    <CommandItem
                      key={customer.id}
                      value={`${customer.id}`}
                      onSelect={() => handleSelectCustomer(customer)}
                      className={cn(
                        "flex items-center gap-3 p-3 cursor-pointer",
                        "max-md:data-[selected=true]:bg-transparent",
                        index === customerResults.length - 1 && "rounded-b-[18px]",
                      )}
                    >
                      <PersonAvatar
                        id={customer.id}
                        firstName={customer.firstName}
                        lastName={customer.lastName}
                        className="h-8 w-8"
                        initialsClassName="text-sm font-medium"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-foreground-1">
                          {highlightMatches([customer.firstName, customer.lastName].filter(Boolean).join(' '), highlightedCustomerSearch)}
                        </div>
                        {customer.email && (
                          <div className="text-sm text-foreground-3 dark:text-foreground-2">
                            {highlightMatches(customer.email, highlightedCustomerSearch)}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="text-sm text-foreground-3 dark:text-foreground-2">
                            {highlightMatches(customer.phone, highlightedCustomerSearch)}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            {customerLoadingMore && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-foreground-3 dark:text-foreground-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t('page.customerSearch.loadingMore')}
              </div>
            )}
            {!customerLoading && !customerLoadingMore && customerSearchCompleted && customerResults.length > 0 && !customerHasMore && (
              <div className="py-2 text-center text-xs text-foreground-3 dark:text-foreground-2">
                {t('page.customerSearch.endOfResults')}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
