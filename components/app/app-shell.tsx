"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { APP_ENTER_FLAG } from "@/components/site/site-transition";

gsap.registerPlugin(useGSAP);

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const shell = shellRef.current;
      if (!shell) return;

      const shouldAnimateEnter =
        sessionStorage.getItem(APP_ENTER_FLAG) === "1";
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (!shouldAnimateEnter || reduceMotion) {
        sessionStorage.removeItem(APP_ENTER_FLAG);
        gsap.set(shell, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        shell,
        { autoAlpha: 0, y: 8 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
          onComplete: () => {
            sessionStorage.removeItem(APP_ENTER_FLAG);
          },
        },
      );
    },
    { scope: shellRef },
  );

  return (
    <div ref={shellRef} className="min-h-screen bg-background">
      {children}
    </div>
  );
}
