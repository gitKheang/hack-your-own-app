import { ApiError } from "@/api/client";
import {
  createRunningScanRecord,
  findScanById,
  getScanResults,
  listScans,
  removeScanById,
  removeScansForDomain,
  setScanResults,
  upsertScanRecord,
  type ScanConfiguration,
} from "./scans-store";
import { findDomainById } from "./domains-store";
import type { ScanResult } from "@/types";

export const listScansMock = async () => listScans();

export const removeScansForDomainMock = async (domainId: string) => {
  removeScansForDomain(domainId);
  return { success: true };
};

export const removeScanMock = async (scanId: string) => {
  const removed = removeScanById(scanId);
  if (!removed) {
    throw new ApiError("Scan not found.", 404, { message: "Scan not found." });
  }
  return { success: true };
};

export const getScanDetailMock = async (scanId: string) => {
  const scan = findScanById(scanId);
  if (!scan) {
    throw new ApiError("Scan not found.", 404, { message: "Scan not found." });
  }

  return {
    scan,
    results: getScanResults(scanId),
    aiSummary: scan.aiSummary ?? null,
  };
};

type CreateScanPayload = {
  domain_id: string;
  target_url: string;
  scope: ScanConfiguration["scope"];
  autoOpenReport: boolean;
};

type PassiveScanPayload = {
  target_url: string;
};

const createPassiveFindings = (scanId: string, targetUrl: string): ScanResult[] => {
  const normalized = targetUrl.replace(/\/$/, "");
  const timestamp = new Date().toISOString();
  return [
    {
      id: `${scanId}_open_redirect`,
      task_id: scanId,
      scan_type: "OpenRedirect",
      severity: "low",
      summary: "Potential open redirect discovered.",
      evidence: {
        request: `GET ${normalized}/logout?next=https://example.org`,
        affected: [`${normalized}/logout`],
      },
      cwe: "CWE-601",
      owasp: "A01:2021",
      references: ["https://owasp.org/www-community/attacks/Reverse_Tabnabbing"],
      raw_output: { parameter: "next", value: "https://example.org" },
      scanned_at: timestamp,
      created_at: timestamp,
    },
    {
      id: `${scanId}_headers`,
      task_id: scanId,
      scan_type: "Headers",
      severity: "medium",
      summary: "Missing recommended security headers.",
      evidence: {
        affected: ["Content-Security-Policy", "X-Frame-Options", "Strict-Transport-Security"],
      },
      cwe: "CWE-693",
      owasp: "A05:2021",
      references: ["https://owasp.org/www-project-secure-headers/"],
      raw_output: { missing: ["CSP", "X-Frame-Options", "HSTS"] },
      scanned_at: timestamp,
      created_at: timestamp,
    },
  ];
};

export const createScanMock = async (payload: CreateScanPayload) => {
  const domain = findDomainById(payload.domain_id);
  if (!domain) {
    throw new ApiError("Domain not found.", 404, { message: "Domain not found." });
  }
  if (!domain.isVerified) {
    throw new ApiError("Domain not verified.", 400, {
      message: "Verify the domain before running scans.",
    });
  }

  const scanId = `scan_${Math.random().toString(36).slice(2, 8)}`;
  const config: ScanConfiguration = {
    scope: payload.scope,
    autoOpenReport: payload.autoOpenReport,
  };
  const record = createRunningScanRecord({
    scanId,
    domainId: payload.domain_id,
    domainName: domain.domain_name,
    targetUrl: payload.target_url,
    summary: `Scan queued for ${domain.domain_name}`,
    config,
  });

  upsertScanRecord(record);

  return record;
};

export const runPassiveScanMock = async (payload: PassiveScanPayload) => {
  const scanId = `passive_${Math.random().toString(36).slice(2, 8)}`;
  const startTime = new Date();
  const findings = createPassiveFindings(scanId, payload.target_url);

  const summary = findings.length
    ? `Passive scan completed with ${findings.length} potential issue${findings.length > 1 ? "s" : ""}.`
    : "Passive scan completed with no issues detected.";

  return {
    scanId,
    summary,
    results: findings,
    started_at: startTime.toISOString(),
    completed_at: new Date(startTime.getTime() + 750).toISOString(),
  };
};

export const completeScanMock = async ({
  scanId,
  results,
  aiSummary,
}: {
  scanId: string;
  results: ScanResult[];
  aiSummary?: string | null;
}) => {
  const scan = findScanById(scanId);
  if (!scan) {
    throw new ApiError("Scan not found.", 404, { message: "Scan not found." });
  }

  const { scan: updatedScan } = setScanResults(scanId, results, aiSummary);
  return { scan: updatedScan, results };
};
