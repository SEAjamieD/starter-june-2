"use client";

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
          <Button
            nativeButton={false}
            render={
              <TransitionLink href="/login" transitionDirection="login" />
            }
            size="lg"
            className="min-w-36"
          >
            Log in
          </Button>
          <Button
            nativeButton={false}
            render={
              <TransitionLink href="/signup" transitionDirection="signup" />
            }
            size="lg"
            variant="secondary"
            className="min-w-36"
          >
            Sign up
          </Button>
        </div>
      </section>
    </div>
  );
});
