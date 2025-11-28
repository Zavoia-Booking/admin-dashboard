import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { UserCircle, Plus, Mail, Phone, Loader2, Edit, Search, Filter, X } from 'lucide-react';
import AddCustomerSlider from '../components/AddCustomerSlider';
import EditCustomerSlider from '../components/EditCustomerSlider';
import { listCustomersAction } from '../actions';
import { 
  getAllCustomersSelector, 
  getCustomersLoadingSelector,
  getCustomersSummarySelector 
} from '../selectors';
import { ItemCard } from '../../../shared/components/common/ItemCard';
import { Avatar, AvatarFallback } from '../../../shared/components/ui/avatar';
import { getAvatarBgColor } from '../../setupWizard/components/StepTeam';
import { Input } from '../../../shared/components/ui/input';
import { FilterPanel } from '../../../shared/components/common/FilterPanel';

export default function CustomersPage() {
  const dispatch = useDispatch();
  const [isAddCustomerSliderOpen, setIsAddCustomerSliderOpen] = useState(false);
  const [isEditCustomerSliderOpen, setIsEditCustomerSliderOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const customers = useSelector(getAllCustomersSelector);
  const isLoading = useSelector(getCustomersLoadingSelector);
  const summary = useSelector(getCustomersSummarySelector);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Local filter state (used in filter card only)
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);

  // Fetch customers on mount
  useEffect(() => {
    dispatch(listCustomersAction.request({
      filters: [],
      pagination: { offset: 0, limit: 20 }
    }));
  }, [dispatch]);

  useEffect(() => {
    if (showFilters) {
      setLocalStatusFilter(statusFilter);
    }
  }, [showFilters, statusFilter]);

  // Calculate number of active filters
  const activeFiltersCount = [
    !!searchTerm,
    statusFilter !== 'all'
  ].filter(Boolean).length;

  const handleEditCustomer = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setIsEditCustomerSliderOpen(true);
  };

  const handleCloseEditSlider = () => {
    setIsEditCustomerSliderOpen(false);
    setSelectedCustomerId(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Controls: Search, Filter, Add */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-11 text-base pr-12 pl-4 rounded-lg border border-input bg-white"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          <button
            className={`
              relative flex items-center justify-center h-9 w-9 rounded-md border border-input transition-all duration-200 ease-out
              ${showFilters
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-white text-muted-foreground hover:text-foreground hover:bg-muted/50'}
            `}
            onClick={() => setShowFilters(v => !v)}
            aria-label="Show filters"
          >
            <Filter className={`h-5 w-5 ${showFilters ? 'text-primary-foreground' : ''}`} />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] flex items-center justify-center shadow">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <Button
            className="h-11 px-4 rounded-lg bg-black hover:bg-gray-800 flex items-center gap-2"
            onClick={() => setIsAddCustomerSliderOpen(true)}
          >
            <Plus className="h-5 w-5" />
            <span className="font-semibold">Add New</span>
          </Button>
        </div>

        {/* Filter Panel (dropdown style) */}
        {showFilters && (
          <FilterPanel
            open={showFilters}
            onOpenChange={setShowFilters}
            fields={[
              {
                type: 'select',
                key: 'status',
                label: 'Status',
                value: localStatusFilter,
                options: [
                  { value: 'all', label: 'All statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'duplicate', label: 'Duplicate' },
                ],
                searchable: true,
              },
              {
                type: 'text',
                key: 'search',
                label: 'Search',
                value: searchTerm,
                placeholder: 'Search customers...'
              },
            ]}
            onApply={values => {
              setStatusFilter(values.status);
              setSearchTerm(values.search);
              setShowFilters(false);
            }}
            onClear={() => {
              setStatusFilter('all');
              setSearchTerm('');
            }}
          />
        )}
        
        {/* Active Filter Badges */}
        {(searchTerm || statusFilter !== 'all') && (
          <div className="flex flex-wrap gap-2 mb-2">
            {searchTerm && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                onClick={() => setSearchTerm('')}
              >
                Search: "{searchTerm}"
                <X className="h-4 w-4 ml-1" />
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                onClick={() => setStatusFilter('all')}
              >
                Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                <X className="h-4 w-4 ml-1" />
              </Badge>
            )}
          </div>
        )}

        {/* Stats Cards */}
        {customers.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border bg-white p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{summary?.total || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Total</div>
            </div>
            <div className="rounded-lg border bg-white p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{summary?.active || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Active</div>
            </div>
            <div className="rounded-lg border bg-white p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{summary?.duplicates || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Duplicates</div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : customers.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center">
            <UserCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No customers yet. Add your first customer to get started.
            </p>
            <Button
              onClick={() => setIsAddCustomerSliderOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
            {customers.map((customer) => {
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
                      <span className="truncate">{customer.email}</span>
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
                  title={displayName}
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


