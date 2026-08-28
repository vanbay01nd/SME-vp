"use client";

import { useState } from "react";
import { toast } from "sonner";
import { smeCall } from "@/lib/sme-api";
import { PerformanceSnapshot } from "@/lib/constants";
import { toActivityItems, toCallStatuses, unwrapRecord, pick, normalizeArray, isRecord } from "@/lib/task-mapper";
import { dateInputValue, responseTotal, asNumber, formatCount, asText } from "@/lib/formatters";

export function usePerformance({ token, connected }: { token: string; connected: boolean; }) {
  const [reportFrom, setReportFrom] = useState(dateInputValue);
  const [reportTo, setReportTo] = useState(dateInputValue);
  const [performanceBusy, setPerformanceBusy] = useState(false);
  const [performance, setPerformance] = useState<PerformanceSnapshot | null>(null);

  const loadPerformance = async (onUnconnected?: () => void) => {
    if (!connected || !token) {
      if (onUnconnected) onUnconnected();
      toast.info("Kết nối SME Connect để tải báo cáo dữ liệu thật.");
      return;
    }
    if (reportFrom > reportTo) {
      toast.error("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.");
      return;
    }
    setPerformanceBusy(true);
    try {
      const [doneData, planData, callData, catalogData] = await Promise.all([
        smeCall(token, {
          action: "activities",
          activityStatus: "DONE",
          fromDate: reportFrom,
          toDate: reportTo,
          pageIndex: 0,
          pageSize: 200,
        }),
        smeCall(token, {
          action: "activities",
          activityStatus: "PLAN",
          fromDate: reportFrom,
          toDate: reportTo,
          pageIndex: 0,
          pageSize: 200,
        }),
        smeCall(token, {
          action: "call-dashboard",
          fromDate: `${reportFrom}T00:00:00Z`,
          toDate: `${reportTo}T23:59:59Z`,
        }),
        smeCall(token, { action: "catalog-overview" }),
      ]);
      const doneRows = toActivityItems(doneData);
      const planRows = toActivityItems(planData);
      const callRecord = unwrapRecord(callData);
      const callStatuses = toCallStatuses(callData);
      const catalog = isRecord(catalogData) ? catalogData : {};
      const callTotalFallback = callStatuses.reduce((total, item) => total + item.count, 0);
      setPerformance({
        doneCount: responseTotal(doneData, doneRows.length),
        planCount: responseTotal(planData, planRows.length),
        callTotal: asNumber(pick(callRecord, "total"), callTotalFallback),
        avgCallCountPerDay: formatCount(pick(callRecord, "avgCallCountPerDay")),
        avgCallDuration: asText(pick(callRecord, "avgCallDuration"), "—"),
        callStatuses,
        activities: [...doneRows, ...planRows]
          .sort((a, b) => b.at.localeCompare(a.at))
          .slice(0, 20),
        customerSourceCount: normalizeArray(catalog.customerSources).length,
        programCount: normalizeArray(catalog.explorationPrograms).length,
        productCount: normalizeArray(catalog.products).length,
        loadedAt: new Date().toLocaleString("vi-VN"),
      });
      toast.success("Đã cập nhật báo cáo Activity và cuộc gọi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được báo cáo.");
    } finally {
      setPerformanceBusy(false);
    }
  };

  return {
    reportFrom,
    setReportFrom,
    reportTo,
    setReportTo,
    performanceBusy,
    performance,
    setPerformance,
    loadPerformance,
  };
}
