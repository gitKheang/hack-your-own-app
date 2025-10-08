import {
  settingsStore,
  addApiToken,
  addWebhook,
  removeToken,
  removeWebhook,
  revokeSession as revokeSessionFromStore,
  revokeAllSessions as revokeAllSessionsFromStore,
  resetSettingsStore,
  createOneTimeSecret,
} from "./store";
import type {
  AppearanceSettings,
  GeneralSettings,
  NotificationsSettings,
  PrivacySettings,
  ScanDefaults,
  SecuritySettings,
  ApiToken,
  ApiTokenCreateResponse,
  WebhookConfig,
} from "@/types/settings";

const uid = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "id_" + Math.random().toString(36).slice(2, 10);
};

export const getGeneralMock = async (): Promise<GeneralSettings> => settingsStore.general;

export const updateGeneralMock = async (payload: GeneralSettings): Promise<GeneralSettings> => {
  settingsStore.general = { ...payload };
  return settingsStore.general;
};

export const getSecurityMock = async (): Promise<SecuritySettings> => settingsStore.security;

export const updateSecurityMock = async (payload: SecuritySettings): Promise<SecuritySettings> => {
  settingsStore.security = { ...payload };
  return settingsStore.security;
};

export const listSessionsMock = async () => settingsStore.sessions;

export const revokeSessionMock = async (id: string) => {
  revokeSessionFromStore(id);
  return { ok: true };
};

export const revokeAllSessionsMock = async () => {
  revokeAllSessionsFromStore();
  return { ok: true };
};

export const logoutMock = async () => {
  revokeAllSessionsFromStore();
  return { ok: true };
};

export const getNotificationsMock = async (): Promise<NotificationsSettings> => settingsStore.notifications;

export const updateNotificationsMock = async (payload: NotificationsSettings): Promise<NotificationsSettings> => {
  settingsStore.notifications = { ...payload };
  return settingsStore.notifications;
};

export const getAppearanceMock = async (): Promise<AppearanceSettings> => settingsStore.appearance;

export const updateAppearanceMock = async (payload: AppearanceSettings): Promise<AppearanceSettings> => {
  settingsStore.appearance = { ...payload };
  return settingsStore.appearance;
};

export const getScanDefaultsMock = async (): Promise<ScanDefaults> => settingsStore.scans;

export const updateScanDefaultsMock = async (payload: ScanDefaults): Promise<ScanDefaults> => {
  settingsStore.scans = { ...payload };
  return settingsStore.scans;
};

export const getPrivacyMock = async (): Promise<PrivacySettings> => settingsStore.privacy;

export const updatePrivacyMock = async (payload: PrivacySettings): Promise<PrivacySettings> => {
  settingsStore.privacy = { ...payload };
  return settingsStore.privacy;
};

export const exportDataMock = async () => {
  const payload = {
    exportedAt: new Date().toISOString(),
    profile: settingsStore.profile,
    settings: {
      general: settingsStore.general,
      security: settingsStore.security,
      notifications: settingsStore.notifications,
      appearance: settingsStore.appearance,
      scans: settingsStore.scans,
      privacy: settingsStore.privacy,
    },
    tokens: settingsStore.tokens,
    webhooks: settingsStore.webhooks,
    sessions: settingsStore.sessions,
  };

  const json = JSON.stringify(payload, null, 2);
  const base64 = (() => {
    if (typeof btoa === "function") {
      return btoa(json);
    }

    const globalBuffer =
      typeof globalThis !== "undefined" ? (globalThis as Record<string, unknown>).Buffer : undefined;
    if (globalBuffer && typeof (globalBuffer as { from: (input: string, encoding: string) => { toString: (encoding: string) => string } }).from === "function") {
      return (globalBuffer as { from: (input: string, encoding: string) => { toString: (encoding: string) => string } }).from(json, "utf8").toString("base64");
    }

    return json;
  })();
  return { url: `data:application/json;base64,${base64}` };
};

export const listTokensMock = async (): Promise<ApiToken[]> => settingsStore.tokens;

export const createTokenMock = async (name: string): Promise<ApiTokenCreateResponse> => {
  const token = {
    id: uid(),
    name,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  };

  addApiToken(token);

  return {
    ...token,
    secretOnce: createOneTimeSecret(),
  };
};

export const revokeTokenMock = async (id: string) => {
  removeToken(id);
  return { ok: true };
};

export const listWebhooksMock = async (): Promise<WebhookConfig[]> => settingsStore.webhooks;

export const createWebhookMock = async ({
  name,
  endpointUrl,
  events,
}: {
  name: string;
  endpointUrl: string;
  events: Array<"scan.completed" | "scan.failed">;
}): Promise<WebhookConfig> => {
  const webhook: WebhookConfig = {
    id: uid(),
    name,
    endpointUrl,
    events,
    secret: `whsec_${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    lastTriggeredAt: null,
  };
  addWebhook(webhook);
  return webhook;
};

export const updateWebhookMock = async (
  id: string,
  payload: Partial<Pick<WebhookConfig, "endpointUrl" | "secret" | "events" | "name">>,
) => {
  const webhook = settingsStore.webhooks.find((hook) => hook.id === id);
  if (!webhook) {
    throw new Error("Webhook not found");
  }
  Object.assign(webhook, payload);
  return webhook;
};

export const deleteWebhookMock = async (id: string) => {
  removeWebhook(id);
  return { ok: true };
};

export const sendTestWebhookMock = async (id: string) => {
  const webhook = settingsStore.webhooks.find((hook) => hook.id === id);
  if (!webhook) {
    throw new Error("Webhook not found");
  }
  webhook.lastTriggeredAt = new Date().toISOString();
  return { ok: true };
};

export const resetApplicationDataMock = async () => {
  resetSettingsStore();
  return { ok: true };
};

export const deleteAccountMock = async () => {
  resetSettingsStore();
  return { ok: true };
};
