"use client";

import {
  ListTodo,
  Clock3,
  Activity,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MetricsGridProps {
  totalTasks: number;
  pendingCount: number;
  processingCount: number;
  doneCount: number;
  lastScan: string;
  scanProgress: number;
  scanning: boolean;
}

export function MetricsGrid({
  totalTasks,
  pendingCount,
  processingCount,
  doneCount,
  lastScan,
  scanProgress,
  scanning,
}: MetricsGridProps) {
  return (
    <>
      <section className="metrics-grid" aria-label="Thống kê nhanh">
        <article className="metric-card metric-primary">
          <div className="metric-icon">
            <ListTodo size={20} />
          </div>
          <div>
            <span>Tổng công việc</span>
            <strong>{totalTasks}</strong>
            <small>{lastScan}</small>
          </div>
          <Sparkles className="metric-spark" size={26} />
        </article>
        <article className="metric-card">
          <div className="metric-icon amber">
            <Clock3 size={20} />
          </div>
          <div>
            <span>Chờ tiếp nhận</span>
            <strong>{pendingCount}</strong>
            <small className="text-amber">Task cần ưu tiên rà soát</small>
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-icon blue">
            <Activity size={20} />
          </div>
          <div>
            <span>Đang xử lý</span>
            <strong>{processingCount}</strong>
            <small>Activity đã được ghi nhận</small>
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-icon green">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span>Đã hoàn tất</span>
            <strong>{doneCount}</strong>
            <small className="text-green">Theo dữ liệu lần quét gần nhất</small>
          </div>
          {totalTasks > 0 && (
            <div className="metric-progress">
              <Progress value={(doneCount / totalTasks) * 100} />
            </div>
          )}
        </article>
      </section>

      {scanProgress > 0 && (
        <div className="scan-strip">
          <span>{scanning ? "Đang đọc các trang công việc..." : "Đồng bộ hoàn tất"}</span>
          <Progress value={scanProgress} />
          <b>{scanProgress}%</b>
        </div>
      )}
    </>
  );
}
