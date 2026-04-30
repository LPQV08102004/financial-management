"use client";

import React from 'react';
import CategoryIcon from './CategoryIcon';

interface HeaderIconButtonProps {
  icon: string;
  onPress?: () => void;
  className?: string; // Thay thế cho style của React Native
}

export default function HeaderIconButton({ 
  icon, 
  onPress, 
  className = "" 
}: HeaderIconButtonProps) {
  return (
    <button
      onClick={onPress}
      className={`
        p-2.5 
        flex items-center justify-center 
        rounded-full 
        transition-all duration-200 
        hover:bg-white/10 
        active:scale-90 
        focus:outline-none 
        ${className}
      `}
      aria-label={`Icon button ${icon}`}
    >
      {/* 
          Sử dụng CategoryIcon để xử lý cả Icon thư viện lẫn Emoji 
          giống như logic bên Mobile của bạn 
      */}
      <CategoryIcon 
        icon={icon} 
        size={24} 
        color="#fff" 
      />
    </button>
  );
}