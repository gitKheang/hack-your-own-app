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
  Clock,
  MoreVertical,
  Activity,
  Settings as SettingsIcon,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listDomains, verifyDomain, type DomainSummary } from "@/api/domains";
import { ApiError } from "@/api/client";
import { AddDomainModal } from "@/features/domains/components/AddDomainModal";
import { DOMAIN_VERIFY_TOKEN } from "@/features/domains/constants";

const DomainsList = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const modalParam = searchParams.get("modal");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<"domain" | "dns">("domain");
  const [domainInput, setDomainInput] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const domainsQuery = useQuery({
    queryKey: ["domains"],
    queryFn: listDomains,
  });

  const {
    mutate: runVerifyDomain,
    reset: resetVerifyDomain,
    isPending: isVerifyingDomain,
  } = useMutation({
    mutationFn: (payload: { domain: string; token: string }) => verifyDomain(payload),
    onSuccess: (domain) => {
      queryClient.setQueryData<DomainSummary[]>(["domains"], (current = []) => {
        const filtered = current.filter(
          (existing) => existing.id !== domain.id && existing.domain_name !== domain.domain_name,
        );
        return [domain, ...filtered];
      });
      toast.success("Domain verified");
      closeModal();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.data && typeof error.data === "object") {
        const data = error.data as { message?: string };
        if (data?.message) {
          setErrorMessage(data.message);
          return;
        }
      }
      setErrorMessage(
        error instanceof Error ? error.message : "Verification failed. Please try again.",
      );
    },
  });

  const isLoadingDomains = domainsQuery.isLoading;
  const loadError =
    domainsQuery.isError && domainsQuery.error instanceof Error
      ? domainsQuery.error.message
      : domainsQuery.isError
        ? "Unable to load domains."
        : null;

  const domains = domainsQuery.data ?? [];
  const totalDomains = domains.length;
  const verifiedCount = domains.filter((domain) => domain.isVerified).length;
  const pendingCount = totalDomains - verifiedCount;

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
      resetModalState();
      setIsModalOpen(true);
    } else if (modalParam !== "add" && isModalOpen) {
      setIsModalOpen(false);
      resetModalState();
    }
  }, [modalParam, isModalOpen, resetModalState]);

  function openModal(prefillDomain?: string) {
    const nextStep: "domain" | "dns" = prefillDomain ? "dns" : "domain";
    resetModalState(prefillDomain, nextStep);
    setIsModalOpen(true);
    const params = Object.fromEntries(searchParams.entries());
    if (params.modal !== "add") {
      params.modal = "add";
      setSearchParams(params, { replace: true });
    }
  }

  function closeModal() {
    setIsModalOpen(false);
    resetModalState();
    if (searchParams.get("modal")) {
      const params = Object.fromEntries(searchParams.entries());
      delete params.modal;
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
    setErrorMessage(null);
    runVerifyDomain({ domain: value, token: DOMAIN_VERIFY_TOKEN });
  };

  const handleDomainContinue = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = domainInput.trim();
    if (!value) {
      setErrorMessage("Please enter a domain.");
      return;
    }

    const normalized = value.toLowerCase();
    const existing = domains.find(
      (domain) => domain.domain_name.toLowerCase() === normalized,
    );

    if (existing?.isVerified) {
      setErrorMessage("This domain is already verified.");
      return;
    }

    setErrorMessage(null);
    setAcknowledged(false);
    resetVerifyDomain();
    setModalStep("dns");
  };

  const handleBackToDomainStep = () => {
    setModalStep("domain");
    setAcknowledged(false);
    setErrorMessage(null);
    resetVerifyDomain();
  };

  const handleCopyValue = async () => {
    try {
      await navigator.clipboard.writeText(DOMAIN_VERIFY_TOKEN);
      toast.success("Copied");
    } catch {
      toast.error("Unable to copy. Please copy manually.");
    }
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
        <Button type="button" onClick={() => openModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Add new domain
        </Button>
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
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
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
          : domains.map((domain) => (
              <Card key={domain.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{domain.domain_name}</CardTitle>
                        {domain.isVerified ? (
                          <Badge variant="completed">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="pending">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        Added {new Date(domain.created_at).toLocaleDateString()}
                        {domain.isVerified && domain.verified_at
                          ? ` • Verified ${new Date(domain.verified_at).toLocaleDateString()}`
                          : ""}
                      </CardDescription>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={`/app/domains/${domain.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        {domain.isVerified && (
                          <DropdownMenuItem asChild>
                            <Link to={`/app/scans/new?domain=${domain.id}`}>New Scan</Link>
                          </DropdownMenuItem>
                        )}
                        {!domain.isVerified && (
                          <DropdownMenuItem
                            onSelect={(event) => {
                              event.preventDefault();
                              openModal(domain.domain_name);
                            }}
                          >
                            Verify Domain
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Remove Domain
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        <span>{domain.scanCount ?? 0} scans</span>
                      </div>
                      {domain.lastScan && (
                        <div>Last scan: {new Date(domain.lastScan).toLocaleDateString()}</div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {domain.isVerified ? (
                        <>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/app/domains/${domain.id}`}>
                              <SettingsIcon className="mr-2 h-4 w-4" />
                              Manage
                            </Link>
                          </Button>
                          <Button size="sm" asChild>
                            <Link to={`/app/scans/new?domain=${domain.id}`}>
                              <Activity className="mr-2 h-4 w-4" />
                              New Scan
                            </Link>
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => openModal(domain.domain_name)}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Complete Verification
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
    </div>
  );
};

export default DomainsList;
