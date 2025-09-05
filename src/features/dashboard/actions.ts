import { createAction } from "@reduxjs/toolkit";

export type WizardDataPayload = Partial<{
  businessName: string;
  industry: string;
  description: string;
  isRemote: boolean;
  address: string;
  city: string;
  services: Array<{ id: string; name: string; price: number; duration: number }>;
  schedule: Array<{ day: string; open: string; close: string; isClosed: boolean }>;
  bufferTime: number;
  teamMembers: Array<{ email: string; role: string }>;
  worksSolo: boolean;
  selectedTemplate: string;
  isLaunched: boolean;
}>;

export const wizardInit = createAction('WIZARD/INIT');
export const wizardSetStep = createAction<number>('WIZARD/SET_STEP');
export const wizardNext = createAction('WIZARD/NEXT');
export const wizardPrev = createAction('WIZARD/PREV');
export const wizardUpdateData = createAction<WizardDataPayload>('WIZARD/UPDATE_DATA');

export const wizardSaveRequest = createAction('WIZARD/SAVE/REQUEST');
export const wizardSaveSuccess = createAction('WIZARD/SAVE/SUCCESS');
export const wizardSaveFailure = createAction<string>('WIZARD/SAVE/FAILURE');

export const wizardCompleteRequest = createAction('WIZARD/COMPLETE/REQUEST');
export const wizardCompleteSuccess = createAction('WIZARD/COMPLETE/SUCCESS');
export const wizardCompleteFailure = createAction<string>('WIZARD/COMPLETE/FAILURE');


