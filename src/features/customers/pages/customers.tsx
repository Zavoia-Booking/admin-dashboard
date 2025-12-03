import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { UserCircle, Plus, Mail, Phone, Edit } from 'lucide-react';
import AddCustomerSlider from '../components/AddCustomerSlider';
import EditCustomerSlider from '../components/EditCustomerSlider';
import { CustomerFilters } from '../components/CustomerFilters';
import { listCustomersAction } from '../actions';
import { 
  getAllCustomersSelector, 
  getCustomersLoadingSelector
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
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const customers = useSelector(getAllCustomersSelector);
  const isLoading = useSelector(getCustomersLoadingSelector);
  
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch customers on mount
  useEffect(() => {
    dispatch(listCustomersAction.request({
      filters: [],
      pagination: { offset: 0, limit: 20 }
    }));
  }, [dispatch]);

  const handleEditCustomer = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setIsEditCustomerSliderOpen(true);
  };

  const handleCloseEditSlider = () => {
    setIsEditCustomerSliderOpen(false);
    setSelectedCustomerId(null);
  };

  // Highlight helper using shared utility
  const highlightMatches = (text: string) => {
    return highlight(text, searchTerm);
  };

  // Filter customers based on search (name or email)
  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (customer.firstName || '').toLowerCase().includes(searchLower) ||
      (customer.lastName || '').toLowerCase().includes(searchLower) ||
      (customer.email || '').toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* While customers are loading, show full-page skeleton (including filters) */}
        {isLoading ? (
          <CustomersListSkeleton />
        ) : (
          <>
            {/* Customer Filters */}
            <CustomerFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onAddClick={() => setIsAddCustomerSliderOpen(true)}
            />

            {/* Main Content */}
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
              
              // Create initials for avatar
              const initials = customer.firstName && customer.lastName
                ? `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase()
                : (customer.email?.[0] || '?').toUpperCase();

              // Create avatar/thumbnail
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

              // Build custom description with email and phone
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
                </div>
              );

              // Build category for duplicate badge
              const category = customer.hasConflict ? {
                name: 'Duplicate',
                color: '#fecaca',
              } : null;

              // Build actions array
              const actions = [{
                icon: Edit,
                label: "Edit Customer",
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleEditCustomer(customer.id);
                },
              }];

              return (
                <ItemCard
                  key={customer.id}
                  title={highlightMatches(displayName)}
                  customContent={customContent}
                  category={category}
                  actions={actions}
                  thumbnail={thumbnail}
                  onClick={() => handleEditCustomer(customer.id)}
                />
              );
              })}
            </div>
            )}
          </>
        )}
      </div>

      {/* Add Customer Slider */}
      <AddCustomerSlider
        isOpen={isAddCustomerSliderOpen}
        onClose={() => setIsAddCustomerSliderOpen(false)}
      />

      {/* Edit Customer Slider */}
      <EditCustomerSlider
        isOpen={isEditCustomerSliderOpen}
        onClose={handleCloseEditSlider}
        customerId={selectedCustomerId}
      />
    </AppLayout>
  );
}


