import { apiRequest } from "./client";
import { shouldUseMock, shouldUseMockFallback } from "./utils";
import type { SecuritySettings, SessionsResponse } from "@/types/settings";

const loadSettingsMockModule = () => import("@/mocks/settings-mock-api");

export const getSecurity = async () => {
  if (shouldUseMock()) {
    const { getSecurityMock } = await loadSettingsMockModule();
    return getSecurityMock();
  }

  try {
    return await apiRequest<SecuritySettings>("/settings/security");
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { getSecurityMock } = await loadSettingsMockModule();
      return getSecurityMock();
    }
    throw error;
  }
};

export const putSecurity = async (payload: SecuritySettings) => {
  if (shouldUseMock()) {
    const { updateSecurityMock } = await loadSettingsMockModule();
    return updateSecurityMock(payload);
  }

  try {
    return await apiRequest<SecuritySettings>("/settings/security", {
      method: "PUT",
      json: payload,
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { updateSecurityMock } = await loadSettingsMockModule();
      return updateSecurityMock(payload);
    }
    throw error;
  }
};

export const listSessions = async () => {
  if (shouldUseMock()) {
    const { listSessionsMock } = await loadSettingsMockModule();
    return listSessionsMock();
  }

  try {
    return await apiRequest<SessionsResponse[]>("/me/sessions");
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { listSessionsMock } = await loadSettingsMockModule();
      return listSessionsMock();
    }
    throw error;
  }
};

export const revokeSession = async (id: string) => {
  if (shouldUseMock()) {
    const { revokeSessionMock } = await loadSettingsMockModule();
    return revokeSessionMock(id);
  }

  try {
    return await apiRequest<{ ok: boolean }>("/me/sessions/revoke", {
      method: "POST",
      json: { id },
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { revokeSessionMock } = await loadSettingsMockModule();
      return revokeSessionMock(id);
    }
    throw error;
  }
};

export const revokeAllSessions = async () => {
  if (shouldUseMock()) {
    const { revokeAllSessionsMock } = await loadSettingsMockModule();
    return revokeAllSessionsMock();
  }

  try {
    return await apiRequest<{ ok: boolean }>("/me/sessions/revoke-all", {
      method: "POST",
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { revokeAllSessionsMock } = await loadSettingsMockModule();
      return revokeAllSessionsMock();
    }
    throw error;
  }
};

export const logout = async () => {
  if (shouldUseMock()) {
    const { logoutMock } = await loadSettingsMockModule();
    return logoutMock();
  }

  try {
    return await apiRequest<{ ok: boolean }>("/auth/logout", {
      method: "POST",
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { logoutMock } = await loadSettingsMockModule();
      return logoutMock();
    }
    throw error;
  }
};
