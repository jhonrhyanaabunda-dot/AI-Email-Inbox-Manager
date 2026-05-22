import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const users = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "asc" },
    include: { memberships: { include: { dealership: { select: { name: true } } } } },
  });

  return (
    <div className="h-full overflow-y-auto p-6">
      <h1 className="mb-4 text-xl font-semibold">Team</h1>
      <div className="space-y-2">
        {users.map((u) => {
          const initials = (u.name ?? u.email).split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
          return (
            <Card key={u.id}>
              <CardContent className="flex items-center gap-3 p-4 text-sm">
                <Avatar><AvatarFallback>{initials}</AvatarFallback></Avatar>
                <div>
                  <div className="font-medium">{u.name ?? u.email}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </div>
                <Badge variant="outline" className="ml-auto">{u.role.replace(/_/g, " ").toLowerCase()}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
