import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Separator } from '../../../shared/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../../../shared/components/ui/avatar';
import BusinessInfoSlider from '../components/BusinessInfoSlider';
import AppointmentSettingsSlider from '../components/AppointmentSettingsSlider';
import WebsiteDomainSlider from '../components/WebsiteDomainSlider';
import IntegrationsSlider from '../components/IntegrationsSlider';
import ProfileSlider from '../components/ProfileSlider';
import BillingSlider from '../components/BillingSlider';
import SecuritySlider from '../components/SecuritySlider';
import AdvancedSettingsSlider from '../components/AdvancedSettingsSlider';
import {
  Receipt,
  Calendar,
  Globe,
  User,
  Plug,
  CreditCard,
  Shield,
  AlertTriangle,
  Trash2,
  Eye,
  ChevronRight,
  Check
} from 'lucide-react';
import { logoutRequestAction } from '../../auth/actions';
import { useDispatch } from 'react-redux';

const SettingsPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showBusinessSlider, setShowBusinessSlider] = useState(false);
  const [showAppointmentSlider, setShowAppointmentSlider] = useState(false);
  const [showWebsiteSlider, setShowWebsiteSlider] = useState(false);
  const [showIntegrationsSlider, setShowIntegrationsSlider] = useState(false);
  const [showProfileSlider, setShowProfileSlider] = useState(false);
  const [showBillingSlider, setShowBillingSlider] = useState(false);
  const [showSecuritySlider, setShowSecuritySlider] = useState(false);
  const [showAdvancedSlider, setShowAdvancedSlider] = useState(false);

  // Check for URL parameters to auto-open sliders
  useEffect(() => {
    const openParam = searchParams.get('open');
    if (openParam === 'billing') {
      setShowBillingSlider(true);
      // Remove the parameter from URL after opening
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleLogout = () => {
    dispatch(logoutRequestAction.request());
  };

  const menuItems = [
    {
      id: 'business',
      title: 'Business Information',
      description: 'Company details and branding',
      icon: Receipt,
      action: () => setShowBusinessSlider(true)
    },
    // {
    //   id: 'appointments',
    //   title: 'Appointment Settings',
    //   description: 'Booking preferences and schedules',
    //   icon: Calendar,
    //   action: () => setShowAppointmentSlider(true)
    // },
    // {
    //   id: 'website',
    //   title: 'Website & Domain',
    //   description: 'Templates and custom domains',
    //   icon: Globe,
    //   action: () => setShowWebsiteSlider(true)
    // },
    // {
    //   id: 'integrations',
    //   title: 'Integrations',
    //   description: 'Connect external services',
    //   icon: Plug,
    //   action: () => setShowIntegrationsSlider(true)
    // },
    {
      id: 'profile',
      title: 'Your Profile',
      description: 'Personal settings and preferences',
      icon: User,
      action: () => setShowProfileSlider(true)
    },
    {
      id: 'billing',
      title: 'Billing & Subscription',
      description: 'Plans, payments and invoices',
      icon: CreditCard,
      action: () => setShowBillingSlider(true)
    },
    // {
    //   id: 'security',
    //   title: 'Security',
    //   description: 'Password management and 2FA',
    //   icon: Shield,
    //   action: () => setShowSecuritySlider(true)
    // },
    // {
    //   id: 'advanced',
    //   title: 'Advanced Settings',
    //   description: 'Data export and danger zone',
    //   icon: AlertTriangle,
    //   action: () => setShowAdvancedSlider(true)
    // }
  ];

  if (selectedSection) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              onClick={() => setSelectedSection(null)}
              className="p-2"
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </Button>
            <h1 className="text-2xl font-bold">
              {menuItems.find(item => item.id === selectedSection)?.title}
            </h1>
          </div>

          {/* Other sections would follow similar pattern... */}
          {selectedSection && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium mb-2">
                    {menuItems.find(item => item.id === selectedSection)?.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {menuItems.find(item => item.id === selectedSection)?.description}
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    Settings content for this section will be implemented here.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    YB
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">Your Business</h1>
                <p className="text-muted-foreground">Business Owner</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">156</div>
                <div className="text-sm text-muted-foreground">Bookings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">4.9</div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">2</div>
                <div className="text-sm text-muted-foreground">Years active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="font-medium">{"Today's Schedule"}</h3>
              <p className="text-sm text-muted-foreground">8 appointments</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="font-medium">Booking Page</h3>
              <p className="text-sm text-muted-foreground">View & share</p>
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Banner */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Upgrade to Pro</h3>
                <p className="text-sm text-muted-foreground">Unlock advanced features and custom branding</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Settings Menu */}
        <Card>
          <CardContent className="p-0">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.id}>
                  <button
                    onClick={item.action}
                    className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </button>
                  {index < menuItems.length - 1 && <Separator />}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Additional Actions */}
        <Card>
          <CardContent className="p-0">
            <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">View public page</h3>
                <p className="text-sm text-muted-foreground">See how clients view your business</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            <Separator />

            <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left text-destructive">
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1" onClick={handleLogout}>
                <h3 className="font-medium">Log out</h3>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Business Information Slider */}
      <BusinessInfoSlider
        isOpen={showBusinessSlider}
        onClose={() => setShowBusinessSlider(false)}
      />

      {/* Appointment Settings Slider */}
      <AppointmentSettingsSlider
        isOpen={showAppointmentSlider}
        onClose={() => setShowAppointmentSlider(false)}
      />

      {/* Website & Domain Slider */}
      <WebsiteDomainSlider
        isOpen={showWebsiteSlider}
        onClose={() => setShowWebsiteSlider(false)}
      />

      {/* Integrations Slider */}
      <IntegrationsSlider
        isOpen={showIntegrationsSlider}
        onClose={() => setShowIntegrationsSlider(false)}
      />

      {/* Profile Slider */}
      <ProfileSlider
        isOpen={showProfileSlider}
        onClose={() => setShowProfileSlider(false)}
      />

      {/* Billing Slider */}
      <BillingSlider
        isOpen={showBillingSlider}
        onClose={() => setShowBillingSlider(false)}
      />

      {/* Security Slider */}
      <SecuritySlider
        isOpen={showSecuritySlider}
        onClose={() => setShowSecuritySlider(false)}
      />

      {/* Advanced Settings Slider */}
      <AdvancedSettingsSlider
        isOpen={showAdvancedSlider}
        onClose={() => setShowAdvancedSlider(false)}
      />
    </AppLayout>
  );
};

export default SettingsPage; 