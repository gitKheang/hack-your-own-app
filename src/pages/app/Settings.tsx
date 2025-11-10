import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getGeneral, putGeneral } from "@/api/general";
import { toast } from "@/components/ui/sonner";

const generalSchema = z.object({
  landing: z.enum(["dashboard", "domains", "scans"]),
  openInNewTab: z.boolean(),
  autosave: z.boolean(),
});

type GeneralFormValues = z.infer<typeof generalSchema>;

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

const GeneralSettingsCard = () => {
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

  const onSubmit = (values: GeneralFormValues) => mutation.mutate(values);

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
        <CardTitle>General Preferences</CardTitle>
        <CardDescription>Control the basics for navigation and workflow.</CardDescription>
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
                  <FormItem className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
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
                name="autosave"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <FormLabel className="text-base">Auto-save forms</FormLabel>
                      <FormDescription>Persist edits as you go.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <CardFooter className="flex justify-end gap-3 p-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (query.data) {
                    form.reset(query.data);
                  }
                }}
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

const Settings = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Adjust the essentials to keep the scanner comfortable to use.
        </p>
      </div>

      <GeneralSettingsCard />
    </div>
  );
};

export default Settings;
