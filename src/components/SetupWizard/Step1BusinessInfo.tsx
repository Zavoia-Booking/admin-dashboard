import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Building2 } from 'lucide-react';
import { WizardData } from '@/hooks/useSetupWizard';

interface Step1Props {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

const industries = [
  'Beauty & Wellness',
  'Healthcare',
  'Professional Services',
  'Fitness & Sports',
  'Education & Training',
  'Automotive',
  'Home Services',
  'Legal Services',
  'Consulting',
  'Other'
];

const Step1BusinessInfo: React.FC<Step1Props> = ({ data, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Tell us about your business</h3>
          <p className="text-sm text-muted-foreground">This information helps us personalize your experience</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="businessName" className="text-sm font-medium">
            Business Name *
          </Label>
          <Input
            id="businessName"
            value={data.businessName}
            onChange={(e) => onUpdate({ businessName: e.target.value })}
            placeholder="e.g. Sarah's Hair Studio"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry" className="text-sm font-medium">
            Industry *
          </Label>
          <Select value={data.industry} onValueChange={(value) => onUpdate({ industry: value })}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This helps us suggest relevant services and templates
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Business Description
          </Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Briefly describe what your business does..."
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Business Logo (Optional)</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG up to 2MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1BusinessInfo; 