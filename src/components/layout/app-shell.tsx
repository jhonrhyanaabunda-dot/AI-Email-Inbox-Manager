"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/**
 * Client wrapper for the dashboard chrome. Owns the mobile-drawer state for
 * the sidebar (hamburger toggle on small screens; fixed rail on md+).
 */
export function AppShell({
  user,
  orgName,
  demoMode,
  children,
}: {
  user: { name?: string | null; email?: string | null };
  orgName?: string;
  demoMode: boolean;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close the drawer on route change so navigating from the mobile menu
  // doesn't leave the overlay covering the page.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar — fixed rail on md+, slide-in drawer on mobile */}
      <Sidebar orgName={orgName} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          user={user}
          demoMode={demoMode}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
