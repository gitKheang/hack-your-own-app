import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, ShieldCheck, Mail, RefreshCcw } from "lucide-react";
import { getMe, updateMe, changeEmail, verifyEmail, changePassword, resendVerification } from "@/api/me";
import type { ProfileResponse } from "@/types/settings";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  display_name: z.string().min(1, "Required"),
  email: z.string().email(),
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

const calculatePasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
};

const strengthLabel = (score: number) => {
  if (score <= 2) return "Weak";
  if (score === 3) return "Okay";
  return "Strong";
};

const getInitials = (profile?: ProfileResponse) => {
  if (!profile) return "U";
  const letters = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`;
  return letters.toUpperCase() || "U";
};

const Profile = () => {
  const queryClient = useQueryClient();
  const [timezoneOptions, setTimezoneOptions] = useState<string[]>(getInitialTimezones());
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFileName, setAvatarFileName] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      display_name: "",
      email: "",
      timezone: detectTimezone(),
      time_format: "24h",
    },
  });

  useEffect(() => {
    if (profileQuery.data) {
      form.reset({
        first_name: profileQuery.data.first_name,
        last_name: profileQuery.data.last_name,
        display_name: profileQuery.data.display_name,
        email: profileQuery.data.email,
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
        display_name: data.display_name,
        email: data.email,
        timezone: data.timezone,
        time_format: data.time_format,
      });
      setProfileError(null);
      toast.success("Profile updated");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to update profile.";
      setProfileError(message);
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

  const changeEmailMutation = useMutation({
    mutationFn: changeEmail,
    onSuccess: (payload) => {
      setPendingEmail(payload.email);
      toast.success(`Verification code sent to ${payload.email}`);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to initiate email change.";
      toast.error(message);
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: (data) => {
      queryClient.setQueryData(["me"], data);
      setPendingEmail(null);
      setEmailDialogOpen(false);
      toast.success("Email verified");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Invalid verification code.";
      toast.error(message);
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: resendVerification,
    onSuccess: () => {
      toast.success("Verification email resent");
    },
    onError: () => {
      toast.error("Failed to resend verification email");
    },
  });

  const onSubmitProfile = (values: ProfileFormValues) => {
    if (!profileQuery.data) return;
    updateProfileMutation.mutate({
      id: profileQuery.data.id,
      ...values,
    });
  };

  const onSubmitPassword = (values: PasswordFormValues) => {
    passwordMutation.mutate({
      current: values.current,
      next: values.next,
    });
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setAvatarPreview(null);
      setAvatarFileName(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarFileName(file.name);
  };

  const timeFormatPreview = useMemo(() => {
    const values = form.getValues();
    const format = values.time_format === "12h" ? "en-US" : "en-GB";
    try {
      return new Intl.DateTimeFormat(format, {
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date());
    } catch {
      return new Date().toLocaleString();
    }
  }, [form]);

  const renderProfileSkeleton = () => (
    <div className="grid gap-6">
      {[...Array(3)].map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const isSubmittingProfile = updateProfileMutation.isPending;
  const isSubmittingPassword = passwordMutation.isPending;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Profile</h1>
          <p className="text-muted-foreground">Manage how you appear across the scanner platform.</p>
        </div>
        {profileQuery.data?.email_verified ? (
          <Badge className="bg-emerald-500/90">
            <ShieldCheck className="mr-1 h-4 w-4" /> Verified
          </Badge>
        ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => resendVerificationMutation.mutate()}
          disabled={resendVerificationMutation.isPending}
        >
          <RefreshCcw
            className={cn(
              "mr-2 h-4 w-4",
              resendVerificationMutation.isPending ? "animate-spin" : "opacity-0",
            )}
            aria-hidden="true"
          />
          {resendVerificationMutation.isPending ? "Resending" : "Resend verification"}
        </Button>
        )}
      </div>

      {!profileQuery.data && profileQuery.isLoading ? (
        renderProfileSkeleton()
      ) : profileQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load profile</AlertTitle>
          <AlertDescription>
            Something went wrong while fetching your profile. Please retry.
            <Button variant="link" onClick={() => profileQuery.refetch()} className="px-2">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal information</CardTitle>
                <CardDescription>Your basic profile details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {profileError && (
                  <Alert variant="destructive">
                    <AlertTitle>Update failed</AlertTitle>
                    <AlertDescription>{profileError}</AlertDescription>
                  </Alert>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First name</FormLabel>
                            <FormControl>
                              <Input placeholder="Alex" {...field} />
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
                              <Input placeholder="Johnson" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="display_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display name</FormLabel>
                          <FormControl>
                            <Input placeholder="Alex J." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly disabled />
                          </FormControl>
                          <FormDescription className="flex items-center gap-2">
                            Primary email for account communication.
                            <Button variant="link" className="h-auto p-0" onClick={() => setEmailDialogOpen(true)}>
                              Change email
                            </Button>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timezoneOptions.map((tz) => (
                                  <SelectItem key={tz} value={tz}>
                                    {tz}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>Override auto-detected timezone.</FormDescription>
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
                            <div className="flex items-center gap-4">
                              <Button
                                type="button"
                                variant={field.value === "12h" ? "default" : "outline"}
                                onClick={() => field.onChange("12h")}
                              >
                                12-hour
                              </Button>
                              <Button
                                type="button"
                                variant={field.value === "24h" ? "default" : "outline"}
                                onClick={() => field.onChange("24h")}
                              >
                                24-hour
                              </Button>
                            </div>
                            <FormDescription>Preview: {timeFormatPreview}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <CardFooter className="flex justify-end gap-4 px-0 pb-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (profileQuery.data) {
                            form.reset({
                              first_name: profileQuery.data.first_name,
                              last_name: profileQuery.data.last_name,
                              display_name: profileQuery.data.display_name,
                              email: profileQuery.data.email,
                              timezone: profileQuery.data.timezone,
                              time_format: profileQuery.data.time_format,
                            });
                            setProfileError(null);
                          }
                        }}
                        disabled={!form.formState.isDirty || isSubmittingProfile}
                      >
                        Reset
                      </Button>
                      <Button type="submit" disabled={!form.formState.isDirty || isSubmittingProfile}>
                        {isSubmittingProfile ? "Saving" : "Save changes"}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change password</CardTitle>
                <CardDescription>Keep your account protected with a strong password.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-6">
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
                      render={({ field }) => {
                        const score = calculatePasswordStrength(field.value);
                        return (
                          <FormItem>
                            <FormLabel>New password</FormLabel>
                            <FormControl>
                              <Input type="password" autoComplete="new-password" {...field} />
                            </FormControl>
                            <FormDescription>
                              Strength: {strengthLabel(score)}
                              <Progress value={(score / 5) * 100} className="mt-2" />
                            </FormDescription>
                            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                              <li className={cn(score >= 1 ? "text-emerald-500" : "")}>At least 8 characters</li>
                              <li className={cn(/[A-Z]/.test(field.value) ? "text-emerald-500" : "")}>One uppercase letter</li>
                              <li className={cn(/[a-z]/.test(field.value) ? "text-emerald-500" : "")}>One lowercase letter</li>
                              <li className={cn(/\d/.test(field.value) ? "text-emerald-500" : "")}>One number</li>
                              <li className={cn(/[^A-Za-z0-9]/.test(field.value) ? "text-emerald-500" : "")}>One symbol</li>
                            </ul>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm password</FormLabel>
                          <FormControl>
                            <Input type="password" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <CardFooter className="flex justify-end gap-4 px-0 pb-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => passwordForm.reset()}
                        disabled={passwordForm.formState.isSubmitting || !passwordForm.formState.isDirty}
                      >
                        Clear
                      </Button>
                      <Button type="submit" disabled={isSubmittingPassword || !passwordForm.formState.isDirty}>
                        {isSubmittingPassword ? "Updating" : "Update password"}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Avatar</CardTitle>
                <CardDescription>Upload an image to personalise your account.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 text-center">
                <Avatar className="h-20 w-20">
                  {avatarPreview ? <AvatarImage src={avatarPreview} alt="Avatar preview" /> : null}
                  <AvatarFallback>{getInitials(profileQuery.data)}</AvatarFallback>
                </Avatar>
                <div className="w-full space-y-2">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-3 text-sm font-medium transition hover:border-primary">
                    <Upload className="h-4 w-4" />
                    <span>{avatarFileName ?? "Upload image"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                  <p className="text-xs text-muted-foreground">PNG or JPG up to 2 MB. Preview only for now.</p>
                </div>
              </CardContent>
            </Card>

            {!profileQuery.data?.email_verified && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertTitle>Email verification pending</AlertTitle>
                <AlertDescription>
                  Your email is not verified. Complete the verification to access security-sensitive workflows.
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Sync your locale and scheduling defaults.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">Use 24-hour clock</p>
                    <p className="text-xs text-muted-foreground">Switch to 12-hour time for AM/PM.</p>
                  </div>
                  <Switch
                    checked={form.watch("time_format") === "24h"}
                    onCheckedChange={(checked) =>
                      form.setValue("time_format", checked ? "24h" : "12h", { shouldDirty: true })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <ChangeEmailDialog
        open={emailDialogOpen}
        onOpenChange={(open) => {
          setEmailDialogOpen(open);
          if (!open) {
            setPendingEmail(null);
            changeEmailMutation.reset();
            verifyEmailMutation.reset();
          }
        }}
        pendingEmail={pendingEmail}
        currentEmail={profileQuery.data?.email ?? ""}
        onSendCode={(email) => changeEmailMutation.mutate({ email })}
        isSendingCode={changeEmailMutation.isPending}
        onVerifyCode={(code, email) => verifyEmailMutation.mutate({ code, email })}
        isVerifyingCode={verifyEmailMutation.isPending}
        onStartOver={() => {
          setPendingEmail(null);
          changeEmailMutation.reset();
          verifyEmailMutation.reset();
        }}
      />
    </div>
  );
};

interface ChangeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
  pendingEmail: string | null;
  onSendCode: (email: string) => void;
  isSendingCode: boolean;
  onVerifyCode: (code: string, email: string) => void;
  isVerifyingCode: boolean;
  onStartOver: () => void;
}

const ChangeEmailDialog = ({
  open,
  onOpenChange,
  currentEmail,
  pendingEmail,
  onSendCode,
  isSendingCode,
  onVerifyCode,
  isVerifyingCode,
  onStartOver,
}: ChangeEmailDialogProps) => {
  const [step, setStep] = useState<"email" | "code">("email");
  const emailForm = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: z.string().email("Enter a valid email") })),
    defaultValues: { email: "" },
  });
  const codeForm = useForm<{ code: string }>({
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (!open) {
      setStep("email");
      emailForm.reset({ email: "" });
      codeForm.reset({ code: "" });
    }
  }, [open, emailForm, codeForm]);

  useEffect(() => {
    if (pendingEmail) {
      setStep("code");
      codeForm.reset({ code: "" });
    }
  }, [pendingEmail, codeForm]);

  const submitEmail = (values: { email: string }) => {
    onSendCode(values.email);
  };

  const submitCode = (values: { code: string }) => {
    if (!pendingEmail) return;
    onVerifyCode(values.code, pendingEmail);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change email</DialogTitle>
          <DialogDescription>
            {step === "email"
              ? "Update your primary email address and we'll send you a confirmation code."
              : `Enter the verification code sent to ${pendingEmail}.`}
          </DialogDescription>
        </DialogHeader>

        {step === "email" ? (
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(submitEmail)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@company.com" {...field} />
                    </FormControl>
                    <FormDescription>We'll keep {currentEmail} active until you verify the new address.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSendingCode}>
                  {isSendingCode ? "Sending" : "Send code"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...codeForm}>
            <form onSubmit={codeForm.handleSubmit(submitCode)} className="space-y-4">
              <FormField
                control={codeForm.control}
                name="code"
                rules={{ required: true }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification code</FormLabel>
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup>
                          {[...Array(6)].map((_, index) => (
                            <InputOTPSlot key={index} index={index} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormDescription>Check your inbox for a 6-digit code.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    emailForm.reset({ email: "" });
                    codeForm.reset({ code: "" });
                    onStartOver();
                    setStep("email");
                  }}
                >
                  Start over
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isVerifyingCode || codeForm.getValues("code").length !== 6}>
                    {isVerifyingCode ? "Verifying" : "Verify"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Profile;
