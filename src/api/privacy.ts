import { apiRequest } from "./client";
import { shouldUseMock, shouldUseMockFallback } from "./utils";
import type { PrivacySettings, ExportDataResponse } from "@/types/settings";

const loadSettingsMockModule = () => import("@/mocks/settings-mock-api");

export const getPrivacy = async () => {
  if (shouldUseMock()) {
    const { getPrivacyMock } = await loadSettingsMockModule();
    return getPrivacyMock();
  }

  try {
    return await apiRequest<PrivacySettings>("/settings/privacy");
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { getPrivacyMock } = await loadSettingsMockModule();
      return getPrivacyMock();
    }
    throw error;
  }
};

export const putPrivacy = async (payload: PrivacySettings) => {
  if (shouldUseMock()) {
    const { updatePrivacyMock } = await loadSettingsMockModule();
    return updatePrivacyMock(payload);
  }

  try {
    return await apiRequest<PrivacySettings>("/settings/privacy", {
      method: "PUT",
      json: payload,
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { updatePrivacyMock } = await loadSettingsMockModule();
      return updatePrivacyMock(payload);
    }
    throw error;
  }
};

export const exportData = async () => {
  if (shouldUseMock()) {
    const { exportDataMock } = await loadSettingsMockModule();
    return exportDataMock();
  }

  try {
    return await apiRequest<ExportDataResponse>("/settings/export", {
      method: "POST",
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { exportDataMock } = await loadSettingsMockModule();
      return exportDataMock();
    }
    throw error;
  }
};
