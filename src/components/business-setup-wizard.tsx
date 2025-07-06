import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useStores } from "@/pages/_app";
import { UserRole } from "@/types/auth";
import { 
  Building2, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  Lock, 
  Upload, 
  Plus, 
  X, 
  ArrowLeft, 
  ArrowRight,
  Save,
  ExternalLink,
  Eye,
  Clipboard
} from "lucide-react";

interface BusinessInfo {
  legalName: string;
  displayName: string;
  email: string;
  phone: string;
  businessType: string;
  website: string;
  logo?: File;
}

interface Location {
  name: string;
  address: string;
  phone: string;
  manager?: string;
  workingHours: WorkingHours[];
}

interface WorkingHours {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

interface Service {
  name: string;
  category: string;
  duration: number;
  price: number;
  description: string;
  locations: string[];
}

interface TeamMember {
  name: string;
  email: string;
  role: UserRole;
  locations: string[];
  status: 'pending' | 'sent';
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const BUSINESS_TYPES = [
  'Hair Salon',
  'Medical Clinic',
  'Consulting',
  'Fitness Studio',
  'Spa & Wellness',
  'Dental Practice',
  'Law Office',
  'Real Estate',
  'Other'
];

const SERVICE_CATEGORIES = [
  'Haircut',
  'Consultation',
  'Massage',
  'Medical Checkup',
  'Fitness Training',
  'Legal Advice',
  'Dental Cleaning',
  'Other'
];

export function BusinessSetupWizard() {
  const { authStore, businessStore } = useStores();
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    legalName: '',
    displayName: '',
    email: authStore.user?.email || '',
    phone: '',
    businessType: '',
    website: '',
  });
  
  const [location, setLocation] = useState<Location>({
    name: '',
    address: '',
    phone: '',
    workingHours: DAYS.map(day => ({
      day,
      open: '09:00',
      close: '17:00',
      isClosed: day === 'Saturday' || day === 'Sunday',
    }))
  });
  
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const steps = [
    { title: 'Welcome', description: 'Quick intro + what to expect' },
    { title: 'Business Info', description: 'Register the business (required)' },
    { title: 'Add First Location', description: 'Add working address & hours (optional)' },
    { title: 'Add Services', description: 'Define what\'s being offered (optional)' },
    { title: 'Invite Team Members', description: 'Add managers/team members to the business (optional)' },
    { title: 'Ready Summary', description: 'Confirmation + complete setup' },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  // Validation functions
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Business Info
        if (!businessInfo.legalName.trim()) newErrors.legalName = 'Legal business name is required';
        if (!businessInfo.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!businessInfo.businessType) newErrors.businessType = 'Business type is required';
        if (businessInfo.website && !isValidUrl(businessInfo.website)) {
          newErrors.website = 'Please enter a valid URL';
        }
        break;
      
      case 2: // Location
        if (!location.name.trim()) newErrors.locationName = 'Location name is required';
        if (!location.address.trim()) newErrors.locationAddress = 'Address is required';
        if (!location.phone.trim()) newErrors.locationPhone = 'Location phone is required';
        break;
      
      case 3: // Services (optional but validate if added)
        services.forEach((service, index) => {
          if (service.name.trim() && !service.category) {
            newErrors[`service${index}Category`] = 'Category is required';
          }
          if (service.name.trim() && service.price <= 0) {
            newErrors[`service${index}Price`] = 'Price must be greater than 0';
          }
        });
        break;
      
      case 4: // Team Members (optional but validate if added)
        teamMembers.forEach((member, index) => {
          if (member.name.trim() && !member.email.trim()) {
            newErrors[`member${index}Email`] = 'Email is required';
          }
          if (member.name.trim() && !isValidEmail(member.email)) {
            newErrors[`member${index}Email`] = 'Please enter a valid email';
          }
        });
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time validation functions
  const validateField = (field: string, value: string, type?: string): string => {
    switch (field) {
      case 'legalName':
        return !value.trim() ? 'Legal business name is required' : '';
      case 'phone':
        return !value.trim() ? 'Phone number is required' : '';
      case 'businessType':
        return !value ? 'Business type is required' : '';
      case 'website':
        if (value && !isValidUrl(value)) {
          return 'Please enter a valid URL';
        }
        return '';
      case 'locationName':
        return !value.trim() ? 'Location name is required' : '';
      case 'locationAddress':
        return !value.trim() ? 'Address is required' : '';
      case 'locationPhone':
        return !value.trim() ? 'Location phone is required' : '';
      case 'email':
        if (value && !isValidEmail(value)) {
          return 'Please enter a valid email';
        }
        return '';
      default:
        return '';
    }
  };

  const updateFieldValidation = (field: string, value: string) => {
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const updateServiceValidation = (index: number, field: string, value: string) => {
    const service = services[index];
    let error = '';
    
    if (field === 'category' && service.name.trim() && !value) {
      error = 'Category is required';
    } else if (field === 'price' && service.name.trim() && parseFloat(value) <= 0) {
      error = 'Price must be greater than 0';
    }
    
    setErrors(prev => ({
      ...prev,
      [`service${index}${field.charAt(0).toUpperCase() + field.slice(1)}`]: error
    }));
  };

  const updateMemberValidation = (index: number, field: string, value: string) => {
    const member = teamMembers[index];
    let error = '';
    
    if (field === 'email') {
      if (member.name.trim() && !value.trim()) {
        error = 'Email is required';
      } else if (member.name.trim() && value && !isValidEmail(value)) {
        error = 'Please enter a valid email';
      }
    }
    
    setErrors(prev => ({
      ...prev,
      [`member${index}Email`]: error
    }));
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Check if current step form is valid/complete
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1: // Business Info - required
        return !!(businessInfo.legalName.trim() && 
                 businessInfo.phone.trim() && 
                 businessInfo.businessType &&
                 businessInfo.email.trim() &&
                 (!businessInfo.website || isValidUrl(businessInfo.website)));
      
      case 2: // Location - optional but validate if any field is filled
        const hasLocationData = location.name.trim() || location.address.trim() || location.phone.trim();
        if (!hasLocationData) return false; // Empty is not valid - must use Skip
        return !!(location.name.trim() && location.address.trim() && location.phone.trim());
      
      case 3: // Services - optional but validate if any service is partially filled
        if (services.length === 0) return false; // No services is not valid - must use Skip
        return services.every((service, index) => {
          const hasServiceData = service.name.trim() || service.category || service.price > 0;
          if (!hasServiceData) return true; // Empty service is valid within the list
          return !!(service.name.trim() && service.category && service.price > 0);
        });
      
      case 4: // Team Members - optional but validate if any member is partially filled
        if (teamMembers.length === 0) return false; // No members is not valid - must use Skip
        return teamMembers.every((member, index) => {
          const hasMemberData = member.name.trim() || member.email.trim();
          if (!hasMemberData) return true; // Empty member is valid within the list
          return !!(member.name.trim() && member.email.trim() && isValidEmail(member.email));
        });
      
      default:
        return true;
    }
  };

  const isNextButtonDisabled = (): boolean => {
    // For step 1 (Business Info), always check validation since it's required
    if (currentStep === 1) {
      return !isStepValid(currentStep);
    }
    // For other steps, check validation but allow empty forms
    return !isStepValid(currentStep);
  };

  const handleNext = async () => {
    if (currentStep === 1 && !validateStep(currentStep)) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    if (currentStep === 4) {
      // Complete setup on the Team Members step
      // await handleSubmit(); // Commented out - no backend yet
      toast.success('Business setup completed!');
      setCurrentStep(prev => prev + 1);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    if (currentStep === 4) {
      // Complete setup when skipping Team Members step
      // handleSubmit(); // Commented out - no backend yet
      toast.success('Business setup completed!');
      setCurrentStep(prev => prev + 1);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    await handleSubmit();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const business = {
        name: businessInfo.displayName || businessInfo.legalName,
        legal_name: businessInfo.legalName,
        phone: businessInfo.phone,
        email: businessInfo.email,
        business_type: businessInfo.businessType,
        website: businessInfo.website,
      };
      
      const success = await businessStore.createBusiness(business);
      
      if (success) {
        toast.success('Business setup completed!');
        window.location.href = '/dashboard';
      } else {
        toast.error(businessStore.error || 'Failed to complete business setup');
      }
    } catch (error) {
      toast.error('Failed to complete business setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    // Save current state to localStorage
    const draft = {
      businessInfo,
      location,
      services,
      teamMembers,
      currentStep,
    };
    localStorage.setItem('businessSetupDraft', JSON.stringify(draft));
    toast.success('Draft saved successfully');
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo must be less than 2MB');
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Logo must be PNG or JPG format');
        return;
      }
      setBusinessInfo(prev => ({ ...prev, logo: file }));
    }
  };

  const addService = () => {
    setServices(prev => [...prev, {
      name: '',
      category: '',
      duration: 30,
      price: 0,
      description: '',
      locations: [location.name],
    }]);
  };

  const removeService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const addTeamMember = () => {
    setTeamMembers(prev => [...prev, {
      name: '',
      email: '',
      role: UserRole.TEAM_MEMBER,
      locations: [location.name],
      status: 'pending',
    }]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(prev => prev.filter((_, i) => i !== index));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="flex flex-col items-center justify-center space-y-8 py-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Building2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold">
                Welcome to Planr!
              </h2>
              <p className="text-lg text-muted-foreground max-w-md">
                Let's help you set up your business in just a few steps.
              </p>
            </div>

            <div className="w-full max-w-md space-y-4">
              <h3 className="text-lg font-medium text-center">What we'll set up together:</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="font-medium">Register your business</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="font-medium">Add your location</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="font-medium">Define your services</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="font-medium">Invite your team</span>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="mt-6"
              onClick={() => setCurrentStep(1)}
            >
              Start Setup
            </Button>
          </div>
        );

      case 1: // Business Info
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="legalName">
                    Legal Business Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="legalName"
                    value={businessInfo.legalName}
                    onChange={(e) => {
                      setBusinessInfo({ ...businessInfo, legalName: e.target.value });
                      updateFieldValidation('legalName', e.target.value);
                    }}
                    className={errors.legalName ? 'border-red-500' : ''}
                  />
                  {errors.legalName && <p className="text-sm text-red-500">{errors.legalName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">
                    Display Name <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="displayName"
                    value={businessInfo.displayName}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, displayName: e.target.value })}
                    placeholder="For public use"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">
                    Business Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={businessInfo.businessType}
                    onValueChange={(value) => {
                      setBusinessInfo({ ...businessInfo, businessType: value });
                      updateFieldValidation('businessType', value);
                    }}
                  >
                    <SelectTrigger className={errors.businessType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.businessType && <p className="text-sm text-red-500">{errors.businessType}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessInfo.email}
                    onChange={(e) => {
                      setBusinessInfo({ ...businessInfo, email: e.target.value });
                      updateFieldValidation('email', e.target.value);
                    }}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={businessInfo.phone}
                    onChange={(e) => {
                      setBusinessInfo({ ...businessInfo, phone: e.target.value });
                      updateFieldValidation('phone', e.target.value);
                    }}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">
                    Website <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="website"
                    value={businessInfo.website}
                    onChange={(e) => {
                      setBusinessInfo({ ...businessInfo, website: e.target.value });
                      updateFieldValidation('website', e.target.value);
                    }}
                    placeholder="https://example.com"
                    className={errors.website ? 'border-red-500' : ''}
                  />
                  {errors.website && <p className="text-sm text-red-500">{errors.website}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Business Logo <span className="text-muted-foreground">(optional)</span></Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      id="logo"
                      accept="image/png,image/jpeg"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <label htmlFor="logo" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {businessInfo.logo ? businessInfo.logo.name : 'Click to upload logo (max 2MB)'}
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Location
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="locationName">
                    Location Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="locationName"
                    value={location.name}
                    onChange={(e) => {
                      setLocation({ ...location, name: e.target.value });
                      updateFieldValidation('locationName', e.target.value);
                    }}
                    placeholder="e.g., Main Street"
                    className={errors.locationName ? 'border-red-500' : ''}
                  />
                  {errors.locationName && <p className="text-sm text-red-500">{errors.locationName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationAddress">
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="locationAddress"
                    value={location.address}
                    onChange={(e) => {
                      setLocation({ ...location, address: e.target.value });
                      updateFieldValidation('locationAddress', e.target.value);
                    }}
                    placeholder="Enter full address"
                    className={errors.locationAddress ? 'border-red-500' : ''}
                  />
                  {errors.locationAddress && <p className="text-sm text-red-500">{errors.locationAddress}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationPhone">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="locationPhone"
                    value={location.phone}
                    onChange={(e) => {
                      setLocation({ ...location, phone: e.target.value });
                      updateFieldValidation('locationPhone', e.target.value);
                    }}
                    className={errors.locationPhone ? 'border-red-500' : ''}
                  />
                  {errors.locationPhone && <p className="text-sm text-red-500">{errors.locationPhone}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Working Hours</Label>
                  <div className="space-y-3">
                    {location.workingHours.map((hours, index) => (
                      <div
                        key={hours.day}
                        className="bg-white border border-muted rounded-xl p-4 flex flex-col gap-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-base font-medium">{hours.day}</span>
                          <Switch
                            checked={!hours.isClosed}
                            onCheckedChange={(checked) => {
                              const newHours = [...location.workingHours];
                              newHours[index] = { ...hours, isClosed: !checked };
                              setLocation({ ...location, workingHours: newHours });
                            }}
                            className="!h-5 !w-9 !min-h-0 !min-w-0"
                          />
                        </div>
                        {!hours.isClosed && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">Open</span>
                              <Input
                                type="time"
                                value={hours.open}
                                onChange={(e) => {
                                  const newHours = [...location.workingHours];
                                  newHours[index] = { ...hours, open: e.target.value };
                                  setLocation({ ...location, workingHours: newHours });
                                }}
                                className="h-9 px-2 text-sm border border-input rounded-md focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">Close</span>
                              <Input
                                type="time"
                                value={hours.close}
                                onChange={(e) => {
                                  const newHours = [...location.workingHours];
                                  newHours[index] = { ...hours, close: e.target.value };
                                  setLocation({ ...location, workingHours: newHours });
                                }}
                                className="h-9 px-2 text-sm border border-input rounded-md focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Services
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Services</h3>
              <Button variant="outline" onClick={addService}>
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </div>

            {services.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clipboard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No services added yet. Add your first service to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Service {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Service Name</Label>
                          <Input
                            value={service.name}
                            onChange={(e) => {
                              const newServices = [...services];
                              newServices[index] = { ...service, name: e.target.value };
                              setServices(newServices);
                            }}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={service.category}
                            onValueChange={(value) => {
                              const newServices = [...services];
                              newServices[index] = { ...service, category: value };
                              setServices(newServices);
                              updateServiceValidation(index, 'category', value);
                            }}
                          >
                            <SelectTrigger className={errors[`service${index}Category`] ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {SERVICE_CATEGORIES.map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors[`service${index}Category`] && (
                            <p className="text-sm text-red-500">{errors[`service${index}Category`]}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Duration (minutes)</Label>
                          <Input
                            type="number"
                            min="15"
                            step="15"
                            value={service.duration}
                            onChange={(e) => {
                              const newServices = [...services];
                              newServices[index] = { ...service, duration: parseInt(e.target.value) };
                              setServices(newServices);
                            }}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Price (€)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={service.price}
                            onChange={(e) => {
                              const newServices = [...services];
                              newServices[index] = { ...service, price: parseFloat(e.target.value) };
                              setServices(newServices);
                              updateServiceValidation(index, 'price', e.target.value);
                            }}
                            className={errors[`service${index}Price`] ? 'border-red-500' : ''}
                          />
                          {errors[`service${index}Price`] && (
                            <p className="text-sm text-red-500">{errors[`service${index}Price`]}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <Label>Description (optional)</Label>
                        <Textarea
                          value={service.description}
                          onChange={(e) => {
                            const newServices = [...services];
                            newServices[index] = { ...service, description: e.target.value };
                            setServices(newServices);
                          }}
                          placeholder="Describe this service..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 4: // Team Members
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Team Members</h3>
              <Button variant="outline" onClick={addTeamMember}>
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </div>

            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No team members added yet. Invite your team to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Team Member {index + 1}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {member.status === 'pending' ? 'Pending Invitation' : 'Invitation Sent'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTeamMember(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={member.name}
                            onChange={(e) => {
                              const newMembers = [...teamMembers];
                              newMembers[index] = { ...member, name: e.target.value };
                              setTeamMembers(newMembers);
                            }}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={member.email}
                            onChange={(e) => {
                              const newMembers = [...teamMembers];
                              newMembers[index] = { ...member, email: e.target.value };
                              setTeamMembers(newMembers);
                              updateMemberValidation(index, 'email', e.target.value);
                            }}
                            className={errors[`member${index}Email`] ? 'border-red-500' : ''}
                          />
                          {errors[`member${index}Email`] && (
                            <p className="text-sm text-red-500">{errors[`member${index}Email`]}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select
                            value={member.role}
                            onValueChange={(value) => {
                              const newMembers = [...teamMembers];
                              newMembers[index] = { ...member, role: value as UserRole };
                              setTeamMembers(newMembers);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={UserRole.TEAM_MEMBER}>Team Member</SelectItem>
                              <SelectItem value={UserRole.ADMIN}>Manager</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Assigned Location</Label>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{location.name || 'Main Location'}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 5: // Ready Summary
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">All Set! 🎉</h2>
              <p className="text-muted-foreground">
                Your business has been successfully set up. Here's what we've configured:
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Setup Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Business registered: {businessInfo.displayName || businessInfo.legalName}</span>
                </div>
                
                {location.name.trim() ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Location added: {location.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <MapPin className="w-5 h-5 text-amber-500" />
                    <div>
                      <span className="font-medium text-amber-700">Location not added</span>
                      <p className="text-sm text-amber-600">Add your business location to start accepting bookings</p>
                    </div>
                  </div>
                )}
                
                {services.length > 0 ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-medium">{services.length} Service{services.length !== 1 ? 's' : ''} configured</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <Clipboard className="w-5 h-5 text-amber-500" />
                    <div>
                      <span className="font-medium text-amber-700">No services added</span>
                      <p className="text-sm text-amber-600">Add services to let customers know what you offer</p>
                    </div>
                  </div>
                )}
                
                {teamMembers.length > 0 ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-medium">{teamMembers.length} Team member{teamMembers.length !== 1 ? 's' : ''} invited</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <Users className="w-5 h-5 text-amber-500" />
                    <div>
                      <span className="font-medium text-amber-700">No team members invited</span>
                      <p className="text-sm text-amber-600">Invite your team to help manage bookings</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {steps[currentStep].title}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {renderStep()}
          </div>

          {/* Navigation */}
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t">
                {/* Left side buttons - stack vertically on mobile */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 sm:flex-none"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    className="flex-1 sm:flex-none"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save & Exit
                  </Button>
                </div>
                
                {/* Right side buttons - stack vertically on mobile */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={handleSkip}
                      className="flex-1 sm:flex-none"
                    >
                      {currentStep === 4 ? 'Skip & Complete' : 'Skip'}
                    </Button>
                  )}
                  <Button 
                    onClick={handleNext} 
                    disabled={isNextButtonDisabled()}
                    title={isNextButtonDisabled() ? "Please complete the form or use Skip to continue" : ""}
                    className="flex-1 sm:flex-none"
                  >
                    {currentStep === 4 ? 'Complete Setup' : 'Next'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
              {isNextButtonDisabled() && currentStep > 1 && (
                <div className="text-center text-sm text-muted-foreground">
                  💡 Complete the form above or use "Skip" to continue
                </div>
              )}
              {isNextButtonDisabled() && currentStep === 1 && (
                <div className="text-center text-sm text-muted-foreground">
                  💡 Please complete all required fields to continue
                </div>
              )}
            </div>
          )}

          {currentStep === steps.length - 1 && (
            <div className="flex justify-center pt-6 border-t">
              <Button 
                variant="outline"
                size="lg"
                onClick={() => window.location.href = '/dashboard'}
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 