"use client";

import { useState } from "react";
import { toast } from "sonner";
import { smeCall } from "@/lib/sme-api";
import { JsonRecord, Task } from "@/lib/constants";
import { unwrapRecord, normalizeArray } from "@/lib/task-mapper";

export function useContractor({ token, connected }: { token: string; connected: boolean; }) {
  const [contractorTaxId, setContractorTaxId] = useState("");
  const [contractorBusy, setContractorBusy] = useState(false);
  const [contractor, setContractor] = useState<JsonRecord | null>(null);
  const [bidOverview, setBidOverview] = useState<JsonRecord | null>(null);

  const contractorPackages = contractor
    ? [
        ...normalizeArray(contractor.bidSuggestDetailDTOS),
        ...normalizeArray(contractor.vbidPackageDetailFullDTOS),
      ].slice(0, 8)
    : [];

  const lookupContractor = async (value: unknown = contractorTaxId, onUnconnected?: () => void) => {
    const rawVal = typeof value === "string" ? value : contractorTaxId;
    const businessNumber = (rawVal || "").trim().replaceAll(" ", "");
    if (!connected || !token) {
      if (onUnconnected) onUnconnected();
      toast.info("Kết nối SME Connect để tra cứu dữ liệu nhà thầu thật.");
      return;
    }
    if (!/^\d{8,14}(?:-\d{1,4})?$/.test(businessNumber)) {
      toast.error("Nhập mã số thuế hợp lệ trước khi tra cứu.");
      return;
    }
    setContractorTaxId(businessNumber);
    setContractorBusy(true);
    setContractor(null);
    try {
      const [contractorData, countData] = await Promise.all([
        smeCall(token, { action: "bid-contractor", businessNumber }),
        smeCall(token, { action: "bid-count" }),
      ]);
      const result = unwrapRecord(contractorData);
      setBidOverview(unwrapRecord(countData));
      if (!Object.keys(result).length) {
        toast.info("Chưa tìm thấy dữ liệu đấu thầu cho mã số thuế này.");
        return;
      }
      setContractor(result);
      toast.success("Đã tải hồ sơ đấu thầu của doanh nghiệp.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tra cứu được dữ liệu nhà thầu.");
    } finally {
      setContractorBusy(false);
    }
  };

  const openContractorFromTask = (task: Task, onOpen?: () => void) => {
    if (!task.businessNumber) return;
    if (onOpen) onOpen();
    setContractorTaxId(task.businessNumber);
    void lookupContractor(task.businessNumber);
  };

  return {
    contractorTaxId,
    setContractorTaxId,
    contractorBusy,
    contractor,
    setContractor,
    bidOverview,
    setBidOverview,
    contractorPackages,
    lookupContractor,
    openContractorFromTask,
  };
}
