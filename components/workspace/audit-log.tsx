"use client";

import { FileClock, SearchCheck, Download, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuditEntry, AuditFilter } from "@/lib/constants";

export interface AuditLogProps {
  auditEntries: AuditEntry[];
  filteredAuditEntries: AuditEntry[];
  auditFilter: AuditFilter;
  setAuditFilter: (filter: AuditFilter) => void;
  auditSuccessCount: number;
  auditFailureCount: number;
  selectFailedForRetry?: () => void;
  clearAudit?: () => void;
  exportAuditCsv?: () => void;
  setView?: (view: "tasks" | "performance" | "contractor" | "audit") => void;
  maskCustomer?: (name: string) => string;
}

export function AuditLog({
  auditEntries,
  filteredAuditEntries,
  auditFilter,
  setAuditFilter,
  auditSuccessCount,
  auditFailureCount,
  selectFailedForRetry,
  clearAudit,
  exportAuditCsv,
  setView,
  maskCustomer,
}: AuditLogProps) {
  const getCustomerName = (customer: string) =>
    maskCustomer ? maskCustomer(customer) : customer;

  return (
    <section className="task-panel audit-panel">
      <div className="panel-topline">
        <div>
          <h2>Kết quả xử lý Activity</h2>
          <p>Chỉ lưu trong phiên hiện tại; không chứa token hoặc mật khẩu.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Badge variant="outline">
            {filteredAuditEntries.length}/{auditEntries.length} bản ghi
          </Badge>
          {exportAuditCsv && auditEntries.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportAuditCsv}>
              <Download size={14} /> Xuất CSV
            </Button>
          )}
          {selectFailedForRetry && auditFailureCount > 0 && (
            <Button variant="outline" size="sm" onClick={selectFailedForRetry}>
              <RotateCcw size={14} /> Chọn lại lỗi ({auditFailureCount})
            </Button>
          )}
          {clearAudit && auditEntries.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAudit}>
              <Trash2 size={14} /> Xóa
            </Button>
          )}
        </div>
      </div>
      {auditEntries.length ? (
        <>
          <div className="audit-filter-bar">
            <div className="audit-filter-buttons" aria-label="Lọc nhật ký xử lý">
              <button
                type="button"
                className={auditFilter === "all" ? "audit-filter-active" : ""}
                onClick={() => setAuditFilter("all")}
              >
                Tất cả <b>{auditEntries.length}</b>
              </button>
              <button
                type="button"
                className={auditFilter === "success" ? "audit-filter-active" : ""}
                onClick={() => setAuditFilter("success")}
              >
                Thành công <b>{auditSuccessCount}</b>
              </button>
              <button
                type="button"
                className={auditFilter === "failed" ? "audit-filter-active" : ""}
                onClick={() => setAuditFilter("failed")}
              >
                Lỗi <b>{auditFailureCount}</b>
              </button>
            </div>
            <span>Chạm “Lỗi” để rà soát và chọn lại task cần xử lý.</span>
          </div>
          {filteredAuditEntries.length ? (
            <>
              <div className="task-table-wrap audit-desktop-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời điểm</TableHead>
                      <TableHead>Task ID</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Hoạt động</TableHead>
                      <TableHead>Kết quả</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Xác minh API</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAuditEntries.map((entry, index) => (
                      <TableRow key={`${entry.taskId}-${entry.at}-${index}`}>
                        <TableCell>
                          <span className="audit-time">{entry.at}</span>
                        </TableCell>
                        <TableCell>
                          <span className="task-id">#{entry.taskId}</span>
                        </TableCell>
                        <TableCell>
                          <strong className="audit-customer">
                            {getCustomerName(entry.customer)}
                          </strong>
                        </TableCell>
                        <TableCell>{entry.activity}</TableCell>
                        <TableCell>{entry.result}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              entry.status === "Thành công"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-700"
                            }
                          >
                            {entry.status}
                          </Badge>
                          {entry.message && (
                            <small
                              className={
                                entry.status === "Thành công"
                                  ? "audit-warning"
                                  : "audit-error"
                              }
                            >
                              {entry.message}
                            </small>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              entry.verified
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }
                          >
                            {entry.verified ? "Đã xác minh" : "Chưa xác minh"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="audit-mobile-list">
                {filteredAuditEntries.map((entry, index) => (
                  <article key={`${entry.taskId}-${entry.at}-mobile-${index}`}>
                    <header>
                      <div>
                        <span className="task-id">#{entry.taskId}</span>
                        <strong>{getCustomerName(entry.customer)}</strong>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          entry.status === "Thành công"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }
                      >
                        {entry.status}
                      </Badge>
                    </header>
                    <dl>
                      <div>
                        <dt>Hoạt động</dt>
                        <dd>{entry.activity}</dd>
                      </div>
                      <div>
                        <dt>Kết quả</dt>
                        <dd>{entry.result}</dd>
                      </div>
                      <div>
                        <dt>Xác minh</dt>
                        <dd>
                          {entry.verified ? "Đã xác minh" : "Chưa xác minh"}
                        </dd>
                      </div>
                      <div>
                        <dt>Thời điểm</dt>
                        <dd>{entry.at}</dd>
                      </div>
                    </dl>
                    {entry.message && (
                      <p
                        className={
                          entry.status === "Thành công"
                            ? "audit-warning"
                            : "audit-error"
                        }
                      >
                        {entry.message}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="audit-empty compact-empty">
              <SearchCheck size={28} />
              <h2>Không có bản ghi trong bộ lọc này</h2>
              <Button variant="outline" onClick={() => setAuditFilter("all")}>
                Hiện tất cả
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="audit-empty">
          <FileClock size={28} />
          <h2>Chưa có activity nào trong phiên</h2>
          <p>
            Kết quả xử lý và trạng thái xác minh từng task sẽ xuất hiện tại đây.
          </p>
          {setView && (
            <Button variant="outline" onClick={() => setView("tasks")}>
              Về danh sách công việc
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
