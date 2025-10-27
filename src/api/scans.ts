import { apiRequest } from "./client";
import { shouldUseMock, shouldUseMockFallback } from "./utils";
import type { ScanResult, ScanTask } from "@/types";

export type ScanSummary = ScanTask & {
  domainName: string;
  lastRun?: string;
  aiSummary?: string | null;
  progress?: number;
};

const loadScansMockModule = () => import("@/mocks/scans-mock-api");

export const listScans = async (): Promise<ScanSummary[]> => {
  if (shouldUseMock()) {
    const { listScansMock } = await loadScansMockModule();
    return listScansMock();
  }

  try {
    return await apiRequest<ScanSummary[]>("/scans");
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { listScansMock } = await loadScansMockModule();
      return listScansMock();
    }
    throw error;
  }
};

export const removeScansForDomain = async (domainId: string) => {
  if (shouldUseMock()) {
    const { removeScansForDomainMock } = await loadScansMockModule();
    return removeScansForDomainMock(domainId);
  }

  try {
    await apiRequest<void>(`/domains/${domainId}/scans`, { method: "DELETE" });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { removeScansForDomainMock } = await loadScansMockModule();
      return removeScansForDomainMock(domainId);
    }
    throw error;
  }
};

export const removeScan = async (scanId: string) => {
  if (shouldUseMock()) {
    const { removeScanMock } = await loadScansMockModule();
    return removeScanMock(scanId);
  }

  try {
    await apiRequest<void>(`/scans/${scanId}`, { method: "DELETE" });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { removeScanMock } = await loadScansMockModule();
      return removeScanMock(scanId);
    }
    throw error;
  }
};

export interface ScanDetailResponse {
  scan: ScanSummary;
  results: ScanResult[];
  aiSummary: string | null;
}

export const getScanDetail = async (scanId: string): Promise<ScanDetailResponse> => {
  if (shouldUseMock()) {
    const { getScanDetailMock } = await loadScansMockModule();
    return getScanDetailMock(scanId);
  }

  try {
    return await apiRequest<ScanDetailResponse>(`/scans/${scanId}`);
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { getScanDetailMock } = await loadScansMockModule();
      return getScanDetailMock(scanId);
    }
    throw error;
  }
};

export interface CreateScanPayload {
  domain_id: string;
  target_url: string;
  scope: {
    sqli: boolean;
    xss: boolean;
    openRedirect: boolean;
    headers: boolean;
  };
  autoOpenReport: boolean;
}

export const createScan = async (payload: CreateScanPayload): Promise<ScanSummary> => {
  if (shouldUseMock()) {
    const { createScanMock } = await loadScansMockModule();
    return createScanMock(payload);
  }

  try {
    return await apiRequest<ScanSummary>("/scans", {
      method: "POST",
      json: payload,
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { createScanMock } = await loadScansMockModule();
      return createScanMock(payload);
    }
    throw error;
  }
};

export interface PassiveScanPayload {
  target_url: string;
}

export interface PassiveScanResponse {
  scanId: string;
  summary: string;
  results: ScanResult[];
  started_at: string;
  completed_at: string;
}

export const runPassiveScan = async (payload: PassiveScanPayload): Promise<PassiveScanResponse> => {
  if (shouldUseMock()) {
    const { runPassiveScanMock } = await loadScansMockModule();
    return runPassiveScanMock(payload);
  }

  try {
    return await apiRequest<PassiveScanResponse>("/scans/passive", {
      method: "POST",
      json: payload,
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { runPassiveScanMock } = await loadScansMockModule();
      return runPassiveScanMock(payload);
    }
    throw error;
  }
};
