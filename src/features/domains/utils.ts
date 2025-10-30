import type { DomainSummary } from "@/api/domains";

export type DomainVerificationState = "verified" | "pending" | "failed";

export const deriveDomainStatus = (domain: DomainSummary): DomainVerificationState => {
  if (domain.verification_status) {
    return domain.verification_status;
  }
  return domain.isVerified ? "verified" : "pending";
};

export const normalizeDomainStatus = (domain: DomainSummary): DomainSummary => {
  const status = deriveDomainStatus(domain);
  let errorMessage = domain.verification_error ?? null;

  if (status !== "failed") {
    errorMessage = null;
  } else if (!errorMessage) {
    errorMessage = "Verification failed. Review your DNS record and try again.";
  }

  return {
    ...domain,
    verification_status: status,
    verification_error: errorMessage,
    isVerified: status === "verified",
  };
};
