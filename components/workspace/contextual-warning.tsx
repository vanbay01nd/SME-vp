"use client";

import { useState } from "react";
import { Lightbulb, Info, AlertTriangle, CircleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type WarningLevel = "tip" | "info" | "warning" | "urgent";

interface ContextualWarningProps {
  level: WarningLevel;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const LEVEL_STYLES: Record<WarningLevel, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  tip: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    icon: Lightbulb,
  },
  info: {
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-200",
    icon: Info,
  },
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    icon: AlertTriangle,
  },
  urgent: {
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
    icon: CircleAlert,
  },
};

export function ContextualWarning({
  level,
  message,
  dismissible = false,
  onDismiss,
  className,
}: ContextualWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const styles = LEVEL_STYLES[level];
  const Icon = styles.icon;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-md border text-sm",
        styles.bg,
        styles.text,
        styles.border,
        className
      )}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 leading-relaxed whitespace-pre-line">{message}</div>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-md hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-black/10 transition-colors"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
