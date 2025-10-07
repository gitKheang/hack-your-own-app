import { ApiError, apiRequest } from "./client";
import { env } from "@/lib/env";
import type { Domain } from "@/types";

export type DomainSummary = Domain & {
  scanCount: number;
  lastScan?: string;
};

const loadDomainsMockModule = () => import("@/mocks/domains-mock-api");

const shouldUseMockFallback = (error: unknown) => {
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

export const listDomains = async (): Promise<DomainSummary[]> => {
  if (env.useMocks && typeof window === "undefined") {
    const { listDomainsMock } = await loadDomainsMockModule();
    return listDomainsMock();
  }

  try {
    return await apiRequest<DomainSummary[]>("/domains");
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { listDomainsMock } = await loadDomainsMockModule();
      return listDomainsMock();
    }
    throw error;
  }
};

export const verifyDomain = async (payload: { domain: string; token: string }) => {
  if (env.useMocks && typeof window === "undefined") {
    const { verifyDomainMock } = await loadDomainsMockModule();
    return verifyDomainMock(payload);
  }

  try {
    return await apiRequest<DomainSummary>("/domains/verify", {
      method: "POST",
      json: payload,
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { verifyDomainMock } = await loadDomainsMockModule();
      return verifyDomainMock(payload);
    }
    throw error;
  }
};

export type { DomainSummary as VerifiedDomainResponse };
