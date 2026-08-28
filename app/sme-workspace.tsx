"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Settings2,
  RefreshCw,
  LoaderCircle,
  Search,
  ChevronRight,
  X,
} from "lucide-react";

// Types and Constants
import {
  Task,
  TaskStatus,
  WorkspaceView,
  ApiOption,
  AuditEntry,
  statusStyles,
} from "@/lib/constants";
import { smeCall, responseSucceeded, delay } from "@/lib/sme-api";
import { unwrapRecord, pick, asText, normalizeArray } from "@/lib/task-mapper";
import { renderNoteTemplate } from "@/lib/note-templates";

// Custom Hooks
import { usePrivacy } from "@/hooks/use-privacy";
import { useDisclaimer } from "@/hooks/use-disclaimer";
import { useSmeConnection } from "@/hooks/use-sme-connection";
import { useTaskStore } from "@/hooks/use-task-store";
import { useActivityForm } from "@/hooks/use-activity-form";
import { usePerformance } from "@/hooks/use-performance";
import { useContractor } from "@/hooks/use-contractor";
import { useAudit } from "@/hooks/use-audit";

// Workspace Components
import { DisclaimerGate } from "@/components/workspace/disclaimer-gate";
import { TipBanner } from "@/components/workspace/tip-banner";
import { Topbar } from "@/components/workspace/topbar";
import { MetricsGrid } from "@/components/workspace/metrics-grid";
import { TaskTable } from "@/components/workspace/task-table";
import { TaskDetailSheet } from "@/components/workspace/task-detail-sheet";
import { ActivityForm } from "@/components/workspace/activity-form";
import { PerformanceDashboard } from "@/components/workspace/performance-dashboard";
import { ContractorProfile } from "@/components/workspace/contractor-profile";
import { AuditLog } from "@/components/workspace/audit-log";
import { FooterDisclaimer } from "@/components/workspace/footer-disclaimer";

export function SmeWorkspace({ displayName }: { displayName: string }) {
  const [view, setView] = useState<WorkspaceView>("tasks");
  const [batchOpen, setBatchOpen] = useState(false);
  const [singleTask, setSingleTask] = useState<Task | null>(null);
  const [activityTypes, setActivityTypes] = useState<ApiOption[]>([]);
  const [taskContextBusy, setTaskContextBusy] = useState(false);
  const [taskHistory, setTaskHistory] = useState<
    Array<{ id: string; description: string; user: string; at: string }>
  >([]);
  const [taskActivities, setTaskActivities] = useState<
    Array<{ id: string; status: string; type: string; result: string; note: string; at: string }>
  >([]);

  // 1. Privacy Shield Hook
  const {
    config: privacyConfig,
    saveConfig: savePrivacyConfig,
    togglePrivacy,
    mask,
    isMasked,
    isReady: isPrivacyReady,
  } = usePrivacy();

  // 2. Disclaimer Hook
  const {
    accepted: disclaimerAccepted,
    accept: acceptDisclaimer,
    isReady: isDisclaimerReady,
  } = useDisclaimer();

  // 3. SME Connection Hook
  const connection = useSmeConnection({
    displayName,
    onTasksReceived: (tasks) => taskStore.setLiveTasks(tasks),
    onActivityTypesReceived: (types) => setActivityTypes(types),
    onScanUpdate: (msg) => taskStore.setLastScan(msg),
  });

  // 4. Task Store Hook
  const taskStore = useTaskStore({
    token: connection.token,
    connected: connection.connected,
    username: connection.username,
    membershipId: connection.membershipId,
  });

  // 5. Activity Form Hook
  const activityForm = useActivityForm({
    token: connection.token,
    connected: connection.connected,
    activityTypes,
  });

  // 6. Performance Report Hook
  const performance = usePerformance({
    token: connection.token,
    connected: connection.connected,
  });

  // 7. Contractor Lookup Hook
  const contractor = useContractor({
    token: connection.token,
    connected: connection.connected,
  });

  // 8. Audit Log Hook
  const audit = useAudit({
    sourceTasks: taskStore.sourceTasks,
    setSelected: taskStore.setSelected,
    onViewChange: () => setView("tasks"),
  });

  const actionTargets = batchOpen
    ? taskStore.sourceTasks.filter((task) => taskStore.selected.includes(task.id))
    : singleTask
      ? [singleTask]
      : [];

  const closeActionSheet = () => {
    setBatchOpen(false);
    setSingleTask(null);
  };

  const loadTaskContext = async (task: Task) => {
    if (!connection.connected || !connection.token) return;
    setTaskContextBusy(true);
    try {
      const [historyData, activitiesData] = await Promise.all([
        smeCall(connection.token, { action: "task-history", taskId: task.id }).catch(
          () => [],
        ),
        smeCall(connection.token, { action: "activities", taskId: task.id }).catch(
          () => [],
        ),
      ]);
      const historyRows = normalizeArray(historyData).map((r, i) => ({
        id: asText(pick(r, "taskHistoryId", "id"), String(i)),
        description: asText(pick(r, "description", "content"), "Cập nhật nhiệm vụ"),
        user: asText(pick(r, "username", "createdBy", "executor"), "Hệ thống"),
        at: asText(pick(r, "createdDate", "createdAt"), "—"),
      }));
      const actRows = normalizeArray(activitiesData).map((r, i) => ({
        id: asText(pick(r, "activityId", "id"), String(i)),
        status: asText(pick(r, "activityStatus", "status"), "—"),
        type: asText(pick(r, "activityTypeDes", "activityType"), "—"),
        result: asText(pick(r, "activityResultDes", "activityResult"), "—"),
        note: asText(pick(r, "note", "description"), "Không có ghi chú"),
        at: asText(pick(r, "createdDate", "createdAt"), "—"),
      }));
      setTaskHistory(historyRows);
      setTaskActivities(actRows);
    } catch {
      // Ignore background load error
    } finally {
      setTaskContextBusy(false);
    }
  };

  const processTargets = async () => {
    if (!connection.token) {
      toast.error("Chưa có token kết nối.");
      return;
    }
    const eligible = actionTargets.filter((t) => t.status !== "Đã hoàn tất");
    if (!eligible.length) {
      toast.info("Không có task đủ điều kiện để xử lý.");
      return;
    }

    const selectedType = activityTypes.find((t) => t.id === activityForm.activityTypeId);
    const selectedResult = activityForm.activityResults.find(
      (r) => r.id === activityForm.activityResultId,
    );

    const entries: AuditEntry[] = [];
    const successfulIds: string[] = [];

    for (let index = 0; index < eligible.length; index += 1) {
      const task = eligible[index];
      try {
        let customerId = task.customerId;
        if (!customerId) {
          const detailData = await smeCall(connection.token, {
            action: "task-detail",
            taskId: task.id,
          });
          const detail = unwrapRecord(detailData);
          customerId = asText(
            pick(detail, "customerId", "customer.customerId", "customer.id"),
            "",
          );
        }
        if (!customerId) throw new Error("Không xác định được customerId.");

        const submissionNote = activityForm.personalizeBatch
          ? renderNoteTemplate(activityForm.note.trim(), task)
          : activityForm.note.trim();

        const done = await smeCall(connection.token, {
          action: "complete",
          taskId: task.id,
          customerId,
          activityTypeId: activityForm.activityTypeId,
          activityResultId: activityForm.activityResultId,
          note: submissionNote,
        });

        if (!responseSucceeded(done)) {
          throw new Error("API không trả về xác nhận activity hợp lệ.");
        }

        successfulIds.push(task.id);
        entries.push({
          taskId: task.id,
          customer: task.customer,
          status: "Thành công",
          activity: selectedType?.label ?? activityForm.activityTypeId,
          result: selectedResult?.label ?? activityForm.activityResultId,
          at: new Date().toLocaleString("vi-VN"),
          verified: true,
        });
      } catch (error) {
        entries.push({
          taskId: task.id,
          customer: task.customer,
          status: "Thất bại",
          activity: selectedType?.label ?? activityForm.activityTypeId,
          result: selectedResult?.label ?? activityForm.activityResultId,
          at: new Date().toLocaleString("vi-VN"),
          verified: false,
          message: error instanceof Error ? error.message : "Lỗi không xác định",
        });
      }

      if (index < eligible.length - 1) await delay(900);
    }

    audit.addEntries(entries);
    taskStore.setLiveTasks((current) =>
      current.map((t) =>
        successfulIds.includes(t.id) ? { ...t, status: "Đang xử lý" as TaskStatus } : t,
      ),
    );
    taskStore.setSelected((current) =>
      current.filter((id) => !successfulIds.includes(id)),
    );

    const failed = entries.length - successfulIds.length;
    if (failed) {
      toast.warning(
        `Hoàn tất ${successfulIds.length}/${entries.length} task. Xem Nhật ký phiên để kiểm tra lỗi.`,
      );
    } else {
      activityForm.clearActivityDraft(false);
      toast.success(`Đã tạo activity cho ${successfulIds.length} task.`);
      closeActionSheet();
    }
  };

  return (
    <DisclaimerGate
      accepted={disclaimerAccepted}
      isReady={isDisclaimerReady}
      accept={acceptDisclaimer}
    >
      <main className="workspace-shell">
        <Toaster position="top-right" richColors closeButton />

        {/* Topbar with Navigation, Status Pill, Privacy Shield, and Connection Trigger */}
        <Topbar
          view={view}
          setView={setView}
          auditCount={audit.auditEntries.length}
          connected={connection.connected}
          profileName={connection.profileName}
          profileDepartment={connection.profileDepartment}
          profileInitials={connection.profileInitials}
          privacyConfig={privacyConfig}
          savePrivacyConfig={savePrivacyConfig}
          togglePrivacy={togglePrivacy}
          isMasked={isMasked}
          isPrivacyReady={isPrivacyReady}
          mask={mask}
          connectionOpen={connection.connectionOpen}
          setConnectionOpen={connection.setConnectionOpen}
          connectionMethod={connection.connectionMethod}
          setConnectionMethod={connection.setConnectionMethod}
          username={connection.username}
          setUsername={connection.setUsername}
          membershipId={connection.membershipId}
          setMembershipId={connection.setMembershipId}
          password={connection.password}
          setPassword={connection.setPassword}
          token={connection.token}
          setToken={connection.setToken}
          credentialBusy={connection.credentialBusy}
          connectionBusy={connection.connectionBusy}
          credentialError={connection.credentialError}
          loginWithCredentials={connection.loginWithCredentials}
          connect={connection.connect}
          disconnect={connection.disconnect}
          copyTokenCommand={connection.copyTokenCommand}
          copyMobileBookmarklet={connection.copyMobileBookmarklet}
          pasteTokenFromClipboard={connection.pasteTokenFromClipboard}
          pasteAndConnect={connection.pasteAndConnect}
        />

        {/* Tip Banner */}
        <div className="page-frame" style={{ paddingBottom: 0 }}>
          <TipBanner />
        </div>

        <div className="page-frame">
          {/* Page Heading */}
          <section className="page-heading">
            <div>
              <p className="eyebrow">Trung tâm điều phối</p>
              <h1>
                {view === "tasks"
                  ? "Công việc SME hôm nay"
                  : view === "performance"
                    ? "Hiệu suất Lead và cuộc gọi"
                    : view === "contractor"
                      ? "Tra cứu năng lực nhà thầu"
                      : "Nhật ký xử lý trong phiên"}
              </h1>
              <p className="heading-copy">
                {view === "tasks"
                  ? "Theo dõi, rà soát và hoàn tất Lead Task trên một màn hình."
                  : view === "performance"
                    ? "Tổng hợp Activity, kế hoạch và trạng thái cuộc gọi từ dữ liệu thật."
                    : view === "contractor"
                      ? "Đánh giá nhanh lịch sử đấu thầu của doanh nghiệp theo mã số thuế."
                      : "Theo dõi kết quả từng Task ID mà không lưu token hay mật khẩu."}
              </p>
            </div>
            <div className="heading-actions">
              {view === "tasks" ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => connection.setConnectionOpen(true)}
                  >
                    <Settings2 size={16} /> Thiết lập kết nối
                  </Button>
                  <Button
                    className="vp-primary"
                    onClick={() =>
                      void taskStore.scanTasks(() =>
                        connection.setConnectionOpen(true),
                      )
                    }
                    disabled={taskStore.scanning}
                  >
                    {taskStore.scanning ? (
                      <LoaderCircle className="animate-spin" size={16} />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    {taskStore.scanning ? "Đang quét..." : "Quét công việc"}
                  </Button>
                </>
              ) : view === "performance" ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => connection.setConnectionOpen(true)}
                  >
                    <Settings2 size={16} /> Thiết lập kết nối
                  </Button>
                  <Button
                    className="vp-primary"
                    onClick={() =>
                      void performance.loadPerformance(() =>
                        connection.setConnectionOpen(true),
                      )
                    }
                    disabled={performance.performanceBusy}
                  >
                    {performance.performanceBusy ? (
                      <LoaderCircle className="animate-spin" size={16} />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    {performance.performanceBusy
                      ? "Đang tải báo cáo..."
                      : "Tải báo cáo"}
                  </Button>
                </>
              ) : view === "contractor" ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => connection.setConnectionOpen(true)}
                  >
                    <Settings2 size={16} /> Thiết lập kết nối
                  </Button>
                  <Button
                    className="vp-primary"
                    onClick={() =>
                      void contractor.lookupContractor(
                        contractor.contractorTaxId,
                        () => connection.setConnectionOpen(true),
                      )
                    }
                    disabled={contractor.contractorBusy}
                  >
                    {contractor.contractorBusy ? (
                      <LoaderCircle className="animate-spin" size={16} />
                    ) : (
                      <Search size={16} />
                    )}
                    {contractor.contractorBusy ? "Đang tra cứu..." : "Tra cứu"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    disabled={!audit.auditEntries.length}
                    onClick={audit.exportAuditCsv}
                  >
                    Xuất CSV
                  </Button>
                  {audit.auditFailureCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={audit.selectFailedForRetry}
                    >
                      Chọn lại task lỗi ({audit.auditFailureCount})
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    disabled={!audit.auditEntries.length}
                    onClick={audit.clearAudit}
                  >
                    Xóa nhật ký
                  </Button>
                </>
              )}
            </div>
          </section>

          {/* VIEW: TASKS */}
          {view === "tasks" && (
            <>
              {/* Metrics Grid */}
              <MetricsGrid
                totalTasks={taskStore.sourceTasks.length}
                pendingCount={taskStore.pendingCount}
                processingCount={taskStore.processingCount}
                doneCount={taskStore.doneCount}
                lastScan={taskStore.lastScan}
                scanProgress={taskStore.scanProgress}
                scanning={taskStore.scanning}
              />

              {/* Lead Task Panel */}
              <section className="task-panel lead-task-panel">
                <div className="panel-topline">
                  <div>
                    <h2>Danh sách Lead Task</h2>
                    <p>
                      {connection.connected
                        ? `Dữ liệu thật · ${connection.username} · Membership ${connection.membershipId}`
                        : "Chưa kết nối SME Connect; app không hiển thị dữ liệu giả lập."}
                    </p>
                  </div>
                  <div className="selection-summary">
                    {taskStore.selected.length > 0 ? (
                      <>
                        <span>
                          Đã chọn <strong>{taskStore.selected.length}</strong>
                        </span>
                        <Button
                          size="sm"
                          className="vp-primary"
                          onClick={() => {
                            activityForm.resetActivityForm();
                            setBatchOpen(true);
                          }}
                        >
                          Rà soát & nhập liệu <ChevronRight size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Bỏ chọn"
                          onClick={() => taskStore.setSelected([])}
                        >
                          <X size={17} />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span>Chọn task để xử lý theo lô</span>
                        {taskStore.pendingCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              taskStore.setSelected(
                                taskStore.sourceTasks
                                  .filter(
                                    (task) => task.status === "Chờ tiếp nhận",
                                  )
                                  .map((task) => task.id),
                              )
                            }
                          >
                            Chọn toàn bộ đang chờ
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="table-controls">
                  <Tabs
                    value={taskStore.activeTab}
                    onValueChange={taskStore.setActiveTab}
                  >
                    <TabsList className="status-tabs">
                      <TabsTrigger value="all">
                        Tất cả <b>{taskStore.sourceTasks.length}</b>
                      </TabsTrigger>
                      <TabsTrigger value="pending">
                        Chờ tiếp nhận <b>{taskStore.pendingCount}</b>
                      </TabsTrigger>
                      <TabsTrigger value="processing">
                        Đang xử lý <b>{taskStore.processingCount}</b>
                      </TabsTrigger>
                      <TabsTrigger value="done">
                        Hoàn tất <b>{taskStore.doneCount}</b>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="table-search">
                    <Search size={15} />
                    <Input
                      value={taskStore.query}
                      onChange={(event) => taskStore.setQuery(event.target.value)}
                      placeholder="Tìm theo tên KH, CIF, ID, MST, nguồn..."
                    />
                  </div>
                </div>

                {/* Task Table */}
                <TaskTable
                  tasks={taskStore.filteredTasks}
                  sourceTasks={taskStore.sourceTasks}
                  selected={taskStore.selected}
                  toggleAll={() => taskStore.toggleAll()}
                  toggleTask={taskStore.toggleTask}
                  openTask={(task) => taskStore.openTask(task as Task)}
                  statusStyles={statusStyles}
                  connected={connection.connected}
                  mask={(val, field) => mask(val, field)}
                />
              </section>
            </>
          )}

          {/* VIEW: PERFORMANCE */}
          {view === "performance" && (
            <PerformanceDashboard
              performance={performance.performance}
              reportFrom={performance.reportFrom}
              setReportFrom={performance.setReportFrom}
              reportTo={performance.reportTo}
              setReportTo={performance.setReportTo}
              loadPerformance={() =>
                void performance.loadPerformance(() =>
                  connection.setConnectionOpen(true),
                )
              }
              performanceBusy={performance.performanceBusy}
              connected={connection.connected}
              setConnectionOpen={connection.setConnectionOpen}
            />
          )}

          {/* VIEW: CONTRACTOR */}
          {view === "contractor" && (
            <ContractorProfile
              contractorTaxId={contractor.contractorTaxId}
              setContractorTaxId={contractor.setContractorTaxId}
              contractor={contractor.contractor}
              bidOverview={contractor.bidOverview}
              contractorPackages={contractor.contractorPackages}
              contractorBusy={contractor.contractorBusy}
              lookupContractor={() =>
                void contractor.lookupContractor(
                  contractor.contractorTaxId,
                  () => connection.setConnectionOpen(true),
                )
              }
              connected={connection.connected}
              privacyMode={isMasked}
              mask={(val, field) => mask(val, field)}
            />
          )}

          {/* VIEW: AUDIT LOG */}
          {view === "audit" && (
            <AuditLog
              auditEntries={audit.auditEntries}
              filteredAuditEntries={audit.filteredAuditEntries}
              auditFilter={audit.auditFilter}
              setAuditFilter={audit.setAuditFilter}
              auditSuccessCount={audit.auditSuccessCount}
              auditFailureCount={audit.auditFailureCount}
              selectFailedForRetry={audit.selectFailedForRetry}
              clearAudit={audit.clearAudit}
              exportAuditCsv={audit.exportAuditCsv}
              setView={setView}
              maskCustomer={(name: string) => mask(name, "customerName")}
            />
          )}
        </div>

        {/* Task Detail Sheet */}
        {taskStore.activeTask && (
          <TaskDetailSheet
            task={taskStore.activeTask}
            open={Boolean(taskStore.activeTask)}
            onOpenChange={(open: boolean) => {
              if (!open) taskStore.openTask(null);
            }}
            statusStyles={statusStyles}
            connected={connection.connected}
            onOpenContractor={(task: Task) => {
              contractor.openContractorFromTask(task, () =>
                setView("contractor"),
              );
            }}
            onOpenAction={(task: Task) => {
              activityForm.resetActivityForm();
              setSingleTask(task);
            }}
            mask={(val, field) => mask(val, field)}
          />
        )}

        {/* Activity Action Sheet (Single or Batch) */}
        <ActivityForm
          actionSheetOpen={batchOpen || Boolean(singleTask)}
          closeActionSheet={closeActionSheet}
          actionTargets={actionTargets}
          batchOpen={batchOpen}
          statusStyles={statusStyles}
          connected={connection.connected}
          openContractorFromTask={(task: Task) => {
            contractor.openContractorFromTask(task, () =>
              setView("contractor"),
            );
          }}
          loadTaskContext={(task: Task) => void loadTaskContext(task)}
          taskContextBusy={taskContextBusy}
          taskHistory={taskHistory}
          taskActivities={taskActivities}
          draftAvailable={activityForm.draftAvailable}
          draftTimeLabel={activityForm.draftUpdatedAt}
          restoreActivityDraft={activityForm.restoreActivityDraft}
          clearActivityDraft={() => activityForm.clearActivityDraft()}
          latestActivityNote={taskActivities[0]?.note ?? null}
          reuseLatestActivityNote={() => {
            if (taskActivities[0]) {
              activityForm.reuseLatestActivityNote({
                id: taskActivities[0].id,
                taskId: singleTask?.id ?? "",
                customer: singleTask?.customer ?? "",
                status: taskActivities[0].status,
                type: taskActivities[0].type,
                result: taskActivities[0].result,
                note: taskActivities[0].note,
                at: taskActivities[0].at,
              });
            }
          }}
          processing={activityForm.processing}
          activityTypeId={activityForm.activityTypeId}
          selectActivityType={activityForm.selectActivityType}
          activityTypes={activityTypes}
          activityResultId={activityForm.activityResultId}
          setActivityResultId={activityForm.setActivityResultId}
          activityResults={activityForm.activityResults}
          resultsBusy={activityForm.resultsBusy}
          note={activityForm.note}
          setNote={activityForm.setNote}
          selectedTemplateId={activityForm.selectedTemplateId}
          applyNoteTemplate={activityForm.applyNoteTemplate}
          copyCurrentNote={() => void activityForm.copyCurrentNote()}
          insertNoteVariable={activityForm.insertNoteVariable}
          personalizeBatch={activityForm.personalizeBatch}
          setPersonalizeBatch={activityForm.setPersonalizeBatch}
          processProgress={activityForm.processProgress}
          setConnectionOpen={connection.setConnectionOpen}
          processTargets={processTargets}
          maskCustomer={(val: string) => mask(val, "customerName")}
          maskPhone={(val: string) => mask(val, "phone")}
          maskCif={(val: string) => mask(val, "cif")}
        />

        {/* Persistent Footer Disclaimer */}
        <FooterDisclaimer />
      </main>
    </DisclaimerGate>
  );
}
