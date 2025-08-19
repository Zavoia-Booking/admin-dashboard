import React from 'react';
import { Button } from '@/components/ui/button';
import { Palette, Eye, Check } from 'lucide-react';
import { WizardData } from '@/hooks/useSetupWizard';

interface Step6Props {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

const templates = [
  {
    id: 'modern',
    name: 'Modern & Clean',
    description: 'Perfect for professional services and consulting',
    image: '/api/placeholder/300/200',
    color: 'blue',
    features: ['Clean typography', 'Professional layout', 'Mobile-optimized']
  },
  {
    id: 'wellness',
    name: 'Wellness & Spa',
    description: 'Ideal for beauty, wellness, and health services',
    image: '/api/placeholder/300/200',
    color: 'emerald',
    features: ['Calming colors', 'Service gallery', 'Testimonials section']
  },
  {
    id: 'fitness',
    name: 'Fitness & Sports',
    description: 'Great for gyms, trainers, and sports services',
    image: '/api/placeholder/300/200',
    color: 'orange',
    features: ['Dynamic design', 'Class schedules', 'Trainer profiles']
  },
  {
    id: 'creative',
    name: 'Creative & Arts',
    description: 'Perfect for studios, artists, and creative services',
    image: '/api/placeholder/300/200',
    color: 'purple',
    features: ['Portfolio showcase', 'Creative layouts', 'Image galleries']
  },
  {
    id: 'medical',
    name: 'Medical & Healthcare',
    description: 'Professional template for healthcare providers',
    image: '/api/placeholder/300/200',
    color: 'slate',
    features: ['Trust-building design', 'Appointment focus', 'Professional appearance']
  }
];

const Step6Template: React.FC<Step6Props & { onNext?: () => void }> = ({ data, onUpdate, onNext }) => {
  const selectTemplate = (templateId: string) => {
    onUpdate({ selectedTemplate: templateId });
  };

  const handleLaunch = () => {
    onUpdate({ isLaunched: true });
    if (onNext) onNext();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Palette className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Choose your website design</h3>
          <p className="text-sm text-muted-foreground">Pick a template that matches your business style</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
              data.selectedTemplate === template.id 
                ? 'border-primary shadow-md ring-2 ring-primary/20' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => selectTemplate(template.id)}
          >
            {/* Selected Indicator */}
            {data.selectedTemplate === template.id && (
              <div className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
            )}

            {/* Template Preview */}
            <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <div className={`text-6xl font-bold text-${template.color}-500/30`}>
                {template.name.charAt(0)}
              </div>
            </div>

            {/* Template Info */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-foreground">{template.name}</h4>
                <Button size="sm" variant="ghost" className="gap-1 p-1 h-auto" onClick={(e) => { e.stopPropagation(); window.open('https://google.com', '_blank'); }}>
                  <Eye className="h-3 w-3" />
                  <span className="text-xs">Preview</span>
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                {template.description}
              </p>

              <div className="space-y-1">
                {template.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className={`w-1 h-1 rounded-full bg-${template.color}-500`} />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Customization Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Palette className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">
              {`Don't worry about perfection!`}
            </p>
            <p className="text-xs text-blue-700">
              {`You can customize colors, fonts, and layout anytime after launch. We'll pre-fill your business information and logo.`}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {data.selectedTemplate && (
        <div className="flex flex-col gap-3 pt-4 border-t">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => window.open('https://google.com', '_blank')}>
            <Eye className="h-4 w-4" />
            Preview Template
          </Button>
        </div>
      )}
    </div>
  );
};

export default Step6Template; 