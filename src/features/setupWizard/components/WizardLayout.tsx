import React from 'react';
import { Progress } from '../../../shared/components/ui/progress';
import { Button } from '../../../shared/components/ui/button';
import { Save, ArrowLeft, ArrowRight, X, Check } from 'lucide-react';
import { Spinner } from '../../../shared/components/ui/spinner';
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
  onGoToStep,
  showNext,
}) => {
  return (
    <div className="min-h-screen bg-background cursor-default">
      <div className="container mx-auto pt-0 md:pt-8 pb-0 md:pb-8">
        <div className="mx-auto max-w-[960px] w-full rounded-none md:rounded-2xl md:border bg-card shadow-md">

          <div className="grid grid-cols-1 md:grid-cols-12">
            {/* Left rail */}
            <aside className="hidden md:block md:col-span-4 bg-gray-100">
                <div className="md:sticky md:top-0 md:max-h-screen md:overflow-auto px-4 ">
                  <div className="-mx-4 px-4 min-h-20 bg-white border-b flex items-center">
                    <h1 className="text-xl font-semibold text-foreground">Business Setup Wizard</h1>
                </div>
                <div className="mb-4 mt-4">
                  <Progress value={progress} className="h-1.5 [&>div]:bg-emerald-600 bg-white mb-2" />
                  <div className="text-[14px] text-muted-foreground">{Math.round(progress)}% completed</div>
                </div>
                <ol className="space-y-2">
                  {(stepLabels || Array.from({ length: totalSteps }).map((_, i) => `Step ${i + 1}`)).map((label, idx) => {
                    const stepNum = idx + 1;
                    const isActive = stepNum === currentStep;
                    const isDone = stepNum < currentStep;
                    return (
                      <li
                        key={idx}
                        className={`flex items-center gap-2 rounded-md px-2 py-2 ${isActive ? 'bg-white border' : ''} ${isDone && onGoToStep ? 'cursor-pointer hover:bg-white/70' : ''}`}
                        onClick={() => {
                          if (isDone && onGoToStep) onGoToStep(stepNum);
                        }}
                      >
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
              </div>
            </aside>

            {/* Right content */}
            <section className="md:col-span-8 px-4 md:px-6 pt-0 pb-8 md:pb-4 ">
              {/* Right column sticky header (actions only) */}
              <div className="sticky top-0 z-60 -mx-4 px-4 md:-mx-6 md:px-6 py-4 border-b bg-white h-auto min-h-20 max-[399px]:static max-[399px]:top-auto">
                {/* Mobile: first row (title + actions) */}
                <div className="md:hidden flex items-center justify-between">
                  <div className="text-[18px] font-semibold text-foreground">Business Setup</div>
                  <div className="flex items-center gap-2">
                    {onSave && (
                      <Button variant="outline" size="sm" onClick={onSave} disabled={isLoading} className="relative gap-2 cursor-pointer">
                        {isLoading ? (
                          <>
                            <span className="opacity-0 inline-flex items-center gap-2">
                              <Save className="hidden md:inline h-4 w-4" />
                              <span>Save Draft</span>
                            </span>
                            <span className="absolute inset-0 flex items-center justify-center">
                              <Spinner size="sm" color="info" />
                            </span>
                          </>
                        ) : (
                          <>
                            <Save className="hidden md:inline h-4 w-4" />
                            <span>Save Draft</span>
                          </>
                        )}
                      </Button>
                    )}
                    {onClose && (
                      <button aria-label="Close" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted cursor-pointer">
                        <X className="h-6 w-6" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Desktop: single row (actions only) */}
                <div className="hidden md:flex items-center justify-end">
                  {onSave && (
                    <Button variant="outline" size="sm" onClick={onSave} disabled={isLoading} className="relative gap-2 cursor-pointer">
                      {isLoading ? (
                        <>
                          <span className="opacity-0 inline-flex items-center gap-2">
                            <Save className="hidden md:inline h-4 w-4" />
                            <span>Save Draft</span>
                          </span>
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Spinner size="sm" color="info" />
                          </span>
                        </>
                      ) : (
                        <>
                          <Save className="hidden md:inline h-4 w-4" />
                          <span>Save Draft</span>
                        </>
                      )}
                    </Button>
                  )}
                  {onClose && (
                    <button aria-label="Close" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted cursor-pointer ml-2">
                      <X className="h-6 w-6" />
                    </button>
                  )}
                </div>

                {/* Mobile: second row (progress + text) */}
                <div className="md:hidden pb-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[14px] text-muted-foreground">{Math.round(progress)}% completed</span>
                  </div>
                  <Progress value={progress} className="h-1.5 [&>div]:bg-emerald-600" />
                </div>

              </div>
              {/* Mobile progress moved into header above */}
              <div className="mb-4 pt-0 md:pt-4">
                <h2 className="text-lg font-semibold text-foreground pt-6 md:pt-0">{title}</h2>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              </div>
              <div className="rounded-lg md:border bg-white p-0 md:p-4 py-4 ">{children}</div>

              {/* Footer buttons */}
              <div className="mt-4 hidden md:flex items-center justify-between">
                <Button variant="outline" onClick={onPrevious} disabled={currentStep === 1} className="gap-2 h-11 w-40 cursor-pointer">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                {showNext !== false && (
                  <Button onClick={onNext} disabled={!canProceed} className="gap-2 h-11 w-40 cursor-pointer">
                    {nextLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Mobile footer (non-sticky) */}
              <div className="md:hidden mt-4">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onPrevious} disabled={currentStep === 1} className="h-11 flex-1 cursor-pointer">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  {showNext !== false && (
                    <Button onClick={onNext} disabled={!canProceed} className="h-11 flex-1 cursor-pointer">
                      {nextLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WizardLayout; 