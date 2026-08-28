"use client";

import {
  LayoutDashboard,
  BarChart3,
  BriefcaseBusiness,
  Activity,
  KeyRound,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const maskedName = mask(profileName, "staffName");
  const maskedDept = mask(profileDepartment, "department");

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand-lockup">
          <Mark />
          <div className="brand-copy">
            <strong>SME Connect</strong>
            <span>Lead Task Control</span>
          </div>
        </div>

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

        <div className="top-actions">
          <div className={connected ? "live-pill" : "offline-pill"}>
            <span /> {connected ? "Dữ liệu thật" : "Chưa kết nối"}
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
            <KeyRound size={15} /> {connected ? "Đã kết nối" : "Kết nối API"}
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

          <div className="user-chip">
            <div className="avatar">{profileInitials}</div>
            <div>
              <strong>{maskedName}</strong>
              <span>{maskedDept}</span>
            </div>
            <Menu size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}
