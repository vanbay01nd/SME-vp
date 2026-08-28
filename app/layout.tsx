import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SME Connect — Enterprise Workspace Pro",
  description:
    "Trung tâm điều phối công việc Lead Task, quản lý Activity và phân tích hiệu suất khách hàng doanh nghiệp.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
