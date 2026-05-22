import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mailbox as MailboxIcon, Users, KeyRound, Building2, Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  const items = [
    { href: "/settings/mailboxes", title: "Mailboxes", desc: "Connect Gmail and Microsoft 365 inboxes", icon: MailboxIcon },
    { href: "/settings/team", title: "Team", desc: "Manage users, roles, and dealership assignments", icon: Users },
    { href: "/settings/dealerships", title: "Dealerships", desc: "Stores under this organization", icon: Building2 },
    { href: "/settings/api-tokens", title: "API tokens", desc: "Programmatic access for integrations", icon: KeyRound },
  ];
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-a3-content p-8">
        <div className="mb-6">
          <div className="a3-label mb-1 text-a3-fog">Workspace</div>
          <h2 className="flex items-center gap-3 text-[28px] font-extrabold tracking-tight text-foreground">
            <SettingsIcon className="h-7 w-7 text-primary" />
            Settings
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((i) => {
            const Icon = i.icon;
            return (
              <Link key={i.href} href={i.href}>
                <Card className="h-full transition-all hover:border-primary/40 hover:shadow-subtle">
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{i.title}</CardTitle>
                      <CardDescription className="mt-1">{i.desc}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
