/* ------------------------------------------------------------------ */
/*  lib/ai-prompts.ts                                                  */
/*  System prompts & prompt builders cho DeepSeek AI integration       */
/*  Tách riêng để dễ tune prompt mà không sửa logic code              */
/* ------------------------------------------------------------------ */

import type { Task, ActivityItem, ApiOption } from "./constants";

/* ============================== */
/*  SYSTEM PROMPTS (cố định)      */
/*  → DeepSeek tự cache khi gửi  */
/*  lặp lại → giảm 98% input $   */
/* ============================== */

export const SYSTEM_NOTE_GENERATOR = `Bạn là trợ lý AI cho Chuyên viên Quản lý Khách hàng SME tại VPBank (Ngân hàng TMCP Việt Nam Thịnh Vượng).
Nhiệm vụ: Viết ghi chú nghiệp vụ ngắn gọn, chuyên nghiệp bằng tiếng Việt cho hoạt động chăm sóc khách hàng.

QUY TẮC:
- Viết 2-4 câu, tối đa 80 từ
- Giọng điệu: chuyên nghiệp, ngắn gọn, đi thẳng vào vấn đề
- Nội dung: mô tả hành động đã thực hiện + kết quả + bước tiếp theo (nếu có)
- KHÔNG dùng emoji, KHÔNG chào hỏi, KHÔNG viết tiêu đề
- KHÔNG bịa thông tin không có trong context
- Nếu KH quan tâm sản phẩm → gợi ý sản phẩm VPBank phù hợp (SmartSME, Bảo lãnh, Tín dụng, LC)
- Dùng từ ngữ ngân hàng chuẩn mực`;

export const SYSTEM_LEAD_BRIEFING = `Bạn là trợ lý AI cho Chuyên viên Quản lý Khách hàng SME tại VPBank.
Nhiệm vụ: Tóm tắt thông tin khách hàng tiềm năng (lead) và đề xuất kịch bản tư vấn.

QUY TẮC:
- Viết bằng tiếng Việt, tối đa 150 từ
- Chia thành 3 phần: TÓM TẮT, ĐỀ XUẤT SẢN PHẨM, GỢI Ý MỞ ĐẦU
- Dùng bullet points, dễ scan nhanh
- KHÔNG bịa thông tin, chỉ phân tích dữ liệu được cung cấp
- Nếu có lịch sử đấu thầu → phân tích tỷ lệ trúng thầu và đề xuất sản phẩm bảo lãnh
- Gợi ý câu mở đầu cuộc gọi phù hợp với hoàn cảnh KH`;

export const SYSTEM_PERFORMANCE_INSIGHTS = `Bạn là trợ lý AI phân tích hiệu suất bán hàng cho Chuyên viên SME tại VPBank.
Nhiệm vụ: Phân tích dữ liệu hoạt động và đưa ra 3-5 nhận xét hành động cụ thể.

QUY TẮC:
- Viết bằng tiếng Việt, tối đa 120 từ
- Mỗi nhận xét bắt đầu bằng bullet "•"
- Tập trung vào: điểm mạnh, điểm cần cải thiện, hành động cụ thể
- Dùng số liệu % khi so sánh
- Nếu tỷ lệ nghe máy thấp → gợi ý khung giờ gọi tốt hơn
- Nếu task quá hạn → cảnh báo ưu tiên xử lý
- Giọng điệu: huấn luyện viên tích cực, không phê phán`;

export const SYSTEM_BATCH_NOTES = `Bạn là trợ lý AI cho Chuyên viên Quản lý Khách hàng SME tại VPBank.
Nhiệm vụ: Tạo ghi chú cá nhân hóa cho TỪNG khách hàng trong một lô xử lý hàng loạt.

QUY TẮC:
- Trả về JSON array, mỗi phần tử có 2 trường: "taskId" và "note"
- Mỗi ghi chú 1-2 câu, tối đa 50 từ, phù hợp với đặc thù từng KH
- Biến tấu cách diễn đạt giữa các ghi chú (không copy-paste)
- KHÔNG dùng emoji
- Giữ nghiệp vụ ngân hàng chuẩn mực
- Format: [{"taskId":"...","note":"..."},...]`;

/* ============================== */
/*  CONTEXT BUILDERS (user msg)   */
/* ============================== */

/** Thông tin context cho AI Note Generator */
export interface NoteContext {
  activityType: string;
  activityResult: string;
  customerName?: string;
  source?: string;
  campaign?: string;
  program?: string;
  recentHistory?: string;       // tóm tắt lịch sử gần nhất
  contractorWinRate?: string;   // nếu có
}

export function buildNotePrompt(ctx: NoteContext): string {
  const parts: string[] = [
    `Loại hoạt động: ${ctx.activityType}`,
    `Kết quả: ${ctx.activityResult}`,
  ];
  if (ctx.customerName) parts.push(`KH: ${ctx.customerName}`);
  if (ctx.source) parts.push(`Nguồn: ${ctx.source}`);
  if (ctx.campaign) parts.push(`Chiến dịch: ${ctx.campaign}`);
  if (ctx.program) parts.push(`Chương trình: ${ctx.program}`);
  if (ctx.recentHistory) parts.push(`Lịch sử gần nhất: ${ctx.recentHistory}`);
  if (ctx.contractorWinRate) parts.push(`Tỷ lệ trúng thầu: ${ctx.contractorWinRate}`);
  return `Viết ghi chú nghiệp vụ cho hoạt động sau:\n${parts.join("\n")}`;
}

/** Thông tin context cho Lead Briefing */
export interface BriefingContext {
  customerName?: string;
  cif?: string;
  source?: string;
  campaign?: string;
  program?: string;
  priority?: string;
  dueDate?: string;
  owner?: string;
  department?: string;
  phone?: string;
  taxId?: string;
  activityHistory?: Array<{ type: string; result: string; note: string; date: string }>;
  contractorInfo?: {
    totalBids?: number;
    wonBids?: number;
    winRate?: string;
    totalWinValue?: string;
  };
}

export function buildBriefingPrompt(ctx: BriefingContext): string {
  const parts: string[] = [];
  if (ctx.customerName) parts.push(`KH: ${ctx.customerName}`);
  if (ctx.source) parts.push(`Nguồn: ${ctx.source}`);
  if (ctx.campaign) parts.push(`Chiến dịch: ${ctx.campaign}`);
  if (ctx.program) parts.push(`Chương trình: ${ctx.program}`);
  if (ctx.priority) parts.push(`Độ ưu tiên: ${ctx.priority}`);
  if (ctx.dueDate) parts.push(`Hạn xử lý: ${ctx.dueDate}`);
  if (ctx.activityHistory && ctx.activityHistory.length > 0) {
    const hist = ctx.activityHistory
      .slice(0, 5) // chỉ lấy 5 gần nhất để tiết kiệm token
      .map((a) => `  - ${a.date}: ${a.type} → ${a.result}${a.note ? ` (${a.note.slice(0, 60)})` : ""}`)
      .join("\n");
    parts.push(`Lịch sử hoạt động:\n${hist}`);
  }
  if (ctx.contractorInfo) {
    const c = ctx.contractorInfo;
    parts.push(
      `Đấu thầu: ${c.totalBids ?? 0} gói, trúng ${c.wonBids ?? 0} (${c.winRate ?? "N/A"}), tổng giá trúng: ${c.totalWinValue ?? "N/A"}`
    );
  }
  return `Tóm tắt lead và đề xuất tư vấn:\n${parts.join("\n")}`;
}

/** Thông tin context cho Performance Insights */
export interface PerformanceContext {
  doneCount: number;
  planCount: number;
  callTotal: number;
  avgCallCountPerDay: string;
  avgCallDuration: string;
  answerRate?: string;
  callStatuses?: Array<{ status: string; count: number }>;
  dateRange?: string;
}

export function buildPerformancePrompt(ctx: PerformanceContext): string {
  const parts: string[] = [
    `Kỳ báo cáo: ${ctx.dateRange ?? "N/A"}`,
    `Task hoàn thành: ${ctx.doneCount}/${ctx.planCount} (${ctx.planCount > 0 ? Math.round((ctx.doneCount / ctx.planCount) * 100) : 0}%)`,
    `Tổng cuộc gọi: ${ctx.callTotal}`,
    `TB cuộc gọi/ngày: ${ctx.avgCallCountPerDay}`,
    `TB thời lượng: ${ctx.avgCallDuration}`,
  ];
  if (ctx.callStatuses && ctx.callStatuses.length > 0) {
    const statusStr = ctx.callStatuses
      .map((s) => `${s.status}: ${s.count}`)
      .join(", ");
    parts.push(`Phân bổ cuộc gọi: ${statusStr}`);
  }
  if (ctx.answerRate) parts.push(`Tỷ lệ nghe máy: ${ctx.answerRate}`);
  return `Phân tích hiệu suất và đưa nhận xét:\n${parts.join("\n")}`;
}

/** Context cho Batch Notes */
export interface BatchNoteTask {
  taskId: string;
  customerName?: string;
  source?: string;
  campaign?: string;
}

export interface BatchNoteContext {
  activityType: string;
  activityResult: string;
  tasks: BatchNoteTask[];
}

export function buildBatchNotesPrompt(ctx: BatchNoteContext): string {
  const taskList = ctx.tasks
    .slice(0, 20) // giới hạn 20 task/lần để tiết kiệm token
    .map((t) => {
      const info = [t.taskId];
      if (t.customerName) info.push(`KH: ${t.customerName}`);
      if (t.source) info.push(`Nguồn: ${t.source}`);
      if (t.campaign) info.push(`CĐ: ${t.campaign}`);
      return `  - ${info.join(" | ")}`;
    })
    .join("\n");
  return `Tạo ghi chú cá nhân hóa cho lô ${ctx.tasks.length} task.
Loại hoạt động: ${ctx.activityType}
Kết quả: ${ctx.activityResult}
Danh sách task:
${taskList}

Trả về JSON array: [{"taskId":"...","note":"..."},...]`;
}
