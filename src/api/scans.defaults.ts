import { apiRequest } from "./client";
import { shouldUseMock, shouldUseMockFallback } from "./utils";
import type { ScanDefaults } from "@/types/settings";

const loadSettingsMockModule = () => import("@/mocks/settings-mock-api");

export const getScanDefaults = async () => {
  if (shouldUseMock()) {
    const { getScanDefaultsMock } = await loadSettingsMockModule();
    return getScanDefaultsMock();
  }

  try {
    return await apiRequest<ScanDefaults>("/settings/scans");
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { getScanDefaultsMock } = await loadSettingsMockModule();
      return getScanDefaultsMock();
    }
    throw error;
  }
};

export const putScanDefaults = async (payload: ScanDefaults) => {
  if (shouldUseMock()) {
    const { updateScanDefaultsMock } = await loadSettingsMockModule();
    return updateScanDefaultsMock(payload);
  }

  try {
    return await apiRequest<ScanDefaults>("/settings/scans", {
      method: "PUT",
      json: payload,
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { updateScanDefaultsMock } = await loadSettingsMockModule();
      return updateScanDefaultsMock(payload);
    }
    throw error;
  }
};
