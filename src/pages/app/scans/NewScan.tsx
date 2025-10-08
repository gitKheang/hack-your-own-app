import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Activity, AlertTriangle, Shield, Sparkles, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { getScanDefaults } from "@/api/scans.defaults";
import type { ScanDefaults } from "@/types/settings";

const scanSchema = z
  .object({
    domain_id: z.string().min(1, "Select a domain"),
    target_url: z.string().url("Enter a valid URL"),
    checks: z
      .object({
        sqli: z.boolean().default(true),
        xss: z.boolean().default(true),
        openRedirect: z.boolean().default(true),
        headers: z.boolean().default(true),
      })
      .superRefine((data, ctx) => {
        if (!Object.values(data).some(Boolean)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select at least one security check" });
        }
      }),
    timeout: z.number().min(10).max(120),
    evidence: z.enum(["minimal", "normal", "verbose"]),
    autoOpenReport: z.boolean(),
    ai: z.boolean(),
    authorization: z.boolean().refine((val) => val === true, {
      message: "You must confirm authorization to scan this target",
    }),
  })
  .transform((value) => ({
    ...value,
    timeout: Math.round(value.timeout),
  }));

type ScanForm = z.infer<typeof scanSchema>;

const DOMAIN_OPTIONS = [
  { id: "dom_1", domain_name: "example.com", isVerified: true },
  { id: "dom_2", domain_name: "test.dev", isVerified: true },
];

const mapDefaultsToForm = (defaults: ScanDefaults | undefined, current: ScanForm): ScanForm => {
  if (!defaults) {
    return current;
  }

  return {
    ...current,
    checks: {
      sqli: defaults.scope.sqli,
      xss: defaults.scope.xss,
      openRedirect: defaults.scope.openRedirect,
      headers: defaults.scope.headers,
    },
    timeout: defaults.timeout,
    evidence: defaults.evidence,
    autoOpenReport: defaults.autoOpenReport,
    ai: defaults.ai,
  };
};

const NewScan = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDomain = searchParams.get("domain");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultsQuery = useQuery({
    queryKey: ["settings", "scans"],
    queryFn: getScanDefaults,
  });

  const form = useForm<ScanForm>({
    resolver: zodResolver(scanSchema),
    defaultValues: {
      domain_id: preselectedDomain || "",
      target_url: "",
      checks: {
        sqli: true,
        xss: true,
        openRedirect: true,
        headers: true,
      },
      timeout: 60,
      evidence: "normal",
      autoOpenReport: true,
      ai: true,
      authorization: false,
    },
  });

  useEffect(() => {
    if (defaultsQuery.data) {
      const currentValues = form.getValues();
      form.reset(mapDefaultsToForm(defaultsQuery.data, currentValues));
    }
  }, [defaultsQuery.data, form]);

  const onSubmit = async (data: ScanForm) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      const taskId = `task_${Math.random().toString(36).slice(2, 9)}`;
      toast.success("Scan initiated successfully");
      navigate(`/app/scans/${taskId}`);
    } catch (error) {
      toast.error("Failed to start scan. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Security Scan</h1>
        <p className="mt-1 text-muted-foreground">Configure and run a vulnerability scan on your verified domain.</p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Only scan websites you own or have explicit permission to test. Unauthorized scanning may be illegal.
        </AlertDescription>
      </Alert>

      {defaultsQuery.isError ? (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            Unable to load scan defaults. We&apos;ll fall back to safe presets.
            <Button size="sm" variant="outline" onClick={() => defaultsQuery.refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Scan configuration</CardTitle>
          <CardDescription>Target selection, coverage, and runtime preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="domain_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a verified domain" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DOMAIN_OPTIONS.map((domain) => (
                          <SelectItem key={domain.id} value={domain.id}>
                            {domain.domain_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Choose a domain that you&apos;ve verified ownership of.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/login" {...field} />
                    </FormControl>
                    <FormDescription>The specific URL or path to scan within your domain.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Security checks</FormLabel>
                  {defaultsQuery.isLoading ? <Skeleton className="h-4 w-16" /> : <Badge variant="secondary">Prefilled from settings</Badge>}
                </div>
                <div className="space-y-3 rounded-lg border p-4">
                  {(
                    [
                      { key: "sqli", title: "SQL injection", description: "Test parameters and forms for SQL injection" },
                      { key: "xss", title: "Cross-site scripting", description: "Identify reflected XSS vulnerabilities" },
                      { key: "openRedirect", title: "Open redirect", description: "Detect open redirect weaknesses" },
                      { key: "headers", title: "Security headers", description: "Check for missing or risky headers" },
                    ] as const
                  ).map((item) => (
                    <FormField
                      key={item.key}
                      control={form.control}
                      name={`checks.${item.key}` as const}
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-0.5">
                            <FormLabel className="font-medium capitalize">{item.title}</FormLabel>
                            <FormDescription className="text-xs">{item.description}</FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <FormLabel className="mb-0">Timeout per check</FormLabel>
                  </div>
                  <FormField
                    control={form.control}
                    name="timeout"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-3">
                            <Slider
                              min={10}
                              max={120}
                              step={5}
                              value={[field.value]}
                              onValueChange={([value]) => field.onChange(value)}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>10s</span>
                              <span className="font-medium text-foreground">{field.value}s</span>
                              <span>120s</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>Extend for slower or high-latency targets.</FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <FormLabel className="mb-0">AI assistants</FormLabel>
                  </div>
                  <FormField
                    control={form.control}
                    name="ai"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border bg-muted/60 p-3">
                        <div>
                          <FormLabel className="text-sm">Enable AI remediation suggestions</FormLabel>
                          <FormDescription className="text-xs">Adds guided fixes after each finding.</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="autoOpenReport"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border bg-muted/60 p-3">
                        <div>
                          <FormLabel className="text-sm">Auto-open report when scans finish</FormLabel>
                          <FormDescription className="text-xs">Jump straight into findings after completion.</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="evidence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evidence verbosity</FormLabel>
                    <FormDescription>Control the level of detail captured for each finding.</FormDescription>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="grid gap-3 md:grid-cols-3">
                        {(
                          [
                            { value: "minimal", title: "Minimal", description: "Essential repro steps only." },
                            { value: "normal", title: "Normal", description: "Balanced detail for engineers." },
                            { value: "verbose", title: "Verbose", description: "Full request and response payloads." },
                          ] as const
                        ).map((option) => (
                          <Label
                            key={option.value}
                            className={cn(
                              "relative flex h-full cursor-pointer flex-col rounded-lg border border-muted p-4 text-left text-sm transition-colors",
                              "hover:border-primary/50 hover:bg-primary/5",
                              "focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-2 focus-within:ring-offset-background",
                              "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5",
                            )}
                          >
                            <RadioGroupItem value={option.value} className="peer sr-only" />
                            <span className="text-base font-semibold text-foreground">{option.title}</span>
                            <span className="mt-2 text-xs text-muted-foreground">{option.description}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border border-dashed p-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Safety mode</FormLabel>
                  <Badge variant="secondary">Non-destructive</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  We only perform read-only, idempotent checks during the MVP. Full attack simulation arrives later.
                </p>
              </div>

              <FormField
                control={form.control}
                name="authorization"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0 rounded-lg border bg-primary/5 p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div>
                      <FormLabel className="text-base font-medium">I have authorization to test this target</FormLabel>
                      <FormDescription>
                        By checking this box, you confirm that you own this website or have explicit written permission to perform security testing.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Activity className="mr-2 h-4 w-4 animate-spin" />
                      Starting scan...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" /> Start scan
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/app/scans")}>Cancel</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewScan;
