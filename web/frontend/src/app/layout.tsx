import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-jakarta",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-dm",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vica – Tìm việc thông minh",
  description: "Nền tảng tìm việc AI hỗ trợ tạo CV, đánh giá độ phù hợp và theo dõi ứng tuyển",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${jakarta.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-dm), system-ui, sans-serif",
              fontSize: "14px",
              borderRadius: "10px",
            },
          }}
        />
      </body>
    </html>
  );
}
