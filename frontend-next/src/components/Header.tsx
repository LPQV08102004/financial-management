"use client";

import React from 'react';
import { ArrowLeft } from 'lucide-react';
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
  className = '',
}: HeaderProps) {
  return (
    <header
      className={`bg-[#075c09] px-5 py-4 flex flex-row items-center justify-between shadow-sm ${className}`}
    >
      {/* Left: hamburger (mobile only) or back arrow */}
      <div className="min-w-[44px]">
        {showMenu ? (
          // Hamburger hidden on desktop — AppSidebar handles navigation
          <button
            onClick={onMenuPress}
            className="lg:hidden p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none"
            aria-label="Mở menu"
          >
            <div className="flex flex-col gap-[5px]">
              <div className="w-6 h-[3px] bg-white rounded-sm" />
              <div className="w-6 h-[3px] bg-white rounded-sm" />
              <div className="w-6 h-[3px] bg-white rounded-sm" />
            </div>
          </button>
        ) : (
          <button
            onClick={onMenuPress}
            className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none"
            aria-label="Quay lại"
          >
            <ArrowLeft className="text-white w-5 h-5" />
          </button>
        )}
      </div>

      {/* Center: page title */}
      <div className="flex-1 flex justify-center overflow-hidden px-2">
        <h1 className="text-white text-lg font-semibold truncate">{title}</h1>
      </div>

      {/* Right: action icon or spacer */}
      <div className="min-w-[44px] flex justify-end">
        {rightIcon ? (
          <button
            onClick={onRightPress}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <CategoryIcon icon={rightIcon} size={22} color="#fff" />
          </button>
        ) : (
          <div className="w-11" />
        )}
      </div>
    </header>
  );
}
