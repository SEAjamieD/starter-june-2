"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import {
  useSiteTransition,
  type SiteTransitionDirection,
} from "@/components/site/site-transition";

type TransitionLinkProps = ComponentProps<typeof Link> & {
  transitionDirection: SiteTransitionDirection;
};

export function TransitionLink({
  href,
  transitionDirection,
  onClick,
  ...props
}: TransitionLinkProps) {
  const { runTransition, isTransitioning } = useSiteTransition();

  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || isTransitioning) return;

        if (
          transitionDirection === "login" &&
          href === "/login"
        ) {
          event.preventDefault();
          runTransition("/login", "login");
          return;
        }

        if (
          transitionDirection === "signup" &&
          href === "/signup"
        ) {
          event.preventDefault();
          runTransition("/signup", "signup");
        }
      }}
      {...props}
    />
  );
}
