"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Footer from '@/src/components/Footer';
import SidebarDrawer from '@/src/components/SidebarDrawer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa]">
      {/* Sidebar overlay */}
      <SidebarDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content - scrollable, takes remaining height */}
      <main className="flex-1 overflow-y-auto">
        {/* Inject sidebar toggle into children context somehow */}
        {children}
      </main>

      {/* Footer - sticky at bottom */}
      <div className="sticky bottom-0 z-10 border-t">
        <Footer />
      </div>
    </div>
  );
}
