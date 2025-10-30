import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/domain/StatusBadge";
import { FindingCard } from "@/components/scans/FindingCard";
import { getScanDetail, type ScanDetailResponse } from "@/api/scans";
import { Loader2, ArrowLeft, Download, Clock, Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";

const RUNNING_STATUSES = new Set(["RUNNING", "PENDING"]);

const ScanDetail = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [progress, setProgress] = useState(0);

  const detailQuery = useQuery({
    queryKey: ["scans", taskId],
    queryFn: () => {
      if (!taskId) {
        throw new Error("Missing scan identifier");
      }
      return getScanDetail(taskId);
    },
    enabled: Boolean(taskId),
    refetchInterval: (query) => {
      const status = query.state.data?.scan.target_status;
      return status && RUNNING_STATUSES.has(status) ? 1500 : false;
    },
  });

  const data: ScanDetailResponse | undefined = detailQuery.data;
  const scan = data?.scan;
  const results = data?.results ?? [];
  const aiSummary = data?.aiSummary ?? null;

  const isRunning = scan ? RUNNING_STATUSES.has(scan.target_status) : false;
  const isCompleted = scan?.target_status === "COMPLETED";
  const isFailed = scan?.target_status === "FAILED";

  useEffect(() => {
    if (!scan) {
      setProgress(0);
      return;
    }

    if (isCompleted) {
      setProgress(100);
      return;
    }

    if (isRunning) {
      setProgress(typeof scan.progress === "number" ? scan.progress : 25);
      return;
    }

    setProgress(typeof scan.progress === "number" ? scan.progress : 0);
  }, [scan, isRunning, isCompleted]);

  const severityCounts = useMemo(() => {
    return results.reduce(
      (acc, result) => {
        acc[result.severity] = (acc[result.severity] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [results]);

  if (!taskId) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Missing scan</AlertTitle>
          <AlertDescription>We couldn&apos;t determine which scan to show. Return to the scans list.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (detailQuery.isLoading || !scan) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (detailQuery.isError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/app/scans">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Unable to load scan</AlertTitle>
          <AlertDescription className="flex items-center gap-3">
            Something went wrong while fetching this scan.
            <Button onClick={() => detailQuery.refetch()} variant="outline" size="sm">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const criticalCount = severityCounts["critical"] ?? 0;
  const highCount = severityCounts["high"] ?? 0;
  const mediumCount = severityCounts["medium"] ?? 0;
  const lowCount = severityCounts["low"] ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild aria-label="Back to scans">
          <Link to="/app/scans">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Scan results</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">{scan.target_url}</p>
        </div>
        {isCompleted && (
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        )}
      </div>

      {!isCompleted && !isRunning && !isFailed && (
        <Alert>
          <AlertDescription>This scan has not started yet. We&apos;ll refresh automatically once it begins.</AlertDescription>
        </Alert>
      )}

      {isFailed && (
        <Alert variant="destructive">
          <AlertTitle>Scan failed</AlertTitle>
          <AlertDescription>
            The scan did not complete successfully. Re-run the scan or check the target configuration.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle>Scan Status</CardTitle>
                <StatusBadge status={scan.target_status} />
              </div>
              <CardDescription>
                Started {new Date(scan.created_at).toLocaleString()}
                {scan.completed_at ? ` • Completed ${new Date(scan.completed_at).toLocaleString()}` : ""}
              </CardDescription>
            </div>
            {scan.summary && <Badge variant="outline">{scan.summary}</Badge>}
          </div>
        </CardHeader>
        {isRunning ? (
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Scanning in progress…</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Running security checks. This page will update automatically.</span>
              </div>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-[hsl(var(--severity-critical))]">{criticalCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">High</p>
                <p className="text-2xl font-bold text-[hsl(var(--severity-high))]">{highCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Medium</p>
                <p className="text-2xl font-bold text-[hsl(var(--severity-medium))]">{mediumCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Low</p>
                <p className="text-2xl font-bold text-[hsl(var(--severity-low))]">{lowCount}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {isCompleted && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <Lightbulb className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="findings">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Findings ({results.length})
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Clock className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            {aiSummary && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <CardTitle>AI Executive Summary</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{aiSummary}</p>
                </CardContent>
              </Card>
            )}
            {results.length === 0 ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Great news! No critical or high-severity vulnerabilities were found in this scan.
                </AlertDescription>
              </Alert>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Top Risks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results
                      .filter((result) => result.severity === "critical" || result.severity === "high")
                      .slice(0, 3)
                      .map((result) => (
                        <div key={result.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-medium">{result.summary}</p>
                            <p className="text-xs text-muted-foreground">{result.scan_type}</p>
                          </div>
                          <Badge variant={result.severity}>{result.severity}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="findings" className="space-y-4">
            {results.map((result) => (
              <FindingCard key={result.id} finding={result} />
            ))}
          </TabsContent>
          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scan Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <div className="w-px flex-1 bg-border" />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium">Scan initiated</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(scan.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {results.map((result, idx) => (
                    <div key={result.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        {idx < results.length - 1 && <div className="w-px flex-1 bg-border" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium">{result.scan_type} check completed</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.scanned_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {scan.completed_at && (
                    <div className="flex gap-4">
                      <div className="h-2 w-2 rounded-full bg-green-600" />
                      <div className="flex-1">
                        <p className="font-medium">Scan completed</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(scan.completed_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {isRunning && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Your scan is in progress. Feel free to navigate elsewhere—results will appear here as soon as they are ready.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ScanDetail;
