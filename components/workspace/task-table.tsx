"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, CircleAlert, ChevronRight, ListTodo } from "lucide-react";

export interface Task {
  id: string;
  customer: string;
  cif: string;
  phone: string;
  businessNumber?: string;
  createdAt: string;
  source: string;
  owner: string;
  status: string;
  due: string;
  priority: string;
  campaign?: string;
  program?: string;
  department?: string;
}

interface TaskTableProps {
  tasks: Task[];
  sourceTasks: Task[];
  selected: string[];
  toggleAll: (checked: boolean) => void;
  toggleTask: (id: string) => void;
  openTask: (task: Task) => void;
  statusStyles: Record<string, string>;
  connected: boolean;
  mask: (value: string, field: "customerName" | "cif" | "phone" | "taxId") => string;
}

export function TaskTable({
  tasks,
  selected,
  toggleAll,
  toggleTask,
  openTask,
  statusStyles,
  connected,
  mask,
}: TaskTableProps) {
  return (
    <div className="task-table-wrap">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="check-col">
              <Checkbox
                aria-label="Chọn tất cả"
                checked={
                  tasks.length > 0 &&
                  tasks
                    .filter((task) => task.status !== "Đã hoàn tất")
                    .every((task) => selected.includes(task.id))
                }
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Task ID</TableHead>
            <TableHead>Nguồn</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Thời hạn</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id} className={selected.includes(task.id) ? "row-selected" : ""}>
              <TableCell>
                <Checkbox
                  aria-label={`Chọn task ${task.id}`}
                  disabled={task.status === "Đã hoàn tất"}
                  checked={selected.includes(task.id)}
                  onCheckedChange={() => toggleTask(task.id)}
                />
              </TableCell>
              <TableCell>
                <button
                  className="customer-cell"
                  onClick={() => openTask(task)}
                >
                  <span className="company-icon"><Building2 size={17} /></span>
                  <span>
                    <strong>{mask(task.customer, "customerName")}</strong>
                    <small>{mask(task.cif, "cif")} · {mask(task.phone, "phone")}</small>
                  </span>
                </button>
              </TableCell>
              <TableCell>
                <button
                  className="task-id"
                  onClick={() => openTask(task)}
                >
                  #{task.id}
                </button>
                <small className="cell-sub">{task.createdAt}</small>
              </TableCell>
              <TableCell>
                <span className="source-cell">{task.source}</span>
                <small className="cell-sub">{task.owner}</small>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={statusStyles[task.status]}>
                  <span className="status-dot" /> {task.status}
                </Badge>
              </TableCell>
              <TableCell>
                <span className={task.due === "Hôm nay" ? "due-now" : "due"}>{task.due}</span>
                {task.priority === "Cao" && (
                  <small className="priority"><CircleAlert size={12} /> Ưu tiên cao</small>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openTask(task)}
                >
                  {task.status === "Đã hoàn tất" ? "Xem" : "Xử lý"}
                  <ChevronRight size={14} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!tasks.length && (
            <TableRow>
              <TableCell colSpan={7} className="empty-table">
                <ListTodo size={24} />
                <strong>{connected ? "Không có công việc phù hợp" : "Chưa kết nối SME Connect"}</strong>
                <span>{connected ? "Thử đổi trạng thái lọc hoặc quét lại dữ liệu." : "Kết nối Bearer token để tải Lead thật từ API."}</span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
