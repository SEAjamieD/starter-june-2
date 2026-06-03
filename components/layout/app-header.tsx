"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

type AppHeaderProps = {
  email: string;
};

export function AppHeader({ email }: AppHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await authClient.signOut();
    if (error) {
      toast.error(error.message ?? "Could not log out.");
      return;
    }

    router.push("/login");
    router.refresh();
  };

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <p className="text-sm text-muted-foreground">{email}</p>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
