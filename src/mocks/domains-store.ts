import type { Domain } from "@/types";

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
  options: { verified?: boolean; scanCount?: number; lastScan?: string } = {},
): DomainRecord => {
  const { verified = false, scanCount = 0, lastScan } = options;
  const timestamp = nowIso();

  return {
    id: uid(),
    user_id: "usr_123",
    domain_name: domainName,
    isVerified: verified,
    verification_token: "HYOW-VERIFY-PLACEHOLDER-XXXXXX",
    created_at: timestamp,
    verified_at: verified ? timestamp : undefined,
    scanCount,
    lastScan,
  };
};

const createInitialDomains = (): DomainRecord[] => [
  createDomainRecord("example.com", {
    verified: true,
    scanCount: 5,
    lastScan: nowIso(),
  }),
  createDomainRecord("test.dev", {
    verified: true,
    scanCount: 3,
    lastScan: nowIso(),
  }),
  createDomainRecord("staging.myapp.io", {
    verified: false,
    scanCount: 0,
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
    existing.isVerified = true;
    existing.verified_at = timestamp;
    existing.scanCount = existing.scanCount ?? 0;
    return existing;
  }

  const verified = createDomainRecord(domainName, {
    verified: true,
    scanCount: 0,
  });
  domainsStore.records.unshift(verified);
  return verified;
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
