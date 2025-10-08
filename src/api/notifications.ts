import { apiRequest } from "./client";
import { shouldUseMock, shouldUseMockFallback } from "./utils";
import type { NotificationsSettings } from "@/types/settings";

const loadSettingsMockModule = () => import("@/mocks/settings-mock-api");

export const getNotifications = async () => {
  if (shouldUseMock()) {
    const { getNotificationsMock } = await loadSettingsMockModule();
    return getNotificationsMock();
  }

  try {
    return await apiRequest<NotificationsSettings>("/settings/notifications");
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { getNotificationsMock } = await loadSettingsMockModule();
      return getNotificationsMock();
    }
    throw error;
  }
};

export const putNotifications = async (payload: NotificationsSettings) => {
  if (shouldUseMock()) {
    const { updateNotificationsMock } = await loadSettingsMockModule();
    return updateNotificationsMock(payload);
  }

  try {
    return await apiRequest<NotificationsSettings>("/settings/notifications", {
      method: "PUT",
      json: payload,
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { updateNotificationsMock } = await loadSettingsMockModule();
      return updateNotificationsMock(payload);
    }
    throw error;
  }
};
