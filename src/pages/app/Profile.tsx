import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { getMe, updateMe, changePassword } from "@/api/me";

const profileSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  timezone: z.string().min(1, "Select a timezone"),
  time_format: z.enum(["12h", "24h"]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    current: z.string().min(1, "Required"),
    next: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Uppercase letter required")
      .regex(/[a-z]/, "Lowercase letter required")
      .regex(/\d/, "Number required")
      .regex(/[^A-Za-z0-9]/, "Symbol required"),
    confirm: z.string().min(1, "Required"),
  })
  .refine((data) => data.next === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const detectTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
};

const getInitialTimezones = (profileTz?: string) => {
  const tz = profileTz ?? detectTimezone();
  const unique = new Set([tz, ...COMMON_TIMEZONES]);
  return Array.from(unique);
};

const ProfileSkeleton = () => (
  <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
      <CardFooter className="justify-end">
        <Skeleton className="h-9 w-48" />
      </CardFooter>
    </Card>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
      <CardFooter className="justify-end">
        <Skeleton className="h-9 w-32" />
      </CardFooter>
    </Card>
  </div>
);

const Profile = () => {
  const queryClient = useQueryClient();
  const [timezoneOptions, setTimezoneOptions] = useState<string[]>(getInitialTimezones());

  const profileQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      timezone: detectTimezone(),
      time_format: "24h",
    },
  });

  useEffect(() => {
    if (profileQuery.data) {
      form.reset({
        first_name: profileQuery.data.first_name,
        last_name: profileQuery.data.last_name,
        timezone: profileQuery.data.timezone,
        time_format: profileQuery.data.time_format,
      });
      setTimezoneOptions(getInitialTimezones(profileQuery.data.timezone));
    }
  }, [profileQuery.data, form]);

  const updateProfileMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (data) => {
      queryClient.setQueryData(["me"], data);
      form.reset({
        first_name: data.first_name,
        last_name: data.last_name,
        timezone: data.timezone,
        time_format: data.time_format,
      });
      toast.success("Profile updated");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to update profile.";
      toast.error(message);
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current: "",
      next: "",
      confirm: "",
    },
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      passwordForm.reset();
      toast.success("Password updated");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to update password.";
      toast.error(message);
    },
  });

  const profile = profileQuery.data;

  const handleProfileSubmit = (values: ProfileFormValues) => {
    if (!profile) return;
    updateProfileMutation.mutate({
      id: profile.id,
      email: profile.email,
      ...values,
    });
  };

  const handlePasswordSubmit = (values: PasswordFormValues) => {
    const { confirm, ...payload } = values;
    passwordMutation.mutate(payload);
  };

  const isLoadingInitial = profileQuery.isLoading && !profile;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your personal details and password.</p>
      </div>

      {profileQuery.isError && !profile ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load profile</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center">
            Something went wrong while fetching your information.
            <Button variant="outline" size="sm" onClick={() => profileQuery.refetch()} className="w-full sm:w-auto">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoadingInitial ? <ProfileSkeleton /> : null}

      {profile ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Profile details</CardTitle>
              <CardDescription>Keep your name and locale information up to date.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center">
                <span className="break-all">{profile.email}</span>
                <Badge variant={profile.email_verified ? "default" : "secondary"} className="w-fit">
                  {profile.email_verified ? "Verified" : "Verification pending"}
                </Badge>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timezone</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                setTimezoneOptions((prev) =>
                                  prev.includes(value) ? prev : [value, ...prev],
                                );
                              }}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                              <SelectContent>
                                {timezoneOptions.map((tz) => (
                                  <SelectItem key={tz} value={tz}>
                                    {tz}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="time_format"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time format</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="12h">12-hour</SelectItem>
                                <SelectItem value="24h">24-hour</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <CardFooter className="flex flex-col gap-3 p-0 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        form.reset({
                          first_name: profile.first_name,
                          last_name: profile.last_name,
                          timezone: profile.timezone,
                          time_format: profile.time_format,
                        });
                      }}
                      disabled={!form.formState.isDirty || updateProfileMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      disabled={!form.formState.isDirty || updateProfileMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {updateProfileMutation.isPending ? "Saving" : "Save changes"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update password</CardTitle>
              <CardDescription>
                Choose a strong password to protect your workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="current"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="next"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Use at least 8 characters with a mix of letters, numbers, and symbols.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm new password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <CardFooter className="flex flex-col gap-3 p-0 sm:flex-row sm:justify-end">
                    <Button type="submit" disabled={passwordMutation.isPending} className="w-full sm:w-auto">
                      {passwordMutation.isPending ? "Updating" : "Update password"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default Profile;
