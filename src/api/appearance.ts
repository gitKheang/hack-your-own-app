import { apiRequest } from "./client";
import type { AppearanceSettings } from "@/types/settings";

export const getAppearance = () => apiRequest<AppearanceSettings>("/settings/appearance");

export const putAppearance = (payload: AppearanceSettings) =>
  apiRequest<AppearanceSettings>("/settings/appearance", {
    method: "PUT",
    json: payload,
  });
