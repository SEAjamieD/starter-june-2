type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-black lg:bg-transparent lg:dark:bg-transparent">
      <div className="flex w-full max-w-none lg:ml-auto lg:w-1/2 lg:justify-center lg:px-8">
        {children}
      </div>
    </main>
  );
}
