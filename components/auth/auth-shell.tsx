import { ThemeToggle } from "@/components/layout/theme-toggle";

type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white px-4 dark:bg-black">
      {children}
      <div className="fixed right-4 bottom-4">
        <ThemeToggle />
      </div>
    </main>
  );
}
