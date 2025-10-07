import { ApiError } from "@/api/client";
import {
  domainsStore,
  findDomainByName,
  verifyDomainRecord,
} from "./domains-store";
import { DOMAIN_VERIFY_TOKEN } from "@/features/domains/constants";

export const listDomainsMock = async () => domainsStore.records;

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
