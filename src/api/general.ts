import { apiRequest } from "./client";
import type { GeneralSettings } from "@/types/settings";

export const getGeneral = () => apiRequest<GeneralSettings>("/settings/general");

export const putGeneral = (payload: GeneralSettings) =>
  apiRequest<GeneralSettings>("/settings/general", {
    method: "PUT",
    json: payload,
  });
