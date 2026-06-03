"use client";

import Link from "next/link";
import { forwardRef } from "react";

import { TransitionLink } from "@/components/site/transition-link";
import { Button } from "@/components/ui/button";

export const LandingContent = forwardRef<HTMLElement>(function LandingContent(
  _props,
  ref,
) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <section
        ref={ref}
        className="relative flex max-w-3xl flex-col items-center gap-8 text-center"
      >
        <h1 className="text-balance text-5xl font-black tracking-tight sm:text-7xl">
          your next build <span className="block">LIVES HERE</span>
        </h1>
        <div className="flex flex-col gap-3 sm:flex-row">
          <TransitionLink href="/login" transitionDirection="login">
            <Button size="lg" className="min-w-36">
              Log in
            </Button>
          </TransitionLink>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="min-w-36">
              Sign up
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
});
