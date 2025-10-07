import { apiRequest } from "./client";

export const resetApplicationData = () =>
  apiRequest<{ ok: boolean }>("/settings/reset", {
    method: "POST",
  });

export const deleteAccount = () =>
  apiRequest<{ ok: boolean }>("/me", {
    method: "DELETE",
  });
