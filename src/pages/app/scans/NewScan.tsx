import { useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { Activity, AlertTriangle, Shield } from "lucide-react";
import { getScanDefaults } from "@/api/scans.defaults";
import { listDomains, type DomainSummary } from "@/api/domains";
import { createScan } from "@/api/scans";
import { ApiError } from "@/api/client";
import type { ScanDefaults } from "@/types/settings";

const scanSchema = z
  .object({
    domain_id: z.string().min(1, "Select a domain"),
    target_url: z.string().url("Enter a valid URL"),
    autoOpenReport: z.boolean(),
    authorization: z.boolean().refine((val) => val === true, {
      message: "You must confirm authorization to scan this target",
    }),
  });

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
    autoOpenReport: defaults.autoOpenReport,
  };
};

const NewScan = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDomain = searchParams.get("domain");
  const preselectedDomainName = searchParams.get("domainName");

  const defaultsQuery = useQuery({
    queryKey: ["settings", "scans"],
    queryFn: getScanDefaults,
  });

  const domainsQuery = useQuery({
    queryKey: ["domains"],
    queryFn: listDomains,
  });

  const domainOptions = useMemo(() => {
    const source: Pick<DomainSummary, "id" | "domain_name" | "isVerified">[] =
      domainsQuery.data && domainsQuery.data.length
        ? domainsQuery.data
        : DOMAIN_OPTIONS;

    const verified = source.filter((domain) => domain.isVerified);
    const options = verified.map((domain) => ({
      id: domain.id,
      domain_name: domain.domain_name,
    }));

    if (
      preselectedDomain &&
      preselectedDomainName &&
      !options.some((option) => option.id === preselectedDomain)
    ) {
      options.unshift({ id: preselectedDomain, domain_name: preselectedDomainName });
    }

    return options;
  }, [domainsQuery.data, preselectedDomain, preselectedDomainName]);

const form = useForm<ScanForm>({
  resolver: zodResolver(scanSchema),
  defaultValues: {
    domain_id: preselectedDomain || "",
    target_url: "",
    autoOpenReport: true,
    authorization: false,
  },
});

  useEffect(() => {
    if (defaultsQuery.data) {
      const currentValues = form.getValues();
      form.reset(mapDefaultsToForm(defaultsQuery.data, currentValues));
    }
  }, [defaultsQuery.data, form]);

  useEffect(() => {
    if (!preselectedDomain && domainOptions.length > 0 && !form.getValues("domain_id")) {
      form.setValue("domain_id", domainOptions[0].id, { shouldDirty: false });
    }
  }, [preselectedDomain, domainOptions, form]);

  const queryClient = useQueryClient();

  const createScanMutation = useMutation({
    mutationFn: createScan,
    onSuccess: (scan) => {
      void queryClient.invalidateQueries({ queryKey: ["scans"] });
      toast.success("Scan initiated successfully");
      navigate(`/app/scans/${scan.id}`);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError && error.data && typeof error.data === "object" && "message" in error.data
          ? (error.data as { message?: string }).message ?? error.message
          : error instanceof Error
            ? error.message
            : "Failed to start scan. Please try again.";
      toast.error(message);
    },
  });

  const onSubmit = (data: ScanForm) => {
    createScanMutation.mutate({
      domain_id: data.domain_id,
      target_url: data.target_url,
      scope: {
        sqli: true,
        xss: true,
        openRedirect: true,
        headers: true,
      },
      autoOpenReport: data.autoOpenReport,
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">New Active Scan</h1>
        <p className="text-muted-foreground">
          Configure an authenticated scan of your verified domain.
        </p>
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
          <CardDescription>Target selection and scan preferences.</CardDescription>
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
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={domainsQuery.isLoading || domainOptions.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              domainsQuery.isLoading
                                ? "Loading domains…"
                                : domainOptions.length
                                  ? "Select a verified domain"
                                  : "No verified domains available"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {domainOptions.map((domain) => (
                          <SelectItem key={domain.id} value={domain.id}>
                            {domain.domain_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {domainsQuery.isLoading ? (
                        "Fetching available domains…"
                      ) : domainOptions.length ? (
                        "Choose a domain that you've verified ownership of."
                      ) : (
                        <>
                          Add and verify a domain before starting a scan. Manage domains from the{" "}
                          <Link to="/app/domains" className="text-primary underline-offset-2 hover:underline">
                            Domains page
                          </Link>
                          .
                        </>
                      )}
                    </FormDescription>
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

              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                <FormLabel className="text-base">Security checks</FormLabel>
                <p className="mt-2">
                  Active scans always include the full suite of assessments:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>SQL injection detection</li>
                  <li>Cross-site scripting</li>
                  <li>Open redirect safety</li>
                  <li>HTTP security header review</li>
                </ul>
              </div>

              <FormField
                control={form.control}
                name="autoOpenReport"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">Auto-open report when scans finish</FormLabel>
                      <FormDescription className="text-xs">
                        Jump straight into findings after completion.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
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
                <Button type="submit" disabled={createScanMutation.isPending} className="flex-1">
                  {createScanMutation.isPending ? (
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
