import type { Domain, DomainVerificationStatus } from "@/types";

export type DomainRecord = Domain & {
  scanCount: number;
  lastScan?: string;
};

const uid = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "dom_" + Math.random().toString(36).slice(2, 10);
};

const nowIso = () => new Date().toISOString();

const createDomainRecord = (
  domainName: string,
  options: {
    id?: string;
    status?: DomainVerificationStatus;
    scanCount?: number;
    lastScan?: string;
    error?: string | null;
  } = {},
): DomainRecord => {
  const { id, status, scanCount = 0, lastScan, error = null } = options;
  const timestamp = nowIso();
  const resolvedStatus: DomainVerificationStatus = status ?? "pending";
  const isVerified = resolvedStatus === "verified";

  return {
    id: id ?? uid(),
    user_id: "usr_123",
    domain_name: domainName,
    isVerified,
    verification_token: "HYOW-VERIFY-PLACEHOLDER-XXXXXX",
    created_at: timestamp,
    verified_at: isVerified ? timestamp : undefined,
    scanCount,
    lastScan,
    verification_status: resolvedStatus,
    verification_error: error,
  };
};

const createInitialDomains = (): DomainRecord[] => [
  createDomainRecord("example.com", {
    id: "dom_1",
    status: "verified",
    scanCount: 3,
    lastScan: nowIso(),
  }),
  createDomainRecord("test.dev", {
    id: "dom_2",
    status: "verified",
    scanCount: 2,
    lastScan: nowIso(),
  }),
  createDomainRecord("staging.myapp.io", {
    id: "dom_3",
    status: "pending",
    scanCount: 2,
  }),
];

export const domainsStore = {
  records: createInitialDomains(),
};

export const listDomains = () => domainsStore.records;

export const findDomainByName = (domainName: string) =>
  domainsStore.records.find(
    (domain) => domain.domain_name.toLowerCase() === domainName.toLowerCase().trim(),
  );

export const findDomainById = (domainId: string) =>
  domainsStore.records.find((domain) => domain.id === domainId);

export const upsertDomain = (domain: DomainRecord) => {
  const existingIndex = domainsStore.records.findIndex((item) => item.id === domain.id);

  if (existingIndex >= 0) {
    domainsStore.records[existingIndex] = domain;
    return;
  }

  domainsStore.records.unshift(domain);
};

export const verifyDomainRecord = (domainName: string) => {
  const normalized = domainName.trim().toLowerCase();
  const existing = domainsStore.records.find(
    (domain) => domain.domain_name.toLowerCase() === normalized,
  );

  if (existing) {
    const timestamp = nowIso();
    if (existing.isVerified) {
      existing.verification_status = "verified";
      existing.verification_error = null;
      existing.verified_at = existing.verified_at ?? timestamp;
      return existing;
    }

    if (existing.verification_status === "pending") {
      existing.isVerified = true;
      existing.verification_status = "verified";
      existing.verification_error = null;
      existing.verified_at = timestamp;
      existing.scanCount = existing.scanCount ?? 0;
      return existing;
    }

    existing.verification_status = "pending";
    existing.verification_error = null;
    return existing;
  }

  const pending = createDomainRecord(domainName, {
    status: "pending",
    scanCount: 0,
  });
  domainsStore.records.unshift(pending);
  return pending;
};

export const updateDomainRecord = (
  domainId: string,
  updates: { domain_name?: string },
) => {
  const existing = findDomainById(domainId);
  if (!existing) {
    return null;
  }

  if (typeof updates.domain_name === "string") {
    existing.domain_name = updates.domain_name;
    existing.isVerified = false;
    existing.verified_at = undefined;
    existing.verification_status = "pending";
    existing.verification_error = null;
  }

  return existing;
};

export const removeDomainRecord = (domainId: string) => {
  const index = domainsStore.records.findIndex((domain) => domain.id === domainId);
  if (index >= 0) {
    domainsStore.records.splice(index, 1);
    return true;
  }
  return false;
};
