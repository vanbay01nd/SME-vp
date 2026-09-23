import assert from "node:assert/strict";
import test from "node:test";
import {
  SYSTEM_NOTE_GENERATOR,
  SYSTEM_LEAD_BRIEFING,
  SYSTEM_PERFORMANCE_INSIGHTS,
  SYSTEM_BATCH_NOTES,
  buildNotePrompt,
  buildBriefingPrompt,
  buildPerformancePrompt,
  buildBatchNotesPrompt,
} from "../lib/ai-prompts.ts";

test("AI Prompts: system prompts contain VPBank banking domain rules", () => {
  assert.ok(SYSTEM_NOTE_GENERATOR.includes("VPBank"));
  assert.ok(SYSTEM_NOTE_GENERATOR.includes("SmartSME"));
  assert.ok(SYSTEM_LEAD_BRIEFING.includes("VPBank"));
  assert.ok(SYSTEM_LEAD_BRIEFING.includes("TÓM TẮT"));
  assert.ok(SYSTEM_PERFORMANCE_INSIGHTS.includes("VPBank"));
  assert.ok(SYSTEM_BATCH_NOTES.includes("JSON"));
});

test("AI Prompts: buildNotePrompt generates correct structured context", () => {
  const prompt = buildNotePrompt({
    activityType: "Gọi điện thoại",
    activityResult: "Khách hàng quan tâm",
    customerName: "CÔNG TY TNHH MINH PHÁT",
    source: "Nhà thầu",
    campaign: "Q3/2026",
    recentHistory: "Gặp trực tiếp → Thành công",
  });

  assert.ok(prompt.includes("Loại hoạt động: Gọi điện thoại"));
  assert.ok(prompt.includes("Kết quả: Khách hàng quan tâm"));
  assert.ok(prompt.includes("KH: CÔNG TY TNHH MINH PHÁT"));
  assert.ok(prompt.includes("Chiến dịch: Q3/2026"));
  assert.ok(prompt.includes("Lịch sử gần nhất: Gặp trực tiếp → Thành công"));
});

test("AI Prompts: buildBriefingPrompt formats lead context and bidding stats", () => {
  const prompt = buildBriefingPrompt({
    customerName: "CÔNG TY CỔ PHẦN CÔNG NGHỆ Á CHÂU",
    cif: "12345678",
    source: "Đấu thầu công",
    campaign: "Bảo lãnh 2026",
    priority: "Cao",
    dueDate: "25/09/2026",
    contractorInfo: {
      totalBids: 15,
      wonBids: 10,
      winRate: "66.7%",
      totalWinValue: "45.000.000.000 VNĐ",
    },
  });

  assert.ok(prompt.includes("KH: CÔNG TY CỔ PHẦN CÔNG NGHỆ Á CHÂU"));
  assert.ok(prompt.includes("Nguồn: Đấu thầu công"));
  assert.ok(prompt.includes("Độ ưu tiên: Cao"));
  assert.ok(prompt.includes("15 gói, trúng 10 (66.7%)"));
});

test("AI Prompts: buildPerformancePrompt formats metrics correctly", () => {
  const prompt = buildPerformancePrompt({
    doneCount: 42,
    planCount: 50,
    callTotal: 65,
    avgCallCountPerDay: "13",
    avgCallDuration: "2p 15s",
    answerRate: "72%",
    dateRange: "01/09/2026 đến 23/09/2026",
  });

  assert.ok(prompt.includes("42/50 (84%)"));
  assert.ok(prompt.includes("Tổng cuộc gọi: 65"));
  assert.ok(prompt.includes("Tỷ lệ nghe máy: 72%"));
});

test("AI Prompts: buildBatchNotesPrompt caps at 20 tasks for token safety", () => {
  const tasks = Array.from({ length: 30 }, (_, i) => ({
    taskId: `TASK_${i + 1}`,
    customerName: `Khách hàng ${i + 1}`,
    source: "SME",
  }));

  const prompt = buildBatchNotesPrompt({
    activityType: "Gọi điện thoại",
    activityResult: "Chưa liên hệ được",
    tasks,
  });

  assert.ok(prompt.includes("TASK_1"));
  assert.ok(prompt.includes("TASK_20"));
  // Tasks beyond 20 should be excluded to respect token limits
  assert.ok(!prompt.includes("TASK_21"));
});
