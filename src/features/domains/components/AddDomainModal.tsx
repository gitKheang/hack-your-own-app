import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DOMAIN_VERIFY_HELP_TEXT,
  DOMAIN_VERIFY_HOST,
  DOMAIN_VERIFY_TOKEN,
  DOMAIN_VERIFY_TYPE,
} from "../constants";

interface AddDomainModalProps {
  isOpen: boolean;
  domain: string;
  acknowledged: boolean;
  errorMessage: string | null;
  isSubmitting: boolean;
  step: "domain" | "dns";
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDomainSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDomainChange: (value: string) => void;
  onAcknowledgedChange: (value: boolean) => void;
  onCopyToken: () => Promise<void> | void;
  onBackToDomain: () => void;
}

export const AddDomainModal = ({
  isOpen,
  domain,
  acknowledged,
  errorMessage,
  isSubmitting,
  step,
  onClose,
  onSubmit,
  onDomainSubmit,
  onDomainChange,
  onAcknowledgedChange,
  onCopyToken,
  onBackToDomain,
}: AddDomainModalProps) => {
  if (!isOpen) {
    return null;
  }

  const isDnsStep = step === "dns";
  const domainLabel = domain.trim() || domain;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
    >
      <Card className="relative z-10 w-full max-w-lg shadow-2xl">
        <form onSubmit={isDnsStep ? onSubmit : onDomainSubmit}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{isDnsStep ? "Verify Domain" : "Add Domain"}</CardTitle>
                <CardDescription>
                  {isDnsStep
                    ? "Create the DNS TXT record so we can verify ownership."
                    : "Provide the domain you would like to verify."}
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                Step {isDnsStep ? "2" : "1"} of 2
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isDnsStep && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="domain-name">Domain</Label>
                  <Input
                    id="domain-name"
                    placeholder="example.com"
                    value={domain}
                    onChange={(event) => onDomainChange(event.target.value)}
                    autoFocus
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  We will guide you through verifying ownership after you save the domain.
                </p>
              </>
            )}

            {isDnsStep && (
              <>
                <div className="space-y-1 text-sm">
                  <Label>Domain</Label>
                  <p className="rounded-md border bg-muted/40 px-3 py-2 font-medium">{domainLabel}</p>
                </div>
                <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                  <div>
                    <h4 className="text-sm font-semibold">Generate TXT record</h4>
                    <p className="text-xs text-muted-foreground">Use these values to create a DNS TXT record.</p>
                  </div>

                  <div className="grid gap-3">
                    <div className="grid gap-1">
                      <Label>Type</Label>
                      <Input value={DOMAIN_VERIFY_TYPE} readOnly />
                    </div>
                    <div className="grid gap-1">
                      <Label>Name / Host</Label>
                      <Input value={DOMAIN_VERIFY_HOST} readOnly />
                    </div>
                    <div className="grid gap-1">
                      <Label>Value</Label>
                      <div className="flex gap-2">
                        <Input value={DOMAIN_VERIFY_TOKEN} readOnly className="font-mono" />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            void onCopyToken();
                          }}
                          className="shrink-0"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{DOMAIN_VERIFY_HELP_TEXT}</p>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto px-0 text-sm"
                  asChild
                >
                  <Link to="/help/domain-verification" target="_blank" rel="noreferrer">
                    Learn more
                  </Link>
                </Button>

                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertTitle>Verification failed</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border border-input bg-background"
                    checked={acknowledged}
                    onChange={(event) => onAcknowledgedChange(event.target.checked)}
                  />
                  I added this TXT record
                </label>
              </>
            )}

            {!isDnsStep && errorMessage && (
              <Alert variant="destructive">
                <AlertTitle>Unable to continue</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="justify-end gap-2 border-t pt-6">
            {isDnsStep ? (
              <>
                <Button type="button" variant="ghost" onClick={onBackToDomain}>
                  Back
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!acknowledged || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Verify domain"
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!domain.trim().length}>
                  Save & Continue
                </Button>
              </>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
