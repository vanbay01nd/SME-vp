import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SME Connect Task Manager",
  description:
    "Điều phối Lead Task, Activity, hiệu suất cuộc gọi và tra cứu nhà thầu dành cho SME Tây Ninh.",
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
