import React, { useState } from 'react';
import { Plug, CreditCard, Calendar, Video, Mail, BarChart3, Star, FileText, Users, ExternalLink, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BaseSlider } from '@/components/common/BaseSlider';

interface IntegrationsSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  connected: boolean;
  category: 'payment' | 'calendar' | 'communication' | 'marketing' | 'analytics' | 'reviews' | 'accounting' | 'crm';
  requiresApiKey?: boolean;
  apiKey?: string;
  status?: 'active' | 'error' | 'pending';
  lastSync?: string;
}

const IntegrationsSlider: React.FC<IntegrationsSliderProps> = ({ isOpen, onClose }) => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    // Payment Processors
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Accept credit card payments and manage subscriptions',
      icon: CreditCard,
      connected: true,
      category: 'payment',
      status: 'active',
      lastSync: '2 minutes ago'
    },
    {
      id: 'square',
      name: 'Square',
      description: 'Point of sale and payment processing',
      icon: CreditCard,
      connected: false,
      category: 'payment'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Accept PayPal payments from customers',
      icon: CreditCard,
      connected: false,
      category: 'payment'
    },
    
    // Calendar Integrations
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Sync appointments with your Google Calendar',
      icon: Calendar,
      connected: true,
      category: 'calendar',
      status: 'active',
      lastSync: '1 hour ago'
    },
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      description: 'Two-way sync with Outlook calendar',
      icon: Calendar,
      connected: false,
      category: 'calendar'
    },
    {
      id: 'apple-calendar',
      name: 'Apple Calendar',
      description: 'Sync with iCloud calendar',
      icon: Calendar,
      connected: false,
      category: 'calendar'
    },
    
    // Communication Tools
    {
      id: 'zoom',
      name: 'Zoom',
      description: 'Automatically create Zoom links for virtual appointments',
      icon: Video,
      connected: true,
      category: 'communication',
      status: 'active',
      lastSync: '30 minutes ago'
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      description: 'Generate Teams meeting links',
      icon: Video,
      connected: false,
      category: 'communication'
    },
    {
      id: 'meet',
      name: 'Google Meet',
      description: 'Create Google Meet links for video calls',
      icon: Video,
      connected: false,
      category: 'communication'
    },
    
    // Email Marketing
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      description: 'Sync customer data and send marketing campaigns',
      icon: Mail,
      connected: false,
      category: 'marketing'
    },
    {
      id: 'constant-contact',
      name: 'Constant Contact',
      description: 'Email marketing and contact management',
      icon: Mail,
      connected: false,
      category: 'marketing'
    },
    
    // Analytics
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      description: 'Track website visits and booking conversions',
      icon: BarChart3,
      connected: false,
      category: 'analytics',
      requiresApiKey: true
    },
    {
      id: 'facebook-pixel',
      name: 'Facebook Pixel',
      description: 'Track conversions for Facebook ads',
      icon: BarChart3,
      connected: false,
      category: 'analytics',
      requiresApiKey: true
    },
    
    // Reviews
    {
      id: 'google-reviews',
      name: 'Google Reviews',
      description: 'Automatically request Google reviews after appointments',
      icon: Star,
      connected: false,
      category: 'reviews'
    },
    {
      id: 'yelp',
      name: 'Yelp',
      description: 'Manage your Yelp business profile',
      icon: Star,
      connected: false,
      category: 'reviews',
      requiresApiKey: true
    },
    
    // Accounting
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Sync payments and customer data with QuickBooks',
      icon: FileText,
      connected: false,
      category: 'accounting'
    },
    {
      id: 'xero',
      name: 'Xero',
      description: 'Accounting and invoicing integration',
      icon: FileText,
      connected: false,
      category: 'accounting'
    },
    
    // CRM
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Sync customer data with Salesforce CRM',
      icon: Users,
      connected: false,
      category: 'crm'
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Customer relationship management',
      icon: Users,
      connected: false,
      category: 'crm'
    }
  ]);

  const handleToggleIntegration = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { 
            ...integration, 
            connected: !integration.connected,
            status: !integration.connected ? 'active' : undefined,
            lastSync: !integration.connected ? 'Just now' : undefined
          }
        : integration
    ));
    
    const integration = integrations.find(i => i.id === integrationId);
    if (integration) {
      toast.success(`${integration.name} ${integration.connected ? 'disconnected' : 'connected'} successfully`);
    }
  };

  const handleApiKeyUpdate = (integrationId: string, apiKey: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, apiKey }
        : integration
    ));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment': return CreditCard;
      case 'calendar': return Calendar;
      case 'communication': return Video;
      case 'marketing': return Mail;
      case 'analytics': return BarChart3;
      case 'reviews': return Star;
      case 'accounting': return FileText;
      case 'crm': return Users;
      default: return Plug;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'payment': return 'Payment Processors';
      case 'calendar': return 'Calendar Sync';
      case 'communication': return 'Communication Tools';
      case 'marketing': return 'Email Marketing';
      case 'analytics': return 'Analytics & Tracking';
      case 'reviews': return 'Review Management';
      case 'accounting': return 'Accounting Software';
      case 'crm': return 'Customer Management';
      default: return 'Other';
    }
  };

  const getStatusBadge = (integration: Integration) => {
    if (!integration.connected) return null;
    
    switch (integration.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 text-xs">Error</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Connected</Badge>;
    }
  };

  // Group integrations by category
  const categories = [
    'payment',
    'calendar', 
    'communication',
    'marketing',
    'analytics',
    'reviews',
    'accounting',
    'crm'
  ];

  const connectedCount = integrations.filter(i => i.connected).length;

  return (
    <BaseSlider
      isOpen={isOpen}
      onClose={onClose}
      title="Integrations"
      contentClassName="bg-muted/50 scrollbar-hide"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={() => {
              toast.success('✅ Integration settings saved');
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
        
        {/* Stats Card */}
        <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{connectedCount}</div>
              <div className="text-sm text-muted-foreground">Connected Services</div>
              <div className="text-xs text-muted-foreground mt-1">
                {integrations.length - connectedCount} available to connect
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Categories */}
        {categories.map(category => {
          const categoryIntegrations = integrations.filter(i => i.category === category);
          if (categoryIntegrations.length === 0) return null;
          
          const CategoryIcon = getCategoryIcon(category);
          
          return (
            <Card key={category} className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
              <CardContent className="space-y-4">
                {/* Category Header */}
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <CategoryIcon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{getCategoryTitle(category)}</h3>
                </div>
                
                {/* Integrations List */}
                <div className="space-y-3">
                  {categoryIntegrations.map(integration => {
                    const IconComponent = integration.icon;
                    
                    return (
                      <div key={integration.id} className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <IconComponent className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">{integration.name}</h4>
                              {getStatusBadge(integration)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {integration.description}
                            </p>
                            {integration.connected && integration.lastSync && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Last sync: {integration.lastSync}
                              </p>
                            )}
                            
                            {/* API Key Input for connected services that require it */}
                            {integration.connected && integration.requiresApiKey && (
                              <div className="mt-2 space-y-1">
                                <Label className="text-xs font-medium">API Key</Label>
                                <Input
                                  type="password"
                                  value={integration.apiKey || ''}
                                  onChange={(e) => handleApiKeyUpdate(integration.id, e.target.value)}
                                  className="border-0 bg-muted/50 focus:bg-background text-xs h-8"
                                  placeholder="Enter your API key"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {integration.connected && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                toast.info(`Configure ${integration.name} settings`);
                              }}
                              className="h-8 px-2 text-xs"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                          <Switch
                            checked={integration.connected}
                            onCheckedChange={() => handleToggleIntegration(integration.id)}
                            className="!h-5 !w-9 !min-h-0 !min-w-0"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Help Card */}
        <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Plug className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-sm mb-2">Need Help?</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Check our integration guides for step-by-step setup instructions.
            </p>
            <Button variant="outline" size="sm" className="text-xs h-8">
              View Documentation
            </Button>
          </CardContent>
        </Card>
      </div>
    </BaseSlider>
  );
};

export default IntegrationsSlider; 