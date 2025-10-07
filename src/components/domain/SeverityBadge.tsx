import { Badge } from "@/components/ui/badge";
import type { Severity } from "@/types";
import { AlertTriangle, AlertCircle, ShieldAlert, Info } from "lucide-react";

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export const SeverityBadge = ({ severity, className }: SeverityBadgeProps) => {
  const icons = {
    low: Info,
    medium: AlertCircle,
    high: AlertTriangle,
    critical: ShieldAlert,
  };

  const Icon = icons[severity];

  return (
    <Badge variant={severity} className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {severity.toUpperCase()}
    </Badge>
  );
};
