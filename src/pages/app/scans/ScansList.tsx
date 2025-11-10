import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/domain/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { listScans, removeScan, type ScanSummary } from "@/api/scans";
import { ApiError } from "@/api/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

type StatusFilter = "all" | TaskStatus;

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "Pending",
  RUNNING: "Running",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELED: "Canceled",
};

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "RUNNING", label: STATUS_LABELS.RUNNING },
  { value: "COMPLETED", label: STATUS_LABELS.COMPLETED },
  { value: "FAILED", label: STATUS_LABELS.FAILED },
  { value: "PENDING", label: STATUS_LABELS.PENDING },
  { value: "CANCELED", label: STATUS_LABELS.CANCELED },
];

const LOADING_PLACEHOLDER_COUNT = 3;

const ScansList = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
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
      toast.success("Scan removed for this URL");
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

  const filteredScans = useMemo(() => {
    if (scans.length === 0) {
      return [];
    }

    const normalizedQuery = searchTerm.trim().toLowerCase();

    return scans.filter((scan) => {
      const matchesStatus = statusFilter === "all" || scan.target_status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedQuery.length) {
        return true;
      }

      const domainMatch = scan.domainName.toLowerCase().includes(normalizedQuery);
      const urlMatch = scan.target_url.toLowerCase().includes(normalizedQuery);
      const summaryMatch = scan.summary?.toLowerCase().includes(normalizedQuery);

      return domainMatch || urlMatch || summaryMatch;
    });
  }, [scans, searchTerm, statusFilter]);

  const totalAvailableScans = scans.length;
  const hasFiltersApplied = searchTerm.trim().length > 0 || statusFilter !== "all";
  const totalScans = filteredScans.length;
  const runningScans = filteredScans.filter((scan) => scan.target_status === "RUNNING").length;
  const completedScans = filteredScans.filter((scan) => scan.target_status === "COMPLETED").length;

  const summaryCards = [
    {
      key: "total",
      title: "Total scans",
      icon: Activity,
      value: totalScans,
      description: hasFiltersApplied ? "Matching current filters" : "Across all domains",
    },
    {
      key: "running",
      title: "Running",
      icon: Clock,
      value: runningScans,
      description: hasFiltersApplied ? "Running scans that match" : "Currently in progress",
    },
    {
      key: "completed",
      title: "Completed",
      icon: CheckCircle2,
      value: completedScans,
      description: hasFiltersApplied ? "Completed scans that match" : "Ready for review",
    },
  ];

  const renderSummaryCards = (cardClassName?: string) =>
    summaryCards.map((card) => {
      const Icon = card.icon;
      return (
        <Card key={card.key} className={cn("w-full shrink-0 snap-center", cardClassName)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </>
            )}
          </CardContent>
        </Card>
      );
    });

  const handleConfirmRemove = () => {
    if (!scanToRemove) {
      return;
    }
    runRemoveScan(scanToRemove.id);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  let scanListContent: ReactNode;

  if (isLoading) {
    scanListContent = Array.from({ length: LOADING_PLACEHOLDER_COUNT }).map((_, index) => (
      <Card key={`scan-skeleton-${index}`} className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
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
  } else if (totalAvailableScans === 0) {
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
  } else if (filteredScans.length === 0) {
    scanListContent = (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No scans match your filters</h3>
          <p className="mb-4 text-muted-foreground">Try adjusting your search or reset the filters.</p>
          <Button type="button" variant="outline" onClick={handleResetFilters}>
            Clear filters
          </Button>
        </CardContent>
      </Card>
    );
  } else {
    const renderDesktopCard = (scan: ScanSummary) => (
      <Card key={`desktop-${scan.id}`} className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <CardTitle className="text-xl">{scan.domainName}</CardTitle>
            <Badge
              variant="outline"
              className="w-fit bg-muted/60 font-mono text-xs uppercase tracking-wide"
            >
              {scan.target_url}
            </Badge>
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
            <span>
              Started {new Date(scan.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </span>
            {scan.lastRun && <span>Last run {new Date(scan.lastRun).toLocaleString()}</span>}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link to={`/app/scans/${scan.id}`}>Scan results</Link>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link
                to={`/app/scans/new?domain=${encodeURIComponent(scan.domain_id)}&domainName=${encodeURIComponent(scan.domainName)}`}
              >
                Run again
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );

    const renderMobileAccordionItem = (scan: ScanSummary) => (
      <AccordionItem key={scan.id} value={scan.id} className="border-b last:border-none">
        <AccordionTrigger className="px-4 text-left">
          <div className="flex w-full items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-foreground">{scan.domainName}</span>
              <span className="text-xs font-mono text-muted-foreground">{scan.target_url}</span>
            </div>
            <StatusBadge status={scan.target_status} />
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4">
          <div className="space-y-4 pb-2 text-sm">
            <div className="space-y-1 text-muted-foreground">
              <p>
                Started {new Date(scan.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </p>
              {scan.lastRun ? <p>Last run {new Date(scan.lastRun).toLocaleString()}</p> : null}
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/app/scans/${scan.id}`}>Scan results</Link>
              </Button>
              <Button className="w-full" asChild>
                <Link
                  to={`/app/scans/new?domain=${encodeURIComponent(scan.domain_id)}&domainName=${encodeURIComponent(scan.domainName)}`}
                >
                  Run again
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="justify-start text-destructive hover:text-destructive"
                onClick={() => setScanToRemove(scan)}
                disabled={isRemovingScan && scanToRemove?.id === scan.id}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete scan
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    );

    scanListContent = (
      <>
        <div className="md:hidden">
          <Accordion type="single" collapsible className="divide-y rounded-xl border bg-card/70">
            {filteredScans.map((scan) => renderMobileAccordionItem(scan))}
          </Accordion>
        </div>
        <div className="hidden space-y-4 md:block">
          {filteredScans.map((scan) => renderDesktopCard(scan))}
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border/70 bg-card/80 shadow-sm">
        <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2 text-left">
              <h1 className="text-3xl font-bold tracking-tight">Scans</h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Review recent scan activity and launch new assessments.
              </p>
            </div>
            <div className="grid w-full gap-2 sm:max-w-md md:w-auto md:grid-cols-2">
              <Button asChild variant="outline" className="w-full">
                <Link to="/app/scans/new">
                  <Activity className="mr-2 h-4 w-4" />
                  New Active Scan
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link to="/scan">
                  <Shield className="mr-2 h-4 w-4" />
                  Quick Passive Scan
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by domain, URL, or summary"
                className="pl-9"
                aria-label="Search scans"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="w-full sm:w-auto">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFiltersApplied && (
                <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {totalAvailableScans > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {totalScans.toLocaleString()} of {totalAvailableScans.toLocaleString()} scans
          {statusFilter !== "all" ? ` • ${STATUS_LABELS[statusFilter as TaskStatus]} only` : ""}
          {searchTerm.trim() ? " • Search applied" : ""}
        </p>
      )}


      {loadError && (
        <Alert variant="destructive">
          <AlertTitle>Unable to load scans</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="-mx-4 sm:hidden">
          <ScrollArea className="w-full" type="auto">
            <div className="flex gap-3 px-4 pb-3">
              {renderSummaryCards("min-w-[220px]")}
            </div>
            <ScrollBar orientation="horizontal" className="h-1.5" />
          </ScrollArea>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {renderSummaryCards()}
        </div>
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
                ? `Deleting this scan removes the stored results for this URL. Other scans for ${scanToRemove.domainName} stay available.`
                : "Deleting this scan removes the stored results for this URL only."}
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
