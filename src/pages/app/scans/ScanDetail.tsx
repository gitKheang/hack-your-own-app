import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/domain/StatusBadge";
import { FindingCard } from "@/components/scans/FindingCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Download,
  Loader2,
  Lightbulb
} from "lucide-react";
import type { ScanTask, ScanResult } from "@/types";

const ScanDetail = () => {
  const { taskId } = useParams();
  const [scan, setScan] = useState<ScanTask | null>(null);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [progress, setProgress] = useState(0);

  // Mock data simulation - in real app, this would poll the API
  useEffect(() => {
    // Simulate scan progress
    const mockScan: ScanTask = {
      id: taskId || "task_1",
      user_id: "user_1",
      domain_id: "dom_1",
      target_url: "https://example.com/login",
      target_status: "RUNNING",
      created_at: new Date().toISOString(),
    };

    setScan(mockScan);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setScan((s) => s ? { ...s, target_status: "COMPLETED", completed_at: new Date().toISOString() } : null);
          
          // Mock results
          setResults([
            {
              id: "r1",
              task_id: taskId || "task_1",
              scan_type: "XSS",
              severity: "high",
              summary: "Reflected XSS vulnerability detected in search parameter",
              evidence: {
                request: "GET /search?q=<script>alert(1)</script>",
                responseSnippet: "<div>Search results for: <script>alert(1)</script></div>",
                affected: ["/search?q="],
              },
              cwe: "CWE-79",
              owasp: "A03:2021",
              references: ["https://owasp.org/www-community/attacks/xss/"],
              ai: {
                impact: "Attackers can execute arbitrary JavaScript in victims' browsers, potentially stealing session tokens or performing actions on behalf of users.",
                recommendation: "Implement HTML encoding for all user-supplied data before rendering. Apply Content Security Policy (CSP) headers to restrict script execution.",
                sampleFix: "res.setHeader('Content-Security-Policy', \"script-src 'self'\");",
              },
              raw_output: { payload: "<script>alert(1)</script>", reflected: true },
              scanned_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            },
            {
              id: "r2",
              task_id: taskId || "task_1",
              scan_type: "Headers",
              severity: "medium",
              summary: "Missing security headers detected",
              evidence: {
                affected: ["Content-Security-Policy", "X-Frame-Options", "Strict-Transport-Security"],
              },
              cwe: "CWE-693",
              owasp: "A05:2021",
              references: ["https://owasp.org/www-project-secure-headers/"],
              ai: {
                impact: "Missing security headers increase the attack surface for various attacks including clickjacking, MITM, and XSS.",
                recommendation: "Implement recommended security headers: Content-Security-Policy, X-Frame-Options, Strict-Transport-Security, X-Content-Type-Options.",
                sampleFix: "res.setHeader('X-Frame-Options', 'DENY');\nres.setHeader('Content-Security-Policy', \"default-src 'self'\");",
              },
              raw_output: { missing: ["CSP", "X-Frame-Options", "HSTS"] },
              scanned_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            },
          ]);

          setAiSummary(
            "This scan identified 2 security issues requiring attention. A high-severity reflected XSS vulnerability was found in the search functionality, allowing potential execution of malicious scripts. Additionally, several important security headers are missing, which could expose the application to various attacks. Immediate remediation is recommended for the XSS issue."
          );
          
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(progressInterval);
  }, [taskId]);

  if (!scan) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isRunning = scan.target_status === "RUNNING" || scan.target_status === "PENDING";
  const isCompleted = scan.target_status === "COMPLETED";
  const isFailed = scan.target_status === "FAILED";

  const criticalCount = results.filter((r) => r.severity === "critical").length;
  const highCount = results.filter((r) => r.severity === "high").length;
  const mediumCount = results.filter((r) => r.severity === "medium").length;
  const lowCount = results.filter((r) => r.severity === "low").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/app/scans">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Scan Details</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            {scan.target_url}
          </p>
        </div>
        {isCompleted && (
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        )}
      </div>

      {/* Status Card */}
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
                {scan.completed_at && ` • Completed ${new Date(scan.completed_at).toLocaleString()}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        {isRunning && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Scanning in progress...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Running security checks</span>
              </div>
            </div>
          </CardContent>
        )}

        {isCompleted && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Results */}
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
            {/* AI Summary */}
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

            {/* Quick Stats */}
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
                      .filter((r) => r.severity === "high" || r.severity === "critical")
                      .slice(0, 3)
                      .map((result) => (
                        <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                      <div className="w-2 h-2 rounded-full bg-primary" />
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
                        <div className="w-2 h-2 rounded-full bg-primary" />
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
                      <div className="w-2 h-2 rounded-full bg-green-600" />
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

      {/* Waiting State */}
      {isRunning && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Your scan is in progress. This page will automatically update with results. 
            You can safely navigate away and return later.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ScanDetail;
