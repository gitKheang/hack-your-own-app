import type { ScanResult, ScanTask } from "@/types";
import { findDomainById } from "./domains-store";

export type ScanConfiguration = {
  scope: {
    sqli: boolean;
    xss: boolean;
    openRedirect: boolean;
    headers: boolean;
  };
  autoOpenReport: boolean;
};

export type ScanRecord = ScanTask & {
  domainName: string;
  lastRun?: string;
  aiSummary?: string | null;
  progress: number;
  config: ScanConfiguration;
};

export const MOCK_SCAN_COMPLETION_DELAY_MS = 2500;

const nowIso = () => new Date().toISOString();
const resultId = () => `sr_${Math.random().toString(36).slice(2, 10)}`;

const defaultConfig: ScanConfiguration = {
  scope: {
    sqli: true,
    xss: true,
    openRedirect: true,
    headers: true,
  },
  autoOpenReport: true,
};

const mergeConfig = (overrides?: Partial<ScanConfiguration>): ScanConfiguration => ({
  ...defaultConfig,
  ...overrides,
  scope: {
    ...defaultConfig.scope,
    ...(overrides?.scope ?? {}),
  },
});

const createScanRecord = (
  overrides: Partial<Omit<ScanRecord, "config">> &
    Pick<ScanRecord, "id" | "domain_id" | "domainName">,
  configOverrides?: Partial<ScanConfiguration>,
): ScanRecord => {
  const createdAt = overrides.created_at ?? nowIso();
  const status = overrides.target_status ?? "COMPLETED";
  const mergedConfig = mergeConfig(configOverrides);

  const record: ScanRecord = {
    id: overrides.id,
    domain_id: overrides.domain_id,
    domainName: overrides.domainName,
    user_id: overrides.user_id ?? "usr_123",
    target_url: overrides.target_url ?? "https://example.com",
    target_status: status,
    summary: overrides.summary ?? "Security scan summary placeholder.",
    created_at: createdAt,
    completed_at: overrides.completed_at,
    lastRun: overrides.lastRun,
    aiSummary: overrides.aiSummary ?? null,
    progress:
      status === "COMPLETED"
        ? 100
        : overrides.progress ?? Math.max(15, Math.round(Math.random() * 20 + 15)),
    config: mergedConfig,
  };

  if (status === "COMPLETED") {
    record.completed_at = record.completed_at ?? nowIso();
    record.lastRun = record.completed_at;
    record.progress = 100;
  }

  if (status === "FAILED") {
    record.progress = 0;
  }

  return record;
};

export const createRunningScanRecord = ({
  scanId,
  domainId,
  domainName,
  targetUrl,
  summary,
  config,
}: {
  scanId: string;
  domainId: string;
  domainName: string;
  targetUrl: string;
  summary?: string;
  config: ScanConfiguration;
}) =>
  createScanRecord(
    {
      id: scanId,
      domain_id: domainId,
      domainName,
      target_url: targetUrl,
      target_status: "RUNNING",
      summary: summary ?? "Security scan in progress.",
      created_at: nowIso(),
      progress: 20,
    },
    config,
  );

const createInitialScans = (): ScanRecord[] => [
  createScanRecord(
    {
      id: "scan_1",
      domain_id: "dom_1",
      domainName: "example.com",
      target_url: "https://example.com",
      target_status: "COMPLETED",
      summary: "Full surface scan with no critical issues detected.",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      completed_at: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
      lastRun: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      scope: { headers: true, xss: true, sqli: true, openRedirect: true },
    },
  ),
  createScanRecord(
    {
      id: "scan_2",
      domain_id: "dom_1",
      domainName: "example.com",
      target_url: "https://example.com/login",
      target_status: "COMPLETED",
      summary: "Authentication journey scan flagged elevated response times on login.",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      completed_at: new Date(Date.now() - 1000 * 60 * 60 * 11).toISOString(),
    },
    {
      scope: { headers: false, xss: true, sqli: true, openRedirect: false },
    },
  ),
  createScanRecord(
    {
      id: "scan_3",
      domain_id: "dom_1",
      domainName: "example.com",
      target_url: "https://example.com/billing",
      target_status: "RUNNING",
      summary: "Checkout workflow scan in progress.",
      created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      progress: 45,
    },
    {
      scope: { headers: true, xss: true, sqli: true, openRedirect: true },
    },
  ),
  createScanRecord(
    {
      id: "scan_4",
      domain_id: "dom_2",
      domainName: "test.dev",
      target_url: "https://test.dev",
      target_status: "COMPLETED",
      summary: "Baseline scan highlighted missing security headers.",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
      completed_at: new Date(Date.now() - 1000 * 60 * 60 * 35).toISOString(),
      lastRun: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      scope: { headers: true, xss: true, sqli: false, openRedirect: true },
    },
  ),
  createScanRecord(
    {
      id: "scan_5",
      domain_id: "dom_2",
      domainName: "test.dev",
      target_url: "https://test.dev/api",
      target_status: "FAILED",
      summary: "API surface scan ended after authentication timeouts. Needs review.",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      completed_at: new Date(Date.now() - 1000 * 60 * 60 * 4.5).toISOString(),
    },
    {
      scope: { headers: false, xss: false, sqli: true, openRedirect: false },
    },
  ),
  createScanRecord(
    {
      id: "scan_6",
      domain_id: "dom_3",
      domainName: "staging.myapp.io",
      target_url: "https://staging.myapp.io",
      target_status: "RUNNING",
      summary: "Staging smoke test running against latest release.",
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      progress: 30,
    },
    {
      scope: { headers: true, xss: true, sqli: true, openRedirect: true },
    },
  ),
  createScanRecord(
    {
      id: "scan_7",
      domain_id: "dom_3",
      domainName: "staging.myapp.io",
      target_url: "https://staging.myapp.io/admin",
      target_status: "PENDING",
      summary: "Queued admin portal scan awaiting resources.",
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      scope: { headers: true, xss: true, sqli: true, openRedirect: true },
    },
  ),
];

export const scansStore = {
  records: createInitialScans(),
};

const computeProgress = (scan: ScanRecord) => {
  if (scan.target_status === "COMPLETED") {
    return 100;
  }

  if (scan.target_status === "FAILED") {
    return 0;
  }

  const elapsed = Date.now() - new Date(scan.created_at).getTime();
  const ratio = Math.min(elapsed / MOCK_SCAN_COMPLETION_DELAY_MS, 0.95);
  return Math.max(15, Math.round(ratio * 100));
};

const updateDomainStats = (scan: ScanRecord) => {
  const domain = findDomainById(scan.domain_id);
  if (domain) {
    domain.scanCount = (domain.scanCount ?? 0) + 1;
    if (scan.completed_at) {
      domain.lastScan = scan.completed_at;
    }
  }
};

const buildAiSummary = (scan: ScanRecord, results: ScanResult[]) => {
  if (!results.length) {
    return `The scan of ${scan.target_url} completed without discovering any vulnerabilities.`;
  }

  const severityCounts = results.reduce<Record<string, number>>((acc, result) => {
    acc[result.severity] = (acc[result.severity] ?? 0) + 1;
    return acc;
  }, {});

  const parts = Object.entries(severityCounts)
    .sort((a, b) => {
      const order = { critical: 4, high: 3, medium: 2, low: 1 };
      return (order[b[0] as keyof typeof order] ?? 0) - (order[a[0] as keyof typeof order] ?? 0);
    })
    .map(([severity, count]) => `${count} ${severity}`);

  return `The scan of ${scan.target_url} surfaced ${results.length} findings (${parts.join(
    ", ",
  )}). Prioritise the highest severity issues first and schedule a follow-up scan after remediation.`;
};

const createFindingsForScan = (scan: ScanRecord): ScanResult[] => {
  const findings: ScanResult[] = [];
  const timestamp = nowIso();

  if (scan.config.scope.sqli) {
    findings.push({
      id: resultId(),
      task_id: scan.id,
      scan_type: "SQLi",
      severity: "high",
      summary: "SQL injection vector detected on login endpoint.",
      evidence: {
        request: "POST /login { username: \"admin' OR 1=1 --\", password: \"\" }",
        responseSnippet: "Login successful without a password provided.",
        affected: [`${scan.target_url.replace(/\/$/, "")}/login`],
      },
      cwe: "CWE-89",
      owasp: "A03:2021",
      references: ["https://owasp.org/www-community/attacks/SQL_Injection"],
      raw_output: { payload: "admin' OR 1=1 --" },
      scanned_at: timestamp,
      created_at: timestamp,
    });
  }

  if (scan.config.scope.xss) {
    findings.push({
      id: resultId(),
      task_id: scan.id,
      scan_type: "XSS",
      severity: "medium",
      summary: "Reflected XSS vulnerability detected in search parameter.",
      evidence: {
        request: "GET /search?q=<script>alert(1)</script>",
        responseSnippet: "<div>Results for <script>alert(1)</script></div>",
        affected: [`${scan.target_url.replace(/\/$/, "")}/search?q=`],
      },
      cwe: "CWE-79",
      owasp: "A03:2021",
      references: ["https://owasp.org/www-community/attacks/xss/"],
      raw_output: { payload: "<script>alert(1)</script>", reflected: true },
      scanned_at: timestamp,
      created_at: timestamp,
    });
  }

  if (scan.config.scope.openRedirect) {
    findings.push({
      id: resultId(),
      task_id: scan.id,
      scan_type: "OpenRedirect",
      severity: "low",
      summary: "Open redirect detected on the logout redirect parameter.",
      evidence: {
        request: "GET /logout?next=https://attacker.example",
        affected: [`${scan.target_url.replace(/\/$/, "")}/logout`],
      },
      cwe: "CWE-601",
      owasp: "A01:2021",
      references: ["https://owasp.org/www-community/attacks/Reverse_Tabnabbing"],
      raw_output: { parameter: "next", value: "https://attacker.example" },
      scanned_at: timestamp,
      created_at: timestamp,
    });
  }

  if (scan.config.scope.headers) {
    findings.push({
      id: resultId(),
      task_id: scan.id,
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
    });
  }

  return findings;
};

const refreshRunningScans = () => {
  scansStore.records = scansStore.records.map((scan) => {
    if (scan.target_status !== "RUNNING") {
      return scan;
    }

    const progress = computeProgress(scan);
    const elapsed = Date.now() - new Date(scan.created_at).getTime();

    if (elapsed >= MOCK_SCAN_COMPLETION_DELAY_MS) {
      const results = createFindingsForScan(scan);
      const summary = buildAiSummary(scan, results);
      const { scan: updated } = setScanResults(scan.id, results, summary);
      return updated ?? scan;
    }

    scan.progress = progress;
    return scan;
  });
};

export const listScans = () => {
  refreshRunningScans();
  return scansStore.records;
};

export const findScansByDomainId = (domainId: string) => {
  refreshRunningScans();
  return scansStore.records.filter((scan) => scan.domain_id === domainId);
};

export const findScanById = (scanId: string) => {
  refreshRunningScans();
  return scansStore.records.find((scan) => scan.id === scanId);
};

export const removeScansForDomain = (domainId: string) => {
  let removed = 0;
  scansStore.records = scansStore.records.filter((scan) => {
    const keep = scan.domain_id !== domainId;
    if (!keep) {
      removed += 1;
    }
    return keep;
  });
  return removed;
};

export const removeScanById = (scanId: string) => {
  const initialLength = scansStore.records.length;
  scansStore.records = scansStore.records.filter((scan) => scan.id !== scanId);
  delete scanResultsStore[scanId];
  return scansStore.records.length < initialLength;
};

export const upsertScanRecord = (record: ScanRecord) => {
  const index = scansStore.records.findIndex((scan) => scan.id === record.id);
  if (index >= 0) {
    scansStore.records[index] = record;
  } else {
    scansStore.records.unshift(record);
  }
  return record;
};

export const scanResultsStore: Record<string, ScanResult[]> = (() => {
  const firstScanResults = createFindingsForScan(scansStore.records[0]);
  return {
    [scansStore.records[0].id]: firstScanResults,
  };
})();

export const getScanResults = (scanId: string) => scanResultsStore[scanId] ?? [];

export const setScanResults = (
  scanId: string,
  results: ScanResult[],
  aiSummary?: string | null,
) => {
  scanResultsStore[scanId] = results;
  const record = scansStore.records.find((scan) => scan.id === scanId) ?? null;

  if (record) {
    record.target_status = "COMPLETED";
    record.completed_at = nowIso();
    record.lastRun = record.completed_at;
    record.progress = 100;
    const computedSummary = buildAiSummary(record, results);
    const finalSummary = aiSummary ?? computedSummary;
    record.aiSummary = finalSummary ?? record.aiSummary ?? null;
    if (!record.summary || record.summary === "Security scan summary placeholder.") {
      record.summary = results.length
        ? "Automated scan completed with actionable findings."
        : "Automated scan completed with no findings detected.";
    }
    updateDomainStats(record);
  }

  return { scan: record, results };
};
