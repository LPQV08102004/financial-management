"use client";

import React from 'react';
import { Menu, ArrowLeft } from 'lucide-react';
// Import CategoryIcon bạn đã làm ở bước trước để thay cho HeaderIconButton
import CategoryIcon from './CategoryIcon'; 

interface HeaderProps {
  title: string;
  rightIcon?: string;
  onRightPress?: () => void;
  onMenuPress?: () => void;
  showMenu?: boolean;
  className?: string;
}

export default function Header({
  title,
  rightIcon,
  onRightPress,
  onMenuPress,
  showMenu = true,
  className = "",
}: HeaderProps) {
  return (
    <header 
      className={`bg-[#075c09] px-5 py-4 flex flex-row items-center justify-between shadow-md ${className}`}
    >
      {/* Cụm bên trái: Menu hoặc Back */}
      <button 
        onClick={onMenuPress}
        className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none"
        aria-label={showMenu ? "Open menu" : "Go back"}
      >
        {showMenu ? (
          /* Hamburger Menu tự chế bằng CSS từ bản mobile hoặc dùng Lucide */
          <div className="flex flex-col gap-[5px]">
            <div className="w-6 h-[3px] bg-white rounded-sm"></div>
            <div className="w-6 h-[3px] bg-white rounded-sm"></div>
            <div className="w-6 h-[3px] bg-white rounded-sm"></div>
          </div>
        ) : (
          <ArrowLeft className="text-white w-6 h-6" />
        )}
      </button>

      {/* Cụm ở giữa: Tiêu đề */}
      <div className="flex-1 flex justify-center overflow-hidden px-4">
        <h1 className="text-white text-xl font-semibold truncate">
          {title}
        </h1>
      </div>

      {/* Cụm bên phải: Icon chức năng hoặc khoảng trống */}
      <div className="min-w-[44px] flex justify-end">
        {rightIcon ? (
          <button 
            onClick={onRightPress}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <CategoryIcon icon={rightIcon} size={24} color="#fff" />
          </button>
        ) : (
          <div className="w-11"></div> // Tương đương headerSpacer (44px)
        )}
      </div>
    </header>
  );
}