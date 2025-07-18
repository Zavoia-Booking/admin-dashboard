import React, { useState, useRef } from 'react';
import { ArrowLeft, Globe, Palette, Link2, Eye, Share2, ChevronsUpDown, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WebsiteDomainSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WebsiteFormData {
  template: string;
  customDomain: string;
  useCustomDomain: boolean;
  businessDescription: string;
  seoTitle: string;
  seoDescription: string;
  socialLinksEnabled: boolean;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  showTeamMembers: boolean;
  showReviews: boolean;
  showPricing: boolean;
  showGallery: boolean;
  primaryColor: string;
  secondaryColor: string;
}

const initialFormData: WebsiteFormData = {
  template: 'modern',
  customDomain: '',
  useCustomDomain: false,
  businessDescription: 'We provide exceptional services with a focus on quality and customer satisfaction.',
  seoTitle: 'Your Business - Professional Services',
  seoDescription: 'Book appointments with our professional team. Quality services and exceptional customer care.',
  socialLinksEnabled: true,
  facebookUrl: '',
  instagramUrl: '',
  twitterUrl: '',
  linkedinUrl: '',
  showTeamMembers: true,
  showReviews: true,
  showPricing: true,
  showGallery: true,
  primaryColor: '#000000',
  secondaryColor: '#6366f1',
};

const WebsiteDomainSlider: React.FC<WebsiteDomainSliderProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<WebsiteFormData>(initialFormData);
  
  // UI state for dropdowns
  const [templateOpen, setTemplateOpen] = useState(false);
  
  // Touch/drag handling for mobile swipe to close
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 100) {
      onClose();
    }
    setDragOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 100) {
      onClose();
    }
    setDragOffset(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('✅ Website settings saved successfully');
    onClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Data arrays
  const templates = [
    { value: 'modern', label: 'Modern & Clean' },
    { value: 'elegant', label: 'Elegant & Minimal' },
    { value: 'vibrant', label: 'Vibrant & Colorful' },
    { value: 'professional', label: 'Professional & Corporate' },
    { value: 'creative', label: 'Creative & Artistic' },
  ];

  const generateBookingUrl = () => {
    if (formData.useCustomDomain && formData.customDomain) {
      return `https://${formData.customDomain}`;
    }
    return 'https://book.yourdomain.com/your-business';
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-60 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sliding Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-full bg-background shadow-lg z-70 ${
          !isDragging ? 'transition-transform duration-300 ease-out' : ''
        } ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          transform: isDragging 
            ? `translateX(${dragOffset}px)` 
            : undefined
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center p-2 border-b bg-card/50 relative">
            <div className="bg-muted rounded-full p-1.5 shadow-sm">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="rounded-full hover:bg-muted-foreground/10"
                style={{ height: '2rem', width: '2rem', minHeight: '2rem', minWidth: '2rem' }}
              >
                <ArrowLeft className="h-3 w-3" />
              </Button>
            </div>
            <h2 className="text-lg font-semibold text-foreground absolute left-1/2 transform -translate-x-1/2">Website & Domain</h2>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-muted/50 scrollbar-hide">
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              {/* Single Card with All Website Settings */}
              <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
                <CardContent className="space-y-8">
                  
                  {/* Template & Design Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Palette className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Template & Design</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Website Template</Label>
                        <p className="text-xs text-muted-foreground">Choose the design style for your booking page.</p>
                        <Popover open={templateOpen} onOpenChange={setTemplateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={templateOpen}
                              className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                            >
                              {formData.template ? templates.find(t => t.value === formData.template)?.label : "Select template"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[350px] p-0 z-[80]">
                            <Command>
                              <CommandInput placeholder="Search templates..." />
                              <CommandList>
                                <CommandEmpty>No templates found.</CommandEmpty>
                                <CommandGroup>
                                  {templates.map((template) => (
                                    <CommandItem
                                      key={template.value}
                                      value={template.value}
                                      onSelect={() => {
                                        setFormData(prev => ({ ...prev, template: template.value }));
                                        setTemplateOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          formData.template === template.value ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {template.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Primary Color</Label>
                        <p className="text-xs text-muted-foreground">Main brand color for buttons and accents.</p>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={formData.primaryColor}
                            onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="w-12 h-12 rounded-lg border border-input cursor-pointer"
                          />
                          <Input
                            value={formData.primaryColor}
                            onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="border-0 bg-muted/50 focus:bg-background text-base h-12 flex-1"
                            placeholder="#000000"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Secondary Color</Label>
                        <p className="text-xs text-muted-foreground">Supporting color for highlights and details.</p>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={formData.secondaryColor}
                            onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="w-12 h-12 rounded-lg border border-input cursor-pointer"
                          />
                          <Input
                            value={formData.secondaryColor}
                            onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="border-0 bg-muted/50 focus:bg-background text-base h-12 flex-1"
                            placeholder="#6366f1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Domain Settings Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Domain Settings</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-foreground">Use Custom Domain</Label>
                            <p className="text-xs text-muted-foreground">Connect your own domain for professional branding.</p>
                          </div>
                          <Switch
                            checked={formData.useCustomDomain}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, useCustomDomain: checked }))}
                            className="!h-5 !w-9 !min-h-0 !min-w-0"
                          />
                        </div>
                      </div>

                      {formData.useCustomDomain && (
                        <div className="space-y-2">
                          <Label htmlFor="customDomain" className="text-sm font-medium text-foreground">Custom Domain</Label>
                          <p className="text-xs text-muted-foreground">Enter your domain (e.g., booking.yourbusiness.com)</p>
                          <Input
                            id="customDomain"
                            value={formData.customDomain}
                            onChange={(e) => setFormData(prev => ({ ...prev, customDomain: e.target.value }))}
                            className="border-0 bg-muted/50 focus:bg-background text-base h-12"
                            placeholder="booking.yourbusiness.com"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Your Booking URL</Label>
                        <p className="text-xs text-muted-foreground">This is where clients will book appointments.</p>
                        <div className="space-y-2">
                          <div className="p-3 bg-muted/30 rounded-lg border">
                            <p className="text-sm font-mono text-foreground break-all">{generateBookingUrl()}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => copyToClipboard(generateBookingUrl())}
                            className="w-full h-10"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy URL
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Settings Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Eye className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Content Settings</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="businessDescription" className="text-sm font-medium text-foreground">Business Description</Label>
                        <p className="text-xs text-muted-foreground">Brief description shown on your booking page.</p>
                        <Textarea
                          id="businessDescription"
                          value={formData.businessDescription}
                          onChange={(e) => setFormData(prev => ({ ...prev, businessDescription: e.target.value }))}
                          className="border-0 bg-muted/50 focus:bg-background text-base min-h-[80px]"
                          placeholder="Tell potential clients about your business..."
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-foreground">Show Team Members</Label>
                            <p className="text-xs text-muted-foreground">Display staff profiles on booking page.</p>
                          </div>
                          <Switch
                            checked={formData.showTeamMembers}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showTeamMembers: checked }))}
                            className="!h-5 !w-9 !min-h-0 !min-w-0"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-foreground">Show Pricing</Label>
                            <p className="text-xs text-muted-foreground">Display service prices to clients.</p>
                          </div>
                          <Switch
                            checked={formData.showPricing}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showPricing: checked }))}
                            className="!h-5 !w-9 !min-h-0 !min-w-0"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-foreground">Show Reviews</Label>
                            <p className="text-xs text-muted-foreground">Display customer testimonials.</p>
                          </div>
                          <Switch
                            checked={formData.showReviews}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showReviews: checked }))}
                            className="!h-5 !w-9 !min-h-0 !min-w-0"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-foreground">Show Gallery</Label>
                            <p className="text-xs text-muted-foreground">Display photos of your work.</p>
                          </div>
                          <Switch
                            checked={formData.showGallery}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showGallery: checked }))}
                            className="!h-5 !w-9 !min-h-0 !min-w-0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEO Settings Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Link2 className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">SEO Settings</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="seoTitle" className="text-sm font-medium text-foreground">Page Title</Label>
                        <p className="text-xs text-muted-foreground">Title shown in search engines and browser tabs.</p>
                        <Input
                          id="seoTitle"
                          value={formData.seoTitle}
                          onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                          className="border-0 bg-muted/50 focus:bg-background text-base h-12"
                          placeholder="Your Business - Professional Services"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="seoDescription" className="text-sm font-medium text-foreground">Meta Description</Label>
                        <p className="text-xs text-muted-foreground">Description shown in search engine results.</p>
                        <Textarea
                          id="seoDescription"
                          value={formData.seoDescription}
                          onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                          className="border-0 bg-muted/50 focus:bg-background text-base min-h-[60px]"
                          placeholder="Book appointments with our professional team..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Media Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Share2 className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Social Media</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-foreground">Show Social Links</Label>
                            <p className="text-xs text-muted-foreground">Display social media links on your booking page.</p>
                          </div>
                          <Switch
                            checked={formData.socialLinksEnabled}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, socialLinksEnabled: checked }))}
                            className="!h-5 !w-9 !min-h-0 !min-w-0"
                          />
                        </div>
                      </div>

                      {formData.socialLinksEnabled && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="facebookUrl" className="text-sm font-medium text-foreground">Facebook URL</Label>
                            <Input
                              id="facebookUrl"
                              value={formData.facebookUrl}
                              onChange={(e) => setFormData(prev => ({ ...prev, facebookUrl: e.target.value }))}
                              className="border-0 bg-muted/50 focus:bg-background text-base h-12"
                              placeholder="https://facebook.com/yourbusiness"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="instagramUrl" className="text-sm font-medium text-foreground">Instagram URL</Label>
                            <Input
                              id="instagramUrl"
                              value={formData.instagramUrl}
                              onChange={(e) => setFormData(prev => ({ ...prev, instagramUrl: e.target.value }))}
                              className="border-0 bg-muted/50 focus:bg-background text-base h-12"
                              placeholder="https://instagram.com/yourbusiness"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="twitterUrl" className="text-sm font-medium text-foreground">Twitter URL</Label>
                            <Input
                              id="twitterUrl"
                              value={formData.twitterUrl}
                              onChange={(e) => setFormData(prev => ({ ...prev, twitterUrl: e.target.value }))}
                              className="border-0 bg-muted/50 focus:bg-background text-base h-12"
                              placeholder="https://twitter.com/yourbusiness"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="linkedinUrl" className="text-sm font-medium text-foreground">LinkedIn URL</Label>
                            <Input
                              id="linkedinUrl"
                              value={formData.linkedinUrl}
                              onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                              className="border-0 bg-muted/50 focus:bg-background text-base h-12"
                              placeholder="https://linkedin.com/company/yourbusiness"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </CardContent>
              </Card>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t bg-card/50">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => { onClose(); setFormData(initialFormData); }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WebsiteDomainSlider; 