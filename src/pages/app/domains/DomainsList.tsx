import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/sonner";
import {
  Plus,
  CheckCircle2,
  XCircle,
  Activity,
  Settings as SettingsIcon,
  Trash2,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { listDomains, verifyDomain, removeDomain, getDomain, type DomainSummary } from "@/api/domains";
import { ApiError } from "@/api/client";
import { AddDomainModal } from "@/features/domains/components/AddDomainModal";
import { DOMAIN_NAME_REGEX, DOMAIN_VERIFY_TOKEN } from "@/features/domains/constants";
import { normalizeDomainStatus, deriveDomainStatus } from "@/features/domains/utils";
import { removeScansForDomain } from "@/api/scans";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DomainsList = () => {
  const INVALID_DOMAIN_MESSAGE = "Enter a valid domain (e.g., example.com).";
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const modalParam = searchParams.get("modal");
  const domainPrefillParam = searchParams.get("domain");
  const modalStepParam = searchParams.get("step");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<"domain" | "dns">("domain");
  const [domainInput, setDomainInput] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [domainToRemove, setDomainToRemove] = useState<DomainSummary | null>(null);

  const domainsQuery = useQuery({
    queryKey: ["domains"],
    queryFn: listDomains,
  });

  const upsertDomain = useCallback(
    (next: DomainSummary) => {
      const normalized = normalizeDomainStatus(next);
      queryClient.setQueryData<DomainSummary[]>(["domains"], (current = []) => {
        const index = current.findIndex((item) => item.id === normalized.id);

        if (index === -1) {
          return [normalized, ...current];
        }

        const updated = [...current];
        updated[index] = normalized;
        return updated;
      });
    },
    [queryClient],
  );

  const {
    mutate: runVerifyDomain,
    reset: resetVerifyDomain,
    isPending: isVerifyingDomain,
  } = useMutation<DomainSummary, unknown, { domain: string; token: string }>({
    mutationFn: (payload: { domain: string; token: string }) => verifyDomain(payload),
    onSuccess: (domain) => {
      const normalized = normalizeDomainStatus(domain);
      upsertDomain(normalized);

      if (normalized.verification_status === "verified") {
        toast.success(`${normalized.domain_name} verified`);
      } else if (normalized.verification_status === "pending") {
        toast.info(
          `We’re verifying ${normalized.domain_name}. DNS updates can take a few minutes to propagate.`,
        );
      } else if (normalized.verification_status === "failed") {
        toast.error(
          normalized.verification_error ?? `Verification failed for ${normalized.domain_name}.`,
        );
      }
      closeModal();
    },
    onError: (error, variables) => {
      let message: string | null = null;

      if (error instanceof ApiError && error.data && typeof error.data === "object") {
        const data = error.data as { message?: string };
        if (data?.message) {
          message = data.message;
        }
      }

      if (!message) {
        message = error instanceof Error ? error.message : "Verification failed. Please try again.";
      }

      setErrorMessage(message);

      if (variables?.domain) {
        const normalizedDomain = variables.domain.toLowerCase();
        queryClient.setQueryData<DomainSummary[]>(["domains"], (current = []) =>
          current.map((existing) =>
            existing.domain_name.toLowerCase() === normalizedDomain
              ? normalizeDomainStatus({
                  ...existing,
                  isVerified: false,
                  verification_status: "failed",
                  verification_error: message,
                })
              : existing,
          ),
        );
      }
    },
  });

  const {
    mutate: runRefreshDomain,
    isPending: isRefreshingDomain,
    variables: refreshingDomainId,
  } = useMutation<DomainSummary, unknown, string>({
    mutationFn: (domainId: string) => getDomain(domainId),
    onSuccess: (domain) => {
      const normalized = normalizeDomainStatus(domain);
      upsertDomain(normalized);

      if (normalized.verification_status === "verified") {
        toast.success(`${normalized.domain_name} verified`);
      } else if (normalized.verification_status === "pending") {
        toast.info(`${normalized.domain_name} is still pending verification.`);
      } else {
        toast.error(
          normalized.verification_error ?? `Verification failed for ${normalized.domain_name}.`,
        );
      }
    },
    onError: (error) => {
      const message =
        error instanceof ApiError && error.data && typeof error.data === "object" && "message" in error.data
          ? (error.data as { message?: string }).message ?? error.message
          : error instanceof Error
            ? error.message
            : "Unable to refresh status. Please try again.";
      toast.error(message);
    },
  });

  const {
    mutate: runRemoveDomain,
    isPending: isRemovingDomain,
  } = useMutation({
    mutationFn: async ({ domainId }: { domainId: string; domainName: string }) => {
      await removeScansForDomain(domainId);
      await removeDomain(domainId);
      return domainId;
    },
    onSuccess: (_, { domainId, domainName }) => {
      queryClient.setQueryData<DomainSummary[]>(["domains"], (current = []) =>
        current.filter((domain) => domain.id !== domainId),
      );
      void queryClient.invalidateQueries({ queryKey: ["scans"] });
      toast.success(`${domainName} and related scans removed`);
      setDomainToRemove(null);
    },
    onError: (error, { domainName }) => {
      const message =
        error instanceof ApiError && error.data && typeof error.data === "object" && "message" in error.data
          ? (error.data as { message?: string }).message ?? error.message
          : error instanceof Error
            ? error.message
            : "Unable to remove domain. Please try again.";
      toast.error(message || `Unable to remove ${domainName}. Please try again.`);
    },
  });

  const isLoadingDomains = domainsQuery.isLoading;
  const loadError =
    domainsQuery.isError && domainsQuery.error instanceof Error
      ? domainsQuery.error.message
      : domainsQuery.isError
        ? "Unable to load domains."
        : null;

  const rawDomains = domainsQuery.data ?? [];
  const domains = rawDomains.map(normalizeDomainStatus);
  const totalDomains = domains.length;
  const verifiedCount = domains.filter((domain) => domain.verification_status === "verified").length;
  const pendingCount = domains.filter((domain) => domain.verification_status === "pending").length;

  const resetModalState = useCallback(
    (prefillDomain?: string, initialStep: "domain" | "dns" = "domain") => {
      setDomainInput(prefillDomain ?? "");
      setAcknowledged(false);
      setErrorMessage(null);
      resetVerifyDomain();
      setModalStep(initialStep);
    },
    [resetVerifyDomain, setModalStep],
  );

  useEffect(() => {
    if (modalParam === "add" && !isModalOpen) {
      const prefillDomain = domainPrefillParam ?? undefined;
      const initialStep: "domain" | "dns" =
        modalStepParam === "dns" ? "dns" : prefillDomain ? "dns" : "domain";
      resetModalState(prefillDomain, initialStep);
      setIsModalOpen(true);
    } else if (modalParam !== "add" && isModalOpen) {
      setIsModalOpen(false);
      resetModalState();
    }
  }, [modalParam, domainPrefillParam, modalStepParam, isModalOpen, resetModalState]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const desiredStep: "domain" | "dns" = modalStepParam === "dns" ? "dns" : "domain";
    setModalStep((current) => (current === desiredStep ? current : desiredStep));
  }, [isModalOpen, modalStepParam]);

  function openModal(prefillDomain?: string) {
    const nextStep: "domain" | "dns" = prefillDomain ? "dns" : "domain";
    resetModalState(prefillDomain, nextStep);
    setIsModalOpen(true);
    const params = new URLSearchParams(searchParams);
    params.set("modal", "add");
    params.set("step", nextStep);
    if (prefillDomain) {
      params.set("domain", prefillDomain);
    } else {
      params.delete("domain");
    }
    setSearchParams(params, { replace: true });
  }

  function closeModal() {
    setIsModalOpen(false);
    resetModalState();
    if (searchParams.get("modal")) {
      const params = new URLSearchParams(searchParams);
      params.delete("modal");
      params.delete("domain");
      params.delete("step");
      setSearchParams(params, { replace: true });
    }
  }

  const handleVerifyDomain = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = domainInput.trim();
    if (!value) {
      setErrorMessage("Please enter a domain.");
      return;
    }
    const normalized = value.toLowerCase();
    if (!DOMAIN_NAME_REGEX.test(normalized)) {
      setErrorMessage(INVALID_DOMAIN_MESSAGE);
      return;
    }
    setDomainInput(normalized);
    const params = new URLSearchParams(searchParams);
    if (params.get("modal") === "add") {
      params.set("step", "dns");
      setSearchParams(params, { replace: true });
    }
    const existing = domains.find(
      (domain) => domain.domain_name.toLowerCase() === normalized,
    );
    if (existing?.verification_status === "verified" || existing?.isVerified) {
      setErrorMessage("This domain already exists and is verified.");
      return;
    }

    setErrorMessage(null);
    runVerifyDomain({ domain: normalized, token: DOMAIN_VERIFY_TOKEN });
  };

  const handleDomainContinue = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = domainInput.trim();
    if (!value) {
      setErrorMessage("Please enter a domain.");
      return;
    }

    const normalized = value.toLowerCase();
    if (!DOMAIN_NAME_REGEX.test(normalized)) {
      setErrorMessage(INVALID_DOMAIN_MESSAGE);
      return;
    }

    const existing = domains.find(
      (domain) => domain.domain_name.toLowerCase() === normalized,
    );

    if (existing) {
      if (existing.verification_status === "verified" || existing.isVerified) {
        setErrorMessage("This domain already exists and is verified.");
      } else {
        setErrorMessage("This domain is already in your list. Open it to finish verification.");
      }
      return;
    }

    setDomainInput(normalized);
    setErrorMessage(null);
    setAcknowledged(false);
    resetVerifyDomain();
    setModalStep("dns");

    const params = new URLSearchParams(searchParams);
    if (params.get("modal") === "add") {
      params.set("step", "dns");
      params.set("domain", normalized);
      setSearchParams(params, { replace: true });
    }
  };

  const handleBackToDomainStep = () => {
    setAcknowledged(false);
    setErrorMessage(null);
    resetVerifyDomain();

    const params = new URLSearchParams(searchParams);
    params.set("modal", "add");
    params.set("step", "domain");

    params.delete("domain");

    setSearchParams(params, { replace: true });
  };

  const handleCopyValue = async () => {
    try {
      await navigator.clipboard.writeText(DOMAIN_VERIFY_TOKEN);
      toast.success("Copied");
    } catch {
      toast.error("Unable to copy. Please copy manually.");
    }
  };

  const handleConfirmRemove = () => {
    if (!domainToRemove) {
      return;
    }
    runRemoveDomain({
      domainId: domainToRemove.id,
      domainName: domainToRemove.domain_name,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domains</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your verified domains for security testing
          </p>
        </div>
        <div>
          <Button type="button" onClick={() => openModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Add new domain
          </Button>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertTitle>Unable to load domains</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Domains</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDomains ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <div className="text-2xl font-bold">{totalDomains}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDomains ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending verification</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDomains ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {isLoadingDomains
          ? Array.from({ length: 3 }).map((_, index) => (
              <Card className="hover:shadow-md transition-shadow" key={`domain-skeleton-${index}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))
          : domains.map((domain) => {
              const status = deriveDomainStatus(domain);
              const isPendingStatus = status === "pending";
              const isFailedStatus = status === "failed";
              const isVerifiedStatus = status === "verified";
              const isRefreshingThisDomain =
                isRefreshingDomain && refreshingDomainId === domain.id;

              return (
                <Card key={domain.id} className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{domain.domain_name}</CardTitle>
                          {isVerifiedStatus ? (
                            <Badge variant="completed" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Verified
                            </Badge>
                          ) : isFailedStatus ? (
                            <Badge variant="failed" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Verification failed
                            </Badge>
                          ) : (
                            <Badge variant="pending" className="gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Pending verification
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          Added {new Date(domain.created_at).toLocaleDateString()}
                          {isVerifiedStatus && domain.verified_at
                            ? ` • Verified ${new Date(domain.verified_at).toLocaleDateString()}`
                            : null}
                          {isPendingStatus ? " • Verification in progress" : null}
                          {isFailedStatus ? " • Verification failed" : null}
                        </CardDescription>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDomainToRemove(domain)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {isFailedStatus && domain.verification_error && (
                      <Alert variant="destructive">
                        <AlertTitle>Verification failed</AlertTitle>
                        <AlertDescription className="text-sm">
                          {domain.verification_error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {isPendingStatus && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>DNS verification in progress. Check back after the record propagates.</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          <span>{domain.scanCount ?? 0} scans</span>
                        </div>
                        {domain.lastScan && (
                          <div>Last scan: {new Date(domain.lastScan).toLocaleDateString()}</div>
                        )}
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        {isVerifiedStatus ? (
                          <>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/app/domains/${domain.id}`}>
                                <SettingsIcon className="mr-2 h-4 w-4" />
                                Manage
                              </Link>
                            </Button>
                            <Button size="sm" asChild>
                              <Link
                                to={`/app/scans/new?domain=${encodeURIComponent(domain.id)}&domainName=${encodeURIComponent(domain.domain_name)}`}
                              >
                                <Activity className="mr-2 h-4 w-4" />
                                New Scan
                              </Link>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => runRefreshDomain(domain.id)}
                              disabled={isRefreshingThisDomain}
                            >
                              {isRefreshingThisDomain ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Refreshing…
                                </>
                              ) : (
                                <>
                                  <RefreshCcw className="mr-2 h-4 w-4" />
                                  Refresh status
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              type="button"
                              variant={isFailedStatus ? "destructive" : "default"}
                              onClick={() => openModal(domain.domain_name)}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              {isFailedStatus ? "Fix verification" : "Review instructions"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {!isLoadingDomains && domains.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <XCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No domains yet</h3>
            <p className="mb-4 text-muted-foreground">
              Add your first domain to start running security scans
            </p>
            <Button type="button" onClick={() => openModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Domain
            </Button>
          </CardContent>
        </Card>
      )}

      <AddDomainModal
        isOpen={isModalOpen}
        domain={domainInput}
        acknowledged={acknowledged}
        errorMessage={errorMessage}
        isSubmitting={isVerifyingDomain}
        step={modalStep}
        onClose={closeModal}
        onSubmit={handleVerifyDomain}
        onDomainSubmit={handleDomainContinue}
        onDomainChange={(value) => {
          setDomainInput(value);
          if (errorMessage) {
            setErrorMessage(null);
          }
        }}
        onAcknowledgedChange={(value) => setAcknowledged(value)}
        onCopyToken={handleCopyValue}
        onBackToDomain={handleBackToDomainStep}
      />

      <AlertDialog
        open={domainToRemove !== null}
        onOpenChange={(open) => {
          if (!open && !isRemovingDomain) {
            setDomainToRemove(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove domain and scans?</AlertDialogTitle>
            <AlertDialogDescription>
              {domainToRemove
                ? `Removing ${domainToRemove.domain_name} will delete all associated scan history and verification data. This action cannot be undone.`
                : "Removing this domain will delete all associated scan history and verification data. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingDomain}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={isRemovingDomain}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemovingDomain ? "Removing…" : "Remove domain"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DomainsList;
