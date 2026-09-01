"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BarChart3,
  BriefcaseBusiness,
  Activity,
  KeyRound,
  User,
  Shield,
  Edit3,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Mark } from "@/components/workspace/mark";
import { PrivacyShield } from "@/components/workspace/privacy-shield";
import { ConnectionSheet } from "@/components/workspace/connection-sheet";
import { WorkspaceView } from "@/lib/constants";
import type { PrivacyConfig } from "@/lib/privacy";

interface TopbarProps {
  view: WorkspaceView;
  setView: (view: WorkspaceView) => void;
  auditCount: number;
  connected: boolean;
  profileName: string;
  profileDepartment: string;
  profileInitials: string;
  // Privacy hook props
  privacyConfig: PrivacyConfig;
  savePrivacyConfig: (config: PrivacyConfig) => void;
  togglePrivacy: () => void;
  isMasked: boolean;
  isPrivacyReady: boolean;
  mask: (value: string | undefined | null, field: keyof PrivacyConfig["fields"]) => string;
  // Connection props
  connectionOpen: boolean;
  setConnectionOpen: (open: boolean) => void;
  connectionMethod: string;
  setConnectionMethod: (method: string) => void;
  username: string;
  setUsername: (username: string) => void;
  membershipId: string;
  setMembershipId: (id: string) => void;
  password: string;
  setPassword: (password: string) => void;
  token: string;
  setToken: (token: string) => void;
  credentialBusy: boolean;
  connectionBusy: boolean;
  credentialError: string;
  loginWithCredentials: () => Promise<void>;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  copyTokenCommand: () => Promise<void>;
  copyMobileBookmarklet: () => Promise<void>;
  pasteTokenFromClipboard: () => Promise<void>;
  pasteAndConnect: () => Promise<void>;
}

const ALIAS_KEY = "sme-user-alias";
const DEPT_ALIAS_KEY = "sme-dept-alias";

export function Topbar({
  view,
  setView,
  auditCount,
  connected,
  profileName,
  profileDepartment,
  profileInitials,
  privacyConfig,
  savePrivacyConfig,
  togglePrivacy,
  isMasked,
  isPrivacyReady,
  mask,
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
  token,
  setToken,
  credentialBusy,
  connectionBusy,
  credentialError,
  loginWithCredentials,
  connect,
  disconnect,
  copyTokenCommand,
  copyMobileBookmarklet,
  pasteTokenFromClipboard,
  pasteAndConnect,
}: TopbarProps) {
  const [customAlias, setCustomAlias] = useState("");
  const [customDept, setCustomDept] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    try {
      const savedAlias = localStorage.getItem(ALIAS_KEY);
      const savedDept = localStorage.getItem(DEPT_ALIAS_KEY);
      if (savedAlias) setCustomAlias(savedAlias);
      if (savedDept) setCustomDept(savedDept);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const saveAliasSettings = () => {
    try {
      if (customAlias.trim()) {
        localStorage.setItem(ALIAS_KEY, customAlias.trim());
      } else {
        localStorage.removeItem(ALIAS_KEY);
      }
      if (customDept.trim()) {
        localStorage.setItem(DEPT_ALIAS_KEY, customDept.trim());
      } else {
        localStorage.removeItem(DEPT_ALIAS_KEY);
      }
    } catch {
      // Ignore localStorage errors
    }
    setIsEditingProfile(false);
  };

  const displayNameToUse = customAlias.trim() || profileName;
  const deptNameToUse = customDept.trim() || profileDepartment;

  const maskedName = mask(displayNameToUse, "staffName");
  const maskedDept = mask(deptNameToUse, "department");

  const initials = displayNameToUse
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || profileInitials || "SM";

  return (
    <header className="topbar">
      <div className="topbar-inner">
        {/* Brand Lockup */}
        <div className="brand-lockup">
          <Mark />
          <div className="brand-copy">
            <div className="brand-title-row">
              <strong>SME Connect</strong>
              <span className="brand-badge-pro">PRO</span>
            </div>
            <span>Enterprise Workspace</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="topnav" aria-label="Điều hướng chính">
          <Button
            variant="ghost"
            className={view === "tasks" ? "nav-active" : ""}
            onClick={() => setView("tasks")}
          >
            <LayoutDashboard size={17} /> Tổng quan
          </Button>
          <Button
            variant="ghost"
            className={view === "performance" ? "nav-active" : ""}
            onClick={() => setView("performance")}
          >
            <BarChart3 size={17} /> Hiệu suất
          </Button>
          <Button
            variant="ghost"
            className={view === "contractor" ? "nav-active" : ""}
            onClick={() => setView("contractor")}
          >
            <BriefcaseBusiness size={17} /> Nhà thầu
          </Button>
          <Button
            variant="ghost"
            className={view === "audit" ? "nav-active" : ""}
            onClick={() => setView("audit")}
          >
            <Activity size={17} /> Nhật ký phiên
            {auditCount > 0 && <b className="nav-count">{auditCount}</b>}
          </Button>
        </nav>

        {/* Top Actions */}
        <div className="top-actions">
          <div className={connected ? "live-pill" : "offline-pill"}>
            <span /> {connected ? "Đang kết nối" : "Chưa kết nối"}
          </div>

          <PrivacyShield
            config={privacyConfig}
            saveConfig={savePrivacyConfig}
            togglePrivacy={togglePrivacy}
            isMasked={isMasked}
            isReady={isPrivacyReady}
          />

          <Button
            variant="outline"
            size="sm"
            className="connection-btn"
            onClick={() => setConnectionOpen(true)}
          >
            <KeyRound size={15} /> {connected ? "Đổi Token" : "Kết nối API"}
          </Button>

          <ConnectionSheet
            open={connectionOpen}
            onOpenChange={setConnectionOpen}
            connected={connected}
            connectionMethod={connectionMethod}
            setConnectionMethod={setConnectionMethod}
            username={username}
            setUsername={setUsername}
            membershipId={membershipId}
            setMembershipId={setMembershipId}
            password={password}
            setPassword={setPassword}
            token={token}
            setToken={setToken}
            credentialBusy={credentialBusy}
            connectionBusy={connectionBusy}
            credentialError={credentialError}
            loginWithCredentials={loginWithCredentials}
            connect={connect}
            disconnect={disconnect}
            copyTokenCommand={copyTokenCommand}
            copyMobileBookmarklet={copyMobileBookmarklet}
            pasteTokenFromClipboard={pasteTokenFromClipboard}
            pasteAndConnect={pasteAndConnect}
          />

          {/* User Profile Popover with Anonymity & Custom Alias Control */}
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="user-chip-button" aria-label="Hồ sơ người dùng">
                <div className="user-chip">
                  <div className="avatar">{initials}</div>
                  <div className="user-info">
                    <strong>{maskedName}</strong>
                    <span>{maskedDept}</span>
                  </div>
                  <div className="user-chip-arrow">
                    <User size={14} />
                  </div>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">Hồ sơ người dùng</h4>
                    <p className="text-xs text-muted-foreground">Tùy biến tên hiển thị &amp; bảo mật</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                    Bảo vệ PII
                  </span>
                </div>

                <Separator />

                {isEditingProfile ? (
                  <div className="space-y-2 text-xs">
                    <label className="block">
                      <span className="font-medium text-foreground block mb-1">Tên hiển thị (Biệt danh)</span>
                      <Input
                        value={customAlias}
                        onChange={(e) => setCustomAlias(e.target.value)}
                        placeholder="Ví dụ: Chuyên viên Quản lý"
                        className="h-8 text-xs"
                      />
                    </label>
                    <label className="block">
                      <span className="font-medium text-foreground block mb-1">Đơn vị / Chi nhánh</span>
                      <Input
                        value={customDept}
                        onChange={(e) => setCustomDept(e.target.value)}
                        placeholder="Ví dụ: Trung tâm KHDN"
                        className="h-8 text-xs"
                      />
                    </label>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="vp-primary flex-1 h-8 text-xs" onClick={saveAliasSettings}>
                        <Check size={13} /> Lưu biệt danh
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => setIsEditingProfile(false)}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-muted/50 rounded-lg flex items-center justify-between">
                      <div>
                        <strong className="block font-medium text-foreground">{displayNameToUse}</strong>
                        <span className="text-muted-foreground">{deptNameToUse}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs gap-1 text-emerald-700 hover:text-emerald-800"
                        onClick={() => setIsEditingProfile(true)}
                      >
                        <Edit3 size={12} /> Đổi tên
                      </Button>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground pt-1">
                      <span className="flex items-center gap-1.5">
                        <Shield size={13} className="text-emerald-600" /> Trạng thái che tên:
                      </span>
                      <strong className="text-foreground">{isMasked ? "Đang ẩn" : "Hiển thị"}</strong>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
