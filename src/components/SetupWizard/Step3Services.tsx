import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Sparkles, Clock, DollarSign } from 'lucide-react';
import { WizardData } from '@/hooks/useSetupWizard';

interface Step3Props {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

const suggestedServices: Record<string, Array<{ name: string; price: number; duration: number }>> = {
  'Beauty & Wellness': [
    { name: 'Haircut & Styling', price: 75, duration: 60 },
    { name: 'Hair Color', price: 120, duration: 120 },
    { name: 'Manicure', price: 35, duration: 45 },
    { name: 'Facial Treatment', price: 90, duration: 90 }
  ],
  'Healthcare': [
    { name: 'Consultation', price: 150, duration: 30 },
    { name: 'Follow-up Visit', price: 100, duration: 20 },
    { name: 'Health Screening', price: 200, duration: 45 }
  ],
  'Fitness & Sports': [
    { name: 'Personal Training Session', price: 80, duration: 60 },
    { name: 'Group Fitness Class', price: 25, duration: 45 },
    { name: 'Nutrition Consultation', price: 120, duration: 60 }
  ],
  'Professional Services': [
    { name: 'Consultation', price: 200, duration: 60 },
    { name: 'Strategy Session', price: 300, duration: 90 },
    { name: 'Follow-up Meeting', price: 150, duration: 45 }
  ]
};

const Step3Services: React.FC<Step3Props> = ({ data, onUpdate }) => {
  const [newService, setNewService] = useState({ name: '', price: 0, duration: 60 });
  const [editingSuggested, setEditingSuggested] = useState<number | null>(null);
  const [editingSuggestedData, setEditingSuggestedData] = useState({ name: '', price: 0, duration: 60 });
  const suggestions = suggestedServices[data.industry] || [];

  const addService = () => {
    if (newService.name.trim()) {
      const service = {
        id: Date.now().toString(),
        ...newService
      };
      onUpdate({ services: [...data.services, service] });
      setNewService({ name: '', price: 0, duration: 60 });
    }
  };

  const removeService = (id: string) => {
    onUpdate({ services: data.services.filter(s => s.id !== id) });
  };

  const startEditingSuggested = (index: number, suggested: { name: string; price: number; duration: number }) => {
    setEditingSuggested(index);
    setEditingSuggestedData({ ...suggested });
  };

  const cancelEditingSuggested = () => {
    setEditingSuggested(null);
    setEditingSuggestedData({ name: '', price: 0, duration: 60 });
  };

  const confirmSuggestedService = () => {
    const service = {
      id: Date.now().toString(),
      ...editingSuggestedData
    };
    onUpdate({ services: [...data.services, service] });
    cancelEditingSuggested();
  };

  const addSuggestedService = (suggested: { name: string; price: number; duration: number }) => {
    const service = {
      id: Date.now().toString(),
      ...suggested
    };
    onUpdate({ services: [...data.services, service] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">What services do you offer?</h3>
          <p className="text-sm text-muted-foreground">Add your first few services to get started</p>
        </div>
      </div>

      {/* Suggested Services */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <Label className="text-sm font-medium text-emerald-800">
              Suggested for {data.industry}
            </Label>
          </div>
          <div className="grid gap-2">
            {suggestions.map((service, index) => (
              <div
                key={index}
                className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
              >
                {editingSuggested === index ? (
                  // Editing mode
                  <div className="space-y-3">
                    <div className="font-medium text-emerald-900">{service.name}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-emerald-700">Price ($)</Label>
                        <Input
                          type="number"
                          value={editingSuggestedData.price || ''}
                          onChange={(e) => setEditingSuggestedData(prev => ({ 
                            ...prev, 
                            price: parseInt(e.target.value) || 0 
                          }))}
                          className="h-9 bg-white border-emerald-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-emerald-700">Duration (min)</Label>
                        <Input
                          type="number"
                          value={editingSuggestedData.duration}
                          onChange={(e) => setEditingSuggestedData(prev => ({ 
                            ...prev, 
                            duration: parseInt(e.target.value) || 60 
                          }))}
                          className="h-9 bg-white border-emerald-300"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={confirmSuggestedService}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        Add Service
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditingSuggested}
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-emerald-900">{service.name}</div>
                      <div className="text-sm text-emerald-700 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {service.price}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.duration}min
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditingSuggested(index, service)}
                        className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-100 px-2 py-1 h-8"
                      >
                        Customize
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addSuggestedService(service)}
                        className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-100 px-2 py-1 h-8"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Services */}
      {data.services.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Your Services</Label>
          <div className="space-y-2">
            {data.services.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-3 bg-card border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{service.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {service.price}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {service.duration}min
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeService(service.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Service */}
      <div className="space-y-4 border-t pt-6">
        <Label className="text-sm font-medium">Add Custom Service</Label>
        <div className="space-y-3">
          <Input
            placeholder="Service name (e.g. Deep Tissue Massage)"
            value={newService.name}
            onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
            className="h-11"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Price ($)</Label>
              <Input
                type="number"
                placeholder="0"
                value={newService.price || ''}
                onChange={(e) => setNewService(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                className="h-10"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Duration (minutes)</Label>
              <Input
                type="number"
                placeholder="60"
                value={newService.duration}
                onChange={(e) => setNewService(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                className="h-10"
              />
            </div>
          </div>
          <Button onClick={addService} disabled={!newService.name.trim()} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Skip Option */}
      <div className="text-center py-4 border-t">
        <p className="text-sm text-muted-foreground">
          Don't worry! You can always add more services later from your dashboard.
        </p>
      </div>
    </div>
  );
};

export default Step3Services; 