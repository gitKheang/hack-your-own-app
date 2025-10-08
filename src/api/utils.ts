import { ApiError } from "./client";
import { env } from "@/lib/env";

export const shouldUseMock = () => env.useMocks && typeof window === "undefined";

export const shouldUseMockFallback = (error: unknown) => {
  if (!env.useMocks) {
    return false;
  }

  if (typeof window === "undefined") {
    return true;
  }

  if (error instanceof ApiError) {
    return error.status === 404;
  }

  return error instanceof TypeError;
};
