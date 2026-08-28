import { Task, NoteTemplate } from "@/lib/constants";

export const noteTemplates: NoteTemplate[] = [
  {
    id: "not-reached",
    label: "Chưa liên hệ được",
    description: "Mẫu ghi chú cho các Lead có cùng kết quả thực tế.",
    template:
      "Đã thực hiện gọi điện liên hệ {customer} theo Lead Task #{taskId} nhưng chưa kết nối được. ĐVKD sẽ tiếp tục liên hệ lại theo kế hoạch.",
  },
  {
    id: "no-demand",
    label: "Chưa có nhu cầu",
    description: "Áp dụng khi khách hàng thực tế xác nhận chưa có nhu cầu.",
    template:
      "Đã gọi điện trao đổi với {customer} theo Lead Task #{taskId}. Khách hàng phản hồi hiện chưa phát sinh nhu cầu sử dụng thêm sản phẩm/dịch vụ ngân hàng.",
  },
  {
    id: "interested",
    label: "Khách hàng quan tâm",
    description: "Áp dụng khi khách hàng thực tế quan tâm sản phẩm.",
    template:
      "Đã trao đổi với {customer} theo Lead Task #{taskId}. Khách hàng ghi nhận thông tin và quan tâm đến sản phẩm; ĐVKD tiếp tục tư vấn theo nhu cầu thực tế.",
  },
  {
    id: "met-customer",
    label: "Đã gặp khách hàng",
    description: "Mẫu ghi nhận buổi gặp đã phát sinh thực tế.",
    template:
      "Đã gặp và trao đổi trực tiếp với {customer} theo Lead Task #{taskId}. Khách hàng ghi nhận nội dung tư vấn; ĐVKD tiếp tục cập nhật nhu cầu và hồ sơ liên quan.",
  },
];

export function renderNoteTemplate(template: string, task: Task) {
  return template
    .replaceAll("{customer}", task.customer)
    .replaceAll("{taskId}", task.id)
    .replaceAll("{cif}", task.cif)
    .replaceAll("{source}", task.source);
}
