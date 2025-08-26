import React, { useState } from 'react';
import { CreditCard, Calendar, Download, Receipt, Crown, Check, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import { BaseSlider } from '../common/BaseSlider';

interface BillingSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank';
  last4?: string;
  brand?: string;
  expiry?: string;
  isDefault: boolean;
  email?: string;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  plan: string;
  period: string;
  downloadUrl?: string;
}

interface Subscription {
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: string;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
}

const BillingSlider: React.FC<BillingSliderProps> = ({ isOpen, onClose }) => {
  const [subscription] = useState<Subscription>({
    plan: 'professional',
    status: 'active',
    currentPeriodEnd: '2024-03-15',
    autoRenew: true,
    cancelAtPeriodEnd: false,
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiry: '12/26',
      isDefault: true,
    },
    {
      id: '2',
      type: 'paypal',
      email: 'john.doe@example.com',
      isDefault: false,
    },
  ]);

  const [invoices] = useState<Invoice[]>([
    {
      id: 'inv_001',
      date: '2024-02-15',
      amount: 29.99,
      status: 'paid',
      plan: 'Professional',
      period: 'Feb 15 - Mar 15, 2024',
      downloadUrl: '/invoices/inv_001.pdf',
    },
    {
      id: 'inv_002',
      date: '2024-01-15',
      amount: 29.99,
      status: 'paid',
      plan: 'Professional',
      period: 'Jan 15 - Feb 15, 2024',
      downloadUrl: '/invoices/inv_002.pdf',
    },
    {
      id: 'inv_003',
      date: '2023-12-15',
      amount: 29.99,
      status: 'paid',
      plan: 'Professional',
      period: 'Dec 15, 2023 - Jan 15, 2024',
      downloadUrl: '/invoices/inv_003.pdf',
    },
  ]);

  const [autoRenew, setAutoRenew] = useState(subscription.autoRenew);

  const handleSetDefaultPayment = (methodId: string) => {
    setPaymentMethods(prev => prev.map(method => ({
      ...method,
      isDefault: method.id === methodId
    })));
    toast.success('Default payment method updated');
  };

  const handleDeletePaymentMethod = (methodId: string) => {
    if (paymentMethods.find(m => m.id === methodId)?.isDefault) {
      toast.error('Cannot delete default payment method');
      return;
    }
    setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
    toast.success('Payment method removed');
  };

  const handleAddPaymentMethod = () => {
    toast.info('Add payment method flow would be implemented here');
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    toast.success(`Downloading invoice ${invoice.id}`);
  };

  const handleUpgradePlan = () => {
    toast.info('Upgrade plan flow would be implemented here');
  };

  const handleCancelSubscription = () => {
    toast.info('Cancel subscription flow would be implemented here');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800 text-xs">Canceled</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Past Due</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">{status}</Badge>;
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 text-xs">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 text-xs">Overdue</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">{status}</Badge>;
    }
  };

  const getCardIcon = (brand: string) => {
    return <CreditCard className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'starter': return 'Starter';
      case 'professional': return 'Professional';
      case 'enterprise': return 'Enterprise';
      default: return plan;
    }
  };

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case 'starter': return '$9.99';
      case 'professional': return '$29.99';
      case 'enterprise': return '$99.99';
      default: return '$0';
    }
  };

  return (
    <BaseSlider
      isOpen={isOpen}
      onClose={onClose}
      title="Billing & Subscription"
      contentClassName="bg-muted/50 scrollbar-hide"
      footer={
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
          <Button 
            onClick={() => {
              toast.success('✅ Billing settings saved');
              onClose();
            }}
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="max-w-md mx-auto space-y-6">
        {/* Current Plan Section */}
        <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/50">
              <div className="p-2 rounded-xl bg-primary/10">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Current Plan</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-lg">{getPlanName(subscription.plan)}</h4>
                  <p className="text-sm text-muted-foreground">{getPlanPrice(subscription.plan)}/month</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(subscription.status)}
                  <p className="text-xs text-muted-foreground mt-1">
                    Renews {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground">Auto-Renewal</Label>
                    <p className="text-xs text-muted-foreground">Automatically renew your subscription.</p>
                  </div>
                  <Switch
                    checked={autoRenew}
                    onCheckedChange={(checked) => {
                      setAutoRenew(checked);
                      toast.success(`Auto-renewal ${checked ? 'enabled' : 'disabled'}`);
                    }}
                    className="!h-5 !w-9 !min-h-0 !min-w-0"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleUpgradePlan}
                  className="flex-1 h-10"
                >
                  Upgrade Plan
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelSubscription}
                  className="flex-1 h-10 text-destructive hover:bg-destructive/10"
                >
                  Cancel Plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Payment Methods Section */}
        <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/50">
              <div className="p-2 rounded-xl bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Payment Methods</h3>
            </div>
            <div className="space-y-3">
              {paymentMethods.map((method, index) => (
                <div key={method.id}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted/50 rounded-lg flex items-center justify-center">
                        {method.type === 'card' ? (
                          getCardIcon(method.brand || '')
                        ) : (
                          <Receipt className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        {method.type === 'card' ? (
                          <>
                            <p className="text-sm font-medium">
                              {method.brand} •••• {method.last4}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Expires {method.expiry}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium">PayPal</p>
                            <p className="text-xs text-muted-foreground">{method.email}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {method.isDefault && (
                        <Badge className="bg-primary/10 text-primary text-xs">Default</Badge>
                      )}
                      <div className="flex gap-1">
                        {!method.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefaultPayment(method.id)}
                            className="h-8 px-2 text-xs"
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {index < paymentMethods.length - 1 && <Separator className="my-3" />}
                </div>
              ))}
              <Button 
                variant="outline" 
                onClick={handleAddPaymentMethod}
                className="w-full h-10 mt-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Billing History Section */}
        <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/50">
              <div className="p-2 rounded-xl bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Billing History</h3>
            </div>
            <div className="space-y-3">
              {invoices.map((invoice, index) => (
                <div key={invoice.id}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">${invoice.amount.toFixed(2)}</p>
                        {getInvoiceStatusBadge(invoice.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">{invoice.plan}</p>
                      <p className="text-xs text-muted-foreground">{invoice.period}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-xs text-muted-foreground">{formatDate(invoice.date)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadInvoice(invoice)}
                        className="h-8 px-2"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {index < invoices.length - 1 && <Separator className="my-3" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Plan Comparison */}
        <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Crown className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-sm mb-2">Need More Features?</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Compare plans and find the perfect fit for your business.
            </p>
            <Button variant="outline" size="sm" className="text-xs h-8">
              <ExternalLink className="h-3 w-3 mr-2" />
              Compare Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    </BaseSlider>
  );
};

export default BillingSlider; 