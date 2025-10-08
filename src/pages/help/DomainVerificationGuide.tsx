import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DOMAIN_VERIFY_HOST, DOMAIN_VERIFY_TOKEN, DOMAIN_VERIFY_TYPE } from "@/features/domains/constants";

const steps = [
  {
    title: "Open your DNS dashboard",
    description:
      "Sign in to the provider that manages DNS for the domain you want to verify. This is often the company where you purchased the domain (for example, Cloudflare, GoDaddy, or Namecheap).",
  },
  {
    title: "Create a TXT record",
    description:
      "Add a new TXT record using the values below. Some providers call the host field “Name”, “Host”, or “Record name”. If your provider requires a TTL, keep the default value (typically 1 hour).",
  },
  {
    title: "Save the record",
    description:
      "Save the new TXT record in your DNS dashboard. DNS changes can take a couple of minutes to propagate. Grab a coffee while we wait!",
  },
  {
    title: "Verify inside Hack Your Own",
    description:
      "Return to the Domains page, open the verification modal, and select “Verify domain”. We’ll look up the TXT record to confirm ownership.",
  },
];

const DomainVerificationGuide = () => {
  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <Button asChild variant="ghost" className="w-fit">
            <Link to="/app/domains">← Back to Domains</Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Verify a domain with a DNS TXT record
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            Add a TXT record to prove you control the domain you want to scan. Follow the steps below;
            they mirror the flow in the app so you always know what comes next.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>TXT record values</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm md:text-base">
            <p className="text-muted-foreground">
              Use these values when creating the DNS record. The token stays constant for your account, so
              you can reuse it for additional domains.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">Type</p>
                <p className="mt-1 font-mono text-sm md:text-base">{DOMAIN_VERIFY_TYPE}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">Name / Host</p>
                <p className="mt-1 font-mono text-sm md:text-base break-all">{DOMAIN_VERIFY_HOST}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">Value</p>
                <p className="mt-1 font-mono text-sm md:text-base break-all">{DOMAIN_VERIFY_TOKEN}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {steps.map((step, index) => (
            <Card key={step.title} className="border-l-4 border-primary">
              <CardHeader className="pb-3">
                <div className="flex items-baseline justify-between gap-4">
                  <CardTitle className="text-lg font-semibold">
                    Step {index + 1}: {step.title}
                  </CardTitle>
                  <span className="text-sm font-medium text-primary/80">#{index + 1}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground md:text-base">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Alert>
          <AlertTitle>Need to double-check propagation?</AlertTitle>
          <AlertDescription className="text-sm leading-relaxed text-muted-foreground">
            Most DNS providers apply changes quickly, but global propagation can take a few minutes. If we
            still can’t find your TXT record, wait a moment and try verifying again. You can also run{" "}
            <code>nslookup -type=TXT {DOMAIN_VERIFY_HOST}</code> from your terminal to confirm that the new
            record is public.
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/app/domains?modal=add">Open verification modal</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/domains">View all domains</Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default DomainVerificationGuide;
