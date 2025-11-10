import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Header } from "@/components/layout/Header";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { runPassiveScan, type PassiveScanResponse } from "@/api/scans";
import { toast } from "@/components/ui/sonner";
import { FindingCard } from "@/components/scans/FindingCard";
import type { ScanResult } from "@/types";
import { Progress } from "@/components/ui/progress";

const passiveSchema = z.object({
  target_url: z.string().url("Enter a valid URL"),
});

type PassiveFormValues = z.infer<typeof passiveSchema>;

const PassiveScan = () => {
  const [searchParams] = useSearchParams();
  const form = useForm<PassiveFormValues>({
    resolver: zodResolver(passiveSchema),
    defaultValues: {
      target_url: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanResult, setScanResult] = useState<PassiveScanResponse | null>(null);
  const [progress, setProgress] = useState(0);
  const [hasSession, setHasSession] = useState(false);
  const redirectProgress = Math.min((progress / 60) * 100, 100);
  const headerProgress =
    progress <= 60 ? 0 : Math.min(((progress - 60) / 40) * 100, 100);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setHasSession(Boolean(localStorage.getItem("hyow_session")));
  }, []);

  useEffect(() => {
    if (!isSubmitting) {
      return;
    }
    setProgress(5);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          return prev;
        }
        const next = prev + 5;
        return next > 90 ? 90 : next;
      });
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [isSubmitting]);

  const onSubmit = async (values: PassiveFormValues) => {
    setIsSubmitting(true);
    setScanResult(null);
    setProgress(5);
    try {
      const response = await runPassiveScan(values);
      setProgress(100);
      setScanResult(response);
      toast.success("Passive scan completed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to run passive scan.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const origin = searchParams.get("origin");
  const closeDestination =
    origin === "landing" || !hasSession ? "/" : "/app/dashboard";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-4xl px-4 py-16 space-y-12">
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Quick passive scan</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Run a lightweight check without creating an account. We&apos;ll look for unsafe redirects and missing
            security headers on the URL you provide.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Passive scan configuration</CardTitle>
            <CardDescription>Provide a public URL. We automatically run redirect and security header checks.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="target_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/login" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormDescription>
                        Accepts HTTPS URLs only. Enter the full address, for example{" "}
                        <span className="font-mono">https://example.com/login</span>.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground space-y-2">
                  <h3 className="font-medium text-foreground text-base">Checks included</h3>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Open redirect — detect unsafe redirects that could send users elsewhere.</li>
                    <li>Security headers — check for missing HTTP response headers.</li>
                  </ul>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Passive scans stay read-only, so they&apos;re safe to run on sites you don&apos;t own. Active scans
                    send intrusive payloads—you&apos;ll need an account and verified ownership before running one.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button type="submit" className="w-full sm:flex-[3]" disabled={isSubmitting}>
                    {isSubmitting ? "Running scan…" : scanResult ? "Run another passive scan" : "Run passive scan"}
                  </Button>
                  <Button asChild variant="outline" className="w-full sm:flex-[1]" disabled={isSubmitting}>
                    <Link to={closeDestination}>Close</Link>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {scanResult ? (
          <section className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Scan results</h2>
                <p className="text-sm text-muted-foreground">{scanResult.summary}</p>
              </div>
            </div>

            {scanResult.results.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No issues detected by the passive checks.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {scanResult.results.map((finding: ScanResult) => (
                  <FindingCard key={finding.id} finding={finding} />
                ))}
              </div>
            )}
          </section>
        ) : null}

        {isSubmitting ? (
          <Card className="border border-primary/20 bg-card/80 shadow-lg shadow-primary/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <CardTitle className="text-xl">Scanning in progress…</CardTitle>
                  <CardDescription>
                    Checking for unsafe redirects and missing security headers. ({progress}% complete)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progress} className="h-2" />
              <div className="rounded-lg border bg-background/60 p-3 text-xs text-muted-foreground space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Step 1 · Redirect safety</span>
                  <span>{progress >= 60 ? "Completed" : progress >= 30 ? "Running…" : "Queued"}</span>
                </div>
                <Progress value={redirectProgress} className="h-1.5" />
                <p>Validating that redirects can&apos;t be abused to send users elsewhere.</p>
              </div>
              <div className="rounded-lg border bg-background/60 p-3 text-xs text-muted-foreground space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Step 2 · Security headers</span>
                  <span>{progress >= 100 ? "Completed" : progress >= 60 ? "Running…" : "Queued"}</span>
                </div>
                <Progress value={headerProgress} className="h-1.5" />
                <p>Reviewing HTTP response headers for missing protections.</p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
};

export default PassiveScan;
