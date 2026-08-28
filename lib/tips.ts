export const TIPS: string[] = [
  "Sử dụng Privacy Shield (biểu tượng con mắt) để che các thông tin nhạy cảm khi cần chia sẻ màn hình.",
  "Privacy Shield sẽ tự động kích hoạt sau 5 phút nếu không có thao tác chuột hoặc bàn phím.",
  "Bạn có thể chọn nhiều Task cùng lúc để cập nhật hàng loạt trạng thái thay vì cập nhật từng cái một.",
  "Kiểm tra thẻ 'Hiệu suất' để theo dõi các cuộc gọi và hoạt động hàng ngày của bạn.",
  "Sử dụng phím tắt Bookmarklet trên Mobile để sao chép token nhanh chóng từ SME Connect.",
  "Bạn có thể tìm kiếm thông minh bằng cách gõ một phần tên khách hàng, mã CIF, hoặc ID của task.",
  "Tính năng lưu nháp tự động sẽ bảo vệ ghi chú của bạn nếu vô tình đóng trình duyệt hoặc mất kết nối.",
  "Phân loại các Task theo 'Chờ tiếp nhận', 'Đang xử lý', và 'Đã hoàn tất' để quản lý công việc hiệu quả hơn.",
  "Hãy chắc chắn kiểm tra lại kết quả sau khi cập nhật hàng loạt trong tab Lịch sử (Audit).",
];

export function getRandomTip(): string {
  const randomIndex = Math.floor(Math.random() * TIPS.length);
  return TIPS[randomIndex];
}

export function getDailyTip(): string {
  const date = new Date();
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const index = dayOfYear % TIPS.length;
  return TIPS[index];
}
