/* ------------------------------------------------------------------ */
/*  hooks/use-ai.ts                                                    */
/*  React hook quản lý tất cả AI interactions                          */
/*  - Streaming text reader cho real-time UI                           */
/*  - sessionStorage cache giảm API calls                              */
/*  - Debounce 2s chống spam                                           */
/*  - Batch notes generation                                           */
/* ------------------------------------------------------------------ */

"use client";

import { useState, useCallback, useRef } from "react";
import type {
  NoteContext,
  BriefingContext,
  PerformanceContext,
  BatchNoteContext,
} from "@/lib/ai-prompts";

/* ---------- Types ---------- */

type AiAction = "generate-note" | "lead-briefing" | "performance-insights" | "batch-notes";

interface BatchNoteResult {
  taskId: string;
  note: string;
}

interface UseAiReturn {
  /** Current AI-generated text (streams in real-time) */
  aiText: string;
  /** Whether an AI call is in progress */
  aiLoading: boolean;
  /** Error message if the call failed */
  aiError: string | null;
  /** Generate a note for a single activity */
  generateNote: (context: NoteContext) => Promise<string>;
  /** Generate a lead briefing summary */
  leadBriefing: (context: BriefingContext) => Promise<string>;
  /** Generate performance insights */
  performanceInsights: (context: PerformanceContext) => Promise<string>;
  /** Generate personalized notes for a batch of tasks */
  batchNotes: (context: BatchNoteContext) => Promise<BatchNoteResult[]>;
  /** Clear current AI text */
  clearAiText: () => void;
}

/* ---------- Cache Helpers ---------- */

function cacheKey(action: AiAction, context: unknown): string {
  const hash = JSON.stringify(context)
    .split("")
    .reduce((acc, char) => {
      const h = ((acc << 5) - acc + char.charCodeAt(0)) | 0;
      return h;
    }, 0);
  return `ai-cache:${action}:${hash}`;
}

function getCached(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function setCache(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // sessionStorage might be full or unavailable
  }
}

/* ---------- Hook ---------- */

export function useAi(): UseAiReturn {
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Debounce ref: block calls within 2 seconds of last call
  const lastCallRef = useRef(0);
  const DEBOUNCE_MS = 2000;

  /** Stream a response from /api/ai */
  const callAiStream = useCallback(
    async (action: AiAction, context: unknown): Promise<string> => {
      // Debounce check
      const now = Date.now();
      if (now - lastCallRef.current < DEBOUNCE_MS) {
        return aiText; // Return existing text if called too fast
      }
      lastCallRef.current = now;

      // Check cache
      const key = cacheKey(action, context);
      const cached = getCached(key);
      if (cached) {
        setAiText(cached);
        return cached;
      }

      setAiLoading(true);
      setAiError(null);
      setAiText("");

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, context }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Lỗi không xác định" })) as { error?: string };
          throw new Error(errorData.error ?? `HTTP ${res.status}`);
        }

        // Check if it's a streaming response
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("text/plain") && res.body) {
          // Stream reading
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let fullText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
            setAiText(fullText);
          }

          // Cache the result
          setCache(key, fullText);
          setAiLoading(false);
          return fullText;
        } else {
          // JSON response (non-streaming)
          const data = (await res.json()) as { content?: string };
          const text = data.content ?? "";
          setAiText(text);
          setCache(key, text);
          setAiLoading(false);
          return text;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Lỗi kết nối AI";
        setAiError(message);
        setAiLoading(false);
        throw err;
      }
    },
    [aiText],
  );

  /** Generate note for single activity */
  const generateNote = useCallback(
    (context: NoteContext) => callAiStream("generate-note", context),
    [callAiStream],
  );

  /** Generate lead briefing */
  const leadBriefing = useCallback(
    (context: BriefingContext) => callAiStream("lead-briefing", context),
    [callAiStream],
  );

  /** Generate performance insights */
  const performanceInsights = useCallback(
    (context: PerformanceContext) => callAiStream("performance-insights", context),
    [callAiStream],
  );

  /** Generate personalized batch notes */
  const batchNotes = useCallback(
    async (context: BatchNoteContext): Promise<BatchNoteResult[]> => {
      // Debounce
      const now = Date.now();
      if (now - lastCallRef.current < DEBOUNCE_MS) {
        return [];
      }
      lastCallRef.current = now;

      // Check cache
      const key = cacheKey("batch-notes", context);
      const cached = getCached(key);
      if (cached) {
        try {
          return JSON.parse(cached) as BatchNoteResult[];
        } catch {
          // Invalid cache, proceed to API call
        }
      }

      setAiLoading(true);
      setAiError(null);

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "batch-notes", context }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Lỗi" })) as { error?: string };
          throw new Error(errorData.error ?? `HTTP ${res.status}`);
        }

        const data = (await res.json()) as { content?: string };
        const content = data.content ?? "[]";

        // Parse JSON array from AI response
        // AI might return with markdown code fences, strip them
        const cleaned = content
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "")
          .trim();

        let results: BatchNoteResult[];
        try {
          results = JSON.parse(cleaned) as BatchNoteResult[];
        } catch {
          // If parsing fails, return empty
          console.warn("[AI] Failed to parse batch notes JSON:", cleaned);
          results = [];
        }

        // Cache
        setCache(key, JSON.stringify(results));
        setAiLoading(false);
        return results;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Lỗi AI batch";
        setAiError(message);
        setAiLoading(false);
        throw err;
      }
    },
    [],
  );

  const clearAiText = useCallback(() => {
    setAiText("");
    setAiError(null);
  }, []);

  return {
    aiText,
    aiLoading,
    aiError,
    generateNote,
    leadBriefing,
    performanceInsights,
    batchNotes,
    clearAiText,
  };
}
