"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, AlertTriangle, Calendar, Settings, BarChart3, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/escalations", label: "Escalations", icon: AlertTriangle },
  { href: "/briefings", label: "Briefings", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ orgName }: { orgName?: string }) {
  const pathname = usePathname();
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card">
      {/* Brandmark — square emerald block w/ "A3" mark, paired with product name */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-emerald">
          <span className="font-black text-[13px] tracking-tight">A3</span>
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-bold tracking-tight text-foreground">A3 Inbox AI</div>
          <div className="a3-label text-a3-fog">A3 Brands · Dealership</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {nav.map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-sm bg-primary" />
              )}
              <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-current")} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      {orgName ? (
        <div className="mx-3 mb-3 rounded-md border border-border bg-secondary p-3">
          <div className="a3-label mb-1 text-a3-fog">Workspace</div>
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            {orgName}
          </div>
        </div>
      ) : null}

      <div className="border-t border-border px-4 py-3 text-[10px] uppercase tracking-[0.05em] text-a3-fog">
        ⌘K · Quick actions
      </div>
    </aside>
  );
}
