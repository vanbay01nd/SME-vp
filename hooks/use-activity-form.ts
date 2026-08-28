"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { smeCall } from "@/lib/sme-api";
import { ApiOption, ActivityItem } from "@/lib/constants";
import { toOptions } from "@/lib/task-mapper";
import { noteTemplates } from "@/lib/note-templates";

const ACTIVITY_DRAFT_KEY = "sme-connect-activity-draft-v1";

type ActivityDraft = {
  activityTypeId: string;
  activityResultId: string;
  note: string;
  selectedTemplateId: string;
  personalizeBatch: boolean;
  updatedAt: string;
};

export function useActivityForm({ token, connected, activityTypes }: {
  token: string;
  connected: boolean;
  activityTypes: ApiOption[];
}) {
  const [activityResults, setActivityResults] = useState<ApiOption[]>([]);
  const [activityTypeId, setActivityTypeId] = useState("");
  const [activityResultId, setActivityResultId] = useState("");
  const [note, setNote] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [personalizeBatch, setPersonalizeBatch] = useState(true);
  const [resultsBusy, setResultsBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [draftAvailable, setDraftAvailable] = useState(false);
  const [draftUpdatedAt, setDraftUpdatedAt] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const stored = sessionStorage.getItem(ACTIVITY_DRAFT_KEY);
        if (!stored) return;
        const draft = JSON.parse(stored) as Partial<ActivityDraft>;
        setDraftAvailable(true);
        setDraftUpdatedAt(typeof draft.updatedAt === "string" ? draft.updatedAt : "");
      } catch {
        setDraftAvailable(false);
      }
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!activityTypeId && !activityResultId && !note.trim()) return;
    const timeoutId = window.setTimeout(() => {
      const updatedAt = new Date().toISOString();
      const draft: ActivityDraft = {
        activityTypeId,
        activityResultId,
        note,
        selectedTemplateId,
        personalizeBatch,
        updatedAt,
      };
      try {
        sessionStorage.setItem(ACTIVITY_DRAFT_KEY, JSON.stringify(draft));
        setDraftAvailable(true);
        setDraftUpdatedAt(updatedAt);
      } catch {
        // Chế độ duyệt riêng tư có thể chặn sessionStorage; form vẫn hoạt động bình thường.
      }
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [activityResultId, activityTypeId, note, personalizeBatch, selectedTemplateId]);

  const selectActivityType = async (value: string): Promise<ApiOption[]> => {
    setActivityTypeId(value);
    setActivityResultId("");
    setActivityResults([]);
    if (!connected || !token) return [];
    setResultsBusy(true);
    try {
      const data = await smeCall(token, {
        action: "activity-results",
        activityTypeId: value,
      });
      const options = toOptions(data, ["activityResultId", "id", "resultId"]);
      setActivityResults(options);
      return options;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được kết quả hoạt động.");
      return [];
    } finally {
      setResultsBusy(false);
    }
  };

  const resetActivityForm = () => {
    setActivityTypeId("");
    setActivityResultId("");
    setActivityResults([]);
    setNote("");
    setSelectedTemplateId("");
    setPersonalizeBatch(true);
    setProcessProgress(0);
  };

  const clearActivityDraft = (showMessage = true) => {
    try {
      sessionStorage.removeItem(ACTIVITY_DRAFT_KEY);
    } catch {
      // Không cần chặn thao tác nếu trình duyệt không cho phép truy cập bộ nhớ phiên.
    }
    setDraftAvailable(false);
    setDraftUpdatedAt("");
    if (showMessage) toast.success("Đã xóa bản nháp của phiên này.");
  };

  const restoreActivityDraft = async () => {
    try {
      const stored = sessionStorage.getItem(ACTIVITY_DRAFT_KEY);
      if (!stored) {
        clearActivityDraft(false);
        toast.info("Không còn bản nháp để khôi phục.");
        return;
      }
      const draft = JSON.parse(stored) as Partial<ActivityDraft>;
      const draftNote = typeof draft.note === "string" ? draft.note : "";
      setNote(draftNote);
      setSelectedTemplateId(typeof draft.selectedTemplateId === "string" ? draft.selectedTemplateId : "");
      setPersonalizeBatch(draft.personalizeBatch !== false);

      const savedTypeId = typeof draft.activityTypeId === "string" ? draft.activityTypeId : "";
      const savedResultId = typeof draft.activityResultId === "string" ? draft.activityResultId : "";
      if (connected && token && activityTypes.some((item) => item.id === savedTypeId)) {
        const options = await selectActivityType(savedTypeId);
        if (options.some((item) => item.id === savedResultId)) {
          setActivityResultId(savedResultId);
        }
        toast.success("Đã khôi phục ghi chú và lựa chọn còn hợp lệ từ API.");
      } else {
        setActivityTypeId("");
        setActivityResultId("");
        setActivityResults([]);
        toast.info("Đã khôi phục ghi chú. Kết nối API để chọn lại loại và kết quả thật.");
      }
    } catch {
      clearActivityDraft(false);
      toast.error("Bản nháp không hợp lệ và đã được xóa.");
    }
  };

  const reuseLatestActivityNote = (latestActivityNote?: ActivityItem) => {
    if (!latestActivityNote) return;
    setNote(latestActivityNote.note);
    setSelectedTemplateId("");
    toast.success("Đã dùng lại ghi chú gần nhất của Lead này.");
  };

  const applyNoteTemplate = (templateId: string) => {
    const selected = noteTemplates.find((item) => item.id === templateId);
    if (!selected) return;
    setSelectedTemplateId(selected.id);
    setNote(selected.template);
  };

  const insertNoteVariable = (variable: string) => {
    setSelectedTemplateId("");
    setNote((current) => `${current}${current && !current.endsWith(" ") ? " " : ""}${variable}`);
  };

  const copyCurrentNote = async () => {
    if (!note.trim()) return;
    try {
      await navigator.clipboard.writeText(note.trim());
      toast.success("Đã sao chép ghi chú.");
    } catch {
      toast.error("Không thể sao chép ghi chú.");
    }
  };

  return {
    activityResults,
    activityTypeId,
    setActivityTypeId,
    activityResultId,
    setActivityResultId,
    note,
    setNote,
    selectedTemplateId,
    personalizeBatch,
    setPersonalizeBatch,
    resultsBusy,
    processing,
    setProcessing,
    processProgress,
    setProcessProgress,
    draftAvailable,
    draftUpdatedAt,
    selectActivityType,
    resetActivityForm,
    clearActivityDraft,
    restoreActivityDraft,
    reuseLatestActivityNote,
    applyNoteTemplate,
    insertNoteVariable,
    copyCurrentNote,
  };
}
