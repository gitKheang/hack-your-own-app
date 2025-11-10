import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Globe, Plus, Shield, TrendingUp, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/domain/StatusBadge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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

  const statItems: Array<{
    key: string;
    title: string;
    icon: LucideIcon;
    iconClass?: string;
    value: string;
    subtext: ReactNode;
  }> = [
    {
      key: "total-domains",
      title: "Total Domains",
      icon: Globe,
      value: stats.totalDomains.toString(),
      subtext: (
        <p className="text-xs text-muted-foreground">
          <CheckCircle2 className="mr-1 inline h-3 w-3" />
          {stats.verifiedDomains} verified
        </p>
      ),
    },
    {
      key: "total-scans",
      title: "Total Scans",
      icon: Activity,
      value: stats.totalScans.toString(),
      subtext: (
        <p className="text-xs text-muted-foreground">
          <TrendingUp className="mr-1 inline h-3 w-3" />
          {stats.recentScans} this week
        </p>
      ),
    },
    {
      key: "coverage",
      title: "Scan Coverage",
      icon: Shield,
      value: "67%",
      subtext: <p className="text-xs text-muted-foreground">Domains with recent scans</p>,
    },
    {
      key: "critical",
      title: "Critical Issues",
      icon: Shield,
      iconClass: "text-destructive",
      value: "2",
      subtext: <p className="text-xs text-destructive">Require immediate attention</p>,
    },
  ];

  const quickActions: Array<{ key: string; icon: LucideIcon; label: string; to: string }> = [
    { key: "add-domain", icon: Globe, label: "Add New Domain", to: "/app/domains?modal=add" },
    { key: "run-scan", icon: Activity, label: "Run Security Scan", to: "/app/scans/new" },
    { key: "view-scans", icon: Shield, label: "View All Scans", to: "/app/scans" },
  ];

  const renderStatCards = (cardClassName?: string) =>
    statItems.map((item) => {
      const Icon = item.icon;
      return (
        <Card key={item.key} className={cn("w-full shrink-0 snap-center", cardClassName)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <Icon className={cn("h-4 w-4 text-muted-foreground", item.iconClass)} />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">{item.value}</div>
            {item.subtext}
          </CardContent>
        </Card>
      );
    });

  const renderQuickActionButtons = (buttonClassName?: string) =>
    quickActions.map((action) => {
      const Icon = action.icon;
      return (
        <Button
          key={action.key}
          variant="outline"
          asChild
          className={cn(
            "h-auto flex flex-col items-center justify-center gap-2 py-4 text-center",
            "shrink-0 snap-center",
            buttonClassName,
          )}
        >
          <Link to={action.to}>
            <div className="flex flex-col items-center gap-2">
              <Icon className="h-6 w-6" />
              <span>{action.label}</span>
            </div>
          </Link>
        </Button>
      );
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your security scanning activity
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button asChild className="w-full sm:w-auto">
            <Link to="/app/domains?modal=add">
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/app/scans/new">
              <Activity className="h-4 w-4 mr-2" />
              New Active Scan
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/scan">
              <Shield className="h-4 w-4 mr-2" />
              Quick Passive Scan
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-4">
        <div className="relative -mx-4 md:hidden">
          <ScrollArea className="w-full" type="auto">
            <div className="flex snap-x snap-mandatory gap-4 px-4 pb-3">
              {renderStatCards("min-w-[220px]")}
            </div>
            <ScrollBar orientation="horizontal" className="h-1.5" />
          </ScrollArea>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background via-background/80 to-transparent" />
        </div>
        <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
          {renderStatCards()}
        </div>
      </div>

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Recent Scans</CardTitle>
              <CardDescription>Your latest security scans</CardDescription>
            </div>
            <Button variant="ghost" asChild className="w-full sm:w-auto md:w-auto">
              <Link to="/app/scans">View all</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentScans.map((scan) => (
              <div
                key={scan.id}
                className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center md:gap-4">
                  {scan.findings > 0 && (
                    <Badge variant="outline">{scan.findings} findings</Badge>
                  )}
                  <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
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
          <div className="space-y-4 sm:space-y-0">
            <div className="relative -mx-4 sm:hidden">
              <ScrollArea className="w-full" type="auto">
                <div className="flex snap-x snap-mandatory gap-3 px-4 pb-3">
                  {renderQuickActionButtons("min-w-[210px]")}
                </div>
                <ScrollBar orientation="horizontal" className="h-1.5" />
              </ScrollArea>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background via-background/80 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background via-background/80 to-transparent" />
            </div>
            <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
              {renderQuickActionButtons()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
