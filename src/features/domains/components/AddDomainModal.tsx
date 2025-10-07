import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, Loader2 } from "lucide-react";
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
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDomainChange: (value: string) => void;
  onAcknowledgedChange: (value: boolean) => void;
  onCopyToken: () => Promise<void> | void;
}

export const AddDomainModal = ({
  isOpen,
  domain,
  acknowledged,
  errorMessage,
  isSubmitting,
  onClose,
  onSubmit,
  onDomainChange,
  onAcknowledgedChange,
  onCopyToken,
}: AddDomainModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
    >
      <Card className="relative z-10 w-full max-w-lg shadow-2xl">
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle>Add Domain</CardTitle>
            <CardDescription>
              Provide the domain you would like to verify and follow the DNS instructions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain-name">Domain</Label>
              <Input
                id="domain-name"
                placeholder="example.com"
                value={domain}
                onChange={(event) => onDomainChange(event.target.value)}
              />
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
          </CardContent>
          <CardFooter className="justify-end gap-2 border-t pt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!acknowledged || isSubmitting || !domain.trim().length}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify domain"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
