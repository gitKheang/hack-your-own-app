import { apiRequest } from "./client";
import type { PrivacySettings, ExportDataResponse } from "@/types/settings";

export const getPrivacy = () => apiRequest<PrivacySettings>("/settings/privacy");

export const putPrivacy = (payload: PrivacySettings) =>
  apiRequest<PrivacySettings>("/settings/privacy", {
    method: "PUT",
    json: payload,
  });

export const exportData = () =>
  apiRequest<ExportDataResponse>("/settings/export", {
    method: "POST",
  });
