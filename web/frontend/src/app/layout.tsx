import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";

import "./globals.css";

export const metadata: Metadata = {
  title: "Vica - Tìm việc thông minh",
  description: "Nền tảng tìm việc AI hỗ trợ tạo CV, đánh giá độ phù hợp và theo dõi ứng tuyển",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "system-ui, sans-serif",
              fontSize: "14px",
              borderRadius: "10px",
            },
          }}
        />
      </body>
    </html>
  );
}
