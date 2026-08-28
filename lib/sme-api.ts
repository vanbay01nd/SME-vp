import { JsonRecord } from "@/lib/constants";
import { isRecord, pick, unwrapRecord } from "@/lib/task-mapper";
import { asText } from "@/lib/formatters";

export function getApiError(data: unknown, fallback: string) {
  if (isRecord(data)) {
    const direct = pick(data, "error", "message", "errorMessage", "data.message");
    if (direct) return asText(direct);
  }
  if (typeof data === "string" && data.length < 300) return data;
  return fallback;
}

export async function smeCall(token: string, payload: JsonRecord) {
  const response = await fetch("/api/sme", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sme-token": token,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const envelope = (await response.json().catch(() => ({}))) as JsonRecord;
  if (!response.ok) {
    const fallback =
      response.status === 401
        ? "Token đã hết hạn hoặc không hợp lệ."
        : `SME Connect trả về lỗi HTTP ${response.status}.`;
    throw new Error(getApiError(envelope, fallback));
  }
  return envelope.data;
}

export function responseSucceeded(data: unknown) {
  if (data === null || data === undefined) return false;
  if (Array.isArray(data) && data.length === 0) return false;
  const record = unwrapRecord(data);
  return !("errorCode" in record) && record.success !== false;
}

export function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
