import { apiRequest } from "./client";
import { shouldUseMock, shouldUseMockFallback } from "./utils";
import type { AppearanceSettings } from "@/types/settings";

const loadSettingsMockModule = () => import("@/mocks/settings-mock-api");

export const getAppearance = async () => {
  if (shouldUseMock()) {
    const { getAppearanceMock } = await loadSettingsMockModule();
    return getAppearanceMock();
  }

  try {
    return await apiRequest<AppearanceSettings>("/settings/appearance");
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { getAppearanceMock } = await loadSettingsMockModule();
      return getAppearanceMock();
    }
    throw error;
  }
};

export const putAppearance = async (payload: AppearanceSettings) => {
  if (shouldUseMock()) {
    const { updateAppearanceMock } = await loadSettingsMockModule();
    return updateAppearanceMock(payload);
  }

  try {
    return await apiRequest<AppearanceSettings>("/settings/appearance", {
      method: "PUT",
      json: payload,
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { updateAppearanceMock } = await loadSettingsMockModule();
      return updateAppearanceMock(payload);
    }
    throw error;
  }
};
