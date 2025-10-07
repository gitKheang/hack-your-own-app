import { apiRequest } from "./client";
import type { ScanDefaults } from "@/types/settings";

export const getScanDefaults = () => apiRequest<ScanDefaults>("/settings/scans");

export const putScanDefaults = (payload: ScanDefaults) =>
  apiRequest<ScanDefaults>("/settings/scans", {
    method: "PUT",
    json: payload,
  });
