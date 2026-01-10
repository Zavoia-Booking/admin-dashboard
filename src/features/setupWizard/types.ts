import type { WizardData } from "../../shared/hooks/useSetupWizard";
import type { UseControllerProps, UseControllerReturn, FieldPath, RegisterOptions } from "react-hook-form";

export interface StepHandle {
	getFormData: () => Partial<WizardData>;
	triggerValidation: () => Promise<boolean>;
	isValid: () => boolean;
}

export interface StepProps {
	data: WizardData;
	onValidityChange?: (isValid: boolean) => void;
	updateData?: (data: Partial<WizardData>) => void;
}

export interface WizardLayoutProps {
	currentStep: number;
	totalSteps: number;
	progress: number;
	title: string;
	subtitle?: string;
	children: React.ReactNode;
	onPrevious?: () => void;
	onNext?: () => void;
	onSave?: () => void;
	onClose?: () => void;
	canProceed: boolean;
	isLoading: boolean;
	nextLabel?: string;
	stepLabels?: string[];
	onGoToStep?: (step: number) => void;
	showNext?: boolean;
	isLoadingDraft?: boolean;
}

// ============================================================================
// React Hook Form Type Helpers
// ============================================================================

/**
 * Valid field paths for WizardData form
 * This provides type-safe access to nested form fields
 * 
 * @example
 * // Instead of: watch("businessInfo.name" as any)
 * // Use: watch("businessInfo.name" satisfies WizardFieldPath)
 */
export type WizardFieldPath = FieldPath<WizardData>;

/**
 * Props for useController with WizardData type safety
 * Use this to get autocomplete and type checking for field names
 * 
 * @example
 * const { field, fieldState } = useController<WizardData, "businessInfo.name">({
 *   name: "businessInfo.name",
 *   control,
 *   rules: { required: "Name is required" }
 * });
 */
export type WizardControllerProps<TName extends WizardFieldPath> = UseControllerProps<WizardData, TName>;

/**
 * Return type for useController with WizardData
 */
export type WizardControllerReturn<TName extends WizardFieldPath> = UseControllerReturn<WizardData, TName>;

/**
 * Type-safe field registration options for WizardData
 * 
 * @example
 * const rules: WizardFieldRules<"businessInfo.name"> = {
 *   validate: (value) => validateBusinessName(value)
 * };
 */
export type WizardFieldRules<TName extends WizardFieldPath> = RegisterOptions<WizardData, TName>;
