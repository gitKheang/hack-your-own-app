import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Globe, Activity, Plus, TrendingUp, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/domain/StatusBadge";

const Dashboard = () => {
  // Mock data - will be replaced with real API calls
  const stats = {
    totalDomains: 3,
    verifiedDomains: 2,
    totalScans: 12,
    recentScans: 5,
  };

  const recentScans = [
    {
      id: "scan_1",
      domain: "example.com",
      target_url: "https://example.com/login",
      status: "COMPLETED" as const,
      created_at: new Date().toISOString(),
      findings: 3,
    },
    {
      id: "scan_2",
      domain: "test.dev",
      target_url: "https://test.dev/api",
      status: "RUNNING" as const,
      created_at: new Date().toISOString(),
      findings: 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your security scanning activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/app/domains?modal=add">
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/scans/new">
              <Activity className="h-4 w-4 mr-2" />
              New Scan
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Domains</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDomains}</div>
            <p className="text-xs text-muted-foreground">
              <CheckCircle2 className="inline h-3 w-3 mr-1" />
              {stats.verifiedDomains} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScans}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {stats.recentScans} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scan Coverage</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <p className="text-xs text-muted-foreground">
              Domains with recent scans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-destructive">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Scans</CardTitle>
              <CardDescription>Your latest security scans</CardDescription>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/app/scans">View all</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentScans.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{scan.domain}</p>
                    <StatusBadge status={scan.status} />
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    {scan.target_url}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(scan.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {scan.findings > 0 && (
                    <Badge variant="outline">{scan.findings} findings</Badge>
                  )}
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/app/scans/${scan.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link to="/app/domains?modal=add">
                <Globe className="h-6 w-6" />
                <span>Add New Domain</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link to="/app/scans/new">
                <Activity className="h-6 w-6" />
                <span>Run Security Scan</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link to="/app/scans">
                <Shield className="h-6 w-6" />
                <span>View All Scans</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
