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
  const taskStatus = String(
    record.taskStatus || record.status || record.taskStatusName || record.statusName || "",
  ).toUpperCase().trim();

  // 1. Đã hoàn tất / Đã duyệt hoàn thành / Đã kết thúc
  if (
    taskStatus === "END" ||
    taskStatus === "ACCEPT_COMPLETE" ||
    taskStatus === "DONE" ||
    taskStatus === "COMPLETED" ||
    taskStatus === "COMPLETE" ||
    /^(END|ACCEPT_COMPLETE|DONE|COMPLETED)$/i.test(taskStatus) ||
    /HOÀN TẤT|HOAN TAT|ĐÃ XỬ LÝ|DA XU LY|ĐÃ KẾT THÚC|DA KET THUC|ĐÃ DUYỆT/i.test(taskStatus)
  ) {
    return "Đã hoàn tất";
  }

  // 2. Từ chối hoàn tất
  if (taskStatus === "REJECT_COMPLETE" || /REJECT|TỪ CHỐI|TU CHOI/i.test(taskStatus)) {
    return "Từ chối hoàn tất";
  }

  // 3. Không hoàn tất / Đã hủy
  if (
    taskStatus === "NOT_COMPLETE" ||
    taskStatus === "CANCEL" ||
    taskStatus === "CANCELLED" ||
    /NOT_COMPLETE|KHÔNG HOÀN TẤT|KHONG HOAN TAT|ĐÃ HỦY|DA HUY/i.test(taskStatus)
  ) {
    return "Không hoàn tất";
  }

  // 4. Chờ tiếp nhận / Mới
  if (
    taskStatus === "NEW" ||
    taskStatus === "WAITING_RECEIVE" ||
    taskStatus === "ASSIGNED" ||
    taskStatus === "PENDING" ||
    /WAITING_RECEIVE|NEW|CHỜ|CHO|PENDING|TIẾP NHẬN|TIEP NHAN|MỚI|MOI/i.test(taskStatus)
  ) {
    return "Chờ tiếp nhận";
  }

  // 5. Quá hạn xử lý
  const expiryRaw = pick(record, "expiryDate", "dueDate", "deadline");
  if (expiryRaw) {
    const expDateStr = String(expiryRaw).slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);
    if (expDateStr < todayStr && (taskStatus === "PROCESSING" || taskStatus === "IN_PROGRESS")) {
      return "Quá hạn";
    }
  }

  // 6. Đang xử lý
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
      status === "Đã hoàn tất" || status === "Từ chối hoàn tất" || status === "Không hoàn tất"
        ? "Đã đóng"
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
