"use client";

import React from 'react';

interface FooterProps {
  height?: number | string;
  className?: string; // Thay thế cho 'style' của React Native bằng Tailwind classes
}

/**
 * Footer component cho Web
 * Sử dụng Tailwind để quản lý màu sắc và kích thước
 */
export default function Footer({ height = 80, className = "" }: FooterProps) {
  return (
    <footer 
      className={`w-full bg-[#075c09] ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      {/* 
          Bạn có thể thêm nội dung bản quyền hoặc links vào đây nếu muốn,
          hoặc để trống như bản Mobile cũ.
      */}
    </footer>
  );
}