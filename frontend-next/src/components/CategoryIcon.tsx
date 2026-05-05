"use client";

import React from 'react';
import * as LucideIcons from 'lucide-react';

interface CategoryIconProps {
  icon: string | null | undefined;
  size?: number;
  color?: string;
  className?: string; // Thêm để tùy biến Tailwind từ bên ngoài
}

/**
 * Regex kiểm tra xem icon có phải là tên một component (viết theo PascalCase hoặc camelCase)
 * Trong Lucide, tên icon thường là PascalCase (ví dụ: HelpCircle)
 */
const ICON_NAME_PATTERN = /^[A-Za-z0-9-]+$/;

export default function CategoryIcon({ 
  icon, 
  size = 28, 
  color = 'currentColor',
  className = "" 
}: CategoryIconProps) {
  
  // 1. Trường hợp không có icon: Mặc định hiện HelpCircle
  if (!icon) {
    return <LucideIcons.HelpCircle size={size} color={color} className={className} />;
  }

  // 2. Kiểm tra nếu là tên Icon của thư viện (ví dụ: "Home", "User", "CreditCard")
  // Lưu ý: Lucide sử dụng PascalCase cho Component name
  const IconComponent = (LucideIcons as any)[icon];

  if (IconComponent && typeof IconComponent === 'function') {
    return <IconComponent size={size} color={color} className={className} />;
  }

  // 3. Nếu không khớp tên thư viện, coi đó là Emoji hoặc ký tự đặc biệt (Text)
  return (
    <span 
      className={`inline-flex items-center justify-center leading-none ${className}`}
      style={{ 
        fontSize: size * 0.85, 
        width: size, 
        height: size,
        color: color 
      }}
    >
      {icon}
    </span>
  );
}