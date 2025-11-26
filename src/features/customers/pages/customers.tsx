import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { UserCircle, Plus, Mail, Phone, Loader2 } from 'lucide-react';
import AddCustomerSlider from '../components/AddCustomerSlider';
import EditCustomerSlider from '../components/EditCustomerSlider';
import { listCustomersAction } from '../actions';
import { 
  getAllCustomersSelector, 
  getCustomersLoadingSelector,
  getCustomersSummarySelector 
} from '../selectors';

export default function CustomersPage() {
  const dispatch = useDispatch();
  const [isAddCustomerSliderOpen, setIsAddCustomerSliderOpen] = useState(false);
  const [isEditCustomerSliderOpen, setIsEditCustomerSliderOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const customers = useSelector(getAllCustomersSelector);
  const isLoading = useSelector(getCustomersLoadingSelector);
  const summary = useSelector(getCustomersSummarySelector);

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

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCircle className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold">Customers</h1>
              {summary && (
                <p className="text-sm text-muted-foreground">
                  {summary.total} total · {summary.active} active · {summary.duplicates} duplicates
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={() => setIsAddCustomerSliderOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Customers List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12">
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
              <div className="space-y-2">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => handleEditCustomer(customer.id)}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {customer.firstName?.[0]}{customer.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {customer.firstName} {customer.lastName}
                          </p>
                          {customer.hasConflict && (
                            <Badge variant="destructive" className="text-xs">
                              Duplicate
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {customer.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                        {customer.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {customer.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Added {new Date(customer.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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


