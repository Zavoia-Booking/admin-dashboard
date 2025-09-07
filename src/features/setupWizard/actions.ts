import { createAsyncAction } from "typesafe-actions";
import type { WizardData } from "../../shared/hooks/useSetupWizard";

export const wizardSaveAction = createAsyncAction(
  'wizard/SAVE_REQUEST',
  'wizard/SAVE_SUCCESS',
  'wizard/SAVE_FAILURE',
)<Partial<WizardData>, void, { message: string }>();

export const wizardCompleteAction = createAsyncAction(
  'wizard/COMPLETE_REQUEST',
  'wizard/COMPLETE_SUCCESS',
  'wizard/COMPLETE_FAILURE',
)<WizardData, void, { message: string }>();


