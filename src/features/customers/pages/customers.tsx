import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { AccessGuard } from '../../../shared/components/guards/AccessGuard';
import { UserCircle, Plus, Mail, Phone, Edit } from 'lucide-react';
import { Badge } from '../../../shared/components/ui/badge';
import AddCustomerSlider from '../components/AddCustomerSlider';
import EditCustomerSlider from '../components/EditCustomerSlider';
import CustomerDetailsPopup from '../components/CustomerDetailsPopup';
import CustomerHistorySlider from '../components/CustomerHistorySlider';
import { CustomerFilters } from '../components/CustomerFilters';
import { listCustomersAction, fetchCustomerByIdAction, clearCurrentCustomerAction, mergeCustomerAction } from '../actions';
import {
    getAllCustomersSelector,
    getCustomersLoadingSelector,
    getCurrentCustomerSelector,
    getIsFetchingCustomerSelector,
    getIsMergingCustomerSelector,
} from '../selectors';
import { ItemCard } from '../../../shared/components/common/ItemCard';
import { Avatar, AvatarFallback } from '../../../shared/components/ui/avatar';
import { getAvatarBgColor } from '../../setupWizard/components/StepTeam';
import { highlightMatches as highlight } from '../../../shared/utils/highlight';
import { EmptyState } from '../../../shared/components/common/EmptyState';
import CustomersListSkeleton from '../components/CustomersListSkeleton';

export default function CustomersPage() {
  const dispatch = useDispatch();
  const text = useTranslation("customers").t;
  const [isAddCustomerSliderOpen, setIsAddCustomerSliderOpen] = useState(false);
  const [isEditCustomerSliderOpen, setIsEditCustomerSliderOpen] = useState(false);
  const [isDetailsPopupOpen, setIsDetailsPopupOpen] = useState(false);
  const [isHistorySliderOpen, setIsHistorySliderOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const customers = useSelector(getAllCustomersSelector);
  const isLoading = useSelector(getCustomersLoadingSelector);
  const currentCustomer = useSelector(getCurrentCustomerSelector);
  const isFetchingCustomer = useSelector(getIsFetchingCustomerSelector);
  const isMerging = useSelector(getIsMergingCustomerSelector);
  const wasMergingRef = useRef(false);
  
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(listCustomersAction.request({
      search: searchTerm || undefined,
      filters: [],
      pagination: { offset: 0, limit: 20 }
    }));
  }, [dispatch, searchTerm]);

  useEffect(() => {
    if (isMerging) {
      wasMergingRef.current = true;
    } else if (wasMergingRef.current) {
      wasMergingRef.current = false;
      if (selectedCustomerId) {
        dispatch(fetchCustomerByIdAction.request({ id: selectedCustomerId }));
      }
    }
  }, [isMerging]);

  const currentCustomerId = currentCustomer?.id;
  const currentCustomerStatus = currentCustomer?.status;
  const mergedIntoCustomerId = currentCustomer?.mergedIntoCustomerId ?? null;

  useEffect(() => {
    if (currentCustomerStatus !== 'merged' || mergedIntoCustomerId == null) return;
    if (mergedIntoCustomerId === currentCustomerId) return;

    setSelectedCustomerId(mergedIntoCustomerId);
    dispatch(fetchCustomerByIdAction.request({ id: mergedIntoCustomerId }));
  }, [currentCustomerId, currentCustomerStatus, mergedIntoCustomerId, dispatch]);

  const handleCustomerClick = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setIsDetailsPopupOpen(true);
    dispatch(fetchCustomerByIdAction.request({ id: customerId }));
  };

  const handleCloseDetailsPopup = () => {
    setIsDetailsPopupOpen(false);
    setIsHistorySliderOpen(false);
    setSelectedCustomerId(null);
    dispatch(clearCurrentCustomerAction());
  };

  const handleEditFromPopup = () => {
    setIsEditCustomerSliderOpen(true);
  };

  const handleCloseEditSlider = useCallback(() => {
    setIsEditCustomerSliderOpen(false);
  }, []);

  const highlightMatches = (text: string) => {
    return highlight(text, searchTerm);
  };

  const filteredCustomers = customers;

  return (
    <AccessGuard>
      <AppLayout>
        <div className="space-y-6">
          <div className="mb-4 w-full border-b border-border-strong hidden md:block">
            <h1 className="px-4 pb-3 text-sm font-medium text-foreground md:text-2xl">
              {text("page.title")}
            </h1>
          </div>

          {isLoading ? (
            <CustomersListSkeleton />
          ) : (
            <>
              <CustomerFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onAddClick={() => setIsAddCustomerSliderOpen(true)}
              />

            {filteredCustomers.length === 0 ? (
          <EmptyState
            title={searchTerm 
              ? text("page.emptyState.noResults")
              : text("page.emptyState.noCustomers")}
            description={searchTerm
              ? text("page.emptyState.noResultsDescription")
              : text("page.emptyState.noCustomersDescription")}
            icon={UserCircle}
            actionButton={!searchTerm ? {
              label: text("page.actions.addCustomer"),
              onClick: () => setIsAddCustomerSliderOpen(true),
              icon: Plus,
            } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
            {filteredCustomers.map((customer) => {
              const displayName = `${customer.firstName} ${customer.lastName}`.trim();
              
              const initials = customer.firstName && customer.lastName
                ? `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase()
                : (customer.email?.[0] || '?').toUpperCase();

              const thumbnail = (
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback 
                    className="text-sm font-medium"
                    style={{ backgroundColor: getAvatarBgColor(customer.email) }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              );

              const customContent = (
                <div className="flex flex-col gap-1 mt-1">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-foreground-2">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{highlightMatches(customer.email)}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-foreground-2">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{customer.phone}</span>
                    </div>
                  )}
                  {customer.hasConflict && (
                    <div className="mt-0.5">
                      <Badge className="whitespace-nowrap border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-300 dark:hover:bg-orange-950/50">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" aria-hidden />
                        {text("page.badges.duplicate")}
                      </Badge>
                    </div>
                  )}
                </div>
              );

              const actions = [{
                icon: Edit,
                label: text("page.actionsLabel.editCustomer"),
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleCustomerClick(customer.id);
                },
              }];

              return (
                <ItemCard
                  key={customer.id}
                  title={highlightMatches(displayName)}
                  customContent={customContent}
                  actions={actions}
                  thumbnail={thumbnail}
                  onClick={() => handleCustomerClick(customer.id)}
                />
              );
              })}
            </div>
            )}
          </>
        )}
      </div>

      <AddCustomerSlider
        isOpen={isAddCustomerSliderOpen}
        onClose={() => setIsAddCustomerSliderOpen(false)}
      />

      <CustomerDetailsPopup
        isOpen={isDetailsPopupOpen}
        onClose={handleCloseDetailsPopup}
        customer={currentCustomer}
        isLoading={isFetchingCustomer && !currentCustomer}
        onEdit={handleEditFromPopup}
        onViewHistory={() => setIsHistorySliderOpen(true)}
        onMerge={() => {
          if (currentCustomer) {
            dispatch(mergeCustomerAction.request({ sourceId: currentCustomer.id }));
          }
        }}
        isMerging={isMerging}
        hasOverlayOpen={isHistorySliderOpen || isEditCustomerSliderOpen}
      />

      <CustomerHistorySlider
        isOpen={isHistorySliderOpen}
        onClose={() => setIsHistorySliderOpen(false)}
        customerId={selectedCustomerId}
        customerFirstName={
          currentCustomer?.id === selectedCustomerId ? currentCustomer.firstName : undefined
        }
        customerLastName={
          currentCustomer?.id === selectedCustomerId ? currentCustomer.lastName : undefined
        }
            elevated={isDetailsPopupOpen}
          />

          <EditCustomerSlider
            isOpen={isEditCustomerSliderOpen}
            onClose={handleCloseEditSlider}
            customerId={selectedCustomerId}
            elevated={isDetailsPopupOpen}
          />
      </AppLayout>
    </AccessGuard>
  );
}
