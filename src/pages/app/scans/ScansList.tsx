import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/domain/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
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
import { toast } from "@/components/ui/sonner";
import { Activity, BarChart3, CheckCircle2, Clock, Plus, Shield, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { listScans, removeScan, type ScanSummary } from "@/api/scans";
import { ApiError } from "@/api/client";

const LOADING_PLACEHOLDER_COUNT = 3;

const ScansList = () => {
  const queryClient = useQueryClient();
  const [scanToRemove, setScanToRemove] = useState<ScanSummary | null>(null);

  const scansQuery = useQuery({
    queryKey: ["scans"],
    queryFn: listScans,
  });

  const {
    mutate: runRemoveScan,
    isPending: isRemovingScan,
  } = useMutation({
    mutationFn: (scanId: string) => removeScan(scanId),
    onSuccess: (_, scanId) => {
      queryClient.setQueryData<ScanSummary[]>(["scans"], (current = []) =>
        current.filter((scan) => scan.id !== scanId),
      );
      toast.success("Scan removed");
      setScanToRemove(null);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError && error.data && typeof error.data === "object" && "message" in error.data
          ? (error.data as { message?: string }).message ?? error.message
          : error instanceof Error
            ? error.message
            : "Unable to remove scan. Please try again.";
      toast.error(message);
    },
  });

  const scans = scansQuery.data ?? [];
  const isLoading = scansQuery.isLoading;
  const loadError =
    scansQuery.isError && scansQuery.error instanceof Error
      ? scansQuery.error.message
      : scansQuery.isError
        ? "Unable to load scans."
        : null;

  const totalScans = scans.length;
  const runningScans = scans.filter((scan) => scan.target_status === "RUNNING").length;
  const completedScans = scans.filter((scan) => scan.target_status === "COMPLETED").length;

  const handleConfirmRemove = () => {
    if (!scanToRemove) {
      return;
    }
    runRemoveScan(scanToRemove.id);
  };

  let scanListContent: ReactNode;

  if (isLoading) {
    scanListContent = Array.from({ length: LOADING_PLACEHOLDER_COUNT }).map((_, index) => (
      <Card key={`scan-skeleton-${index}`} className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-6 w-28 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex justify-end gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </CardContent>
      </Card>
    ));
  } else if (scans.length === 0) {
    scanListContent = (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No scans yet</h3>
          <p className="mb-4 text-muted-foreground">
            Launch your first scan to start monitoring application health.
          </p>
          <Button asChild>
            <Link to="/app/scans/new">
              <Plus className="mr-2 h-4 w-4" />
              Start scanning
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  } else {
    scanListContent = scans.map((scan) => (
      <Card key={scan.id} className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">{scan.domainName}</CardTitle>
            <CardDescription>{scan.target_url}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={scan.target_status} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => setScanToRemove(scan)}
              disabled={isRemovingScan && scanToRemove?.id === scan.id}
              aria-label={`Delete scan for ${scan.domainName}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{scan.summary}</p>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              Started {new Date(scan.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </span>
            {scan.lastRun && <span>Last run {new Date(scan.lastRun).toLocaleString()}</span>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link to={`/app/scans/${scan.id}`}>View details</Link>
            </Button>
            <Button asChild>
              <Link
                to={`/app/scans/new?domain=${encodeURIComponent(scan.domain_id)}&domainName=${encodeURIComponent(scan.domainName)}`}
              >
                Run again
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    ));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scans</h1>
          <p className="mt-1 text-muted-foreground">
            Review recent scan activity and launch new assessments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/app/scans/new">
              <Activity className="mr-2 h-4 w-4" />
              New Active Scan
            </Link>
          </Button>
          <Button asChild>
            <Link to="/scan">
              <Shield className="mr-2 h-4 w-4" />
              Quick Passive Scan
            </Link>
          </Button>
        </div>
      </div>


      {loadError && (
        <Alert variant="destructive">
          <AlertTitle>Unable to load scans</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalScans}</div>
                <p className="text-xs text-muted-foreground">Across all domains</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <>
                <div className="text-2xl font-bold">{runningScans}</div>
                <p className="text-xs text-muted-foreground">Currently in progress</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-14" />
            ) : (
              <>
                <div className="text-2xl font-bold">{completedScans}</div>
                <p className="text-xs text-muted-foreground">Ready for review</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">{scanListContent}</div>

      <AlertDialog
        open={scanToRemove !== null}
        onOpenChange={(open) => {
          if (!open && !isRemovingScan) {
            setScanToRemove(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete scan?</AlertDialogTitle>
            <AlertDialogDescription>
              {scanToRemove
                ? `Deleting this scan will remove all stored results for ${scanToRemove.domainName}.`
                : "Deleting this scan will remove all stored results."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingScan}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={isRemovingScan}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemovingScan ? "Deleting…" : "Delete scan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ScansList;
