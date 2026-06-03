import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader email={session.user.email} />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold">logged in</h1>
        <p className="mt-3 text-muted-foreground">{session.user.email}</p>
      </main>
    </div>
  );
}
