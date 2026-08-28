"use client";

import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DISCLAIMER_SECTIONS } from "@/lib/disclaimer";

export function FooterDisclaimer() {
  return (
    <div className="border-t bg-muted/30 py-2 px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground w-full">
      <div className="flex items-center gap-2 text-center sm:text-left">
        <ShieldCheck className="h-4 w-4 text-muted-foreground/70 shrink-0" />
        <span>
          Công cụ hỗ trợ nội bộ &middot; Không phải sản phẩm chính thức VPBank &middot; 
          Token không được lưu &middot; Người dùng chịu trách nhiệm về dữ liệu nhập
        </span>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs shrink-0">
            Xem điều khoản
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Điều khoản sử dụng</DialogTitle>
            <DialogDescription>
              Các điều khoản về bảo mật và trách nhiệm khi sử dụng công cụ
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-4 my-2 space-y-6">
            {DISCLAIMER_SECTIONS.map((section, index) => (
              <div key={index} className="space-y-2">
                <h3 className="font-semibold text-foreground text-sm">
                  {section.title}
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
