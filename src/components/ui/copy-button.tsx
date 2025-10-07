import { useState } from "react";
import type { MouseEvent } from "react";
import { Copy, Check } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps extends ButtonProps {
  value: string;
  copiedLabel?: string;
  copyLabel?: string;
}

export const CopyButton = ({
  value,
  copiedLabel = "Copied",
  copyLabel = "Copy",
  className,
  onClick,
  ...props
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!navigator?.clipboard) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn("Failed to copy", error);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("h-8 gap-2", className)}
      onClick={handleCopy}
      {...props}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      <span className="text-xs font-medium">{copied ? copiedLabel : copyLabel}</span>
    </Button>
  );
};
