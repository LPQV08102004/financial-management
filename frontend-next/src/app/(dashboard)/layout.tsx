"use client";

import { useState } from 'react';
import AppSidebar from '@/src/components/AppSidebar';
import SidebarDrawer from '@/src/components/SidebarDrawer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Desktop: permanent sidebar */}
      <AppSidebar />

      {/* Mobile: overlay sidebar — triggered by screens' own hamburger buttons */}
      <SidebarDrawer
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
