"use client";

import { useState } from "react";
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
  Bot,
  LoaderCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Task, isClosedStatus } from "@/lib/constants";
import type { BriefingContext } from "@/lib/ai-prompts";

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
  // AI
  aiLeadBriefing?: (context: BriefingContext) => Promise<string>;
  aiText?: string;
  aiLoading?: boolean;
  aiError?: string | null;
  clearAiText?: () => void;
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  statusStyles,
  onOpenContractor,
  onOpenAction,
  mask,
  aiLeadBriefing,
  aiText = "",
  aiLoading = false,
  aiError = null,
  clearAiText,
}: TaskDetailSheetProps) {
  const [briefingExpanded, setBriefingExpanded] = useState(false);

  if (!task) return null;

  const maskedCustomer = mask(task.customer, "customerName");
  const maskedCif = mask(task.cif, "cif");
  const maskedPhone = mask(task.phone, "phone");
  const maskedTaxId = mask(task.businessNumber, "taxId");

  const handleBriefing = async () => {
    if (!aiLeadBriefing) return;
    setBriefingExpanded(true);
    try {
      await aiLeadBriefing({
        customerName: task.customer,
        source: task.source,
        campaign: task.campaign,
        program: task.program,
        priority: task.priority,
        dueDate: task.due,
      });
    } catch {
      // Error handled by hook
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => {
      if (!o && clearAiText) clearAiText();
      onOpenChange(o);
    }}>
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

          {/* AI Lead Briefing Section */}
          {aiLeadBriefing && (
            <div className="ai-card">
              <div className="ai-card-header">
                <span><Bot size={13} /> AI Briefing</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {!aiText && !aiLoading && (
                    <button
                      type="button"
                      className="ai-btn ai-btn-sm"
                      onClick={handleBriefing}
                      disabled={aiLoading}
                    >
                      <Sparkles size={11} /> Tóm tắt & Đề xuất
                    </button>
                  )}
                  {aiText && (
                    <button
                      type="button"
                      className="ai-btn ai-btn-sm"
                      onClick={() => setBriefingExpanded(!briefingExpanded)}
                    >
                      {briefingExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      {briefingExpanded ? "Thu gọn" : "Xem chi tiết"}
                    </button>
                  )}
                </div>
              </div>
              {aiLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div className="ai-shimmer" style={{ width: "90%" }} />
                  <div className="ai-shimmer" style={{ width: "75%" }} />
                  <div className="ai-shimmer" style={{ width: "60%" }} />
                </div>
              )}
              {aiText && briefingExpanded && (
                <div className={`ai-card-body${aiLoading ? " ai-typewriter" : ""}`}>
                  {aiText}
                </div>
              )}
              {aiError && (
                <div className="ai-error">
                  <AlertTriangle size={12} /> {aiError}
                </div>
              )}
              <p className="ai-disclaimer">
                <AlertTriangle size={9} /> Nội dung AI chỉ mang tính gợi ý, cần kiểm tra trước khi sử dụng.
              </p>
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
            {!isClosedStatus(task.status) ? (
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
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 opacity-70 cursor-not-allowed"
                disabled
              >
                Đã đóng / Không thể tạo Activity
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
