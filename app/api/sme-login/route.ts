const SME_ADMIN_API =
  "https://smeconnect.vpbank.com.vn/tai-khoan-doanh-nghiep/smeca-admin/api";
const SME_ORIGIN = "https://smeconnect.vpbank.com.vn";
const SME_LOGIN_PAGE = `${SME_ORIGIN}/digitalgate/login`;
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

type JsonRecord = Record<string, unknown>;
type Attempt = { count: number; resetAt: number };

const attempts = new Map<string, Attempt>();
const ATTEMPT_WINDOW_MS = 10 * 60 * 1_000;
const MAX_ATTEMPTS = 5;
const noStoreHeaders = {
  "Cache-Control": "no-store, private",
  Pragma: "no-cache",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    const requestUrl = new URL(request.url);

    if (originUrl.origin === requestUrl.origin) return true;
    if (host && originUrl.host === host) return true;

    const hostname = originUrl.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.") ||
      hostname.endsWith(".ngrok-free.app") ||
      hostname.endsWith(".trycloudflare.com") ||
      hostname.endsWith(".loca.lt")
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function cleanUsername(value: unknown) {
  const username = String(value ?? "").trim();
  if (!/^[A-Za-z0-9._-]{2,80}$/.test(username)) {
    throw new Error("USERNAME_INVALID");
  }
  return username;
}

function cleanPassword(value: unknown) {
  const password = String(value ?? "");
  if (!password || password.length > 256 || /[\r\n]/.test(password)) {
    throw new Error("PASSWORD_INVALID");
  }
  return password;
}

function cleanMembershipId(value: unknown) {
  const membershipId = String(value ?? "").trim();
  if (membershipId && !/^\d{1,20}$/.test(membershipId)) {
    throw new Error("MEMBERSHIP_INVALID");
  }
  return membershipId;
}

function requestKey(request: Request, username: string) {
  const forwarded = request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")
    ?? "unknown";
  const ip = forwarded.split(",")[0].trim().slice(0, 80);
  return `${ip}:${username.toLowerCase()}`;
}

function getAttempt(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.delete(key);
    return null;
  }
  return current;
}

function recordFailure(key: string) {
  const current = getAttempt(key);
  attempts.set(key, {
    count: (current?.count ?? 0) + 1,
    resetAt: current?.resetAt ?? Date.now() + ATTEMPT_WINDOW_MS,
  });

  if (attempts.size > 2_000) {
    const now = Date.now();
    for (const [attemptKey, attempt] of attempts) {
      if (attempt.resetAt <= now) attempts.delete(attemptKey);
    }
  }
}

async function upstream(
  path: string,
  options: {
    method?: "GET" | "POST";
    token?: string;
    body?: unknown;
    cookies?: string;
  } = {},
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(`${SME_ADMIN_API}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
        Referer: SME_LOGIN_PAGE,
        "User-Agent": BROWSER_USER_AGENT,
        "X-Requested-With": "XMLHttpRequest",
        ...(options.method === "POST" ? { Origin: SME_ORIGIN } : {}),
        ...(options.token
          ? { Authorization: `Bearer ${options.token}` }
          : {}),
        ...(options.cookies ? { Cookie: options.cookies } : {}),
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
      // Không đưa HTML hoặc nội dung lỗi thô của hệ thống đăng nhập về client.
    }
    return { status: response.status, data };
  } finally {
    clearTimeout(timer);
  }
}

function cookiesFrom(response: Response) {
  const cookieHeaders = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const values = cookieHeaders.getSetCookie?.() ?? [];
  if (!values.length) {
    const combined = response.headers.get("set-cookie");
    if (combined) values.push(combined);
  }
  return values
    .map((value) => value.split(";", 1)[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function bootstrapLoginSession() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(SME_LOGIN_PAGE, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
        "User-Agent": BROWSER_USER_AGENT,
      },
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });
    return cookiesFrom(response);
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

function membershipFromLoginBody(loginBody: JsonRecord): string {
  if (Array.isArray(loginBody.roleInDepartmentList) && loginBody.roleInDepartmentList.length > 0) {
    const list = loginBody.roleInDepartmentList as JsonRecord[];
    const defaultRole = list.find((item) => item.isDefault === true) || list[0];
    const mId = String(asRecord(defaultRole).membershipId ?? "").trim();
    if (/^\d{1,20}$/.test(mId)) return mId;
  }
  return "";
}

function membershipFromProfile(profile: JsonRecord) {
  const currentRole = asRecord(profile.currentRole);
  const membershipId = String(currentRole.membershipId ?? "").trim();
  return /^\d{1,20}$/.test(membershipId) ? membershipId : "";
}

function profileMemberships(profile: JsonRecord) {
  if (!Array.isArray(profile.membershipList)) return [];
  return profile.membershipList
    .map((item) => String(asRecord(item).membershipId ?? "").trim())
    .filter((item) => /^\d{1,20}$/.test(item));
}

export async function POST(request: Request) {
  try {
    if (!isAllowedOrigin(request)) {
      return Response.json(
        { error: "Yêu cầu đăng nhập không hợp lệ." },
        { status: 403, headers: noStoreHeaders },
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 2_048) {
      return Response.json(
        { error: "Dữ liệu đăng nhập quá lớn." },
        { status: 413, headers: noStoreHeaders },
      );
    }

    const payload = asRecord(await request.json());
    const username = cleanUsername(payload.username);
    const password = cleanPassword(payload.password);
    const requestedMembershipId = cleanMembershipId(payload.membershipId);
    const attemptKey = requestKey(request, username);
    const currentAttempt = getAttempt(attemptKey);

    if (currentAttempt && currentAttempt.count >= MAX_ATTEMPTS) {
      const retryAfter = Math.max(
        1,
        Math.ceil((currentAttempt.resetAt - Date.now()) / 1_000),
      );
      return Response.json(
        { error: "Đã thử đăng nhập quá nhiều lần. Vui lòng chờ rồi thử lại." },
        {
          status: 429,
          headers: { ...noStoreHeaders, "Retry-After": String(retryAfter) },
        },
      );
    }

    let sessionCookies = await bootstrapLoginSession();
    let loginResult = await upstream("/auth/login", {
      method: "POST",
      cookies: sessionCookies,
      body: { username, password },
    });
    let loginBody = asRecord(loginResult.data);
    let token = String(loginBody.token ?? "").trim();

    // Fallback: nếu mật khẩu có khoảng trắng thừa do copy-paste, thử lại với mật khẩu đã trim
    if (
      (loginResult.status < 200 || loginResult.status >= 300 || !token)
      && password.trim() !== password
      && password.trim().length > 0
    ) {
      loginResult = await upstream("/auth/login", {
        method: "POST",
        cookies: sessionCookies,
        body: { username, password: password.trim() },
      });
      loginBody = asRecord(loginResult.data);
      token = String(loginBody.token ?? "").trim();
    }

    if (loginResult.status < 200 || loginResult.status >= 300) {
      console.warn(
        `[sme-login] FAILED username="${username}", pwdLen=${password.length}, status=${loginResult.status}, data=`,
        loginResult.data,
      );
    }

    if (loginResult.status >= 500) {
      return Response.json(
        { error: "Dịch vụ đăng nhập SME Connect đang tạm thời không phản hồi." },
        { status: 502, headers: noStoreHeaders },
      );
    }

    if (
      loginResult.status < 200
      || loginResult.status >= 300
      || token.length < 10
      || token.length > 12_000
      || /[\r\n]/.test(token)
    ) {
      recordFailure(attemptKey);
      const serverMessage =
        typeof loginBody.message === "string" && loginBody.message.trim()
          ? loginBody.message.trim()
          : typeof loginBody.responseMessage === "string" && loginBody.responseMessage.trim()
            ? loginBody.responseMessage.trim()
            : "Sai tài khoản, mật khẩu hoặc SME Connect từ chối đăng nhập.";
      return Response.json(
        { error: serverMessage },
        { status: 401, headers: noStoreHeaders },
      );
    }

    let profile: JsonRecord = {};
    const profileResult = await upstream("/me/info", {
      token,
      cookies: sessionCookies,
    });
    if (profileResult.status >= 200 && profileResult.status < 300) {
      profile = asRecord(profileResult.data);
    }

    const loginMembershipId = membershipFromLoginBody(loginBody);
    const currentMembershipId = membershipFromProfile(profile) || loginMembershipId;
    const availableMemberships = profileMemberships(profile);
    let resolvedMembershipId = requestedMembershipId || currentMembershipId;

    if (
      requestedMembershipId
      && currentMembershipId
      && requestedMembershipId !== currentMembershipId
      && availableMemberships.includes(requestedMembershipId)
    ) {
      const switchResult = await upstream("/me/switch-role", {
        method: "POST",
        token,
        cookies: sessionCookies,
        body: { membershipId: Number(requestedMembershipId) },
      });
      const switchedToken = String(asRecord(switchResult.data).token ?? "").trim();
      if (
        switchResult.status >= 200
        && switchResult.status < 300
        && switchedToken.length >= 10
        && switchedToken.length <= 12_000
        && !/[\r\n]/.test(switchedToken)
      ) {
        token = switchedToken;
        resolvedMembershipId = requestedMembershipId;
      }
    }

    attempts.delete(attemptKey);
    return Response.json(
      {
        ok: true,
        token,
        username,
        membershipId: resolvedMembershipId,
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    const invalidInput =
      error instanceof SyntaxError
      || (error instanceof Error && /_INVALID$/.test(error.message));
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    return Response.json(
      {
        error: invalidInput
          ? "Thông tin đăng nhập không hợp lệ."
          : timedOut
            ? "SME Connect phản hồi quá thời gian."
            : "Chưa thể đăng nhập SME Connect lúc này.",
      },
      { status: invalidInput ? 400 : 502, headers: noStoreHeaders },
    );
  }
}
