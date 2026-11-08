import { apiClient } from "../../shared/lib/http";

export interface RegisterPushTokenPayload {
  token: string;
  platform: "ios" | "android" | "web";
  deviceId?: string;
  appVersion?: string;
}

export async function registerPushTokenApi(payload: RegisterPushTokenPayload): Promise<{ ok: boolean }> {
  const { data } = await apiClient().post("/business-push/token", payload);
  return data;
}

export async function unregisterPushTokenApi(token: string): Promise<{ ok: boolean }> {
  const { data } = await apiClient().delete("/business-push/token", { data: { token } });
  return data;
}

/** Saves the user's dashboard language (User.locale): business push and emails go out in it. */
export async function updateUserLocaleApi(locale: "en" | "ro"): Promise<{ locale: "en" | "ro" }> {
  const { data } = await apiClient().put("/business-push/locale", { locale });
  return data;
}
