const DEFAULT_API_BASE =
  "https://smeconnect.vpbank.com.vn/tai-khoan-doanh-nghiep/sme-lead/api";

type JsonRecord = Record<string, unknown>;

function textValue(value: unknown, field: string, max = 120) {
  const text = String(value ?? "").trim();
  if (!text || text.length > max) {
    throw new Error(`${field} không hợp lệ`);
  }
  return text;
}

function numericId(value: unknown, field: string) {
  const text = textValue(value, field, 40);
  if (!/^\d+$/.test(text)) throw new Error(`${field} không hợp lệ`);
  return text;
}

function integer(value: unknown, field: string, min: number, max: number) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${field} không hợp lệ`);
  }
  return number;
}

function dateValue(value: unknown, field: string) {
  const text = textValue(value, field, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`${field} không hợp lệ`);
  }
  return text;
}

function dateTimeValue(value: unknown, field: string) {
  const text = textValue(value, field, 40);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(text)) {
    throw new Error(`${field} không hợp lệ`);
  }
  return text;
}

function businessNumberValue(value: unknown) {
  const text = textValue(value, "businessNumber", 20);
  if (!/^\d{8,14}(?:-\d{1,4})?$/.test(text)) {
    throw new Error("Mã số thuế không hợp lệ");
  }
  return text;
}

async function upstream(
  token: string,
  path: string,
  options: { method?: "GET" | "POST"; query?: URLSearchParams; body?: unknown } = {},
) {
  const base = (process.env.SME_CONNECT_API_BASE || DEFAULT_API_BASE).replace(
    /\/$/,
    "",
  );
  const url = `${base}${path}${options.query ? `?${options.query}` : ""}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await response.text();
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // Some SME Connect errors are returned as plain text or HTML.
    }

    return { status: response.status, data };
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  const noStoreHeaders = { "Cache-Control": "no-store, private" };
  try {
    const token = request.headers.get("x-sme-token")?.trim() ?? "";
    if (token.length < 10 || token.length > 12_000 || /[\r\n]/.test(token)) {
      return Response.json(
        { error: "Bearer token không hợp lệ hoặc đang để trống." },
        { status: 401, headers: noStoreHeaders },
      );
    }

    const payload = (await request.json()) as JsonRecord;
    const action = textValue(payload.action, "action", 40);
    let result: { status: number; data: unknown };

    switch (action) {
      case "tasks": {
        const query = new URLSearchParams({
          pageSize: String(integer(payload.pageSize ?? 20, "pageSize", 1, 100)),
          pageIndex: String(integer(payload.pageIndex ?? 1, "pageIndex", 1, 1_000)),
          username: textValue(payload.username, "username", 80),
          membershipId: numericId(payload.membershipId, "membershipId"),
        });
        result = await upstream(token, "/sme-task", { query });
        break;
      }
      case "task-detail": {
        const taskId = numericId(payload.taskId, "taskId");
        result = await upstream(token, `/sme-task/${taskId}`);
        break;
      }
      case "task-history": {
        const taskId = numericId(payload.taskId, "taskId");
        result = await upstream(token, `/task/${taskId}/history`, {
          query: new URLSearchParams({
            sort: "createdDate, desc",
            pageSize: String(integer(payload.pageSize ?? 20, "pageSize", 1, 100)),
          }),
        });
        break;
      }
      case "activities": {
        const query = new URLSearchParams({
          sort: "activityId, desc",
          pageSize: String(integer(payload.pageSize ?? 100, "pageSize", 1, 1_000)),
        });
        if (payload.taskId !== undefined && String(payload.taskId).trim()) {
          query.set("taskId", numericId(payload.taskId, "taskId"));
        } else {
          const activityStatus = textValue(payload.activityStatus, "activityStatus", 12);
          if (!/^(DONE|PLAN)$/.test(activityStatus)) {
            throw new Error("activityStatus không hợp lệ");
          }
          query.set("activityStatus", activityStatus);
          query.set("fromCreDate", dateValue(payload.fromDate, "fromDate"));
          query.set("toCreDate", dateValue(payload.toDate, "toDate"));
          query.set(
            "pageIndex",
            String(integer(payload.pageIndex ?? 0, "pageIndex", 0, 1_000)),
          );
        }
        result = await upstream(token, "/lead/activity", { query });
        break;
      }
      case "activity-types": {
        result = await upstream(token, "/lead/activity-type", {
          query: new URLSearchParams({ pageSize: "1000" }),
        });
        break;
      }
      case "activity-results": {
        const activityTypeId = numericId(
          payload.activityTypeId,
          "activityTypeId",
        );
        result = await upstream(token, "/lead/activity-result", {
          query: new URLSearchParams({
            pageSize: "1000",
            activityTypeId,
          }),
        });
        break;
      }
      case "call-dashboard": {
        result = await upstream(token, "/lead/three-cx/dashboard", {
          query: new URLSearchParams({
            activityId: "",
            fromDate: dateTimeValue(payload.fromDate, "fromDate"),
            toDate: dateTimeValue(payload.toDate, "toDate"),
          }),
        });
        break;
      }
      case "bid-count": {
        result = await upstream(token, "/lead/pool-bidding/count");
        break;
      }
      case "bid-contractor": {
        result = await upstream(token, "/lead/bid-contractor/show", {
          query: new URLSearchParams({
            businessNumber: businessNumberValue(payload.businessNumber),
          }),
        });
        break;
      }
      case "user-profile": {
        result = await upstream(token, "/user", {
          query: new URLSearchParams({
            username: textValue(payload.username, "username", 80),
          }),
        });
        break;
      }
      case "catalog-overview": {
        const [sourceResult, programResult, productResult] = await Promise.all([
          upstream(token, "/lead/customer-source/all"),
          upstream(token, "/lead/exploration-program/all"),
          upstream(token, "/smartsme/news-product/all"),
        ]);
        const failed = [sourceResult, programResult, productResult].find(
          (item) => item.status < 200 || item.status >= 300,
        );
        result = {
          status: failed?.status ?? 200,
          data: {
            customerSources: sourceResult.data,
            explorationPrograms: programResult.data,
            products: productResult.data,
          },
        };
        break;
      }
      case "complete": {
        const taskId = numericId(payload.taskId, "taskId");
        const customerId = numericId(payload.customerId, "customerId");
        const activityTypeId = numericId(
          payload.activityTypeId,
          "activityTypeId",
        );
        const activityResultId = numericId(
          payload.activityResultId,
          "activityResultId",
        );
        const note = textValue(payload.note, "note", 2_000);
        if (/DỮ LIỆU MẪU|UAT-RANDOM/i.test(note)) {
          return Response.json(
            { error: "Ghi chú chứa nhãn thử nghiệm nên không thể gửi vào API thật." },
            { status: 400, headers: noStoreHeaders },
          );
        }

        result = await upstream(token, "/lead/activity/v2", {
          method: "POST",
          body: {
            doneRequest: {
              activityStatus: "DONE",
              activityTypeId: Number(activityTypeId),
              taskId: Number(taskId),
              customerId: Number(customerId),
              activityResultId: Number(activityResultId),
              estimationDate: null,
              note,
              taskStatus: "PROCESSING",
            },
            planRequest: null,
          },
        });
        break;
      }
      default:
        return Response.json(
          { error: "Thao tác API không được hỗ trợ." },
          { status: 400, headers: noStoreHeaders },
        );
    }

    return Response.json(
      { upstreamStatus: result.status, data: result.data },
      {
        status: result.status >= 200 && result.status < 600 ? result.status : 502,
        headers: noStoreHeaders,
      },
    );
  } catch (error) {
    const message =
      error instanceof DOMException && error.name === "AbortError"
        ? "SME Connect phản hồi quá thời gian."
        : error instanceof Error
          ? error.message
          : "Không thể xử lý yêu cầu SME Connect.";
    return Response.json(
      { error: message },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
