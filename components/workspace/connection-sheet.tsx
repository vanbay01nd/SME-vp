"use client";

import {
  KeyRound,
  ShieldCheck,
  LockKeyhole,
  Smartphone,
  LogIn,
  Bookmark,
  Copy,
  ExternalLink,
  ClipboardPaste,
  BadgeCheck,
  Unplug,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SME_LOGIN, TOKEN_COMMAND, MOBILE_TOKEN_BOOKMARKLET } from "@/lib/constants";

interface ConnectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connected: boolean;
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

export function ConnectionSheet({
  open,
  onOpenChange,
  connected,
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
}: ConnectionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="connection-sheet sm:max-w-lg">
        <SheetHeader className="connection-header">
          <div className="connection-title-row">
            <span className="connection-title-icon">
              <KeyRound size={19} />
            </span>
            <div>
              <SheetTitle>Kết nối SME Connect</SheetTitle>
              <SheetDescription>
                Token chỉ tồn tại trong bộ nhớ phiên trình duyệt, không lưu
                vào mã nguồn, URL hay cơ sở dữ liệu.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="sheet-form">
          <div className="security-note">
            <ShieldCheck size={18} />
            <div>
              <strong>Kết nối bảo mật theo phiên</strong>
              <p>Mật khẩu không được lưu; đóng trang hoặc ngắt kết nối sẽ xóa token.</p>
            </div>
          </div>
          <Tabs
            value={connectionMethod}
            onValueChange={setConnectionMethod}
            className="connection-method-tabs"
          >
            <TabsList className="connection-tabs">
              <TabsTrigger value="account">
                <LockKeyhole size={14} /> Tài khoản
              </TabsTrigger>
              <TabsTrigger value="mobile">
                <Smartphone size={14} /> Điện thoại
              </TabsTrigger>
              <TabsTrigger value="desktop">
                <KeyRound size={14} /> Máy tính
              </TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="connection-tab-panel">
              <form
                id="credential-login-form"
                className="credential-card"
                onSubmit={(event) => {
                  event.preventDefault();
                  void loginWithCredentials();
                }}
              >
                <div className="method-heading">
                  <span>
                    <LockKeyhole size={16} />
                  </span>
                  <div>
                    <strong>Đăng nhập trực tiếp · nhanh nhất</strong>
                    <p>Nhập mật khẩu SME Connect để app tự lấy token và kết nối dữ liệu.</p>
                  </div>
                </div>
                <div className="identity-grid account-identity-grid">
                  <label>
                    Tên đăng nhập
                    <Input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      type="text"
                      autoComplete="username"
                      name="username"
                      placeholder="Nhập username SME Connect"
                    />
                  </label>
                  <label>
                    Membership ID <small>Không bắt buộc</small>
                    <Input
                      value={membershipId}
                      onChange={(event) => setMembershipId(event.target.value)}
                      inputMode="numeric"
                      name="membershipId"
                      placeholder="Để trống để tự nhận diện"
                    />
                  </label>
                </div>
                <label>
                  Mật khẩu SME Connect
                  <Input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    name="password"
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                  />
                </label>
                <Button
                  type="submit"
                  className="vp-primary"
                  disabled={credentialBusy || connectionBusy}
                >
                  {credentialBusy || connectionBusy ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <LogIn size={16} />
                  )}
                  {credentialBusy || connectionBusy
                    ? "Đang đăng nhập..."
                    : "Đăng nhập & kết nối"}
                </Button>
                {credentialError && (
                  <p className="credential-error" role="alert">
                    {credentialError}
                  </p>
                )}
                <p className="credential-security">
                  Thông tin được chuyển tiếp qua HTTPS tới SME Connect, không lưu vào cơ sở dữ liệu, URL hoặc log của app.
                </p>
              </form>
            </TabsContent>
            <TabsContent value="mobile" className="connection-tab-panel">
              <div className="mobile-token-card">
                <div className="method-heading">
                  <span>
                    <Bookmark size={16} />
                  </span>
                  <div>
                    <strong>Bookmark lấy token · thiết lập một lần</strong>
                    <p>Không cần mở Console hoặc nhập mật khẩu vào app.</p>
                  </div>
                </div>
                <ol>
                  <li>Bấm <b>Sao chép bookmark</b> bên dưới.</li>
                  <li>Mở SME Connect, đăng nhập và lưu trang làm dấu trang.</li>
                  <li>Sửa dấu trang: tên <b>Lấy token SME</b>, thay địa chỉ bằng nội dung vừa sao chép.</li>
                  <li>Khi đang ở SME Connect, gõ <b>Lấy token SME</b> trên thanh địa chỉ và chọn dấu trang.</li>
                  <li>Quay lại app rồi bấm <b>Dán token &amp; kết nối</b>.</li>
                </ol>
                <code title={MOBILE_TOKEN_BOOKMARKLET}>{MOBILE_TOKEN_BOOKMARKLET}</code>
                <div className="mobile-token-actions">
                  <Button variant="outline" size="sm" onClick={() => void copyMobileBookmarklet()}>
                    <Copy size={14} /> Sao chép bookmark
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={SME_LOGIN} target="_blank" rel="noreferrer">
                      Mở SME Connect <ExternalLink size={14} />
                    </a>
                  </Button>
                </div>
                <Button
                  className="vp-primary bookmark-connect-btn"
                  disabled={connectionBusy}
                  onClick={() => void pasteAndConnect()}
                >
                  {connectionBusy ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <ClipboardPaste size={16} />
                  )}
                  {connectionBusy ? "Đang kết nối..." : "Dán token & kết nối"}
                </Button>
                <p className="bookmark-security">
                  Bookmark chỉ đọc <code>authtoken</code> trên trang SME Connect và sao chép vào thiết bị; không gửi token tới địa chỉ khác.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="desktop" className="connection-tab-panel">
              <div className="token-steps">
                <strong>Lấy token trong 3 bước</strong>
                <ol>
                  <li>Mở SME Connect và đăng nhập như bình thường.</li>
                  <li>Mở Console của trình duyệt.</li>
                  <li>Chạy lệnh dưới đây rồi dán kết quả vào app.</li>
                </ol>
                <code>{TOKEN_COMMAND}</code>
                <div>
                  <Button variant="outline" size="sm" onClick={() => void copyTokenCommand()}>
                    <Copy size={14} /> Sao chép lệnh
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={SME_LOGIN} target="_blank" rel="noreferrer">
                      Mở SME Connect <ExternalLink size={14} />
                    </a>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          {connectionMethod !== "account" && (
            <div className="fallback-connect-card">
              <div className="identity-grid fallback-identity-grid">
                <label>
                  Tên đăng nhập
                  <Input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    type="text"
                    autoComplete="username"
                    name="fallbackUsername"
                    placeholder="Username SME Connect"
                  />
                </label>
                <label>
                  Membership ID
                  <Input
                    value={membershipId}
                    onChange={(event) => setMembershipId(event.target.value)}
                    inputMode="numeric"
                    name="fallbackMembershipId"
                    placeholder="Membership ID"
                  />
                </label>
              </div>
              <div className="manual-token-section">
                <label>
                  <span className="token-label-row">
                    <span>Bearer token</span>
                    <button type="button" onClick={() => void pasteTokenFromClipboard()}>
                      <ClipboardPaste size={13} /> Dán clipboard
                    </button>
                  </span>
                  <Input
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    type="password"
                    placeholder="Dán authtoken từ SME Connect"
                    autoComplete="off"
                  />
                </label>
                <Button
                  className="vp-primary"
                  disabled={connectionBusy || !token.trim()}
                  onClick={() => void connect()}
                >
                  {connectionBusy ? (
                    <LoaderCircle className="animate-spin" size={17} />
                  ) : (
                    <BadgeCheck size={17} />
                  )}
                  {connectionBusy ? "Đang kiểm tra..." : "Kiểm tra và kết nối"}
                </Button>
              </div>
            </div>
          )}
          {connected && (
            <Button variant="outline" onClick={disconnect}>
              <Unplug size={16} /> Ngắt kết nối và xóa token
            </Button>
          )}
          <p className="helper-copy">
            Đăng nhập bằng tài khoản là phương án chính. Bookmark và token
            thủ công vẫn được giữ lại để dự phòng khi endpoint đăng nhập
            tạm thời không phản hồi.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
