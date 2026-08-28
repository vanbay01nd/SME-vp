"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AuditEntry, AuditFilter, Task } from "@/lib/constants";

export function useAudit({
  sourceTasks,
  setSelected,
  onViewChange
}: {
  sourceTasks: Task[];
  setSelected: (ids: string[]) => void;
  onViewChange?: () => void;
}) {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditFilter, setAuditFilter] = useState<AuditFilter>("all");

  const filteredAuditEntries = auditEntries.filter((entry) =>
    auditFilter === "all"
      ? true
      : auditFilter === "success"
        ? entry.status === "Thành công"
        : entry.status === "Thất bại"
  );

  const auditSuccessCount = auditEntries.filter((entry) => entry.status === "Thành công").length;
  const auditFailureCount = auditEntries.length - auditSuccessCount;

  const exportAuditCsv = () => {
    if (!auditEntries.length) return;
    const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const rows = [
      ["Thời điểm", "Task ID", "Khách hàng", "Hoạt động", "Kết quả", "Trạng thái", "Xác minh API", "Thông báo"],
      ...auditEntries.map((entry) => [
        entry.at,
        entry.taskId,
        entry.customer,
        entry.activity,
        entry.result,
        entry.status,
        entry.verified === undefined
          ? "Không áp dụng"
          : entry.verified
            ? "Đã xác minh"
            : "Chưa xác minh",
        entry.message ?? "",
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `sme-connect-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất nhật ký CSV.");
  };

  const selectFailedForRetry = () => {
    const failed = new Set(
      auditEntries
        .filter((entry) => entry.status === "Thất bại")
        .map((entry) => entry.taskId)
    );
    const retryIds = sourceTasks
      .filter((task) => failed.has(task.id) && task.status !== "Đã hoàn tất")
      .map((task) => task.id);
    setSelected(retryIds);
    if (onViewChange) onViewChange();
    toast.info(
      retryIds.length
        ? `Đã chọn lại ${retryIds.length} task lỗi.`
        : "Không còn task lỗi đủ điều kiện để xử lý lại."
    );
  };

  const addEntries = (entries: AuditEntry[]) => {
    setAuditEntries((current) => [...entries, ...current]);
  };

  const clearAudit = () => {
    setAuditEntries([]);
  };

  return {
    auditEntries,
    setAuditEntries,
    auditFilter,
    setAuditFilter,
    filteredAuditEntries,
    auditSuccessCount,
    auditFailureCount,
    exportAuditCsv,
    selectFailedForRetry,
    addEntries,
    clearAudit,
  };
}
