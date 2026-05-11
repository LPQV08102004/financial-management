"use client";

import React from 'react';
import CategoryIcon from './CategoryIcon';

interface HeaderIconButtonProps {
  icon: string;
  onPress?: () => void;
  className?: string;
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
      {}
      <CategoryIcon
        icon={icon}
        size={24}
        color="#fff"
      />
    </button>
  );
}