import config from "../../app/config/env";

export const saveWizardProgress = async (data: any) => {
  // Placeholder for backend endpoint. For now, simulate success.
  // await fetch(`${config.API_URL}/wizard/save`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return Promise.resolve({ ok: true });
}

export const completeWizard = async (data: any) => {
  // Placeholder for backend endpoint. For now, simulate success.
  // await fetch(`${config.API_URL}/wizard/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return Promise.resolve({ ok: true });
}


