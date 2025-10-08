import { ApiError } from "@/api/client";
import {
  domainsStore,
  findDomainById,
  findDomainByName,
  updateDomainRecord,
  removeDomainRecord,
  verifyDomainRecord,
} from "./domains-store";
import { DOMAIN_VERIFY_TOKEN } from "@/features/domains/constants";

export const listDomainsMock = async () => domainsStore.records;

export const getDomainMock = async (domainId: string) => {
  const domain = findDomainById(domainId);
  if (!domain) {
    throw new ApiError("Domain not found.", 404, { message: "Domain not found." });
  }
  return domain;
};

export const verifyDomainMock = async ({
  domain,
  token,
}: {
  domain: string;
  token: string;
}) => {
  const normalized = domain?.trim() ?? "";

  if (!normalized) {
    throw new ApiError("Domain is required.", 400, { message: "Domain is required." });
  }

  if (token !== DOMAIN_VERIFY_TOKEN) {
    throw new ApiError("Invalid verification token.", 400, { message: "Invalid verification token." });
  }

  if (normalized.endsWith(".invalid")) {
    throw new ApiError(
      "DNS verification failed. Check the TXT record and try again.",
      422,
      { message: "DNS verification failed. Check the TXT record and try again." },
    );
  }

  const existing = findDomainByName(normalized);

  if (existing?.isVerified) {
    throw new ApiError("Domain is already verified.", 409, { message: "Domain is already verified." });
  }

  return verifyDomainRecord(normalized);
};

export const updateDomainMock = async ({
  id,
  domain,
}: {
  id: string;
  domain: string;
}) => {
  const normalized = domain?.trim() ?? "";
  if (!normalized) {
    throw new ApiError("Domain is required.", 400, { message: "Domain is required." });
  }

  const existing = findDomainById(id);
  if (!existing) {
    throw new ApiError("Domain not found.", 404, { message: "Domain not found." });
  }

  const duplicate = findDomainByName(normalized);
  if (duplicate && duplicate.id !== id) {
    throw new ApiError("Domain already exists.", 409, { message: "Another domain already uses this name." });
  }

  const updated = updateDomainRecord(id, { domain_name: normalized });

  if (!updated) {
    throw new ApiError("Domain not found.", 404, { message: "Domain not found." });
  }

  return updated;
};

export const removeDomainMock = async (id: string) => {
  const removed = removeDomainRecord(id);
  if (!removed) {
    throw new ApiError("Domain not found.", 404, { message: "Domain not found." });
  }
  return { success: true };
};
