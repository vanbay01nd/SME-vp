/* ------------------------------------------------------------------ */
/*  app/api/ai/route.ts                                                */
/*  API endpoint duy nhất cho tất cả AI features                       */
/*  - Streaming response cho UX mượt mà                                */
/*  - PII filtering trước khi gửi DeepSeek                            */
/*  - Rate limiting 10 calls/phút/session                              */
/*  - Tối ưu chi phí: deepseek-flash, max_tokens thấp, temp 0.3      */
/* ------------------------------------------------------------------ */

import { NextRequest } from "next/server";
import {
  SYSTEM_NOTE_GENERATOR,
  SYSTEM_LEAD_BRIEFING,
  SYSTEM_PERFORMANCE_INSIGHTS,
  SYSTEM_BATCH_NOTES,
  buildNotePrompt,
  buildBriefingPrompt,
  buildPerformancePrompt,
  buildBatchNotesPrompt,
} from "@/lib/ai-prompts";
import type {
  NoteContext,
  BriefingContext,
  PerformanceContext,
  BatchNoteContext,
} from "@/lib/ai-prompts";

/* ---------- Configuration ---------- */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? "";
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const MODEL = "deepseek-flash";

const noStoreHeaders = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
};

/* ---------- Rate Limiting ---------- */

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateBucket>();
const RATE_LIMIT = 10;        // max calls
const RATE_WINDOW_MS = 60_000; // per minute

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = rateLimitMap.get(key);
  if (!bucket || now >= bucket.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT) return false;
  bucket.count += 1;
  return true;
}

/* ---------- PII Sanitizer ---------- */

/** Lọc thông tin nhạy cảm trước khi gửi AI */
function sanitizePII(text: string): string {
  return text
    // Số điện thoại VN
    .replace(/(\+?84|0)\d{8,10}/g, "[SĐT]")
    // CIF (8-12 chữ số độc lập)
    .replace(/\b\d{8,12}\b/g, (match) => {
      // Giữ lại các số ngắn như task ID (thường 5-6 số)
      return match.length >= 8 ? "[MÃ_KH]" : match;
    })
    // Mã số thuế (10 hoặc 13 chữ số)
    .replace(/\b\d{10}(\d{3})?\b/g, "[MST]")
    // Email
    .replace(/[\w.+-]+@[\w.-]+\.\w+/g, "[EMAIL]");
}

/* ---------- Action → Config Mapping ---------- */

type AiAction = "generate-note" | "lead-briefing" | "performance-insights" | "batch-notes";

interface ActionConfig {
  system: string;
  maxTokens: number;
  stream: boolean;
  buildPrompt: (context: Record<string, unknown>) => string;
}

const ACTION_MAP: Record<AiAction, ActionConfig> = {
  "generate-note": {
    system: SYSTEM_NOTE_GENERATOR,
    maxTokens: 150,
    stream: true,
    buildPrompt: (ctx) => buildNotePrompt(ctx as unknown as NoteContext),
  },
  "lead-briefing": {
    system: SYSTEM_LEAD_BRIEFING,
    maxTokens: 300,
    stream: true,
    buildPrompt: (ctx) => buildBriefingPrompt(ctx as unknown as BriefingContext),
  },
  "performance-insights": {
    system: SYSTEM_PERFORMANCE_INSIGHTS,
    maxTokens: 250,
    stream: true,
    buildPrompt: (ctx) => buildPerformancePrompt(ctx as unknown as PerformanceContext),
  },
  "batch-notes": {
    system: SYSTEM_BATCH_NOTES,
    maxTokens: 800, // nhiều task → cần nhiều token hơn
    stream: false,   // batch trả JSON, không stream
    buildPrompt: (ctx) => buildBatchNotesPrompt(ctx as unknown as BatchNoteContext),
  },
};

/* ---------- Route Handler ---------- */

export async function POST(request: NextRequest) {
  // 1. Validate API key exists
  if (!DEEPSEEK_API_KEY) {
    return Response.json(
      { error: "AI chưa được cấu hình. Thiếu DEEPSEEK_API_KEY." },
      { status: 500, headers: noStoreHeaders },
    );
  }

  // 2. Parse body
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json(
      { error: "Body không hợp lệ." },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const action = String(body.action ?? "") as AiAction;
  const context = (body.context ?? {}) as Record<string, unknown>;

  // 3. Validate action
  const config = ACTION_MAP[action];
  if (!config) {
    return Response.json(
      { error: `Action "${action}" không hợp lệ. Hỗ trợ: ${Object.keys(ACTION_MAP).join(", ")}` },
      { status: 400, headers: noStoreHeaders },
    );
  }

  // 4. Rate limiting
  const clientIP =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const rateLimitKey = `ai:${clientIP}`;

  if (!checkRateLimit(rateLimitKey)) {
    return Response.json(
      { error: "Bạn đang gửi yêu cầu AI quá nhanh. Vui lòng đợi 1 phút." },
      { status: 429, headers: noStoreHeaders },
    );
  }

  // 5. Build prompt with PII sanitization
  const userPrompt = sanitizePII(config.buildPrompt(context));

  // 6. Call DeepSeek API
  try {
    const dsResponse = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: config.system },
          { role: "user", content: userPrompt },
        ],
        max_tokens: config.maxTokens,
        temperature: 0.3,
        stream: config.stream,
      }),
    });

    if (!dsResponse.ok) {
      const errText = await dsResponse.text().catch(() => "Unknown error");
      console.error(`[AI] DeepSeek error ${dsResponse.status}:`, errText);

      let errorMessage = "AI tạm thời không phản hồi. Vui lòng thử lại sau.";
      if (dsResponse.status === 402 || errText.includes("Insufficient Balance")) {
        errorMessage = "Tài khoản DeepSeek API đã hết số dư (Insufficient Balance). Vui lòng nạp thêm số dư tại platform.deepseek.com để sử dụng tính năng AI.";
      } else if (dsResponse.status === 401 || errText.includes("Authentication Fails")) {
        errorMessage = "Khóa API DeepSeek không hợp lệ hoặc đã hết hạn.";
      }

      return Response.json(
        { error: errorMessage },
        { status: dsResponse.status === 402 ? 402 : 502, headers: noStoreHeaders },
      );
    }

    // 7a. Non-streaming response (batch-notes)
    if (!config.stream) {
      const result = (await dsResponse.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = result.choices?.[0]?.message?.content ?? "";
      return Response.json(
        { content },
        { headers: noStoreHeaders },
      );
    }

    // 7b. Streaming response — pipe SSE chunks to client
    if (!dsResponse.body) {
      return Response.json(
        { error: "Không nhận được dữ liệu stream từ AI." },
        { status: 502, headers: noStoreHeaders },
      );
    }

    const readable = new ReadableStream({
      async start(controller) {
        const reader = dsResponse.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;
              const data = trimmed.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data) as {
                  choices?: Array<{ delta?: { content?: string } }>;
                };
                const chunk = parsed.choices?.[0]?.delta?.content;
                if (chunk) {
                  controller.enqueue(new TextEncoder().encode(chunk));
                }
              } catch {
                // Ignore malformed SSE lines
              }
            }
          }
        } catch (err) {
          console.error("[AI] Stream read error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (err) {
    console.error("[AI] Unexpected error:", err);
    return Response.json(
      { error: "Lỗi kết nối đến AI. Kiểm tra kết nối mạng." },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
