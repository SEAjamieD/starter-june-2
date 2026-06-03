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

  const hrefPath = typeof href === "string" ? href : href.pathname;

  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || isTransitioning) return;

        if (
          transitionDirection === "login" &&
          hrefPath === "/login"
        ) {
          event.preventDefault();
          runTransition("/login", "login");
          return;
        }

        if (
          transitionDirection === "signup" &&
          hrefPath === "/signup"
        ) {
          event.preventDefault();
          runTransition("/signup", "signup");
        }
      }}
      {...props}
    />
  );
}

type BackToHomeLinkProps = Omit<ComponentProps<typeof Link>, "href">;

export function BackToHomeLink({ onClick, ...props }: BackToHomeLinkProps) {
  const { runHomeTransition, isTransitioning } = useSiteTransition();

  return (
    <Link
      href="/"
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || isTransitioning) return;
        event.preventDefault();
        runHomeTransition();
      }}
      {...props}
    />
  );
}
