import React from "react";
import { Progress } from "../../../shared/components/ui/progress";
import { Button } from "../../../shared/components/ui/button";
import { Save, ArrowLeft, ArrowRight, X, Check } from "lucide-react";
import { Spinner } from "../../../shared/components/ui/spinner";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import type { WizardLayoutProps } from "../types";

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
  nextLabel = "Continue",
  onClose,
  stepLabels,
  onGoToStep,
  showNext,
  isLoadingDraft = false,
}) => {
  return (
    <div className="min-h-[100svh] cursor-default">
      <div className="container mx-auto pt-0 md:pt-8 pb-0 md:pb-8 min-h-[100svh] flex flex-col">
        <div className="mx-auto max-w-[960px] w-full rounded-none md:rounded-2xl md:border bg-surface shadow-md flex-1 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 px-4 md:px-0">
            {/* Left rail */}
            <aside className="hidden md:block md:col-span-4 bg-sidebar md:rounded-tl-2xl md:rounded-bl-2xl">
              <div className="md:sticky md:top-0 md:max-h-screen md:overflow-auto pb-4 md:rounded-tl-2xl">
                <div className="px-4 min-h-20 bg-surface border-b flex items-center">
                  <h1 className="text-xl font-semibold text-foreground-1 ">
                    Business Setup Wizard
                  </h1>
                </div>
                <div className="mb-4 mt-4 px-4">
                  {isLoadingDraft ? (
                    <>
                      <Skeleton className="h-1.5 w-full mb-2 bg-border-strong" />
                      <Skeleton className="h-3.5 w-24 bg-border-strong" />
                    </>
                  ) : (
                    <>
                  <Progress
                    value={progress}
                    className="h-1.5 [&>div]:bg-primary bg-surface mb-2"
                  />
                  <div className="text-sm text-foreground-3 dark:text-foreground-2">
                    {Math.round(progress)}% completed
                  </div>
                    </>
                  )}
                </div>
                <ol className="space-y-2 px-2">
                  {isLoadingDraft ? (
                    // Show skeleton steps while loading
                    Array.from({ length: totalSteps }).map((_, idx) => (
                      <li key={idx} className="flex items-center gap-2 rounded-md px-2 py-2">
                        <Skeleton className="h-6 w-6 rounded-full bg-border-strong" />
                        <Skeleton className="h-4 w-24 bg-border-strong" />
                      </li>
                    ))
                  ) : (
                    // Show actual steps after hydration
                    (
                    stepLabels ||
                    Array.from({ length: totalSteps }).map(
                      (_, i) => `Step ${i + 1}`
                    )
                  ).map((label, idx) => {
                    const stepNum = idx + 1;
                    const isActive = stepNum === currentStep;
                    const isDone = stepNum < currentStep;
                    return (
                      <li
                        key={idx}
                        className={`flex items-center gap-2 rounded-md px-2 py-2 ${isActive ? "bg-surface border" : ""} ${
                          isDone && onGoToStep ? "group cursor-pointer hover:bg-surface-hover" : "cursor-default"
                        }`}
                        onClick={() => {
                          if (isDone && onGoToStep) onGoToStep(stepNum);
                        }}
                      >
                        {isDone ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                              isActive
                                ? "bg-primary text-foreground-inverse"
                                : "bg-surface-hover text-foreground-3"
                            }`}
                          >
                            {stepNum}
                          </span>
                        )}
                        <span
                          className={`text-sm ${
                            isActive
                              ? "font-medium text-foreground-1"
                              : isDone && onGoToStep
                              ? "text-foreground-3 dark:group-hover:text-foreground-2"
                              : "text-foreground-3"
                          }`}
                        >
                          {label}
                        </span>
                      </li>
                    );
                    })
                  )}
                </ol>
              </div>
            </aside>

            {/* Right content */}
            <section className="md:col-span-8 md:px-6 pt-0 md:pb-4 flex flex-col min-h-0 pb-8">
              {/* Right column sticky header (actions only) */}
              <div className="sticky top-0 z-100 -mx-4 md:-mx-6 px-4 md:px-6 py-4 border-b bg-surface h-auto min-h-20 max-[399px]:static max-[399px]:top-auto md:rounded-tr-2xl">
                {/* Mobile: first row (title + actions) */}
                <div className="md:hidden flex items-center justify-between">
                  <div className="text-lg font-semibold text-foreground-1">
                    Business Setup
                  </div>
                  <div className="flex items-center gap-2">
                    {onSave && (
                      <Button
                        variant="outline"
                        size="sm"
                        rounded="full"
                        onClick={onSave}
                        disabled={isLoading}
                        className="relative gap-2 h-8 w-28"
                      >
                        {isLoading ? (
                          <>
                            <span className="opacity-0 inline-flex items-center gap-2">
                              <Save className="hidden md:inline text-primary" />
                              <span>Save Draft</span>
                            </span>
                            <span className="absolute inset-0 flex items-center justify-center">
                              <Spinner size="sm" color="default" />
                            </span>
                          </>
                        ) : (
                          <>
                            <Save className="hidden md:inline text-primary" />
                            <span>Save Draft</span>
                          </>
                        )}
                      </Button>
                    )}
                    {onClose && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Close"
                        onClick={onClose}
                        className="h-8 w-8"
                      >
                        <X />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Desktop: single row (actions only) */}
                <div className="hidden md:flex items-center justify-end">
                  {onSave && (
                    <Button
                      variant="outline"
                      size="sm"
                      rounded="full"
                      onClick={onSave}
                      disabled={isLoading}
                      className="relative gap-2 cursor-pointer w-34"
                    >
                      {isLoading ? (
                        <>
                          <span className="opacity-0 inline-flex items-center gap-2">
                            <Save className="hidden md:inline text-primary" />
                            <span>Save Draft</span>
                          </span>
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Spinner size="sm" color="default" />
                          </span>
                        </>
                      ) : (
                          <>
                          <Save className="hidden md:inline text-primary" />
                          <span>Save Draft</span>
                        </>
                      )}
                    </Button>
                  )}
                  {onClose && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Close"
                      onClick={onClose}
                      className="h-8 w-8 ml-2 [&_svg]:!size-5"
                    >
                      <X />
                    </Button>
                  )}
                </div>

                {/* Mobile: second row (progress + text) */}
                <div className="md:hidden pb-2">
                  {isLoadingDraft ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <Skeleton className="h-3.5 w-24" />
                      </div>
                      <Skeleton className="h-1.5 w-full" />
                    </>
                  ) : (
                    <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-foreground-3">
                      {Math.round(progress)}% completed
                    </span>
                  </div>
                  <Progress
                    value={progress}
                    className="h-1.5 [&>div]:bg-primary"
                  />
                    </>
                  )}
                </div>
              </div>
              {/* Header */}
              <div className="mb-4 pt-0 md:pt-4">
                <h2 className="text-lg md:text-xl font-semibold text-foreground-1 pt-6 md:pt-0">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm text-foreground-3 dark:text-foreground-2">{subtitle}</p>
                )}
              </div>
              <div className="rounded-lg md:border bg-surface p-0 md:p-4 pt-4 flex-1 md:min-h-[500px] !pb-8">
                {children}
              </div>

              {/* Footer buttons */}
              <div className="mt-4 hidden md:flex items-center justify-between">
                <Button
                  variant="outline"
                  rounded="full"
                  onClick={onPrevious}
                  disabled={currentStep === 1}
                  className="gap-2 h-11 w-40 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                {showNext !== false && (
                  <Button
                    rounded="full"
                    onClick={onNext}
                    disabled={!canProceed}
                    className={`gap-2 h-11 ${currentStep === 3 ? 'w-48' : 'w-40'} cursor-pointer`}
                  >
                    {nextLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Mobile footer (non-sticky) */}
              <div
                className={`md:hidden ${
                  currentStep === 3
                    ? "border-t border-border pt-6 mt-1"
                    : "mt-4"
                }`}
              >
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    rounded="full"
                    onClick={onPrevious}
                    disabled={currentStep === 1}
                    className="h-11 cursor-pointer flex-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  {showNext !== false && (
                    <Button
                      rounded="full"
                      onClick={onNext}
                      disabled={!canProceed}
                      className="h-11 cursor-pointer flex-2"
                    >
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
