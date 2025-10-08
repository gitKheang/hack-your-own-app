import { ApiError, apiRequest } from "./client";
import { env } from "@/lib/env";
import { shouldUseMock, shouldUseMockFallback } from "./utils";
import type { Domain } from "@/types";

export type DomainSummary = Domain & {
  scanCount: number;
  lastScan?: string;
};

const loadDomainsMockModule = () => import("@/mocks/domains-mock-api");

export const listDomains = async (): Promise<DomainSummary[]> => {
  if (shouldUseMock()) {
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

export const getDomain = async (domainId: string): Promise<DomainSummary> => {
  if (env.useMocks && typeof window === "undefined") {
    const { getDomainMock } = await loadDomainsMockModule();
    return getDomainMock(domainId);
  }

  try {
    return await apiRequest<DomainSummary>(`/domains/${domainId}`);
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { getDomainMock } = await loadDomainsMockModule();
      return getDomainMock(domainId);
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

export const updateDomain = async (payload: { id: string; domain: string }) => {
  if (env.useMocks && typeof window === "undefined") {
    const { updateDomainMock } = await loadDomainsMockModule();
    return updateDomainMock(payload);
  }

  try {
    return await apiRequest<DomainSummary>(`/domains/${payload.id}`, {
      method: "PATCH",
      json: { domain: payload.domain },
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { updateDomainMock } = await loadDomainsMockModule();
      return updateDomainMock(payload);
    }
    throw error;
  }
};

export const removeDomain = async (domainId: string) => {
  if (env.useMocks && typeof window === "undefined") {
    const { removeDomainMock } = await loadDomainsMockModule();
    return removeDomainMock(domainId);
  }

  try {
    await apiRequest<void>(`/domains/${domainId}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { removeDomainMock } = await loadDomainsMockModule();
      return removeDomainMock(domainId);
    }
    throw error;
  }
};

export type { DomainSummary as VerifiedDomainResponse };
