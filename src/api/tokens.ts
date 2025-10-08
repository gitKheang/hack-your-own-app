import { apiRequest } from "./client";
import { shouldUseMock, shouldUseMockFallback } from "./utils";
import type { ApiToken, ApiTokenCreateResponse } from "@/types/settings";

const loadSettingsMockModule = () => import("@/mocks/settings-mock-api");

export const listTokens = async () => {
  if (shouldUseMock()) {
    const { listTokensMock } = await loadSettingsMockModule();
    return listTokensMock();
  }

  try {
    return await apiRequest<ApiToken[]>("/settings/api-tokens");
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { listTokensMock } = await loadSettingsMockModule();
      return listTokensMock();
    }
    throw error;
  }
};

export const createToken = async (name: string) => {
  if (shouldUseMock()) {
    const { createTokenMock } = await loadSettingsMockModule();
    return createTokenMock(name);
  }

  try {
    return await apiRequest<ApiTokenCreateResponse>("/settings/api-tokens", {
      method: "POST",
      json: { name },
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { createTokenMock } = await loadSettingsMockModule();
      return createTokenMock(name);
    }
    throw error;
  }
};

export const revokeToken = async (id: string) => {
  if (shouldUseMock()) {
    const { revokeTokenMock } = await loadSettingsMockModule();
    return revokeTokenMock(id);
  }

  try {
    return await apiRequest<{ ok: boolean }>(`/settings/api-tokens/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { revokeTokenMock } = await loadSettingsMockModule();
      return revokeTokenMock(id);
    }
    throw error;
  }
};
