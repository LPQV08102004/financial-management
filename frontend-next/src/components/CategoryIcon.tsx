"use client";

import React from 'react';
import * as LucideIcons from 'lucide-react';

interface CategoryIconProps {
  icon: string | null | undefined;
  size?: number;
  color?: string;
  className?: string;
}

const ICON_NAME_PATTERN = /^[A-Za-z0-9-]+$/;

export default function CategoryIcon({
  icon,
  size = 28,
  color = 'currentColor',
  className = ""
}: CategoryIconProps) {

  if (!icon) {
    return <LucideIcons.HelpCircle size={size} color={color} className={className} />;
  }

  const IconComponent = (LucideIcons as any)[icon];

  if (IconComponent && typeof IconComponent === 'function') {
    return <IconComponent size={size} color={color} className={className} />;
  }

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