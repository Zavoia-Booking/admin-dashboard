import type { WizardData } from "../../shared/hooks/useSetupWizard";

export interface StepHandle {
	getFormData: () => Partial<WizardData>;
	triggerValidation: () => Promise<boolean>;
	isValid: () => boolean;
}

export interface StepProps {
	data: WizardData;
	onValidityChange?: (isValid: boolean) => void;
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
}
