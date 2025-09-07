import { wizardSaveAction, wizardCompleteAction } from "./actions";

type WizardState = {
  currentStep: number;
  totalSteps: number;
  data: any;
  isLoading: boolean;
  error: string | null;
};

const initialState: WizardState = {
  currentStep: 1,
  totalSteps: 7,
  data: {},
  isLoading: false,
  error: null,
};

export default function setupWizardReducer(state: WizardState = initialState, action: any) {
  switch (action.type) {
    case wizardSaveAction.request:
    case wizardCompleteAction.request: {
      return { ...state, isLoading: true, error: null };
    }
    case wizardSaveAction.success:
    case wizardCompleteAction.success: {
      return { ...state, isLoading: false };
    }
    case wizardSaveAction.failure:
    case wizardCompleteAction.failure: {
      return { ...state, isLoading: false, error: action.payload?.message };
    }
    default:
      return state;
  }
}


