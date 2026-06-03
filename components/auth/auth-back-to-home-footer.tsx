"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useLayoutEffect, useRef } from "react";

import { BackToHomeLink } from "@/components/site/transition-link";
import { useSiteTransition } from "@/components/site/site-transition";
import { cn } from "@/lib/utils";

type AuthBackToHomeFooterProps = {
  side?: "left" | "right";
};

export function AuthBackToHomeFooter({ side = "right" }: AuthBackToHomeFooterProps) {
  const footerRef = useRef<HTMLDivElement>(null);
  const { registerAuthBackHome } = useSiteTransition();

  useLayoutEffect(() => {
    registerAuthBackHome(footerRef.current);
    return () => registerAuthBackHome(null);
  }, [registerAuthBackHome]);

  return (
    <div
      ref={footerRef}
      className={cn(
        "fixed bottom-6 z-10 flex justify-start px-4 lg:px-8",
        side === "right"
          ? "inset-x-0 lg:left-1/2 lg:w-1/2 lg:justify-start"
          : "inset-x-0 lg:left-0 lg:w-1/2 lg:justify-end",
      )}
    >
      <BackToHomeLink className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        {side === "right" ? (
          <>
            <ArrowLeftIcon className="size-4 shrink-0" aria-hidden />
            Back to home
          </>
        ) : (
          <>
            Back to home
            <ArrowRightIcon className="size-4 shrink-0" aria-hidden />
          </>
        )}
      </BackToHomeLink>
    </div>
  );
}
