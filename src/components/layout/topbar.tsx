"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function Topbar({
  user,
  demoMode,
}: {
  user?: { name?: string | null; email?: string | null };
  demoMode: boolean;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  // Filter the thread list in-place via a CSS class hook the list reads
  useEffect(() => {
    document.documentElement.dataset.search = query.trim().toLowerCase();
  }, [query]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pathname.startsWith("/inbox")) router.push("/inbox");
  }

  const initials = (user?.name ?? user?.email ?? "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <header className="flex h-16 items-center gap-3 border-b border-border bg-background px-6">
      <form onSubmit={onSubmit} className="relative max-w-xl flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-a3-fog" />
        <Input
          placeholder="Search threads, escalations, contacts…"
          className="h-10 pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>
      {demoMode && (
        <Badge variant="status" title="Running on local SQLite seed data. OpenAI calls are simulated.">
          DEMO
        </Badge>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
        className="text-muted-foreground hover:text-primary"
      >
        {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Avatar className="h-9 w-9 ring-2 ring-primary/20">
        <AvatarFallback className="bg-primary/10 text-[12px] font-bold text-primary">
          {initials || "?"}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
