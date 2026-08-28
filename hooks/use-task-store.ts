"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { smeCall } from "@/lib/sme-api";
import { Task } from "@/lib/constants";
import { normalizeArray, toTask } from "@/lib/task-mapper";

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function useTaskStore({ token, connected, username, membershipId }: {
  token: string;
  connected: boolean;
  username: string;
  membershipId: string;
}) {
  const [liveTasks, setLiveTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScan, setLastScan] = useState("Chưa quét dữ liệu thật");

  const sourceTasks = liveTasks;
  const pendingCount = sourceTasks.filter((task) => task.status === "Chờ tiếp nhận").length;
  const processingCount = sourceTasks.filter((task) => task.status === "Đang xử lý").length;
  const doneCount = sourceTasks.filter((task) => task.status === "Đã hoàn tất").length;

  const filteredTasks = useMemo(() => {
    return sourceTasks.filter((task) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "pending" && task.status === "Chờ tiếp nhận") ||
        (activeTab === "processing" && task.status === "Đang xử lý") ||
        (activeTab === "done" && task.status === "Đã hoàn tất");
      const haystack = `${task.customer} ${task.cif} ${task.id} ${task.businessNumber} ${task.campaign} ${task.program}`.toLowerCase();
      return matchesTab && haystack.includes(query.trim().toLowerCase());
    });
  }, [activeTab, query, sourceTasks]);

  const toggleTask = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleAll = () => {
    const selectable = filteredTasks
      .filter((task) => task.status !== "Đã hoàn tất")
      .map((task) => task.id);
    setSelected((current) =>
      selectable.every((id) => current.includes(id))
        ? current.filter((id) => !selectable.includes(id))
        : Array.from(new Set([...current, ...selectable]))
    );
  };

  const openTask = (task: Task | null) => {
    setActiveTask(task);
  };

  const scanTasks = async (onUnconnected?: () => void) => {
    if (!connected || !token) {
      if (onUnconnected) onUnconnected();
      toast.info("Kết nối SME Connect trước khi quét dữ liệu thật.");
      return;
    }
    setScanning(true);
    setScanProgress(3);
    try {
      const found = new Map<string, Task>();
      const pageSize = 20;
      for (let pageIndex = 1; pageIndex <= 40; pageIndex += 1) {
        const data = await smeCall(token, {
          action: "tasks",
          pageSize,
          pageIndex,
          username,
          membershipId,
        });
        const rows = normalizeArray(data);
        rows
          .map(toTask)
          .filter((task): task is Task => Boolean(task))
          .forEach((task) => found.set(task.id, task));
        setScanProgress(Math.min(95, 5 + pageIndex * 4));
        if (!rows.length || rows.length < pageSize) break;
        await delay(250);
      }
      const nextTasks = Array.from(found.values());
      setLiveTasks(nextTasks);
      setSelected([]);
      setScanProgress(100);
      setLastScan(`Quét lúc ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`);
      toast.success(`Đã đồng bộ ${nextTasks.length} task, không trùng Task ID.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Quét task thất bại.");
    } finally {
      setScanning(false);
      setTimeout(() => setScanProgress(0), 800);
    }
  };

  return {
    liveTasks,
    setLiveTasks,
    activeTab,
    setActiveTab,
    query,
    setQuery,
    selected,
    setSelected,
    activeTask,
    setActiveTask,
    scanning,
    scanProgress,
    lastScan,
    setLastScan,
    sourceTasks,
    pendingCount,
    processingCount,
    doneCount,
    filteredTasks,
    toggleTask,
    toggleAll,
    openTask,
    scanTasks,
  };
}
