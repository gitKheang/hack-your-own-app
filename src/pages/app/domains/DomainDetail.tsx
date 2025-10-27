import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { getDomain, updateDomain, verifyDomain, type DomainSummary } from "@/api/domains";
import { ApiError } from "@/api/client";
import { Copy, Loader2, PenSquare, RefreshCw, ArrowLeft, Activity } from "lucide-react";
import {
  DOMAIN_VERIFY_HELP_TEXT,
  DOMAIN_VERIFY_HOST,
  DOMAIN_VERIFY_TOKEN,
  DOMAIN_VERIFY_TYPE,
} from "@/features/domains/constants";
import { cn } from "@/lib/utils";

const formatDate = (value?: string) => {
  if (!value) {
    return "—";
  }
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    if (error.data && typeof error.data === "object" && "message" in error.data) {
      const { message } = error.data as { message?: string };
      if (message) {
        return message;
      }
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const DomainDetail = () => {
  const params = useParams<{ domainId: string }>();
  const domainId = params.domainId ?? "";
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const domainQuery = useQuery({
    queryKey: ["domain", domainId],
    queryFn: () => getDomain(domainId),
    enabled: Boolean(domainId),
    retry: 1,
  });

  const domain = domainQuery.data;

  useEffect(() => {
    if (isEditOpen && domain) {
      setEditValue(domain.domain_name);
      setEditError(null);
    }
    if (!isEditOpen) {
      setEditError(null);
    }
  }, [isEditOpen, domain]);

  const updateDomainMutation = useMutation({
    mutationFn: (domainName: string) => updateDomain({ id: domainId, domain: domainName }),
    onSuccess: (updatedDomain) => {
      queryClient.setQueryData<DomainSummary | undefined>(["domain", domainId], updatedDomain);
      queryClient.setQueryData<DomainSummary[]>(["domains"], (current = []) => {
        const existingIndex = current.findIndex((item) => item.id === updatedDomain.id);
        if (existingIndex >= 0) {
          const next = [...current];
          next[existingIndex] = updatedDomain;
          return next;
        }
        return [updatedDomain, ...current];
      });
      toast.success("Domain updated. Re-verify to confirm ownership.");
      setIsEditOpen(false);
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Unable to update the domain.");
      setEditError(message);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (domainName: string) => verifyDomain({ domain: domainName, token: DOMAIN_VERIFY_TOKEN }),
    onSuccess: (updatedDomain) => {
      queryClient.setQueryData<DomainSummary | undefined>(["domain", domainId], updatedDomain);
      queryClient.setQueryData<DomainSummary[]>(["domains"], (current = []) => {
        const filtered = current.filter(
          (existing) => existing.id !== updatedDomain.id && existing.domain_name !== updatedDomain.domain_name,
        );
        return [updatedDomain, ...filtered];
      });
      toast.success("Domain verification refreshed.");
    },
    onError: (error) => {
      const message = getErrorMessage(
        error,
        "We couldn’t verify the domain. Double-check the DNS record and try again.",
      );
      toast.error(message);
    },
  });

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(DOMAIN_VERIFY_TOKEN);
      toast.success("Verification token copied");
    } catch {
      toast.error("Unable to copy. Please copy manually.");
    }
  };

  const handleRefreshStatus = () => {
    if (!domain || verifyMutation.isPending) {
      return;
    }

    if (domain.isVerified) {
      toast.info("Domain is already verified.");
      void domainQuery.refetch();
      return;
    }

    verifyMutation.mutate(domain.domain_name);
  };

  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = editValue.trim();
    if (!value.length) {
      setEditError("Please enter a domain.");
      return;
    }
    if (!domain) {
      setEditError("Domain details are still loading. Try again in a moment.");
      return;
    }
    if (value.toLowerCase() === domain.domain_name.toLowerCase()) {
      setEditError("Enter a different domain or close the dialog.");
      return;
    }
    setEditError(null);
    updateDomainMutation.mutate(value);
  };

  const verificationStatus = useMemo(() => {
    if (!domain) {
      return null;
    }
    return domain.isVerified
      ? { label: "Verified", variant: "completed" as const }
      : { label: "Verification failed", variant: "failed" as const };
  }, [domain]);

  if (!domainId) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Domain not found</AlertTitle>
          <AlertDescription>
            We couldn’t determine which domain to load. Return to the domains list and try again.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/app/domains">Back to Domains</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Button variant="ghost" className="w-fit gap-2" asChild>
          <Link to="/app/domains">
            <ArrowLeft className="h-4 w-4" />
            Domains
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            {domainQuery.isLoading ? (
              <>
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-4 w-96" />
              </>
            ) : domain ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">{domain.domain_name}</h1>
                  {verificationStatus && (
                    <Badge variant={verificationStatus.variant}>{verificationStatus.label}</Badge>
                  )}
                </div>
                <p className="max-w-2xl text-muted-foreground">
                  View ownership details, verification status, and activity for this domain. Use the actions on
                  the right to update the record or rerun verification.
                </p>
              </>
            ) : domainQuery.isError ? (
              <Alert variant="destructive" className="max-w-lg">
                <AlertTitle>Unable to load domain</AlertTitle>
                <AlertDescription>
                  {getErrorMessage(domainQuery.error, "Something went wrong while loading the domain.")}
                </AlertDescription>
              </Alert>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(true)}
              disabled={!domain || domainQuery.isLoading}
            >
              <PenSquare className="mr-2 h-4 w-4" />
              Edit domain
            </Button>
            <Button
              variant="secondary"
              onClick={handleRefreshStatus}
              disabled={!domain || verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing…
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh status
                </>
              )}
            </Button>
            <Button variant="default" asChild disabled={!domain}>
              <Link
                to={`/app/scans/new?domain=${encodeURIComponent(domain?.id ?? "")}&domainName=${encodeURIComponent(domain?.domain_name ?? "")}`}
              >
                <Activity className="mr-2 h-4 w-4" />
                New scan
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {!domainQuery.isLoading && domainQuery.isError && !domain ? (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTitle>Unable to load domain</AlertTitle>
            <AlertDescription>
              {getErrorMessage(domainQuery.error, "Something went wrong while loading the domain.")}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => domainQuery.refetch()}>
              Try again
            </Button>
            <Button asChild>
              <Link to="/app/domains">Back to Domains</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {domainQuery.isLoading && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-28 w-full" />
            </CardContent>
          </Card>
        </div>
      )}

      {domain && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Domain overview</CardTitle>
              <CardDescription>Key information about this domain.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-2">
                <Label className="text-xs uppercase text-muted-foreground">Domain</Label>
                <div className="rounded-md border bg-muted/40 px-3 py-2 font-medium">{domain.domain_name}</div>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs uppercase text-muted-foreground">Created at</Label>
                <span>{formatDate(domain.created_at)}</span>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs uppercase text-muted-foreground">Verified at</Label>
                <span>{domain.isVerified ? formatDate(domain.verified_at) : "Not verified yet"}</span>
              </div>
              <Separator />
              <div className="grid gap-2">
                <Label className="text-xs uppercase text-muted-foreground">Total scans</Label>
                <span>{domain.scanCount ?? 0}</span>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs uppercase text-muted-foreground">Last scan</Label>
                <span>{domain.lastScan ? formatDate(domain.lastScan) : "No scans run yet"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verification instructions</CardTitle>
              <CardDescription>Keep this TXT record in place so we can confirm ownership.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-1">
                  <Label>Type</Label>
                  <Input value={DOMAIN_VERIFY_TYPE} readOnly />
                </div>
                <div className="grid gap-1">
                  <Label>Name / Host</Label>
                  <Input value={DOMAIN_VERIFY_HOST} readOnly />
                </div>
                <div className="grid gap-1">
                  <Label>Value</Label>
                  <div className="flex gap-2">
                    <Input value={DOMAIN_VERIFY_TOKEN} readOnly className="font-mono" />
                    <Button variant="outline" type="button" onClick={handleCopyToken} className="shrink-0">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground">{DOMAIN_VERIFY_HELP_TEXT}</p>
              <Button
                type="button"
                variant="link"
                className="h-auto px-0 text-sm"
                asChild
              >
                <Link to="/help/domain-verification" target="_blank" rel="noreferrer">
                  Learn more about TXT verification
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <EditDomainDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        value={editValue}
        onValueChange={setEditValue}
        onSubmit={handleEditSubmit}
        isSubmitting={updateDomainMutation.isPending}
        errorMessage={editError}
        currentDomain={domain ?? null}
      />
    </div>
  );
};

interface EditDomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
  currentDomain: DomainSummary | null;
}

const EditDomainDialog = ({
  open,
  onOpenChange,
  value,
  onValueChange,
  onSubmit,
  isSubmitting,
  errorMessage,
  currentDomain,
}: EditDomainDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <form onSubmit={onSubmit} className="space-y-4">
        <DialogHeader>
          <DialogTitle>Edit domain</DialogTitle>
          <DialogDescription>
            Update the domain name. We’ll pause verification until you confirm ownership again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="edit-domain-name">Domain</Label>
          <Input
            id="edit-domain-name"
            placeholder="example.com"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
          />
        </div>

        {currentDomain && (
          <Alert>
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground">
              Changing the domain resets verification. Run “Refresh status” after updating your DNS TXT record.
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive">
            <AlertTitle>Unable to save</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !value.trim().length}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);

export default DomainDetail;
