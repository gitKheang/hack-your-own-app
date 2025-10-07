import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/domain/StatusBadge";
import { Activity, BarChart3, CheckCircle2, Clock, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import type { ScanTask } from "@/types";

type ScanSummary = ScanTask & {
  domainName: string;
  lastRun?: string;
};

const mockScans: ScanSummary[] = [
  {
    id: "scan_1",
    user_id: "usr_123",
    domain_id: "dom_1",
    domainName: "example.com",
    target_url: "https://example.com",
    target_status: "COMPLETED",
    summary: "Full surface scan with no critical issues detected.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    completed_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    lastRun: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "scan_2",
    user_id: "usr_123",
    domain_id: "dom_2",
    domainName: "staging.myapp.io",
    target_url: "https://staging.myapp.io",
    target_status: "RUNNING",
    summary: "OWASP Top 10 scan in progress.",
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "scan_3",
    user_id: "usr_123",
    domain_id: "dom_3",
    domainName: "test.dev",
    target_url: "https://test.dev/login",
    target_status: "FAILED",
    summary: "Scan aborted after repeated timeouts. Needs review.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const ScansList = () => {
  const totalScans = mockScans.length;
  const runningScans = mockScans.filter((scan) => scan.target_status === "RUNNING").length;
  const completedScans = mockScans.filter((scan) => scan.target_status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scans</h1>
          <p className="mt-1 text-muted-foreground">
            Review recent scan activity and launch new assessments.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/scans/new">
            <Plus className="mr-2 h-4 w-4" />
            Start new scan
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScans}</div>
            <p className="text-xs text-muted-foreground">Across all domains</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningScans}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedScans}</div>
            <p className="text-xs text-muted-foreground">Ready for review</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {mockScans.length === 0 ? (
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
        ) : (
          mockScans.map((scan) => (
            <Card key={scan.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-xl">{scan.domainName}</CardTitle>
                  <CardDescription>{scan.target_url}</CardDescription>
                </div>
                <StatusBadge status={scan.target_status} />
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
                    <Link to={`/app/scans/new?domain=${scan.domain_id}`}>Run again</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ScansList;
