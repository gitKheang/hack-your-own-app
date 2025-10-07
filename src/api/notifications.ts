import { apiRequest } from "./client";
import type { NotificationsSettings } from "@/types/settings";

export const getNotifications = () => apiRequest<NotificationsSettings>("/settings/notifications");

export const putNotifications = (payload: NotificationsSettings) =>
  apiRequest<NotificationsSettings>("/settings/notifications", {
    method: "PUT",
    json: payload,
  });
