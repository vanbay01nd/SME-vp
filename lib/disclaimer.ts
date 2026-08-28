export const DISCLAIMER_VERSION = "v1";
export const DISCLAIMER_KEY = "sme-disclaimer-accepted";

export interface DisclaimerSection {
  title: string;
  items: string[];
}

export const DISCLAIMER_SECTIONS: DisclaimerSection[] = [
  {
    title: "1. TÍNH CHẤT CÔNG CỤ",
    items: [
      "Đây là công cụ hỗ trợ giao diện người dùng nội bộ, hoạt động trực tiếp trên trình duyệt của bạn.",
      "Công cụ không thay thế hệ thống lõi SME Connect mà chỉ cung cấp giao diện thao tác nhanh và tự động hóa các thao tác lặp lại.",
    ],
  },
  {
    title: "2. TRÁCH NHIỆM DỮ LIỆU",
    items: [
      "Mọi dữ liệu hiển thị được lấy trực tiếp từ hệ thống của ngân hàng thông qua token bạn cung cấp.",
      "Dữ liệu được xử lý tại local (trình duyệt) và KHÔNG được lưu trữ trên bất kỳ máy chủ trung gian nào.",
    ],
  },
  {
    title: "3. BẢO MẬT THÔNG TIN",
    items: [
      "Bạn phải có trách nhiệm bảo mật Token đăng nhập và không chia sẻ cho bất kỳ ai.",
      "Bạn phải tuân thủ nghiêm ngặt các quy định về an toàn thông tin và bảo mật dữ liệu khách hàng.",
      "Sử dụng tính năng Privacy Shield (Che thông tin) khi trình chiếu hoặc có người thứ ba quan sát màn hình.",
    ],
  },
  {
    title: "4. GIỚI HẠN TRÁCH NHIỆM",
    items: [
      "Công cụ được cung cấp 'nguyên trạng'. Người dùng tự chịu trách nhiệm về tính chính xác của các quyết định và hành động thao tác (ví dụ: cập nhật hàng loạt).",
      "Nhóm phát triển không chịu trách nhiệm cho bất kỳ gián đoạn hoặc sai sót nào do API của hệ thống gốc thay đổi.",
    ],
  },
  {
    title: "5. LỜI KHUYÊN AN TOÀN",
    items: [
      "Luôn khóa màn hình hoặc đăng xuất khi rời khỏi bàn làm việc.",
      "Chỉ sử dụng công cụ trên thiết bị của ngân hàng cấp phát hoặc thiết bị cá nhân đã được phê duyệt.",
    ],
  },
];

export function isDisclaimerAccepted(): boolean {
  if (typeof window === "undefined") return false;
  const data = localStorage.getItem(DISCLAIMER_KEY);
  if (!data) return false;
  try {
    const parsed = JSON.parse(data);
    return parsed.version === DISCLAIMER_VERSION && !!parsed.acceptedAt;
  } catch {
    return false;
  }
}

export function acceptDisclaimer(): void {
  if (typeof window === "undefined") return;
  const payload = {
    version: DISCLAIMER_VERSION,
    acceptedAt: new Date().toISOString(),
  };
  localStorage.setItem(DISCLAIMER_KEY, JSON.stringify(payload));
}

export function revokeDisclaimer(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DISCLAIMER_KEY);
}

export function getDisclaimerAcceptedAt(): string | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(DISCLAIMER_KEY);
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    return parsed.acceptedAt || null;
  } catch {
    return null;
  }
}
