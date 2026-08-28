"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UsersRound,
  Phone,
  Clock3,
  BriefcaseBusiness,
  Building2,
  Calendar,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Task } from "@/lib/constants";

export interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusStyles: Record<string, string>;
  connected: boolean;
  onOpenContractor: (task: Task) => void;
  onOpenAction: (task: Task) => void;
  mask: (
    value: string | undefined | null,
    field: "customerName" | "cif" | "phone" | "taxId",
  ) => string;
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  statusStyles,
  onOpenContractor,
  onOpenAction,
  mask,
}: TaskDetailSheetProps) {
  if (!task) return null;

  const maskedCustomer = mask(task.customer, "customerName");
  const maskedCif = mask(task.cif, "cif");
  const maskedPhone = mask(task.phone, "phone");
  const maskedTaxId = mask(task.businessNumber, "taxId");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="connection-sheet sm:max-w-lg">
        <SheetHeader className="connection-header">
          <div className="connection-title-row">
            <span className="connection-title-icon">
              <Building2 size={20} />
            </span>
            <div>
              <SheetTitle>{maskedCustomer}</SheetTitle>
              <SheetDescription>
                Task #{task.id} &middot; CIF: {maskedCif || "Chưa có"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="sheet-form space-y-4">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={
                statusStyles[task.status] ??
                "border-gray-200 bg-gray-50 text-gray-700"
              }
            >
              {task.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Tạo lúc: {task.createdAt}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg text-xs">
            <div>
              <span className="text-muted-foreground block">Điện thoại</span>
              <strong className="font-semibold flex items-center gap-1 mt-0.5">
                <Phone size={13} /> {maskedPhone || "Chưa cập nhật"}
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Mã số thuế</span>
              <strong className="font-semibold block mt-0.5">
                {maskedTaxId || "—"}
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Nguồn</span>
              <span className="font-medium block mt-0.5">{task.source}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Người phụ trách</span>
              <span className="font-medium block mt-0.5 flex items-center gap-1">
                <UsersRound size={13} /> {task.owner}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Thời hạn</span>
              <span className="font-medium block mt-0.5 flex items-center gap-1">
                <Clock3 size={13} /> {task.due}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Độ ưu tiên</span>
              <span
                className={`font-semibold block mt-0.5 ${task.priority === "Cao" ? "text-red-600" : ""}`}
              >
                {task.priority}
              </span>
            </div>
          </div>

          {task.campaign && (
            <div className="p-2.5 bg-accent/20 rounded border text-xs">
              <span className="text-muted-foreground block">Chiến dịch</span>
              <strong>{task.campaign}</strong>
              {task.program && (
                <span className="block text-muted-foreground mt-0.5">
                  Chương trình: {task.program}
                </span>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {task.businessNumber && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  onOpenChange(false);
                  onOpenContractor(task);
                }}
              >
                <BriefcaseBusiness size={14} /> Tra cứu nhà thầu
              </Button>
            )}
            <Button
              className="vp-primary flex-1"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onOpenAction(task);
              }}
            >
              <Sparkles size={14} /> Tạo Activity <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
