import React from 'react';
import { Progress } from '../../../shared/components/ui/progress';
import { Button } from '../../../shared/components/ui/button';
import { Save, ArrowLeft, ArrowRight, X, Check } from 'lucide-react';
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
  nextLabel = 'Continue',
  onClose,
  stepLabels,
}) => {
  return (
    <div className="min-h-screen bg-background cursor-default">
      <div className="container mx-auto py-8">
        <div className="mx-auto max-w-[960px] w-full rounded-2xl border bg-card shadow-md overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-white/80">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-foreground">Project Setup Wizard</h1>
            </div>
            <div className="flex items-center gap-2">
              {onSave && (
                <Button variant="outline" size="sm" onClick={onSave} disabled={isLoading} className="gap-2 cursor-pointer">
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Saving…' : 'Save & Finish Later'}
                </Button>
              )}
              {onClose && (
                <button aria-label="Close" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-12">
            {/* Left rail */}
            <aside className="col-span-4 border-r bg-gray-50 px-4 py-6">
              <div className="mb-4">
                <Progress value={progress} className="h-1.5 [&>div]:bg-emerald-600 bg-white mb-2" />
                <div className="text-xs text-muted-foreground">{Math.round(progress)}% completed</div>
              </div>
              <ol className="space-y-2">
                {(stepLabels || Array.from({ length: totalSteps }).map((_, i) => `Step ${i + 1}`)).map((label, idx) => {
                  const stepNum = idx + 1;
                  const isActive = stepNum === currentStep;
                  const isDone = stepNum < currentStep;
                  return (
                    <li key={idx} className={`flex items-center gap-2 rounded-md px-2 py-2 ${isActive ? 'bg-white border' : ''}`}>
                      {isDone ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${isActive ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {stepNum}
                        </span>
                      )}
                      <span className={`text-sm ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                    </li>
                  );
                })}
              </ol>
            </aside>

            {/* Right content */}
            <section className="col-span-8 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              </div>
              <div className="rounded-lg border bg-white p-4">{children}</div>

              {/* Footer buttons */}
              <div className="mt-4 flex items-center justify-between">
                <Button variant="outline" onClick={onPrevious} disabled={currentStep === 1} className="gap-2 h-11 w-40 cursor-pointer">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={onNext} disabled={!canProceed} className="gap-2 h-11 w-40 cursor-pointer">
                  {nextLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WizardLayout; 