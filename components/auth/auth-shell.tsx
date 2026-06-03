import { AuthBackToHomeFooter } from "@/components/auth/auth-back-to-home-footer";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: React.ReactNode;
  side?: "left" | "right";
  showBackToHome?: boolean;
};

export function AuthShell({
  children,
  side = "right",
  showBackToHome = true,
}: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white px-4 dark:bg-black lg:bg-transparent lg:dark:bg-transparent">
      <div
        className={cn(
          "flex w-full max-w-none lg:w-1/2 lg:justify-center lg:px-8",
          side === "right" ? "lg:ml-auto" : "lg:mr-auto",
        )}
      >
        {children}
      </div>
      {showBackToHome ? <AuthBackToHomeFooter side={side} /> : null}
    </main>
  );
}
