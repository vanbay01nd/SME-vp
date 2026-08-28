export type JsonRecord = Record<string, unknown>;
export type TaskStatus = "Chờ tiếp nhận" | "Đang xử lý" | "Đã hoàn tất";
export type WorkspaceView = "tasks" | "performance" | "contractor" | "audit";

export type Task = {
  id: string;
  customer: string;
  cif: string;
  source: string;
  owner: string;
  status: TaskStatus;
  createdAt: string;
  due: string;
  phone: string;
  businessNumber: string;
  campaign: string;
  program: string;
  department: string;
  priority: "Cao" | "Bình thường";
  customerId?: string;
  raw?: JsonRecord;
};

export type ApiOption = { id: string; label: string; code: string };
export type TaskHistoryItem = {
  id: string;
  description: string;
  user: string;
  at: string;
};
export type ActivityItem = {
  id: string;
  taskId: string;
  customer: string;
  status: string;
  type: string;
  result: string;
  note: string;
  at: string;
};
export type CallStatusItem = { status: string; count: number };
export type PerformanceSnapshot = {
  doneCount: number;
  planCount: number;
  callTotal: number;
  avgCallCountPerDay: string;
  avgCallDuration: string;
  callStatuses: CallStatusItem[];
  activities: ActivityItem[];
  customerSourceCount: number;
  programCount: number;
  productCount: number;
  loadedAt: string;
};
export type NoteTemplate = {
  id: string;
  label: string;
  description: string;
  template: string;
};
export type AuditEntry = {
  taskId: string;
  customer: string;
  status: "Thành công" | "Thất bại";
  activity: string;
  result: string;
  at: string;
  verified?: boolean;
  message?: string;
};
export type ActivityDraft = {
  activityTypeId: string;
  activityResultId: string;
  note: string;
  selectedTemplateId: string;
  personalizeBatch: boolean;
  updatedAt: string;
};
export type AuditFilter = "all" | "success" | "failed";

export type MaskLevel = 'off' | 'partial' | 'full';
export type PrivacyConfig = { level: MaskLevel; fields: { customerName: boolean; cif: boolean; phone: boolean; taxId: boolean; staffName: boolean; department: boolean; } };

export const SME_LOGIN = "https://smeconnect.vpbank.com.vn/digitalgate/login";
export const TOKEN_COMMAND = "localStorage.getItem('authtoken')";
export const ACTIVITY_DRAFT_KEY = "sme-connect-activity-draft-v1";
export const MOBILE_TOKEN_BOOKMARKLET =
  "javascript:(()=>{const t=localStorage.getItem('authtoken');if(!t){alert('Không tìm thấy token. Hãy đăng nhập lại SME Connect.');return}const f=()=>prompt('Giữ vào token để sao chép:',t);if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(()=>alert('Đã sao chép token. Quay lại SME Connect Task Manager.')).catch(f)}else{f()}})()";

export const statusStyles: Record<TaskStatus, string> = {
  "Chờ tiếp nhận": "border-amber-200 bg-amber-50 text-amber-700",
  "Đang xử lý": "border-blue-200 bg-blue-50 text-blue-700",
  "Đã hoàn tất": "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export const callStatusLabels: Record<string, string> = {
  ANSWERED: "Nghe máy",
  BUSY: "Máy bận",
  NO_ANSWERED: "Không nghe máy",
  FAILED: "Thất bại",
};

export const noteVariables = ["{customer}", "{taskId}", "{cif}", "{source}"];
