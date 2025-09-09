import { apiClient } from "../../shared/lib/http";
import type { WizardData } from "../../shared/hooks/useSetupWizard";

export const completeWizardApi = async (payload: WizardData): Promise<WizardData> => {
  const { data } = await apiClient().post<WizardData>(`/wizard/complete`, { wizardData: payload });
  return data;
}

export const saveWizardDraftApi = async (payload: Partial<WizardData>): Promise<void> => {
  await apiClient().post(`/wizard/save-draft`, { wizardData: payload });
}

export const getWizardDraftApi = async (): Promise<{ wizardData: Partial<WizardData> }> => {
  const { data } = await apiClient().get<{ wizardData: Partial<WizardData> }>(`/wizard/draft`);
  return data;
}