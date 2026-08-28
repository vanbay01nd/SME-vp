import { JsonRecord } from "@/lib/constants";
import { isRecord, pick } from "@/lib/task-mapper";

export function asText(value: unknown, fallback = "—") {
  const text = value === undefined || value === null ? "" : String(value).trim();
  return text || fallback;
}

export function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function formatApiDate(value: unknown) {
  const text = asText(value, "—");
  if (text === "—") return text;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function dateInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function responseTotal(value: unknown, fallback: number) {
  if (!isRecord(value)) return fallback;
  return asNumber(
    pick(value, "total", "totalElements", "data.total", "result.total"),
    fallback,
  );
}

export function formatCount(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(number)
    : "—";
}

export function formatRate(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  const percent = Math.abs(number) <= 1 ? number * 100 : number;
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(percent)}%`;
}

export function summarizeComplex(value: unknown, limit = 5) {
  if (Array.isArray(value)) {
    const labels = value
      .map((item) =>
        isRecord(item)
          ? asText(pick(item, "description", "name", "label", "location", "code"), "")
          : asText(item, ""),
      )
      .filter(Boolean);
    return labels.slice(0, limit).join(" · ") || "—";
  }
  if (isRecord(value)) {
    return Object.entries(value)
      .slice(0, limit)
      .map(([key, item]) => {
        const label = isRecord(item)
          ? asText(pick(item, "description", "name", "label", "count", "value"), "")
          : asText(item, "");
        return label ? `${key}: ${label}` : key;
      })
      .join(" · ") || "—";
  }
  return asText(value);
}
