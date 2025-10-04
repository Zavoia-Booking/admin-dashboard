import {
  wizardInit, wizardSetStep, wizardNext, wizardPrev, wizardUpdateData, wizardSaveRequest, wizardSaveSuccess,
  wizardSaveFailure, wizardCompleteRequest, wizardCompleteSuccess, wizardCompleteFailure
} from "./actions";

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
    case wizardInit.type: {
      return { ...initialState };
    }
    case wizardSetStep.type: {
      const next = Math.min(Math.max(action.payload, 1), state.totalSteps);
      return { ...state, currentStep: next };
    }
    case wizardNext.type: {
      const next = Math.min(state.currentStep + 1, state.totalSteps);
      return { ...state, currentStep: next };
    }
    case wizardPrev.type: {
      const prev = Math.max(state.currentStep - 1, 1);
      return { ...state, currentStep: prev };
    }
    case wizardUpdateData.type: {
      return { ...state, data: { ...state.data, ...action.payload } };
    }
    case wizardSaveRequest.type:
    case wizardCompleteRequest.type: {
      return { ...state, isLoading: true, error: null };
    }
    case wizardSaveSuccess.type:
    case wizardCompleteSuccess.type: {
      return { ...state, isLoading: false };
    }
    case wizardSaveFailure.type:
    case wizardCompleteFailure.type: {
      return { ...state, isLoading: false, error: action.payload };
    }
    default:
      return state;
  }
}


