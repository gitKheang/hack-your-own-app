import { apiRequest } from "./client";
import type { SecuritySettings, SessionsResponse } from "@/types/settings";

export const getSecurity = () => apiRequest<SecuritySettings>("/settings/security");

export const putSecurity = (payload: SecuritySettings) =>
  apiRequest<SecuritySettings>("/settings/security", {
    method: "PUT",
    json: payload,
  });

export const listSessions = () => apiRequest<SessionsResponse[]>("/me/sessions");

export const revokeSession = (id: string) =>
  apiRequest<{ ok: boolean }>("/me/sessions/revoke", {
    method: "POST",
    json: { id },
  });

export const revokeAllSessions = () =>
  apiRequest<{ ok: boolean }>("/me/sessions/revoke-all", {
    method: "POST",
  });

export const logout = () =>
  apiRequest<{ ok: boolean }>("/auth/logout", {
    method: "POST",
  });
