import React from 'react';
import { Progress } from '../../../shared/components/ui/progress';
import { Button } from '../../../shared/components/ui/button';
import { Save, ArrowLeft, ArrowRight } from 'lucide-react';
import type { WizardLayoutProps } from '../types';

const WizardLayout: React.FC<WizardLayoutProps> = ({
  currentStep,
  totalSteps,
  progress,
  title,
  subtitle,
  children,
  onPrevious,
  onNext,
  onSave,
  canProceed,
  isLoading,
  showNext = true,
  nextLabel = 'Continue'
}) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-lg font-semibold text-foreground">Setup Wizard</h1>
              {onSave && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSave}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save & Finish Later'}
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              Step {currentStep} of {totalSteps} • {progress}% complete
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8" data-wizard-content>
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {title}
            </h2>
            {subtitle && (
              <p className="text-muted-foreground text-lg">
                {subtitle}
              </p>
            )}
          </div>

          <div className="bg-card rounded-lg border p-6 md:p-8 mb-8">
            {children}
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            {showNext && (
              <Button
                variant="outline"
                onClick={onPrevious}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
            )}
            {showNext && (
              <Button
                onClick={onNext}
                disabled={!canProceed}
                className="gap-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
              >
                {nextLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WizardLayout; 