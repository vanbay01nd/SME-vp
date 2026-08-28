"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DISCLAIMER_SECTIONS } from "@/lib/disclaimer";

interface DisclaimerGateProps {
  accepted: boolean;
  isReady: boolean;
  accept: () => void;
  children: React.ReactNode;
}

export function DisclaimerGate({ accepted, isReady, accept, children }: DisclaimerGateProps) {
  const [agreed, setAgreed] = useState(false);

  if (!isReady) return null;

  if (accepted) {
    return <>{children}</>;
  }

  const handleDecline = () => {
    // In a real app, this might redirect to a safe landing page or company portal
    window.location.href = "about:blank";
  };

  return (
    <AlertDialog open={!accepted}>
      <AlertDialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-full shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-xl">
              Điều khoản sử dụng SME Connect Task Manager
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Vui lòng đọc kỹ các điều khoản dưới đây trước khi tiếp tục sử dụng công cụ.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex-1 overflow-y-auto pr-4 my-4 space-y-6">
          {DISCLAIMER_SECTIONS.map((section, index) => (
            <div key={index} className="space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="flex items-center justify-center bg-muted w-6 h-6 rounded-full text-xs">
                  {index + 1}
                </span>
                {section.title}
              </h3>
              <ul className="text-sm text-muted-foreground pl-8 space-y-1">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex gap-2">
                    <span className="shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-2 py-4 border-t">
          <Checkbox
            id="terms"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Tôi đã đọc, hiểu và đồng ý với các điều khoản trên
          </label>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleDecline}>
            Không đồng ý
          </Button>
          <Button onClick={accept} disabled={!agreed}>
            Đồng ý & Tiếp tục
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
