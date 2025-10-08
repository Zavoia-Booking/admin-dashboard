import type { WizardData } from "../../shared/hooks/useSetupWizard";

export interface StepProps {
	data: WizardData;
	onUpdate: (data: Partial<WizardData>) => void;
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
