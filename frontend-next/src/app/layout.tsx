import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Đảm bảo bạn có file css này
import { AuthProvider } from "../context/AuthContext";
import { ChatProvider } from "../context/ChatContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Singitronic - AI Financial Assistant",
  description: "Hệ thống quản lý tài chính thông minh tích hợp Agentic AI",
};

export default function RootLayout(props: Readonly<{
  children: React.ReactNode;
}>) {
  const { children } = props;
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        {/* AuthProvider bọc ngoài cùng để xác định danh tính người dùng trước */}
        <AuthProvider>
          {/* ChatProvider nằm trong để có thể truy cập thông tin user nếu cần */}
          <ChatProvider>
            {children}
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}