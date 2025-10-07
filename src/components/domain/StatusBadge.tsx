import { Badge } from "@/components/ui/badge";
import type { TaskStatus } from "@/types";
import { Clock, Play, CheckCircle2, XCircle, Ban } from "lucide-react";

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const icons = {
    PENDING: Clock,
    RUNNING: Play,
    COMPLETED: CheckCircle2,
    FAILED: XCircle,
    CANCELED: Ban,
  };

  const variants: Record<TaskStatus, "pending" | "running" | "completed" | "failed"> = {
    PENDING: "pending",
    RUNNING: "running",
    COMPLETED: "completed",
    FAILED: "failed",
    CANCELED: "failed",
  };

  const Icon = icons[status];

  return (
    <Badge variant={variants[status]} className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  );
};
