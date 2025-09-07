import { apiClient } from "../../shared/lib/http";
import type { WizardData } from "../../shared/hooks/useSetupWizard";

export const completeWizardApi = async (payload: WizardData): Promise<WizardData> => {
  const { data } = await apiClient().post<WizardData>(`/wizard/complete`, { wizardData: payload });
  return data;
}
