"use client";

import { useState, useEffect } from "react";
import { Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDailyTip } from "@/lib/tips";

export function TipBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [tipText, setTipText] = useState("");

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem("tip-banner-dismissed");
    
    if (!isDismissed) {
      const tip = getDailyTip();
      setTipText(tip);
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("tip-banner-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="bg-amber-50/80 border-b border-amber-100 text-amber-800 px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 overflow-hidden">
        <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
        <span className="truncate font-medium">Mẹo:</span>
        <span className="truncate">{tipText}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-amber-700 hover:text-amber-900 hover:bg-amber-200/50 rounded-full"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Đóng</span>
      </Button>
    </div>
  );
}
