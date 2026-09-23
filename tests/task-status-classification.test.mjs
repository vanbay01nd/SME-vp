import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true },
});

after(async () => {
  await vite.close();
});

test("classifyStatus maps SME Connect real status codes accurately", async () => {
  const { classifyStatus } = await vite.ssrLoadModule("/lib/task-mapper.ts");

  // Real SME Connect API taskStatus values
  assert.equal(classifyStatus({ taskStatus: "PROCESSING" }), "Đang xử lý");
  assert.equal(classifyStatus({ taskStatus: "END" }), "Đã hoàn tất");
  assert.equal(classifyStatus({ taskStatus: "ACCEPT_COMPLETE" }), "Đã hoàn tất");
  assert.equal(classifyStatus({ taskStatus: "REJECT_COMPLETE" }), "Từ chối hoàn tất");
  assert.equal(classifyStatus({ taskStatus: "NOT_COMPLETE" }), "Không hoàn tất");
  assert.equal(classifyStatus({ taskStatus: "WAITING_RECEIVE" }), "Chờ tiếp nhận");
  assert.equal(classifyStatus({ taskStatus: "NEW" }), "Chờ tiếp nhận");
  assert.equal(classifyStatus({ statusName: "ĐÃ DUYỆT" }), "Đã hoàn tất");
});

test("isClosedStatus recognizes all closed and completed states", async () => {
  const { isClosedStatus } = await vite.ssrLoadModule("/lib/constants.ts");

  assert.equal(isClosedStatus("Đã hoàn tất"), true);
  assert.equal(isClosedStatus("Từ chối hoàn tất"), true);
  assert.equal(isClosedStatus("Không hoàn tất"), true);
  assert.equal(isClosedStatus("Đang xử lý"), false);
  assert.equal(isClosedStatus("Chờ tiếp nhận"), false);
  assert.equal(isClosedStatus("Quá hạn"), false);
});

test("toTask formats due as 'Đã đóng' for closed tasks", async () => {
  const { toTask } = await vite.ssrLoadModule("/lib/task-mapper.ts");

  const endedTask = toTask({
    id: "101",
    customerName: "CÔNG TY TNHH TEST",
    taskStatus: "END",
    expiryDate: "2026-09-16T17:00:00.000Z",
  });
  assert.equal(endedTask.status, "Đã hoàn tất");
  assert.equal(endedTask.due, "Đã đóng");

  const activeTask = toTask({
    id: "102",
    customerName: "CÔNG TY ABC",
    taskStatus: "PROCESSING",
    expiryDate: "2026-09-25T17:00:00.000Z",
  });
  assert.equal(activeTask.status, "Đang xử lý");
  assert.notEqual(activeTask.due, "Đã đóng");
});
