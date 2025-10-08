import { apiRequest } from "./client";
import { shouldUseMock, shouldUseMockFallback } from "./utils";
import type { GeneralSettings } from "@/types/settings";

const loadSettingsMockModule = () => import("@/mocks/settings-mock-api");

export const getGeneral = async () => {
  if (shouldUseMock()) {
    const { getGeneralMock } = await loadSettingsMockModule();
    return getGeneralMock();
  }

  try {
    return await apiRequest<GeneralSettings>("/settings/general");
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { getGeneralMock } = await loadSettingsMockModule();
      return getGeneralMock();
    }
    throw error;
  }
};

export const putGeneral = async (payload: GeneralSettings) => {
  if (shouldUseMock()) {
    const { updateGeneralMock } = await loadSettingsMockModule();
    return updateGeneralMock(payload);
  }

  try {
    return await apiRequest<GeneralSettings>("/settings/general", {
      method: "PUT",
      json: payload,
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { updateGeneralMock } = await loadSettingsMockModule();
      return updateGeneralMock(payload);
    }
    throw error;
  }
};
