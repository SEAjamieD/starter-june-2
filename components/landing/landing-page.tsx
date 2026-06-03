"use client";

import { useEffect, useRef } from "react";

import { LandingContent } from "@/components/landing/landing-content";
import { useSiteTransition } from "@/components/site/site-transition";

export function LandingPage() {
  const { registerLandingContent } = useSiteTransition();
  const landingRef = useRef<HTMLElement>(null);

  useEffect(() => {
    registerLandingContent(landingRef.current);
    return () => registerLandingContent(null);
  }, [registerLandingContent]);

  return <LandingContent ref={landingRef} />;
}
