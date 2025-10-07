import { apiRequest } from "./client";
import type { ApiToken, ApiTokenCreateResponse } from "@/types/settings";

export const listTokens = () => apiRequest<ApiToken[]>("/settings/api-tokens");

export const createToken = (name: string) =>
  apiRequest<ApiTokenCreateResponse>("/settings/api-tokens", {
    method: "POST",
    json: { name },
  });

export const revokeToken = (id: string) =>
  apiRequest<{ ok: boolean }>(`/settings/api-tokens/${id}`, {
    method: "DELETE",
  });
