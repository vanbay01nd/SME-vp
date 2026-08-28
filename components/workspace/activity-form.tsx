"use client";

import { useMemo } from "react";
import {
  UsersRound,
  Phone,
  Clock3,
  BriefcaseBusiness,
  History,
  Activity,
  WandSparkles,
  ShieldCheck,
  FileClock,
  RotateCcw,
  X,
  Copy,
  CircleAlert,
  ClipboardCheck,
  BadgeCheck,
  KeyRound,
  CheckCircle2,
  LoaderCircle,
  Building2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Task, ApiOption, noteVariables } from "@/lib/constants";
import { noteTemplates, renderNoteTemplate } from "@/lib/note-templates";
import { maskName, maskCif, maskPhone } from "@/lib/privacy";

export interface ActivityFormProps {
  actionSheetOpen: boolean;
  closeActionSheet: () => void;
  actionTargets: Task[];
  batchOpen: boolean;
  statusStyles: Record<string, string>;
  connected: boolean;
  openContractorFromTask?: (task: Task) => void;
  loadTaskContext?: (task: Task) => void;
  taskContextBusy?: boolean;
  taskHistory?: Array<{ id: string; description: string; user: string; at: string }>;
  taskActivities?: Array<{ id: string; status: string; type: string; result: string; note: string; at: string }>;
  // Draft props
  draftAvailable: boolean;
  draftTimeLabel: string;
  restoreActivityDraft: () => void;
  clearActivityDraft: () => void;
  processing: boolean;
  latestActivityNote?: string | null;
  reuseLatestActivityNote?: () => void;
  // Activity Type & Result
  activityTypeId: string;
  selectActivityType: (id: string) => Promise<ApiOption[]>;
  activityTypes: ApiOption[];
  activityResultId: string;
  setActivityResultId: (id: string) => void;
  activityResults: ApiOption[];
  resultsBusy: boolean;
  // Note props
  note: string;
  setNote: (note: string) => void;
  selectedTemplateId: string;
  applyNoteTemplate: (id: string) => void;
  copyCurrentNote: () => void;
  insertNoteVariable: (variable: string) => void;
  personalizeBatch: boolean;
  setPersonalizeBatch: (val: boolean) => void;
  // Execution
  processProgress: number;
  setConnectionOpen?: (open: boolean) => void;
  processTargets: () => Promise<void>;
  // Privacy
  maskCustomer?: (val: string) => string;
  maskPhone?: (val: string) => string;
  maskCif?: (val: string) => string;
}

export function ActivityForm({
  actionSheetOpen,
  closeActionSheet,
  actionTargets,
  batchOpen,
  statusStyles,
  connected,
  openContractorFromTask,
  loadTaskContext,
  taskContextBusy = false,
  taskHistory = [],
  taskActivities = [],
  draftAvailable,
  draftTimeLabel,
  restoreActivityDraft,
  clearActivityDraft,
  processing,
  latestActivityNote,
  reuseLatestActivityNote,
  activityTypeId,
  selectActivityType,
  activityTypes,
  activityResultId,
  setActivityResultId,
  activityResults,
  resultsBusy,
  note,
  setNote,
  selectedTemplateId,
  applyNoteTemplate,
  copyCurrentNote,
  insertNoteVariable,
  personalizeBatch,
  setPersonalizeBatch,
  processProgress,
  setConnectionOpen,
  processTargets,
  maskCustomer = (v) => maskName(v, "partial"),
  maskPhone: maskPhoneProp = (v) => maskPhone(v, "partial"),
  maskCif: maskCifProp = (v) => maskCif(v, "partial"),
}: ActivityFormProps) {
  const selectedType = activityTypes.find((t) => t.id === activityTypeId);
  const selectedResult = activityResults.find((r) => r.id === activityResultId);
  const selectedTemplate = noteTemplates.find((t) => t.id === selectedTemplateId);

  // Preflight calculations
  const eligibleTargets = useMemo(
    () => actionTargets.filter((task) => task.status !== "Đã hoàn tất"),
    [actionTargets],
  );

  const completedTargetCount = actionTargets.length - eligibleTargets.length;
  const duplicateTargetCount = useMemo(() => {
    const seen = new Set<string>();
    let duplicates = 0;
    actionTargets.forEach((task) => {
      if (seen.has(task.id)) duplicates++;
      else seen.add(task.id);
    });
    return duplicates;
  }, [actionTargets]);

  const missingPhoneTargetCount = useMemo(
    () =>
      eligibleTargets.filter(
        (t) => !t.phone.trim() || /chưa cập nhật|^—$/i.test(t.phone.trim()),
      ).length,
    [eligibleTargets],
  );

  const renderedTargetNotes = useMemo(() => {
    return eligibleTargets.map((task) =>
      personalizeBatch ? renderNoteTemplate(note.trim(), task) : note.trim(),
    );
  }, [eligibleTargets, note, personalizeBatch]);

  const oversizedNoteCount = useMemo(
    () => renderedTargetNotes.filter((n) => n.length > 2000).length,
    [renderedTargetNotes],
  );

  const unresolvedPlaceholderCount = useMemo(
    () => renderedTargetNotes.filter((n) => /\{[a-z0-9_]+\}/i.test(n)).length,
    [renderedTargetNotes],
  );

  const batchSharedNoteWarning =
    batchOpen && !personalizeBatch && eligibleTargets.length > 1;

  const preflightReady =
    connected &&
    eligibleTargets.length > 0 &&
    Boolean(activityTypeId) &&
    Boolean(activityResultId) &&
    note.trim().length >= 5 &&
    oversizedNoteCount === 0 &&
    unresolvedPlaceholderCount === 0;

  return (
    <Sheet
      open={actionSheetOpen}
      onOpenChange={(open) => !open && closeActionSheet()}
    >
      <SheetContent className="task-sheet sm:max-w-xl">
        {actionTargets.length > 0 && (
          <>
            <SheetHeader>
              <div className="detail-kicker">
                <Badge
                  variant="outline"
                  className={
                    batchOpen
                      ? "border-violet-200 bg-violet-50 text-violet-700"
                      : (statusStyles[actionTargets[0].status] ?? "")
                  }
                >
                  {batchOpen
                    ? `${actionTargets.length} task đã chọn`
                    : actionTargets[0].status}
                </Badge>
                {!batchOpen && <span>#{actionTargets[0].id}</span>}
              </div>
              <SheetTitle>
                {batchOpen
                  ? "Rà soát & nhập Activity theo lô"
                  : maskCustomer(actionTargets[0].customer)}
              </SheetTitle>
              <SheetDescription>
                {batchOpen
                  ? "Mỗi task được gửi tuần tự, có khoảng nghỉ 0,9 giây giữa hai yêu cầu."
                  : `${maskCifProp(actionTargets[0].cif)} · ${actionTargets[0].source}`}
              </SheetDescription>
            </SheetHeader>

            <div className="detail-body">
              {batchOpen ? (
                <div className="batch-summary">
                  {actionTargets.slice(0, 4).map((task) => (
                    <div key={task.id}>
                      <span>#{task.id}</span>
                      <strong>{maskCustomer(task.customer)}</strong>
                    </div>
                  ))}
                  {actionTargets.length > 4 && (
                    <small>+ {actionTargets.length - 4} task khác</small>
                  )}
                </div>
              ) : (
                <div className="detail-card">
                  <div>
                    <UsersRound size={17} />
                    <span>Chuyên viên</span>
                    <strong>{actionTargets[0].owner}</strong>
                  </div>
                  <div>
                    <Phone size={17} />
                    <span>Điện thoại</span>
                    <strong>{maskPhoneProp(actionTargets[0].phone)}</strong>
                  </div>
                  <div>
                    <Clock3 size={17} />
                    <span>Thời hạn</span>
                    <strong>{actionTargets[0].due}</strong>
                  </div>
                </div>
              )}

              {!batchOpen && (
                <section className="lead-360">
                  <div className="lead-360-heading">
                    <div>
                      <span>LEAD 360</span>
                      <strong>Lịch sử và dữ liệu liên quan</strong>
                    </div>
                    <div>
                      {actionTargets[0].businessNumber && openContractorFromTask && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openContractorFromTask(actionTargets[0])}
                        >
                          <BriefcaseBusiness size={14} /> Tra cứu MST
                        </Button>
                      )}
                      {loadTaskContext && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Tải lại lịch sử Lead"
                          onClick={() => loadTaskContext(actionTargets[0])}
                          disabled={!connected || taskContextBusy}
                        >
                          <RefreshCw
                            className={taskContextBusy ? "animate-spin" : ""}
                            size={15}
                          />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="lead-meta-grid">
                    <div>
                      <span>Mã số thuế</span>
                      <strong>{actionTargets[0].businessNumber || "—"}</strong>
                    </div>
                    <div>
                      <span>Chiến dịch</span>
                      <strong>{actionTargets[0].campaign || "—"}</strong>
                    </div>
                    <div>
                      <span>Chương trình</span>
                      <strong>{actionTargets[0].program || "—"}</strong>
                    </div>
                    <div>
                      <span>Đơn vị nhận</span>
                      <strong>{actionTargets[0].department || "—"}</strong>
                    </div>
                  </div>

                  {connected && (
                    <div className="lead-context-grid">
                      <div className="timeline-card">
                        <div className="context-title">
                          <History size={15} /> Lịch sử Task{" "}
                          <Badge variant="outline">{taskHistory.length}</Badge>
                        </div>
                        {taskHistory.length ? (
                          taskHistory.slice(0, 6).map((item) => (
                            <div key={item.id} className="timeline-item">
                              <strong>{item.description}</strong>
                              <span>
                                {item.user} · {item.at}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="context-empty">
                            Chưa có lịch sử thay đổi nhiệm vụ.
                          </p>
                        )}
                      </div>
                      <div className="timeline-card">
                        <div className="context-title">
                          <Activity size={15} /> Activity gần nhất{" "}
                          <Badge variant="outline">{taskActivities.length}</Badge>
                        </div>
                        {taskActivities.length ? (
                          taskActivities.slice(0, 6).map((item) => (
                            <div key={item.id} className="timeline-item">
                              <strong>
                                {item.type} · {item.result}
                              </strong>
                              <span>
                                {item.status} · {item.at}
                              </span>
                              <small>{item.note}</small>
                            </div>
                          ))
                        ) : (
                          <p className="context-empty">
                            Chưa có Activity nào trước đây.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              )}

              <Separator />

              {/* Activity Form */}
              <div className="activity-form-panel">
                <div className="panel-subhead">
                  <WandSparkles size={16} />
                  <strong>Nhập Activity &amp; Kết quả</strong>
                </div>

                <div className="form-grid">
                  <label>
                    Loại hoạt động
                    <Select
                      value={activityTypeId}
                      onValueChange={(val) => void selectActivityType(val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại hoạt động" />
                      </SelectTrigger>
                      <SelectContent>
                        {activityTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>

                  <label>
                    Kết quả hoạt động
                    <Select
                      value={activityResultId}
                      onValueChange={setActivityResultId}
                      disabled={!activityTypeId || resultsBusy}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            resultsBusy
                              ? "Đang tải kết quả..."
                              : "Chọn kết quả hoạt động"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {activityResults.map((result) => (
                          <SelectItem key={result.id} value={result.id}>
                            {result.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                </div>

                {/* Templates */}
                <div className="template-picker">
                  <span className="picker-label">Mẫu ghi chú nhanh:</span>
                  <div className="template-chips">
                    {noteTemplates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={
                          selectedTemplateId === t.id
                            ? "template-chip chip-active"
                            : "template-chip"
                        }
                        onClick={() => applyNoteTemplate(t.id)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note Editor */}
                <div className="note-section">
                  <div className="note-header">
                    <label htmlFor="activity-note">Ghi chú Activity</label>
                    <div className="note-actions">
                      {noteVariables.map((v) => (
                        <button
                          key={v}
                          type="button"
                          className="var-btn"
                          onClick={() => insertNoteVariable(v)}
                        >
                          +{v}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={copyCurrentNote}
                      >
                        <Copy size={12} /> Copy
                      </button>
                    </div>
                  </div>
                  <Textarea
                    id="activity-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nhập ghi chú chi tiết kết quả liên hệ..."
                    rows={4}
                  />
                  <div className="note-footer">
                    <span>{note.length}/2000 ký tự</span>
                    {draftAvailable && (
                      <span className="draft-tag">
                        <FileClock size={12} /> Đã lưu nháp ({draftTimeLabel})
                        <button type="button" onClick={clearActivityDraft}>
                          Xóa nháp
                        </button>
                      </span>
                    )}
                  </div>
                </div>

                {batchOpen && (
                  <div className="personalize-toggle">
                    <Switch
                      checked={personalizeBatch}
                      onCheckedChange={setPersonalizeBatch}
                    />
                    <div>
                      <strong>Cá nhân hóa ghi chú theo từng task</strong>
                      <p>
                        Tự động thay thế &#123;customer&#125;, &#123;taskId&#125;,
                        &#123;cif&#125; vào nội dung từng task khi gửi.
                      </p>
                    </div>
                  </div>
                )}

                {/* Preflight Checklist */}
                <div className="preflight-box">
                  <strong>Kiểm tra trước khi gửi</strong>
                  <ul className="preflight-list">
                    <li className={connected ? "pass" : "fail"}>
                      {connected ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <CircleAlert size={14} />
                      )}
                      <span>Đã kết nối SME Connect</span>
                    </li>
                    <li className={eligibleTargets.length > 0 ? "pass" : "fail"}>
                      {eligibleTargets.length > 0 ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <CircleAlert size={14} />
                      )}
                      <span>{eligibleTargets.length} task đủ điều kiện gửi</span>
                    </li>
                    <li
                      className={
                        activityTypeId && activityResultId ? "pass" : "fail"
                      }
                    >
                      {activityTypeId && activityResultId ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <CircleAlert size={14} />
                      )}
                      <span>Đã chọn loại và kết quả hoạt động</span>
                    </li>
                    <li className={note.trim().length >= 5 ? "pass" : "fail"}>
                      {note.trim().length >= 5 ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <CircleAlert size={14} />
                      )}
                      <span>Ghi chú tối thiểu 5 ký tự</span>
                    </li>
                  </ul>
                </div>

                {/* Progress bar during execution */}
                {processing && (
                  <div className="process-progress-strip">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Đang gửi Activity...</span>
                      <b>{processProgress}%</b>
                    </div>
                    <Progress value={processProgress} />
                  </div>
                )}

                {/* Submit button with Confirmation Dialog */}
                <div className="submit-section pt-3">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="vp-primary w-full"
                        size="lg"
                        disabled={!preflightReady || processing}
                      >
                        {processing ? (
                          <LoaderCircle
                            className="animate-spin"
                            size={16}
                          />
                        ) : (
                          <BadgeCheck size={16} />
                        )}
                        {processing
                          ? "Đang xử lý..."
                          : batchOpen
                            ? `Xác nhận & Gửi ${eligibleTargets.length} Activity`
                            : "Xác nhận & Gửi Activity"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Xác nhận ghi nhận Activity
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Hành động này sẽ gửi Activity{" "}
                          <strong>
                            {selectedType?.label} &middot;{" "}
                            {selectedResult?.label}
                          </strong>{" "}
                          cho{" "}
                          <strong>{eligibleTargets.length} Lead Task</strong>{" "}
                          trực tiếp vào hệ thống SME Connect của VPBank.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Xem lại</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void processTargets()}
                          className="vp-primary"
                        >
                          Xác nhận gửi
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
