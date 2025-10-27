import type {
  ApiToken,
  AppearanceSettings,
  GeneralSettings,
  NotificationsSettings,
  PrivacySettings,
  ProfileResponse,
  ScanDefaults,
  SecuritySettings,
  SessionsResponse,
  WebhookConfig,
} from "@/types/settings";

type PendingEmailChange = {
  email: string;
  code: string;
};

export interface SettingsStore {
  profile: ProfileResponse;
  password: string;
  general: GeneralSettings;
  security: SecuritySettings;
  notifications: NotificationsSettings;
  appearance: AppearanceSettings;
  scans: ScanDefaults;
  privacy: PrivacySettings;
  tokens: ApiToken[];
  webhooks: WebhookConfig[];
  sessions: SessionsResponse[];
  pendingEmailChange: PendingEmailChange | null;
}

const uid = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "id_" + Math.random().toString(36).slice(2, 10);
};

const nowIso = () => new Date().toISOString();

const detectTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
};

const createSessions = (): SessionsResponse[] => [
  {
    id: uid(),
    device: "MacBook Pro • Safari",
    ip: "24.16.42.11",
    location: "New York, USA",
    created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    lastActive: nowIso(),
  },
  {
    id: uid(),
    device: "iPhone 15 • Secure App",
    ip: "172.33.11.5",
    location: "Brooklyn, USA",
    created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    lastActive: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

const createTokens = (): ApiToken[] => [
  {
    id: uid(),
    name: "CI pipeline",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

const createWebhooks = (): WebhookConfig[] => [
  {
    id: uid(),
    name: "Ops Pager",
    events: ["scan.completed", "scan.failed"],
    endpointUrl: "https://hooks.ops.example.com/scanner",
    secret: "whsec_" + Math.random().toString(36).slice(2, 12),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    lastTriggeredAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

const createInitialStore = (): SettingsStore => ({
  profile: {
    id: "usr_123",
    first_name: "Alex",
    last_name: "Johnson",
    email: "alex@example.com",
    email_verified: true,
    timezone: detectTimezone(),
    time_format: "24h",
  },
  password: "SecurePass123!",
  general: {
    landing: "dashboard",
    openInNewTab: false,
    autosave: false,
  },
  security: {
    requireOtpOnSensitive: true,
    preferredChannel: "email",
  },
  notifications: {
    email: {
      scanCompleted: true,
      onlyHigh: true,
      weeklyDigest: false,
      domainReminders: true,
    },
    inapp: {
      scanToasts: true,
    },
  },
  appearance: {
    theme: "system",
    density: "comfortable",
    colorAssist: false,
    monoForCode: true,
    locale: "en-US",
  },
  scans: {
    scope: {
      sqli: true,
      xss: true,
      openRedirect: true,
      headers: true,
    },
    autoOpenReport: true,
  },
  privacy: {
    retentionDays: 30,
    telemetry: false,
  },
  tokens: createTokens(),
  webhooks: createWebhooks(),
  sessions: createSessions(),
  pendingEmailChange: null,
});

export const settingsStore = createInitialStore();

export const resetSettingsStore = () => {
  const fresh = createInitialStore();

  (Object.keys(settingsStore) as Array<keyof SettingsStore>).forEach((key) => {
    // @ts-expect-error deliberate mutation for store refresh
    settingsStore[key] = fresh[key];
  });
};

export const createOneTimeSecret = () => `token_${Math.random().toString(36).slice(2, 10)}`;

export const createOtpCode = () =>
  Math.random()
    .toString()
    .slice(2, 8)
    .padEnd(6, "0");

export const addSession = (session: SessionsResponse) => {
  settingsStore.sessions.unshift(session);
};

export const addApiToken = (token: ApiToken) => {
  settingsStore.tokens.unshift(token);
};

export const addWebhook = (webhook: WebhookConfig) => {
  settingsStore.webhooks.unshift(webhook);
};

export const removeToken = (id: string) => {
  settingsStore.tokens = settingsStore.tokens.filter((token) => token.id !== id);
};

export const removeWebhook = (id: string) => {
  settingsStore.webhooks = settingsStore.webhooks.filter((webhook) => webhook.id !== id);
};

export const revokeSession = (id: string) => {
  settingsStore.sessions = settingsStore.sessions.filter((session) => session.id !== id);
};

export const revokeAllSessions = () => {
  settingsStore.sessions = [];
};
