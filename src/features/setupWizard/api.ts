import { apiClient } from "../../shared/lib/http";
import type { WizardData } from "../../shared/hooks/useSetupWizard";

export type CompleteWizardResponse = {
  accessToken: string;
  refreshToken?: string;
  csrfToken?: string | null;
};

export const completeWizardApi = async (payload: WizardData): Promise<CompleteWizardResponse> => {
  const { data } = await apiClient().post<CompleteWizardResponse>(`/wizard/complete`, { wizardData: payload });
  return data;
}

export const saveWizardDraftApi = async (payload: Partial<WizardData>): Promise<void> => {
  await apiClient().post(`/wizard/save-draft`, { wizardData: payload });
}

export const getWizardDraftApi = async (): Promise<{ wizardData: Partial<WizardData> }> => {
  const { data } = await apiClient().get<{ wizardData: Partial<WizardData> }>(`/wizard/draft`);
  return data;
}