import Link from "next/link";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { DitherBackdrop } from "@/components/landing/dither-backdrop";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <DitherBackdrop />
      <section className="relative z-10 flex max-w-3xl flex-col items-center gap-8 text-center">
        <h1 className="text-balance text-5xl font-black tracking-tight sm:text-7xl">
          your next build <span className="block">LIVES HERE</span>
        </h1>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/login">
            <Button size="lg" className="min-w-36">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="min-w-36">
              Sign up
            </Button>
          </Link>
        </div>
      </section>
      <div className="fixed right-4 bottom-4 z-20">
        <ThemeToggle />
      </div>
    </main>
  );
}
