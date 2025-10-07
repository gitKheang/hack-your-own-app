import {
  settingsStore,
  resetSettingsStore,
  addApiToken,
  addWebhook,
  removeToken,
  removeWebhook,
  createOneTimeSecret,
} from "./store";
import type {
  AppearanceSettings,
  GeneralSettings,
  NotificationsSettings,
  PrivacySettings,
  ScanDefaults,
  SecuritySettings,
} from "@/types/settings";

const API_BASE = "/api";

const randomDelay = (delay: (duration?: number) => Promise<void>) =>
  delay(150 + Math.random() * 450);

type RequestContext = {
  request: Request;
};

type RequestWithParamsContext = {
  request: Request;
  params: Record<string, string | undefined>;
};

type ParamsContext = {
  params: Record<string, string | undefined>;
};

export const createSettingsHandlers = ({
  http,
  delay,
  HttpResponse,
}: {
  http: typeof import("msw").http;
  delay: typeof import("msw").delay;
  HttpResponse: typeof import("msw").HttpResponse;
}) => [
  // General settings
  http.get(`${API_BASE}/settings/general`, async () => {
    await randomDelay(delay);
    return HttpResponse.json(settingsStore.general);
  }),
  http.put(`${API_BASE}/settings/general`, async ({ request }: RequestContext) => {
    await randomDelay(delay);
    const body = (await request.json()) as GeneralSettings;
    settingsStore.general = body;
    return HttpResponse.json(settingsStore.general);
  }),
  // Security settings
  http.get(`${API_BASE}/settings/security`, async () => {
    await randomDelay(delay);
    return HttpResponse.json(settingsStore.security);
  }),
  http.put(`${API_BASE}/settings/security`, async ({ request }: RequestContext) => {
    await randomDelay(delay);
    const body = (await request.json()) as SecuritySettings;
    settingsStore.security = body;
    return HttpResponse.json(settingsStore.security);
  }),
  // Notifications
  http.get(`${API_BASE}/settings/notifications`, async () => {
    await randomDelay(delay);
    return HttpResponse.json(settingsStore.notifications);
  }),
  http.put(`${API_BASE}/settings/notifications`, async ({ request }: RequestContext) => {
    await randomDelay(delay);
    const body = (await request.json()) as NotificationsSettings;
    settingsStore.notifications = body;
    return HttpResponse.json(settingsStore.notifications);
  }),
  // Appearance
  http.get(`${API_BASE}/settings/appearance`, async () => {
    await randomDelay(delay);
    return HttpResponse.json(settingsStore.appearance);
  }),
  http.put(`${API_BASE}/settings/appearance`, async ({ request }: RequestContext) => {
    await randomDelay(delay);
    const body = (await request.json()) as AppearanceSettings;
    settingsStore.appearance = body;
    return HttpResponse.json(settingsStore.appearance);
  }),
  // Scan defaults
  http.get(`${API_BASE}/settings/scans`, async () => {
    await randomDelay(delay);
    return HttpResponse.json(settingsStore.scans);
  }),
  http.put(`${API_BASE}/settings/scans`, async ({ request }: RequestContext) => {
    await randomDelay(delay);
    const body = (await request.json()) as ScanDefaults;
    settingsStore.scans = body;
    return HttpResponse.json(settingsStore.scans);
  }),
  // Privacy
  http.get(`${API_BASE}/settings/privacy`, async () => {
    await randomDelay(delay);
    return HttpResponse.json(settingsStore.privacy);
  }),
  http.put(`${API_BASE}/settings/privacy`, async ({ request }: RequestContext) => {
    await randomDelay(delay);
    const body = (await request.json()) as PrivacySettings;
    settingsStore.privacy = body;
    return HttpResponse.json(settingsStore.privacy);
  }),
  http.post(`${API_BASE}/settings/export`, async () => {
    await randomDelay(delay);
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
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    return HttpResponse.json({ url });
  }),
  // API tokens
  http.get(`${API_BASE}/settings/api-tokens`, async () => {
    await randomDelay(delay);
    return HttpResponse.json(settingsStore.tokens);
  }),
  http.post(`${API_BASE}/settings/api-tokens`, async ({ request }: RequestContext) => {
    await randomDelay(delay);
    const body = (await request.json()) as { name: string };
    if (!body?.name) {
      return HttpResponse.json({ message: "Name is required" }, { status: 400 });
    }

    const secretOnce = createOneTimeSecret();
    const token = {
      id: crypto.randomUUID(),
      name: body.name,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };

    addApiToken(token);

    return HttpResponse.json({
      ...token,
      secretOnce,
    });
  }),
  http.delete(`${API_BASE}/settings/api-tokens/:id`, async ({ params }: ParamsContext) => {
    await randomDelay(delay);
    const { id } = params;
    if (typeof id !== "string") {
      return HttpResponse.json({ message: "Token id is required" }, { status: 400 });
    }
    removeToken(id);
    return HttpResponse.json({ ok: true });
  }),
  // Webhooks
  http.get(`${API_BASE}/settings/webhooks`, async () => {
    await randomDelay(delay);
    return HttpResponse.json(settingsStore.webhooks);
  }),
  http.post(`${API_BASE}/settings/webhooks`, async ({ request }: RequestContext) => {
    await randomDelay(delay);
    const body = (await request.json()) as {
      name: string;
      endpointUrl: string;
      events: Array<"scan.completed" | "scan.failed">;
      secret?: string;
    };

    if (!body?.name || !body?.endpointUrl) {
      return HttpResponse.json({ message: "Name and endpoint URL are required." }, { status: 400 });
    }

    const webhook = {
      id: crypto.randomUUID(),
      name: body.name,
      endpointUrl: body.endpointUrl,
      events: body.events ?? ["scan.completed"],
      secret: body.secret ?? `whsec_${Math.random().toString(36).slice(2, 10)}`,
      createdAt: new Date().toISOString(),
      lastTriggeredAt: null,
    };

    addWebhook(webhook);

    return HttpResponse.json(webhook);
  }),
  http.put(
    `${API_BASE}/settings/webhooks/:id`,
    async ({ request, params }: RequestWithParamsContext) => {
      await randomDelay(delay);
      const { id } = params;
      if (typeof id !== "string") {
        return HttpResponse.json({ message: "Webhook id is required" }, { status: 400 });
      }

      const body = (await request.json()) as {
        endpointUrl?: string;
        secret?: string;
        events?: Array<"scan.completed" | "scan.failed">;
        name?: string;
      };

      const existing = settingsStore.webhooks.find((hook) => hook.id === id);
      if (!existing) {
        return HttpResponse.json({ message: "Webhook not found" }, { status: 404 });
      }

      Object.assign(existing, body);

      return HttpResponse.json(existing);
    },
  ),
  http.delete(`${API_BASE}/settings/webhooks/:id`, async ({ params }: ParamsContext) => {
    await randomDelay(delay);
    const { id } = params;
    if (typeof id !== "string") {
      return HttpResponse.json({ message: "Webhook id is required" }, { status: 400 });
    }
    removeWebhook(id);
    return HttpResponse.json({ ok: true });
  }),
  http.post(`${API_BASE}/settings/webhooks/test`, async ({ request }: RequestContext) => {
    await randomDelay(delay);
    const body = (await request.json()) as { id: string };
    if (!body?.id) {
      return HttpResponse.json({ message: "Webhook id is required" }, { status: 400 });
    }

    const webhook = settingsStore.webhooks.find((hook) => hook.id === body.id);
    if (!webhook) {
      return HttpResponse.json({ message: "Webhook not found" }, { status: 404 });
    }

    webhook.lastTriggeredAt = new Date().toISOString();
    return HttpResponse.json({ ok: true });
  }),
  // Danger zone
  http.post(`${API_BASE}/settings/reset`, async () => {
    await randomDelay(delay);
    resetSettingsStore();
    return HttpResponse.json({ ok: true });
  }),
  http.delete(`${API_BASE}/me`, async () => {
    await randomDelay(delay);
    resetSettingsStore();
    return HttpResponse.json({ ok: true });
  }),
];
