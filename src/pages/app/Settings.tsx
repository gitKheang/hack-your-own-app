import { useEffect, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { RadioGroup } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import {
  getGeneral,
  putGeneral,
} from "@/api/general";
import {
  getSecurity,
  putSecurity,
  listSessions,
  revokeSession,
  revokeAllSessions,
  logout,
} from "@/api/security";
import { resendVerification } from "@/api/me";
import {
  getNotifications,
  putNotifications,
} from "@/api/notifications";
import {
  getAppearance,
  putAppearance,
} from "@/api/appearance";
import {
  getScanDefaults,
  putScanDefaults,
} from "@/api/scans.defaults";
import {
  listTokens,
  createToken,
  revokeToken,
} from "@/api/tokens";
import {
  listWebhooks,
  createWebhook,
  deleteWebhook,
  sendTestWebhook,
} from "@/api/webhooks";
import {
  getPrivacy,
  putPrivacy,
  exportData,
} from "@/api/privacy";
import {
  deleteAccount,
  resetApplicationData,
} from "@/api/danger";
import type { AppearanceSettings, ProfileResponse, WebhookConfig } from "@/types/settings";
import { useTheme } from "next-themes";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ShieldAlert, ShieldCheck, Target, Laptop, Bell, Paintbrush, Link as LinkIcon, Database, AlertTriangle, Trash2, KeyRound, Network } from "lucide-react";
import { useNavigate } from "react-router-dom";

type TabOption = {
  value: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const tabs: TabOption[] = [
  { value: "general", label: "General", icon: Laptop },
  { value: "security", label: "Security & Sessions", icon: ShieldCheck },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "appearance", label: "Appearance", icon: Paintbrush },
  { value: "scans", label: "Scan Defaults", icon: Target },
  { value: "integrations", label: "API & Integrations", icon: LinkIcon },
  { value: "privacy", label: "Data & Privacy", icon: Database },
  { value: "danger", label: "Danger Zone", icon: AlertTriangle },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.value ?? "general");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure how your scanner behaves across teams.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full flex-wrap gap-2 bg-transparent p-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex flex-1 items-center gap-2 whitespace-nowrap rounded-md border bg-card px-3 py-2 text-sm font-medium shadow-sm transition data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="general">
          <GeneralSettingsTab />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySessionsTab />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceTab />
        </TabsContent>

        <TabsContent value="scans">
          <ScanDefaultsTab />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacyTab />
        </TabsContent>

        <TabsContent value="danger">
          <DangerZoneTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const SettingsSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-64" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-2/3" />
    </CardContent>
    <CardFooter className="justify-end">
      <Skeleton className="h-9 w-48" />
    </CardFooter>
  </Card>
);

const generalSchema = z.object({
  landing: z.enum(["dashboard", "domains", "scans"]),
  openInNewTab: z.boolean(),
  confirmations: z.boolean(),
  autosave: z.boolean(),
});

type GeneralFormValues = z.infer<typeof generalSchema>;

const GeneralSettingsTab = () => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["settings", "general"],
    queryFn: getGeneral,
  });

  const form = useForm<GeneralFormValues>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      landing: "dashboard",
      openInNewTab: false,
      confirmations: true,
      autosave: false,
    },
  });

  useEffect(() => {
    if (query.data) {
      form.reset(query.data);
    }
  }, [query.data, form]);

  const mutation = useMutation({
    mutationFn: putGeneral,
    onSuccess: (data) => {
      form.reset(data);
      queryClient.setQueryData(["settings", "general"], data);
      toast.success("General settings saved");
    },
    onError: () => toast.error("Failed to save general settings"),
  });

  const onSubmit = (values: GeneralFormValues) => {
    mutation.mutate(values);
  };

  if (query.isLoading && !query.data) {
    return <SettingsSkeleton />;
  }

  if (query.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load general settings</AlertTitle>
        <AlertDescription className="flex items-center gap-3">
          Something went wrong while fetching your configuration.
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>Baseline behaviours for navigation and safety.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="landing"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default landing page</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dashboard">Dashboard</SelectItem>
                        <SelectItem value="domains">Domains</SelectItem>
                        <SelectItem value="scans">Scans</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>Where to send users after login.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="openInNewTab"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">Open scan results in a new tab</FormLabel>
                      <FormDescription>Keep the dashboard visible while reviewing findings.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmations"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">Show destructive confirmations</FormLabel>
                      <FormDescription>Require confirmation before deleting domains, tokens, or scans.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autosave"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">Auto-save forms</FormLabel>
                      <FormDescription>Persist edits as you go. Disabled for MVP.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <CardFooter className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => query.data && form.reset(query.data)}
                disabled={!form.formState.isDirty || mutation.isPending}
              >
                Reset
              </Button>
              <Button type="submit" disabled={!form.formState.isDirty || mutation.isPending}>
                {mutation.isPending ? "Saving" : "Save"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

const securitySchema = z.object({
  requireOtpOnSensitive: z.boolean(),
  preferredChannel: z.enum(["email"]),
});

type SecurityFormValues = z.infer<typeof securitySchema>;

const SecuritySessionsTab = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const securityQuery = useQuery({
    queryKey: ["settings", "security"],
    queryFn: getSecurity,
  });

  const sessionsQuery = useQuery({
    queryKey: ["me", "sessions"],
    queryFn: listSessions,
  });

  const resendMutation = useMutation({
    mutationFn: resendVerification,
    onSuccess: () => toast.success("Verification email resent"),
    onError: () => toast.error("Failed to resend verification"),
  });

  const form = useForm<SecurityFormValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      requireOtpOnSensitive: true,
      preferredChannel: "email",
    },
  });

  useEffect(() => {
    if (securityQuery.data) {
      form.reset(securityQuery.data);
    }
  }, [securityQuery.data, form]);

  const mutation = useMutation({
    mutationFn: putSecurity,
    onSuccess: (data) => {
      form.reset(data);
      queryClient.setQueryData(["settings", "security"], data);
      toast.success("Security preferences updated");
    },
    onError: () => toast.error("Failed to update security preferences"),
  });

  const revokeMutation = useMutation({
    mutationFn: revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "sessions"] });
      toast.success("Session revoked");
    },
    onError: () => toast.error("Failed to revoke session"),
  });

  const revokeAllMutation = useMutation({
    mutationFn: revokeAllSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "sessions"] });
      toast.success("All sessions revoked");
    },
    onError: () => toast.error("Failed to revoke sessions"),
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      toast.success("Signed out");
      navigate("/auth/login", { replace: true });
    },
    onError: () => toast.error("Failed to sign out"),
  });

  const onSubmit = (values: SecurityFormValues) => {
    mutation.mutate(values);
  };

  const profile = queryClient.getQueryData<ProfileResponse>(["me"]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Two-step verification</CardTitle>
          <CardDescription>Guard sensitive flows with lightweight OTP prompts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile && !profile.email_verified && (
            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Email verification required</AlertTitle>
              <AlertDescription className="flex items-center gap-3">
                Verify {profile.email} to enable sensitive actions.
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resendMutation.mutate()}
                  disabled={resendMutation.isPending}
                >
                  {resendMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {resendMutation.isPending ? "Resending" : "Resend code"}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {securityQuery.isLoading && !securityQuery.data ? (
            <SettingsSkeleton />
          ) : securityQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to load security settings</AlertTitle>
              <AlertDescription className="flex items-center gap-3">
                Please retry in a moment.
                <Button variant="outline" size="sm" onClick={() => securityQuery.refetch()}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="requireOtpOnSensitive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">Require OTP on sensitive actions</FormLabel>
                        <FormDescription>Prompt for OTP when changing email or password.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredChannel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred verification channel</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>We&apos;ll extend to SMS and authenticators later.</FormDescription>
                    </FormItem>
                  )}
                />

                <CardFooter className="flex justify-end gap-3 px-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => securityQuery.data && form.reset(securityQuery.data)}
                    disabled={!form.formState.isDirty || mutation.isPending}
                  >
                    Reset
                  </Button>
                  <Button type="submit" disabled={!form.formState.isDirty || mutation.isPending}>
                    {mutation.isPending ? "Saving" : "Save"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>Monitor who&apos;s logged in and sign out suspicious activity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Sessions update in real time. Revoke unknown devices quickly.
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Log out
              </Button>
              <Button
                variant="outline"
                onClick={() => revokeAllMutation.mutate()}
                disabled={revokeAllMutation.isPending || (sessionsQuery.data?.length ?? 0) === 0}
              >
                {revokeAllMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign out all
              </Button>
            </div>
          </div>

          {sessionsQuery.isLoading && !sessionsQuery.data ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : sessionsQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to load sessions</AlertTitle>
              <AlertDescription className="flex items-center gap-3">
                Please retry.
                <Button variant="outline" size="sm" onClick={() => sessionsQuery.refetch()}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : sessionsQuery.data?.length ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionsQuery.data.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{session.device}</TableCell>
                      <TableCell>{session.ip}</TableCell>
                      <TableCell>{session.location}</TableCell>
                      <TableCell>{formatDistanceToNow(new Date(session.created), { addSuffix: true })}</TableCell>
                      <TableCell>{formatDistanceToNow(new Date(session.lastActive), { addSuffix: true })}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeMutation.mutate(session.id)}
                          disabled={revokeMutation.isPending}
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No active sessions found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const notificationsSchema = z.object({
  email: z.object({
    scanCompleted: z.boolean(),
    onlyHigh: z.boolean(),
    weeklyDigest: z.boolean(),
    domainReminders: z.boolean(),
  }),
  inapp: z.object({
    scanToasts: z.boolean(),
  }),
});

type NotificationsFormValues = z.infer<typeof notificationsSchema>;

const NotificationsTab = () => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["settings", "notifications"],
    queryFn: getNotifications,
  });

  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      email: {
        scanCompleted: true,
        onlyHigh: false,
        weeklyDigest: false,
        domainReminders: true,
      },
      inapp: {
        scanToasts: true,
      },
    },
  });

  useEffect(() => {
    if (query.data) {
      form.reset(query.data);
    }
  }, [query.data, form]);

  const mutation = useMutation({
    mutationFn: putNotifications,
    onSuccess: (data) => {
      form.reset(data);
      queryClient.setQueryData(["settings", "notifications"], data);
      toast.success("Notification preferences saved");
    },
    onError: () => toast.error("Failed to save notification settings"),
  });

  const onSubmit = (values: NotificationsFormValues) => mutation.mutate(values);

  if (query.isLoading && !query.data) {
    return <SettingsSkeleton />;
  }

  if (query.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load notification preferences</AlertTitle>
        <AlertDescription className="flex items-center gap-3">
          Please retry.
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Select when to reach you about scan activity.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Email</h3>
              <FormField
                control={form.control}
                name="email.scanCompleted"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">Scan completed</FormLabel>
                      <FormDescription>Notify me when any scan finishes.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email.onlyHigh"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">High & critical findings only</FormLabel>
                      <FormDescription>Suppress noise from lower-severity alerts.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email.weeklyDigest"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">Weekly digest</FormLabel>
                      <FormDescription>Summary of scan activity every Monday.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email.domainReminders"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">Domain verification reminders</FormLabel>
                      <FormDescription>Pings to verify domains before scheduling scans.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">In-app</h3>
              <FormField
                control={form.control}
                name="inapp.scanToasts"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">Background scan toasts</FormLabel>
                      <FormDescription>Lightweight heads-up when a scan ends.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <CardFooter className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => query.data && form.reset(query.data)}
                disabled={!form.formState.isDirty || mutation.isPending}
              >
                Reset
              </Button>
              <Button type="submit" disabled={!form.formState.isDirty || mutation.isPending}>
                {mutation.isPending ? "Saving" : "Save"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

const appearanceSchema = z.object({
  theme: z.enum(["system", "light", "dark"]),
  density: z.enum(["comfortable", "compact"]),
  colorAssist: z.boolean(),
  monoForCode: z.boolean(),
  locale: z.string(),
});

type AppearanceFormValues = z.infer<typeof appearanceSchema>;

const AppearanceTab = () => {
  const queryClient = useQueryClient();
  const { setTheme } = useTheme();
  const query = useQuery({
    queryKey: ["settings", "appearance"],
    queryFn: getAppearance,
  });

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      theme: "system",
      density: "comfortable",
      colorAssist: false,
      monoForCode: true,
      locale: "en-US",
    },
  });

  const applyAppearance = (values: AppearanceSettings) => {
    setTheme(values.theme);
    document.documentElement.dataset.density = values.density;
    document.documentElement.dataset.colorAssist = values.colorAssist ? "true" : "false";
    document.documentElement.dataset.monoCode = values.monoForCode ? "true" : "false";
    localStorage.setItem("scanner-appearance", JSON.stringify(values));
  };

  useEffect(() => {
    const stored = localStorage.getItem("scanner-appearance");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AppearanceSettings;
        applyAppearance(parsed);
      } catch (error) {
        console.warn("Failed to parse appearance preferences", error);
      }
    }
  }, []);

  useEffect(() => {
    if (query.data) {
      form.reset(query.data);
      applyAppearance(query.data);
    }
  }, [query.data, form]);

  const mutation = useMutation({
    mutationFn: putAppearance,
    onSuccess: (data) => {
      form.reset(data);
      applyAppearance(data);
      queryClient.setQueryData(["settings", "appearance"], data);
      toast.success("Appearance updated");
    },
    onError: () => toast.error("Failed to update appearance"),
  });

  const onSubmit = (values: AppearanceFormValues) => mutation.mutate(values);

  if (query.isLoading && !query.data) {
    return <SettingsSkeleton />;
  }

  if (query.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load appearance settings</AlertTitle>
        <AlertDescription className="flex items-center gap-3">
          Please retry.
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance & Locale</CardTitle>
        <CardDescription>Match the UI to your working style.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>Switch between light and dark, or follow your OS.</FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="density"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Density</FormLabel>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="grid gap-2 sm:grid-cols-2">
                    <FormItem className={cn("cursor-pointer rounded-lg border p-4", field.value === "comfortable" && "border-primary")}
                      onClick={() => field.onChange("comfortable")}
                    >
                      <div className="space-y-1">
                        <FormLabel className="text-base">Comfortable</FormLabel>
                        <FormDescription>
                          Generous spacing that showcases data tables clearly.
                        </FormDescription>
                      </div>
                    </FormItem>
                    <FormItem className={cn("cursor-pointer rounded-lg border p-4", field.value === "compact" && "border-primary")}
                      onClick={() => field.onChange("compact")}
                    >
                      <div className="space-y-1">
                        <FormLabel className="text-base">Compact</FormLabel>
                        <FormDescription>Denser layout for power users with big monitors.</FormDescription>
                      </div>
                    </FormItem>
                  </RadioGroup>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="colorAssist"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">Colorblind-safe palette</FormLabel>
                      <FormDescription>Adjust severity colors for better contrast.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={(checked) => field.onChange(checked)} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monoForCode"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">Monospace code blocks</FormLabel>
                      <FormDescription>Use mono fonts when showing payloads or scripts.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={(checked) => field.onChange(checked)} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="locale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Locale</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>More locales coming soon.</FormDescription>
                </FormItem>
              )}
            />

            <CardFooter className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => query.data && form.reset(query.data)}
                disabled={!form.formState.isDirty || mutation.isPending}
              >
                Reset
              </Button>
              <Button type="submit" disabled={!form.formState.isDirty || mutation.isPending}>
                {mutation.isPending ? "Saving" : "Save"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

const scanDefaultsSchema = z.object({
  scope: z.object({
    sqli: z.boolean(),
    xss: z.boolean(),
    openRedirect: z.boolean(),
    headers: z.boolean(),
  }),
  timeout: z.number().min(10).max(120),
  evidence: z.enum(["minimal", "normal", "verbose"]),
  autoOpenReport: z.boolean(),
  ai: z.boolean(),
});

type ScanDefaultsFormValues = z.infer<typeof scanDefaultsSchema>;

const ScanDefaultsTab = () => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["settings", "scans"],
    queryFn: getScanDefaults,
  });

  const form = useForm<ScanDefaultsFormValues>({
    resolver: zodResolver(scanDefaultsSchema),
    defaultValues: {
      scope: {
        sqli: true,
        xss: true,
        openRedirect: true,
        headers: true,
      },
      timeout: 60,
      evidence: "normal",
      autoOpenReport: true,
      ai: true,
    },
  });

  useEffect(() => {
    if (query.data) {
      form.reset(query.data);
    }
  }, [query.data, form]);

  const mutation = useMutation({
    mutationFn: putScanDefaults,
    onSuccess: (data) => {
      form.reset(data);
      queryClient.setQueryData(["settings", "scans"], data);
      toast.success("Scan defaults saved");
    },
    onError: () => toast.error("Failed to save scan defaults"),
  });

  const onSubmit = (values: ScanDefaultsFormValues) => mutation.mutate(values);

  if (query.isLoading && !query.data) {
    return <SettingsSkeleton />;
  }

  if (query.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load scan defaults</AlertTitle>
        <AlertDescription className="flex items-center gap-3">
          Please retry.
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan defaults</CardTitle>
        <CardDescription>These values prefill every new scan you start.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Scope</h3>
              {(
                [
                  { key: "sqli", label: "SQLi", description: "Database injection coverage" },
                  { key: "xss", label: "XSS", description: "Reflected cross-site scripting" },
                  { key: "openRedirect", label: "Open redirect", description: "Catch redirect shenanigans" },
                  { key: "headers", label: "Security headers", description: "Review headers for best practice" },
                ] as const
              ).map((item) => (
                <FormField
                  key={item.key}
                  control={form.control}
                  name={`scope.${item.key}` as const}
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 rounded-lg border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{item.label}</FormLabel>
                        <FormDescription>{item.description}</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <FormField
              control={form.control}
              name="timeout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timeout per check</FormLabel>
                  <FormDescription>Increase for slower targets. Applies to each vulnerability test.</FormDescription>
                  <FormControl>
                    <div className="space-y-3">
                      <Slider
                        min={10}
                        max={120}
                        step={5}
                        value={[field.value]}
                        onValueChange={([value]) => field.onChange(value)}
                      />
                      <div className="text-sm text-muted-foreground">{field.value} seconds</div>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evidence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evidence verbosity</FormLabel>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="grid gap-3 sm:grid-cols-3">
                    <FormItem
                      className={cn("cursor-pointer rounded-lg border p-4 text-sm", field.value === "minimal" && "border-primary")}
                      onClick={() => field.onChange("minimal")}
                    >
                      <FormLabel className="text-base">Minimal</FormLabel>
                      <FormDescription>Only essential repro steps.</FormDescription>
                    </FormItem>
                    <FormItem
                      className={cn("cursor-pointer rounded-lg border p-4 text-sm", field.value === "normal" && "border-primary")}
                      onClick={() => field.onChange("normal")}
                    >
                      <FormLabel className="text-base">Normal</FormLabel>
                      <FormDescription>Balanced detail for engineers.</FormDescription>
                    </FormItem>
                    <FormItem
                      className={cn("cursor-pointer rounded-lg border p-4 text-sm", field.value === "verbose" && "border-primary")}
                      onClick={() => field.onChange("verbose")}
                    >
                      <FormLabel className="text-base">Verbose</FormLabel>
                      <FormDescription>Full request/response dumps.</FormDescription>
                    </FormItem>
                  </RadioGroup>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="autoOpenReport"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">Auto-open report</FormLabel>
                      <FormDescription>Immediately open the report card when scans finish.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ai"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">AI suggestions</FormLabel>
                      <FormDescription>Include post-scan remediation tips.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <CardFooter className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => query.data && form.reset(query.data)}
                disabled={!form.formState.isDirty || mutation.isPending}
              >
                Reset
              </Button>
              <Button type="submit" disabled={!form.formState.isDirty || mutation.isPending}>
                {mutation.isPending ? "Saving" : "Save"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

const IntegrationsTab = () => {
  return (
    <div className="space-y-6">
      <ApiTokensSection />
      <WebhooksSection />
    </div>
  );
};

const ApiTokensSection = () => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["settings", "tokens"],
    queryFn: listTokens,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatedSecret, setGeneratedSecret] = useState<{ value: string; name: string } | null>(null);

  const form = useForm<{ name: string }>({
    resolver: zodResolver(z.object({ name: z.string().min(2, "Name is required") })),
    defaultValues: { name: "" },
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string }) => createToken(payload.name),
    onSuccess: (data) => {
      setGeneratedSecret({ value: data.secretOnce, name: data.name });
      form.reset({ name: "" });
      queryClient.invalidateQueries({ queryKey: ["settings", "tokens"] });
      toast.success("API token created");
    },
    onError: () => toast.error("Failed to create token"),
  });

  const revokeMutation = useMutation({
    mutationFn: revokeToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "tokens"] });
      toast.success("Token revoked");
    },
    onError: () => toast.error("Failed to revoke token"),
  });

  const handleCreateToken = (values: { name: string }) => {
    createMutation.mutate(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API tokens</CardTitle>
        <CardDescription>Automate orchestration and CI integrations using scoped tokens.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Tokens are secret—revoke and rotate when compromised.</div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              form.reset({ name: "" });
              setGeneratedSecret(null);
              createMutation.reset();
            }
          }}>
            <Button onClick={() => setDialogOpen(true)}>
              <KeyRound className="mr-2 h-4 w-4" />
              New token
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API token</DialogTitle>
                <DialogDescription>Give your token a memorable label.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateToken)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="CI pipeline" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {generatedSecret ? (
                    <Alert>
                      <AlertTitle>Copy your secret</AlertTitle>
                      <AlertDescription className="space-y-2">
                        <p>
                          This secret is shown once. Store it securely for <span className="font-medium">{generatedSecret.name}</span>.
                        </p>
                        <div className="flex items-center justify-between rounded-md border bg-muted/50 p-3 text-xs font-mono">
                          <span className="truncate">{generatedSecret.value}</span>
                          <CopyButton value={generatedSecret.value} copyLabel="Copy" copiedLabel="Copied" />
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <DialogFooter className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Close
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Creating" : "Create token"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {query.isLoading && !query.data ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to load tokens</AlertTitle>
            <AlertDescription className="flex items-center gap-3">
              Please retry.
              <Button variant="outline" size="sm" onClick={() => query.refetch()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : query.data?.length ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell className="font-medium">{token.name}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(token.createdAt), { addSuffix: true })}</TableCell>
                    <TableCell>
                      {token.lastUsedAt ? formatDistanceToNow(new Date(token.lastUsedAt), { addSuffix: true }) : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeMutation.mutate(token.id)}
                        disabled={revokeMutation.isPending}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No tokens yet. Generate one to integrate with your CI pipeline.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const WebhooksSection = () => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["settings", "webhooks"],
    queryFn: listWebhooks,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const form = useForm<{ name: string; endpointUrl: string; events: string }>(
    {
      resolver: zodResolver(
        z.object({
          name: z.string().min(2, "Name is required"),
          endpointUrl: z.string().url("Enter a valid URL"),
          events: z.string().optional(),
        }),
      ),
      defaultValues: { name: "", endpointUrl: "", events: "scan.completed,scan.failed" },
    },
  );

  const createMutation = useMutation({
    mutationFn: createWebhook,
    onSuccess: () => {
      form.reset({ name: "", endpointUrl: "", events: "scan.completed,scan.failed" });
      queryClient.invalidateQueries({ queryKey: ["settings", "webhooks"] });
      toast.success("Webhook created");
    },
    onError: () => toast.error("Failed to create webhook"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "webhooks"] });
      toast.success("Webhook removed");
    },
    onError: () => toast.error("Failed to remove webhook"),
  });

  const testMutation = useMutation({
    mutationFn: sendTestWebhook,
    onSuccess: () => toast.success("Test event dispatched"),
    onError: () => toast.error("Failed to send test event"),
  });

  const onSubmit = (values: { name: string; endpointUrl: string; events: string }) => {
    const events = values.events
      .split(",")
      .map((event) => event.trim())
      .filter(Boolean) as Array<"scan.completed" | "scan.failed">;
    createMutation.mutate({
      name: values.name,
      endpointUrl: values.endpointUrl,
      events: events.length ? events : ["scan.completed"],
    });
    setDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhooks</CardTitle>
        <CardDescription>Forward scan events to Slack, PagerDuty, or any HTTPS endpoint.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Send signed payloads when scans finish or fail.</div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              form.reset({ name: "", endpointUrl: "", events: "scan.completed,scan.failed" });
              createMutation.reset();
            }
          }}>
            <Button onClick={() => setDialogOpen(true)}>
              <Network className="mr-2 h-4 w-4" />
              Add webhook
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add webhook</DialogTitle>
                <DialogDescription>We&apos;ll include event details and signatures.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Ops Pager" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endpointUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endpoint URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://hooks.example.com/scanner" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="events"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Events</FormLabel>
                        <FormControl>
                          <Input placeholder="scan.completed,scan.failed" {...field} />
                        </FormControl>
                        <FormDescription>Comma-separated list. Supported: scan.completed, scan.failed.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Saving" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {query.isLoading && !query.data ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to load webhooks</AlertTitle>
            <AlertDescription className="flex items-center gap-3">
              Please retry.
              <Button variant="outline" size="sm" onClick={() => query.refetch()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : query.data?.length ? (
          <div className="space-y-3">
            {query.data.map((webhook) => (
              <div key={webhook.id} className="rounded-lg border p-4 md:flex md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{webhook.name}</p>
                    <Badge variant="outline">{webhook.events.join(", ")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{webhook.endpointUrl}</p>
                  <p className="text-xs text-muted-foreground">
                    Last triggered: {webhook.lastTriggeredAt ? formatDistanceToNow(new Date(webhook.lastTriggeredAt), { addSuffix: true }) : "Never"}
                  </p>
                </div>
                <div className="mt-3 flex gap-2 md:mt-0">
                  <CopyButton value={webhook.secret} copyLabel="Secret" copiedLabel="Copied" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testMutation.mutate(webhook.id)}
                    disabled={testMutation.isPending}
                  >
                    {testMutation.isPending ? "Testing" : "Send test"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(webhook.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No webhooks configured yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const privacySchema = z.object({
  retentionDays: z.union([z.literal(7), z.literal(30), z.literal(90)]),
  telemetry: z.boolean(),
});

type PrivacyFormValues = z.infer<typeof privacySchema>;

const PrivacyTab = () => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["settings", "privacy"],
    queryFn: getPrivacy,
  });

  const form = useForm<PrivacyFormValues>({
    resolver: zodResolver(privacySchema),
    defaultValues: {
      retentionDays: 30,
      telemetry: false,
    },
  });

  useEffect(() => {
    if (query.data) {
      form.reset(query.data);
    }
  }, [query.data, form]);

  const mutation = useMutation({
    mutationFn: putPrivacy,
    onSuccess: (data) => {
      form.reset(data);
      queryClient.setQueryData(["settings", "privacy"], data);
      toast.success("Privacy preferences saved");
    },
    onError: () => toast.error("Failed to save privacy preferences"),
  });

  const exportMutation = useMutation({
    mutationFn: exportData,
    onSuccess: (data) => {
      const link = document.createElement("a");
      link.href = data.url;
      link.download = `scanner-export-${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Export ready");
    },
    onError: () => toast.error("Failed to export data"),
  });

  const onSubmit = (values: PrivacyFormValues) => mutation.mutate(values);

  if (query.isLoading && !query.data) {
    return <SettingsSkeleton />;
  }

  if (query.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load privacy settings</AlertTitle>
        <AlertDescription className="flex items-center gap-3">
          Please retry.
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data & Privacy</CardTitle>
        <CardDescription>Manage retention policy, telemetry, and exports.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="retentionDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data retention</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value) as 7 | 30 | 90)}
                      value={String(field.value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Keep for 7 days</SelectItem>
                        <SelectItem value="30">Keep for 30 days</SelectItem>
                        <SelectItem value="90">Keep for 90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>Controls how long we retain scan artifacts.</FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telemetry"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel className="text-base">Anonymised telemetry</FormLabel>
                    <FormDescription>Improve heuristics by sharing aggregated diagnostics.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
              <div>
                <h4 className="text-sm font-medium">Export my data</h4>
                <p className="text-xs text-muted-foreground">Generates a JSON file containing profile, settings, and tokens.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
              >
                {exportMutation.isPending ? "Preparing" : "Download"}
              </Button>
            </div>

            <CardFooter className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => query.data && form.reset(query.data)}
                disabled={!form.formState.isDirty || mutation.isPending}
              >
                Reset
              </Button>
              <Button type="submit" disabled={!form.formState.isDirty || mutation.isPending}>
                {mutation.isPending ? "Saving" : "Save"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

const DangerZoneTab = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const resetMutation = useMutation({
    mutationFn: resetApplicationData,
    onSuccess: () => {
      queryClient.clear();
      toast.success("Application data reset");
    },
    onError: () => toast.error("Failed to reset application state"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.clear();
      toast.success("Account deleted");
      navigate("/auth/login", { replace: true });
    },
    onError: () => toast.error("Failed to delete account"),
  });

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Danger zone</CardTitle>
        <CardDescription>Irreversible actions. Proceed with caution.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-medium">Reset application data</h4>
            <p className="text-sm text-muted-foreground">Clears cached settings, sessions, and mock state locally.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" disabled={resetMutation.isPending}>
                Reset data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset application data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This clears the mock stores and reloads defaults. You&apos;ll stay signed in.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => resetMutation.mutate()} className="bg-destructive text-destructive-foreground">
                  Confirm reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-destructive/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-medium">Delete account</h4>
            <p className="text-sm text-muted-foreground">Permanently remove your account and all associated data.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-destructive hover:bg-destructive/90" disabled={deleteMutation.isPending}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm account deletion</AlertDialogTitle>
                <AlertDialogDescription>
                  Type <span className="font-semibold">DELETE</span> to permanently remove your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                placeholder="DELETE"
                value={deleteConfirm}
                onChange={(event) => setDeleteConfirm(event.target.value)}
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteConfirm !== "DELETE" || deleteMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteMutation.mutate()}
                >
                  Permanently delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default Settings;
