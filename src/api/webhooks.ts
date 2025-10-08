import { apiRequest } from "./client";
import { shouldUseMock, shouldUseMockFallback } from "./utils";
import type { WebhookConfig } from "@/types/settings";

const loadSettingsMockModule = () => import("@/mocks/settings-mock-api");

export const listWebhooks = async () => {
  if (shouldUseMock()) {
    const { listWebhooksMock } = await loadSettingsMockModule();
    return listWebhooksMock();
  }

  try {
    return await apiRequest<WebhookConfig[]>("/settings/webhooks");
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { listWebhooksMock } = await loadSettingsMockModule();
      return listWebhooksMock();
    }
    throw error;
  }
};

export const createWebhook = (payload: {
  name: string;
  endpointUrl: string;
  events: Array<"scan.completed" | "scan.failed">;
}) =>
  (async () => {
    if (shouldUseMock()) {
      const { createWebhookMock } = await loadSettingsMockModule();
      return createWebhookMock(payload);
    }

    try {
      return await apiRequest<WebhookConfig>("/settings/webhooks", {
        method: "POST",
        json: payload,
      });
    } catch (error) {
      if (shouldUseMockFallback(error)) {
        const { createWebhookMock } = await loadSettingsMockModule();
        return createWebhookMock(payload);
      }
      throw error;
    }
  })();

export const updateWebhook = (
  id: string,
  payload: Partial<Pick<WebhookConfig, "endpointUrl" | "secret" | "events" | "name">>,
) =>
  (async () => {
    if (shouldUseMock()) {
      const { updateWebhookMock } = await loadSettingsMockModule();
      return updateWebhookMock(id, payload);
    }

    try {
      return await apiRequest<WebhookConfig>(`/settings/webhooks/${id}`, {
        method: "PUT",
        json: payload,
      });
    } catch (error) {
      if (shouldUseMockFallback(error)) {
        const { updateWebhookMock } = await loadSettingsMockModule();
        return updateWebhookMock(id, payload);
      }
      throw error;
    }
  })();

export const deleteWebhook = (id: string) =>
  (async () => {
    if (shouldUseMock()) {
      const { deleteWebhookMock } = await loadSettingsMockModule();
      return deleteWebhookMock(id);
    }

    try {
      return await apiRequest<{ ok: boolean }>(`/settings/webhooks/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (shouldUseMockFallback(error)) {
        const { deleteWebhookMock } = await loadSettingsMockModule();
        return deleteWebhookMock(id);
      }
      throw error;
    }
  })();

export const sendTestWebhook = (id: string) =>
  (async () => {
    if (shouldUseMock()) {
      const { sendTestWebhookMock } = await loadSettingsMockModule();
      return sendTestWebhookMock(id);
    }

    try {
      return await apiRequest<{ ok: boolean }>("/settings/webhooks/test", {
        method: "POST",
        json: { id },
      });
    } catch (error) {
      if (shouldUseMockFallback(error)) {
        const { sendTestWebhookMock } = await loadSettingsMockModule();
        return sendTestWebhookMock(id);
      }
      throw error;
    }
  })();
