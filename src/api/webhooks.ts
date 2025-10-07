import { apiRequest } from "./client";
import type { WebhookConfig } from "@/types/settings";

export const listWebhooks = () => apiRequest<WebhookConfig[]>("/settings/webhooks");

export const createWebhook = (payload: {
  name: string;
  endpointUrl: string;
  events: Array<"scan.completed" | "scan.failed">;
}) =>
  apiRequest<WebhookConfig>("/settings/webhooks", {
    method: "POST",
    json: payload,
  });

export const updateWebhook = (
  id: string,
  payload: Partial<Pick<WebhookConfig, "endpointUrl" | "secret" | "events" | "name">>,
) =>
  apiRequest<WebhookConfig>(`/settings/webhooks/${id}`, {
    method: "PUT",
    json: payload,
  });

export const deleteWebhook = (id: string) =>
  apiRequest<{ ok: boolean }>(`/settings/webhooks/${id}`, {
    method: "DELETE",
  });

export const sendTestWebhook = (id: string) =>
  apiRequest<{ ok: boolean }>("/settings/webhooks/test", {
    method: "POST",
    json: { id },
  });
