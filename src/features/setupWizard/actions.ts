import { createAsyncAction, createAction } from "typesafe-actions";
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

export const wizardLoadDraftAction = createAsyncAction(
  'wizard/LOAD_DRAFT_REQUEST',
  'wizard/LOAD_DRAFT_SUCCESS',
  'wizard/LOAD_DRAFT_FAILURE',
)<void, Partial<WizardData>, { message: string }>();

export const wizardUpdateDataAction = createAction('wizard/UPDATE_DATA')<Partial<WizardData>>();


