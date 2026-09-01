"use client";

import {
  CheckCircle2,
  TrendingUp,
  CalendarDays,
  PhoneCall,
  BadgeCheck,
  SearchCheck,
  Activity,
  BarChart3,
  KeyRound,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PerformanceSnapshot, callStatusLabels } from "@/lib/constants";
import { formatCount, formatRate } from "@/lib/formatters";
import { maskField, DEFAULT_PRIVACY_CONFIG } from "@/lib/privacy";

export interface PerformanceDashboardProps {
  connected: boolean;
  performance: PerformanceSnapshot | null;
  reportFrom: string;
  setReportFrom: (date: string) => void;
  reportTo: string;
  setReportTo: (date: string) => void;
  loadPerformance: () => void;
  performanceBusy: boolean;
  setConnectionOpen?: (open: boolean) => void;
  mask?: (value: string, field: "customerName" | "cif" | "phone" | "taxId") => string;
}

export function PerformanceDashboard({
  connected,
  performance,
  reportFrom,
  setReportFrom,
  reportTo,
  setReportTo,
  loadPerformance,
  performanceBusy,
  setConnectionOpen,
  mask,
}: PerformanceDashboardProps) {
  if (!connected) {
    return (
      <section className="task-panel audit-panel">
        <div className="audit-empty compact-empty">
          <KeyRound size={28} />
          <h2>Cần kết nối SME Connect</h2>
          <p>Báo cáo chỉ sử dụng Activity và cuộc gọi thật từ API.</p>
          {setConnectionOpen && (
            <Button className="vp-primary" onClick={() => setConnectionOpen(true)}>
              Kết nối API
            </Button>
          )}
        </div>
      </section>
    );
  }

  const answeredItem = performance?.callStatuses.find(
    (item) => item.status === "ANSWERED",
  );
  const answerRate =
    performance && performance.callTotal > 0
      ? formatRate((answeredItem?.count ?? 0) / performance.callTotal)
      : "—";

  return (
    <>
      {/* Date Range Selector */}
      <section className="task-panel" style={{ marginBottom: "15px" }}>
        <div className="panel-topline" style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <Calendar size={18} className="text-muted-foreground" />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600 }}>Từ ngày</label>
              <Input
                type="date"
                value={reportFrom}
                onChange={(e) => setReportFrom(e.target.value)}
                style={{ width: "150px" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600 }}>Đến ngày</label>
              <Input
                type="date"
                value={reportTo}
                onChange={(e) => setReportTo(e.target.value)}
                style={{ width: "150px" }}
              />
            </div>
            <Button
              className="vp-primary"
              size="sm"
              onClick={loadPerformance}
              disabled={performanceBusy}
            >
              {performanceBusy ? "Đang tải..." : "Cập nhật dữ liệu"}
            </Button>
          </div>
          {performance && (
            <span style={{ fontSize: "11px", color: "#66736c" }}>
              Cập nhật: {performance.loadedAt}
            </span>
          )}
        </div>
      </section>

      {!performance ? (
        <section className="task-panel audit-panel">
          <div className="audit-empty compact-empty">
            <BarChart3 size={28} />
            <h2>Chọn khoảng ngày để tổng hợp</h2>
            <p>App sẽ đọc Activity DONE, PLAN và Dashboard Three-CX.</p>
            <Button variant="outline" onClick={loadPerformance}>
              Tải báo cáo
            </Button>
          </div>
        </section>
      ) : (
        <>
          <section
            className="metrics-grid insight-metrics"
            aria-label="Chỉ số hiệu suất"
          >
            <article className="metric-card metric-primary">
              <div className="metric-icon">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span>Activity hoàn tất</span>
                <strong>{formatCount(performance.doneCount)}</strong>
                <small>Trạng thái DONE</small>
              </div>
              <TrendingUp className="metric-spark" size={26} />
            </article>
            <article className="metric-card">
              <div className="metric-icon amber">
                <CalendarDays size={20} />
              </div>
              <div>
                <span>Activity kế hoạch</span>
                <strong>{formatCount(performance.planCount)}</strong>
                <small>Trạng thái PLAN</small>
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-icon blue">
                <PhoneCall size={20} />
              </div>
              <div>
                <span>Tổng cuộc gọi</span>
                <strong>{formatCount(performance.callTotal)}</strong>
                <small>TB {performance.avgCallCountPerDay} cuộc/ngày</small>
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-icon green">
                <BadgeCheck size={20} />
              </div>
              <div>
                <span>Tỷ lệ nghe máy</span>
                <strong>{answerRate}</strong>
                <small>Thời lượng TB {performance.avgCallDuration}</small>
              </div>
            </article>
          </section>

          <div className="insight-grid">
            <section className="task-panel insight-card">
              <div className="panel-topline">
                <div>
                  <h2>Trạng thái cuộc gọi</h2>
                  <p>Dữ liệu Dashboard Three-CX trong kỳ.</p>
                </div>
                <PhoneCall size={20} />
              </div>
              <div className="call-status-list">
                {performance.callStatuses.length ? (
                  performance.callStatuses.map((item) => (
                    <div key={item.status}>
                      <div>
                        <span>
                          {callStatusLabels[item.status] ?? item.status}
                        </span>
                        <strong>{formatCount(item.count)}</strong>
                      </div>
                      <Progress
                        value={
                          performance.callTotal
                            ? (item.count / performance.callTotal) * 100
                            : 0
                        }
                      />
                    </div>
                  ))
                ) : (
                  <p>
                    API chưa trả dữ liệu phân bổ trạng thái cuộc gọi trong kỳ.
                  </p>
                )}
              </div>
            </section>
            <section className="task-panel insight-card">
              <div className="panel-topline">
                <div>
                  <h2>Danh mục SME đang khả dụng</h2>
                  <p>Số lượng bản ghi thật app có thể khai thác.</p>
                </div>
                <SearchCheck size={20} />
              </div>
              <div className="catalog-metrics">
                <div>
                  <span>Nguồn khách hàng</span>
                  <strong>
                    {formatCount(performance.customerSourceCount)}
                  </strong>
                </div>
                <div>
                  <span>Chương trình khai thác</span>
                  <strong>{formatCount(performance.programCount)}</strong>
                </div>
                <div>
                  <span>Sản phẩm SmartSME</span>
                  <strong>{formatCount(performance.productCount)}</strong>
                </div>
              </div>
            </section>
          </div>

          <section className="task-panel activity-report-panel">
            <div className="panel-topline">
              <div>
                <h2>Activity gần nhất trong kỳ</h2>
                <p>Tối đa 20 bản ghi DONE và PLAN mới nhất.</p>
              </div>
              <Badge variant="outline">
                {performance.activities.length} bản ghi
              </Badge>
            </div>
            <div className="task-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời điểm</TableHead>
                    <TableHead>Task ID</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Hoạt động</TableHead>
                    <TableHead>Kết quả</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performance.activities.map((item) => (
                    <TableRow key={`${item.id}-${item.status}`}>
                      <TableCell>
                        <span className="audit-time">{item.at}</span>
                      </TableCell>
                      <TableCell>
                        <span className="task-id">#{item.taskId}</span>
                      </TableCell>
                      <TableCell>
                        <strong className="audit-customer">
                          {mask ? mask(item.customer, "customerName") : item.customer}
                        </strong>
                        <small className="cell-sub">{item.note}</small>
                      </TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.result}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            item.status === "DONE"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-blue-200 bg-blue-50 text-blue-700"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!performance.activities.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="empty-table">
                        <Activity size={24} />
                        <strong>Không có Activity trong kỳ</strong>
                        <span>Thử mở rộng khoảng thời gian báo cáo.</span>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
