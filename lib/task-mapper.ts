import { JsonRecord, TaskStatus, TaskHistoryItem, ActivityItem, CallStatusItem, Task, ApiOption } from "@/lib/constants";
import { asText, formatApiDate, asNumber } from "@/lib/formatters";
export { asText, formatApiDate, asNumber } from "@/lib/formatters";

export const asRecord = (value: unknown): JsonRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};

export const cleanToken = (value: string) =>
  value
    .trim()
    .replace(/^Bearer\s+/i, "")
    .replace(/^['"]|['"]$/g, "");

export function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function pick(record: JsonRecord, ...paths: string[]) {
  for (const path of paths) {
    let value: unknown = record;
    for (const key of path.split(".")) {
      if (!isRecord(value)) {
        value = undefined;
        break;
      }
      value = value[key];
    }
    if (value !== undefined && value !== null && String(value).trim()) return value;
  }
  return undefined;
}

export function normalizeArray(value: unknown, depth = 0): JsonRecord[] {
  if (depth > 7) return [];
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];
  for (const key of ["data", "content", "items", "records", "list", "result", "rows", "infos"]) {
    const rows = normalizeArray(value[key], depth + 1);
    if (rows.length) return rows;
  }
  return [];
}

export function unwrapRecord(value: unknown, depth = 0): JsonRecord {
  if (depth > 7 || !isRecord(value)) return {};
  for (const key of ["data", "content", "result", "record", "item"]) {
    if (isRecord(value[key])) return unwrapRecord(value[key], depth + 1);
  }
  return value;
}

export function classifyStatus(record: JsonRecord): TaskStatus {
  const value = JSON.stringify({
    taskStatus: record.taskStatus,
    status: record.status,
    taskStatusName: record.taskStatusName,
    statusName: record.statusName,
    taskStatusGroup: record.taskStatusGroup,
  });
  if (/DONE|COMPLETED|HOÀN TẤT|HOAN TAT|ĐÃ XỬ LÝ|DA XU LY/i.test(value)) {
    return "Đã hoàn tất";
  }
  if (/WAITING_RECEIVE|NEW|CHỜ|CHO|PENDING|TIẾP NHẬN|TIEP NHAN/i.test(value)) {
    return "Chờ tiếp nhận";
  }
  return "Đang xử lý";
}

export function toTaskHistoryItems(value: unknown): TaskHistoryItem[] {
  return normalizeArray(value).map((record, index) => ({
    id: asText(pick(record, "taskHistoryId", "id"), String(index)),
    description: asText(pick(record, "description", "content"), "Cập nhật nhiệm vụ"),
    user: asText(pick(record, "username", "createdBy", "executor"), "Hệ thống"),
    at: formatApiDate(pick(record, "createdDate", "createdAt")),
  }));
}

export function toActivityItems(value: unknown): ActivityItem[] {
  return normalizeArray(value).map((record, index) => ({
    id: asText(pick(record, "activityId", "id"), String(index)),
    taskId: asText(pick(record, "taskId"), "—"),
    customer: asText(pick(record, "companyName", "legalName", "customerName"), "—"),
    status: asText(pick(record, "activityStatus", "status"), "—"),
    type: asText(pick(record, "activityTypeDes", "activityTypeDescription", "activityType"), "—"),
    result: asText(pick(record, "activityResultDes", "activityResultDescription", "activityResult"), "—"),
    note: asText(pick(record, "note", "description"), "Không có ghi chú"),
    at: formatApiDate(
      pick(record, "createdDateDisplay", "createdDate", "estimationDateDisplay", "taskUpdatedDateDisplay"),
    ),
  }));
}

export function toCallStatuses(value: unknown): CallStatusItem[] {
  const record = unwrapRecord(value);
  const raw = record.callStatusList;
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (!isRecord(item)) return null;
        const status = asText(pick(item, "status", "callStatus", "code", "name"), "");
        const count = asNumber(pick(item, "count", "total", "value", "quantity"));
        return status ? { status, count } : null;
      })
      .filter((item): item is CallStatusItem => Boolean(item));
  }
  if (isRecord(raw)) {
    return Object.entries(raw).map(([status, count]) => ({
      status,
      count: asNumber(count),
    }));
  }
  return [];
}

export function toTask(record: JsonRecord, index: number): Task | null {
  const id = asText(pick(record, "id", "taskId", "smeTaskId"), "");
  if (!id) return null;
  const status = classifyStatus(record);
  const priorityText = asText(
    pick(record, "priority", "priorityName", "taskPriority"),
    "",
  );
  return {
    id,
    customer: asText(
      pick(
        record,
        "customerName",
        "companyName",
        "leadName",
        "customer.customerName",
        "customer.companyName",
        "customer.name",
        "name",
      ),
      `Khách hàng ${index + 1}`,
    ),
    cif: asText(
      pick(record, "cif", "cifNo", "customerCif", "customer.cif"),
      "Chưa có CIF",
    ),
    source: asText(
      pick(
        record,
        "sourceDescription",
        "customerSourceDes",
        "leadSourceName",
        "sourceName",
        "source",
        "campaignName",
      ),
      "SME Connect",
    ),
    owner: asText(
      pick(record, "recipient", "supporter", "assigner", "username", "ownerName", "assignee"),
      "Baynv",
    ),
    status,
    createdAt: formatApiDate(
      pick(record, "createdAt", "createdDate", "creationDate", "createdTime"),
    ),
    due:
      status === "Đã hoàn tất"
        ? "Đã xong"
        : formatApiDate(
            pick(record, "expiryDate", "dueDate", "deadline", "expectedDate", "endDate"),
          ),
    phone: asText(
      pick(record, "phone", "phoneNumber", "mobile", "customer.phone"),
      "Chưa cập nhật",
    ),
    businessNumber: asText(
      pick(record, "businessNumber", "taxCode", "customer.businessNumber"),
      "",
    ),
    campaign: asText(pick(record, "campaignName", "campaignMasterName"), "—"),
    program: asText(
      pick(record, "explorationProgramDescription", "explorationProgramCode"),
      "—",
    ),
    department: asText(
      pick(record, "recipientDepartmentName", "departmentName", "daoCode"),
      "—",
    ),
    priority:
      /HIGH|CAO|URGENT/i.test(priorityText) || Boolean(record.warning)
        ? "Cao"
        : "Bình thường",
    customerId: asText(
      pick(record, "customerId", "customer.customerId", "customer.id"),
      "",
    ) || undefined,
    raw: record,
  };
}

export function toOptions(value: unknown, idKeys: string[]): ApiOption[] {
  return normalizeArray(value)
    .map((record) => {
      const id = asText(pick(record, ...idKeys), "");
      const code = asText(pick(record, "code"), "");
      const label = asText(
        pick(record, "description", "name", "label", "activityTypeName"),
        code || `Mã ${id}`,
      );
      return id ? { id, label, code } : null;
    })
    .filter((option): option is ApiOption => Boolean(option));
}
