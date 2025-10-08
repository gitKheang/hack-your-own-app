import { apiRequest } from "./client";
import { shouldUseMock, shouldUseMockFallback } from "./utils";

const loadSettingsMockModule = () => import("@/mocks/settings-mock-api");

export const resetApplicationData = async () => {
  if (shouldUseMock()) {
    const { resetApplicationDataMock } = await loadSettingsMockModule();
    return resetApplicationDataMock();
  }

  try {
    return await apiRequest<{ ok: boolean }>("/settings/reset", {
      method: "POST",
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { resetApplicationDataMock } = await loadSettingsMockModule();
      return resetApplicationDataMock();
    }
    throw error;
  }
};

export const deleteAccount = async () => {
  if (shouldUseMock()) {
    const { deleteAccountMock } = await loadSettingsMockModule();
    return deleteAccountMock();
  }

  try {
    return await apiRequest<{ ok: boolean }>("/me", {
      method: "DELETE",
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { deleteAccountMock } = await loadSettingsMockModule();
      return deleteAccountMock();
    }
    throw error;
  }
};
