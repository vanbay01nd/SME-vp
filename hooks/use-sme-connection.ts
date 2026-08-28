"use client";

import { useState } from "react";
import { toast } from "sonner";
import { smeCall } from "@/lib/sme-api";
import { Task, ApiOption, JsonRecord } from "@/lib/constants";
import { normalizeArray, toTask, cleanToken, asRecord, unwrapRecord, pick, toOptions } from "@/lib/task-mapper";
import { asText } from "@/lib/formatters";

const SME_LOGIN = "https://smeconnect.vpbank.com.vn/digitalgate/login";
const TOKEN_COMMAND = "localStorage.getItem('authtoken')";
const MOBILE_TOKEN_BOOKMARKLET =
  "javascript:(()=>{const t=localStorage.getItem('authtoken');if(!t){alert('Không tìm thấy token. Hãy đăng nhập lại SME Connect.');return}const f=()=>prompt('Giữ vào token để sao chép:',t);if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(()=>alert('Đã sao chép token. Quay lại SME Connect Task Manager.')).catch(f)}else{f()}})()";

export function useSmeConnection({ displayName, onTasksReceived, onActivityTypesReceived, onScanUpdate }: { 
  displayName: string;
  onTasksReceived: (tasks: Task[]) => void;
  onActivityTypesReceived: (types: ApiOption[]) => void;
  onScanUpdate: (msg: string) => void;
}) {
  const [token, setToken] = useState("");
  const [connected, setConnected] = useState(false);
  const [connectionBusy, setConnectionBusy] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState("account");
  const [username, setUsername] = useState("");
  const [membershipId, setMembershipId] = useState("");
  const [password, setPassword] = useState("");
  const [credentialBusy, setCredentialBusy] = useState(false);
  const [credentialError, setCredentialError] = useState("");
  const [userProfile, setUserProfile] = useState<JsonRecord | null>(null);

  const profileName = userProfile
    ? asText(pick(userProfile, "fullName", "username"), displayName)
    : displayName;
  const profileDepartment = userProfile
    ? asText(pick(userProfile, "centerName", "departmentName", "departmentCode"), "SME Tây Ninh")
    : "SME Tây Ninh";
  const profileInitials = profileName
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "BN";

  const connect = async (
    tokenOverride?: string,
    identityOverride?: { username?: string; membershipId?: string }
  ) => {
    const activeToken = cleanToken(tokenOverride ?? token);
    const activeUsername = (identityOverride?.username ?? username).trim();
    const activeMembershipId = (identityOverride?.membershipId ?? membershipId).trim();
    if (!activeToken) {
      toast.error("Anh cần dán Bearer token trước khi kết nối.");
      return false;
    }
    if (!activeUsername || !/^\d+$/.test(activeMembershipId)) {
      toast.error("Username hoặc Membership ID chưa hợp lệ.");
      return false;
    }
    setToken(activeToken);
    setUsername(activeUsername);
    setMembershipId(activeMembershipId);
    setConnectionBusy(true);
    try {
      const [taskData, typeData, profileData] = await Promise.all([
        smeCall(activeToken, {
          action: "tasks",
          pageSize: 20,
          pageIndex: 1,
          username: activeUsername,
          membershipId: activeMembershipId,
        }),
        smeCall(activeToken, { action: "activity-types" }),
        smeCall(activeToken, {
          action: "user-profile",
          username: activeUsername,
        }).catch(() => null),
      ]);
      const mapped = normalizeArray(taskData)
        .map(toTask)
        .filter((task): task is Task => Boolean(task));
      
      onTasksReceived(mapped);
      onActivityTypesReceived(toOptions(typeData, ["activityTypeId", "id", "typeId"]));
      
      if (profileData) {
        const profile = unwrapRecord(profileData);
        setUserProfile(Object.keys(profile).length ? profile : null);
      } else {
        setUserProfile(null);
      }
      setConnected(true);
      onScanUpdate(`Kết nối lúc ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`);
      setConnectionOpen(false);
      toast.success(`Kết nối thành công · nhận ${mapped.length} task trang đầu.`);
      return true;
    } catch (error) {
      setConnected(false);
      toast.error(error instanceof Error ? error.message : "Không thể kết nối.");
      return false;
    } finally {
      setConnectionBusy(false);
    }
  };

  const loginWithCredentials = async () => {
    if (!username.trim() || !password) {
      const message = "Anh cần nhập đầy đủ tài khoản và mật khẩu SME Connect.";
      setCredentialError(message);
      toast.error(message);
      return;
    }
    if (membershipId.trim() && !/^\d+$/.test(membershipId.trim())) {
      const message = "Membership ID chưa hợp lệ.";
      setCredentialError(message);
      toast.error(message);
      return;
    }

    setCredentialError("");
    setCredentialBusy(true);
    try {
      const response = await fetch("/api/sme-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          membershipId: membershipId.trim(),
        }),
        cache: "no-store",
      });
      const result = asRecord(await response.json().catch(() => ({})));
      if (!response.ok) {
        throw new Error(
          typeof result.error === "string" ? result.error : "Không thể đăng nhập SME Connect."
        );
      }

      const loginToken = cleanToken(String(result.token ?? ""));
      if (!loginToken) throw new Error("SME Connect không trả về token.");

      const resolvedUsername = String(result.username ?? username).trim();
      const resolvedMembershipId = String(result.membershipId ?? membershipId).trim();
      if (!/^\d+$/.test(resolvedMembershipId)) {
        throw new Error("Không xác định được Membership ID của tài khoản.");
      }
      await connect(loginToken, {
        username: resolvedUsername,
        membershipId: resolvedMembershipId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể đăng nhập SME Connect.";
      setCredentialError(message);
      toast.error(message);
    } finally {
      setPassword("");
      setCredentialBusy(false);
    }
  };

  const disconnect = () => {
    setPassword("");
    setToken("");
    setConnected(false);
    setUserProfile(null);
    setConnectionOpen(false);
    toast.info("Đã xóa token và dữ liệu Lead khỏi phiên hiện tại.");
  };

  const copyTokenCommand = async () => {
    try {
      await navigator.clipboard.writeText(TOKEN_COMMAND);
      toast.success("Đã sao chép lệnh lấy token.");
    } catch {
      toast.error("Không thể sao chép tự động. Anh hãy copy lệnh hiển thị.");
    }
  };

  const copyMobileBookmarklet = async () => {
    try {
      await navigator.clipboard.writeText(MOBILE_TOKEN_BOOKMARKLET);
      toast.success("Đã sao chép bookmark lấy token.");
    } catch {
      toast.error("Không thể sao chép tự động. Anh hãy giữ vào dòng công cụ để sao chép.");
    }
  };

  const readTokenFromClipboard = async () => {
    try {
      const clipboardToken = cleanToken(await navigator.clipboard.readText());
      if (!clipboardToken) {
        toast.error("Clipboard chưa có token SME Connect.");
        return null;
      }
      return clipboardToken;
    } catch {
      toast.error("Trình duyệt chưa cho phép đọc clipboard. Anh hãy giữ ô Bearer token và chọn Dán.");
      return null;
    }
  };

  const pasteTokenFromClipboard = async () => {
    const clipboardToken = await readTokenFromClipboard();
    if (!clipboardToken) return;
    setToken(clipboardToken);
    toast.success("Đã dán token từ clipboard.");
  };

  const pasteAndConnect = async () => {
    const clipboardToken = await readTokenFromClipboard();
    if (!clipboardToken) return;
    setToken(clipboardToken);
    const connectedSuccessfully = await connect(clipboardToken);
    if (connectedSuccessfully) {
      try {
        await navigator.clipboard.writeText("");
      } catch {
        // Một số trình duyệt chặn xóa clipboard sau khi yêu cầu mạng hoàn tất.
      }
    }
  };

  return {
    token,
    setToken,
    connected,
    connectionBusy,
    connectionOpen,
    setConnectionOpen,
    connectionMethod,
    setConnectionMethod,
    username,
    setUsername,
    membershipId,
    setMembershipId,
    password,
    setPassword,
    credentialBusy,
    credentialError,
    userProfile,
    profileName,
    profileDepartment,
    profileInitials,
    connect,
    loginWithCredentials,
    disconnect,
    copyTokenCommand,
    copyMobileBookmarklet,
    readTokenFromClipboard,
    pasteTokenFromClipboard,
    pasteAndConnect,
    cleanToken,
  };
}
