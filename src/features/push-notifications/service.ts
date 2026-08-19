import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import type { PermissionState } from "@capacitor/core";
import { toast } from "sonner";
import config, { getNativePlatform, isNativeApp } from "../../app/config/env";
import { registerPushTokenApi, unregisterPushTokenApi } from "./api";

let lastRegisteredToken: string | null = null;
let listenersInstalled = false;

async function uploadToken(token: string): Promise<void> {
  if (token === lastRegisteredToken) return;
  await registerPushTokenApi({
    token,
    platform: getNativePlatform(),
    appVersion: config.IS_PROD ? "prod" : config.IS_STAGING ? "staging" : "dev",
  });
  lastRegisteredToken = token;
}

async function fetchAndUploadToken(): Promise<void> {
  const { token } = await FirebaseMessaging.getToken();
  if (!token) return;
  await uploadToken(token);
}

export async function getPushPermissionState(): Promise<PermissionState> {
  if (!isNativeApp()) return "denied";
  const { receive } = await FirebaseMessaging.checkPermissions();
  return receive;
}

/**
 * Silent path (login / session restore): registers the token only when the OS
 * permission is ALREADY granted. Never triggers the system prompt — Android
 * allows two lifetime prompts and iOS one, so those are spent exclusively via
 * the primer's explicit request below.
 */
export async function registerIfGranted(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const { receive } = await FirebaseMessaging.checkPermissions();
    if (receive !== "granted") {
      console.info("[push] permission not granted, skipping silent register:", receive);
      return;
    }
    await fetchAndUploadToken();
  } catch (err) {
    console.error("[push] registerIfGranted failed", err);
  }
}

/** Explicit path (primer accept / settings toggle): fires the OS prompt. */
export async function requestPushPermissionAndRegister(): Promise<PermissionState> {
  if (!isNativeApp()) return "denied";

  try {
    const perm = await FirebaseMessaging.requestPermissions();
    if (perm.receive === "granted") {
      await fetchAndUploadToken().catch((err) =>
        console.error("[push] token registration after grant failed", err),
      );
    }
    return perm.receive;
  } catch (err) {
    console.error("[push] requestPushPermissionAndRegister failed", err);
    return "denied";
  }
}

export async function unregisterFromPush(): Promise<void> {
  if (!isNativeApp()) return;
  const tokenToRemove = lastRegisteredToken;
  lastRegisteredToken = null;

  try {
    if (tokenToRemove) {
      await unregisterPushTokenApi(tokenToRemove).catch(() => undefined);
    }
    await FirebaseMessaging.deleteToken().catch(() => undefined);
  } catch (err) {
    console.error("[push] unregisterFromPush failed", err);
  }
}

export function installPushListeners(navigate?: (path: string) => void): void {
  if (!isNativeApp() || listenersInstalled) return;
  listenersInstalled = true;

  FirebaseMessaging.addListener("tokenReceived", async ({ token }) => {
    if (!token) return;
    try {
      await uploadToken(token);
    } catch (err) {
      console.error("[push] token refresh upload failed", err);
    }
  });

  FirebaseMessaging.addListener("notificationReceived", ({ notification }) => {
    const title = notification?.title ?? "Notification";
    const body = notification?.body ?? "";
    toast(title, { description: body });
  });

  FirebaseMessaging.addListener("notificationActionPerformed", ({ notification }) => {
    const data = notification?.data as Record<string, string> | undefined;
    const deeplink = data?.deeplink;
    if (deeplink && navigate) {
      navigate(deeplink);
    } else if (deeplink) {
      window.location.assign(deeplink);
    }
  });
}
