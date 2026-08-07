"use client";

import { Sidebar } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";
import { useAdmin } from "@/contexts/AdminContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useAdmin();

  return (
    <div
      className="min-h-screen bg-mk-ink-50 lg:grid lg:items-start lg:p-5 lg:gap-5 lg:grid-cols-[272px_1fr]"
    >
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar />

      <div className="min-w-0 p-4 pt-0 lg:p-0">
        <Topbar />
        <main>{children}</main>
      </div>
    </div>
  );
}
