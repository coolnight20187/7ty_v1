// FILE: app/layout.tsx
// ĐÃ SỬA: Khắc phục lỗi 'next/font', 'next/script' và 'globals.css'

import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
// ** SỬA: Xóa bỏ import "./globals.css" (gây lỗi biên dịch trong Canvas) **
// Next.js sẽ tự động nạp file app/globals.css trong quá trình build thật.

export const metadata: Metadata = {
  title: "Dashboard - Tra cứu Bill",
  description: "Ứng dụng tra cứu hóa đơn và quản lý kho (Next.js)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* ** SỬA: Thêm Google Font (Inter) bằng <link> chuẩn ** */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* 1. Tải BOOTSTRAP 5.3 (CSS) */}
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" crossOrigin="anonymous" />
        {/* 2. Tải THƯ VIỆN ICON (Boxicons) */}
        <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet' />
        {/* 3. Tải file Excel JS (cho nút Xuất) */}
        <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" defer></script>
      </head>

      <body className="bg-body-tertiary">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: { background: '#333', color: '#fff' },
          }}
        />
        {/* ** SỬA: Dùng thẻ <script> HTML chuẩn (defer) cho Bootstrap JS ** */}
        <script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" 
          xintegrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" 
          crossOrigin="anonymous"
          defer
        ></script>
      </body>
    </html>
  );
}

