"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { LandingContent } from "@/components/landing/landing-content";
import { DitherBackdrop } from "@/components/landing/dither-backdrop";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

import "./site-dither.css";

gsap.registerPlugin(useGSAP);

export type SiteTransitionDirection = "login" | "signup" | null;

type MediaConditions = {
  isDesktop: boolean;
  isMobile: boolean;
  reduceMotion: boolean;
};

type PendingTimeline = {
  href: "/login" | "/signup";
  direction: SiteTransitionDirection;
};

type SiteTransitionContextValue = {
  runTransition: (href: "/login" | "/signup", direction: SiteTransitionDirection) => void;
  isTransitioning: boolean;
  transitionDirection: SiteTransitionDirection;
  authCardSuppressed: boolean;
  registerLandingContent: (element: HTMLElement | null) => void;
  registerAuthCard: (element: HTMLElement | null) => void;
};

const SiteTransitionContext = createContext<SiteTransitionContextValue | null>(null);

export function useSiteTransition() {
  const context = useContext(SiteTransitionContext);
  if (!context) {
    throw new Error("useSiteTransition must be used within SiteShell.");
  }
  return context;
}

function finishCardEnter(
  clearPendingCardEnter: () => void,
  setIsTransitioning: (value: boolean) => void,
) {
  clearPendingCardEnter();
  setIsTransitioning(false);
}

function animateCardEnter(
  element: HTMLElement,
  reduceMotion: boolean,
  onComplete: () => void,
) {
  if (reduceMotion) {
    gsap.set(element, { autoAlpha: 1 });
    onComplete();
    return;
  }

  gsap.fromTo(
    element,
    { autoAlpha: 0, y: 12 },
    { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out", onComplete },
  );
}

function LandingExitOverlay({
  registerLandingContent,
}: {
  registerLandingContent: (element: HTMLElement | null) => void;
}) {
  const landingRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    registerLandingContent(landingRef.current);
    return () => registerLandingContent(null);
  }, [registerLandingContent]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <LandingContent ref={landingRef} />
    </div>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const shellRef = useRef<HTMLDivElement>(null);
  const ditherLayerRef = useRef<HTMLDivElement>(null);
  const landingContentRef = useRef<HTMLElement | null>(null);
  const authCardRef = useRef<HTMLElement | null>(null);
  const activeTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const isTransitioningRef = useRef(false);
  const pendingTimelineRef = useRef<PendingTimeline | null>(null);
  const pendingReverseRef = useRef(false);
  const pendingCardEnterRef = useRef(false);
  const prevPathnameRef = useRef(pathname);
  const mediaConditionsRef = useRef<MediaConditions>({
    isDesktop: false,
    isMobile: true,
    reduceMotion: false,
  });
  const runTransitionRef = useRef<
    (href: "/login" | "/signup", direction: SiteTransitionDirection) => void
  >(() => {});
  const startPendingTimelineRef = useRef<() => void>(() => {});

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] =
    useState<SiteTransitionDirection>(null);
  const [landingExitActive, setLandingExitActive] = useState(false);
  const [landingContentVersion, setLandingContentVersion] = useState(0);
  const [authCardSuppressed, setAuthCardSuppressed] = useState(false);
  const authCardSuppressedRef = useRef(false);

  const syncAuthCardSuppressed = useCallback((value: boolean) => {
    authCardSuppressedRef.current = value;
    setAuthCardSuppressed(value);
  }, []);

  const syncIsTransitioning = useCallback((value: boolean) => {
    isTransitioningRef.current = value;
    setIsTransitioning(value);
  }, []);

  const clearPendingCardEnter = useCallback(() => {
    pendingCardEnterRef.current = false;
  }, []);

  const triggerCardEnter = useCallback(() => {
    pendingCardEnterRef.current = true;
    syncAuthCardSuppressed(false);
    const card = authCardRef.current;
    if (!card) return;

    const { reduceMotion } = mediaConditionsRef.current;
    gsap.set(card, { autoAlpha: 0, y: 12, visibility: "visible" });
    animateCardEnter(card, reduceMotion, () =>
      finishCardEnter(clearPendingCardEnter, syncIsTransitioning),
    );
  }, [clearPendingCardEnter, syncIsTransitioning, syncAuthCardSuppressed]);

  const registerAuthCard = useCallback(
    (element: HTMLElement | null) => {
      authCardRef.current = element;
      if (!element) return;

      const { reduceMotion } = mediaConditionsRef.current;

      if (pendingCardEnterRef.current) {
        gsap.set(element, { autoAlpha: 0, y: 12, visibility: "visible" });
        animateCardEnter(element, reduceMotion, () =>
          finishCardEnter(clearPendingCardEnter, syncIsTransitioning),
        );
        return;
      }

      if (isTransitioningRef.current && authCardSuppressedRef.current) {
        gsap.set(element, { autoAlpha: 0, visibility: "hidden" });
        return;
      }

      if (pathname === "/login" || pathname === "/signup") {
        if (isTransitioningRef.current || pendingCardEnterRef.current) {
          return;
        }
        gsap.set(element, { autoAlpha: 1, y: 0, visibility: "visible" });
      }
    },
    [pathname, syncIsTransitioning, clearPendingCardEnter],
  );

  const runLoginReverseTimelineRef = useRef<() => void>(() => {});

  const registerLandingContent = useCallback(
    (element: HTMLElement | null) => {
      landingContentRef.current = element;
      if (!element) return;

      if (pendingReverseRef.current) {
        gsap.set(element, { autoAlpha: 0 });
        pendingReverseRef.current = false;
        runLoginReverseTimelineRef.current();
      } else if (!isTransitioningRef.current) {
        gsap.set(element, { autoAlpha: 1 });
      }

      setLandingContentVersion((version) => version + 1);
    },
    [],
  );

  const runLoginReverseTimeline = useCallback(() => {
    activeTimelineRef.current?.kill();

    const { isDesktop, reduceMotion } = mediaConditionsRef.current;
    const landing = landingContentRef.current;
    const dither = ditherLayerRef.current;

    const finishReverse = () => {
      activeTimelineRef.current = null;
      syncIsTransitioning(false);
      setTransitionDirection(null);
      setLandingExitActive(false);
    };

    if (reduceMotion) {
      if (dither) gsap.set(dither, { xPercent: 0 });
      if (landing) gsap.set(landing, { autoAlpha: 1 });
      finishReverse();
      return;
    }

    if (!isDesktop) {
      if (landing) {
        gsap.set(landing, { autoAlpha: 0 });
        gsap.to(landing, {
          autoAlpha: 1,
          duration: 0.35,
          ease: "power2.out",
          onComplete: finishReverse,
        });
      } else {
        finishReverse();
      }
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: finishReverse,
    });

    activeTimelineRef.current = tl;

    if (dither) {
      tl.to(dither, { xPercent: 0, duration: 0.6 });
    }

    if (landing) {
      tl.fromTo(
        landing,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" },
        "-=0.25",
      );
    }
  }, [syncIsTransitioning]);

  runLoginReverseTimelineRef.current = runLoginReverseTimeline;

  const runLoginTimeline = useCallback(() => {
    activeTimelineRef.current?.kill();

    const { isDesktop, reduceMotion } = mediaConditionsRef.current;
    const landing = landingContentRef.current;
    const dither = ditherLayerRef.current;

    if (reduceMotion) {
      if (landing) gsap.set(landing, { autoAlpha: 0 });
      if (dither) gsap.set(dither, { xPercent: isDesktop ? -50 : 0 });
      setLandingExitActive(false);
      triggerCardEnter();
      return;
    }

    if (!isDesktop) {
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
          activeTimelineRef.current = null;
        },
      });

      activeTimelineRef.current = tl;

      if (landing) {
        tl.to(landing, {
          autoAlpha: 0,
          duration: 0.35,
          onComplete: () => setLandingExitActive(false),
        });
      } else {
        setLandingExitActive(false);
      }

      tl.add(triggerCardEnter, "+=0.05");
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        activeTimelineRef.current = null;
      },
    });

    activeTimelineRef.current = tl;

    tl.addLabel("start", 0);

    if (landing) {
      tl.to(
        landing,
        {
          autoAlpha: 0,
          duration: 0.35,
          onComplete: () => setLandingExitActive(false),
        },
        "start",
      );
    } else {
      setLandingExitActive(false);
    }

    tl.addLabel("route", "start+=0.15");

    if (dither) {
      tl.to(dither, { xPercent: -50, duration: 0.6 }, "route");
    }

    tl.add(triggerCardEnter, "route+=0.6");
  }, [triggerCardEnter]);

  startPendingTimelineRef.current = runLoginTimeline;

  useLayoutEffect(() => {
    const previousPath = prevPathnameRef.current;

    if (pendingTimelineRef.current && landingContentRef.current) {
      pendingTimelineRef.current = null;
      startPendingTimelineRef.current();
      prevPathnameRef.current = pathname;
      return;
    }

    if (
      previousPath === "/login" &&
      pathname === "/" &&
      !pendingTimelineRef.current &&
      !landingExitActive
    ) {
      pendingReverseRef.current = true;
      syncIsTransitioning(true);
      setTransitionDirection("login");

      if (landingContentRef.current) {
        gsap.set(landingContentRef.current, { autoAlpha: 0 });
        pendingReverseRef.current = false;
        runLoginReverseTimelineRef.current();
      }
    }

    prevPathnameRef.current = pathname;
  }, [pathname, landingContentVersion, landingExitActive, syncIsTransitioning]);

  useLayoutEffect(() => {
    if (pathname !== "/login" || isTransitioningRef.current) return;

    const dither = ditherLayerRef.current;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (dither && isDesktop && !reduceMotion) {
      gsap.set(dither, { xPercent: -50 });
    }
  }, [pathname]);

  useGSAP(
    (_, contextSafe) => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: "(min-width: 1024px)",
          isMobile: "(max-width: 1023px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          mediaConditionsRef.current = context.conditions as MediaConditions;

          if (
            pathname === "/login" &&
            !isTransitioningRef.current &&
            ditherLayerRef.current
          ) {
            const { isDesktop, reduceMotion } = mediaConditionsRef.current;
            if (isDesktop && !reduceMotion) {
              gsap.set(ditherLayerRef.current, { xPercent: -50 });
            }
          }
        },
        shellRef,
      );

      runTransitionRef.current = contextSafe!(
        (href: "/login" | "/signup", direction: SiteTransitionDirection) => {
          if (isTransitioningRef.current || direction !== "login") {
            return;
          }

          activeTimelineRef.current?.kill();

          syncIsTransitioning(true);
          setTransitionDirection(direction);
          setLandingExitActive(true);
          syncAuthCardSuppressed(true);
          pendingTimelineRef.current = { href, direction };

          router.push(href);
        },
      );

      return () => {
        mm.revert();
        activeTimelineRef.current?.kill();
      };
    },
    { scope: shellRef, dependencies: [router, syncIsTransitioning, syncAuthCardSuppressed, pathname] },
  );

  const runTransition = useCallback(
    (href: "/login" | "/signup", direction: SiteTransitionDirection) => {
      if (direction === "signup") {
        router.push(href);
        return;
      }
      runTransitionRef.current(href, direction);
    },
    [router],
  );

  const showLoginReveal =
    pathname === "/login" ||
    (isTransitioning && transitionDirection === "login");

  const showDither = pathname === "/" || pathname === "/login" || showLoginReveal;

  const contextValue: SiteTransitionContextValue = {
    runTransition,
    isTransitioning,
    transitionDirection,
    authCardSuppressed,
    registerLandingContent,
    registerAuthCard,
  };

  return (
    <SiteTransitionContext.Provider value={contextValue}>
      <div
        ref={shellRef}
        className="relative min-h-screen overflow-hidden bg-white dark:bg-black"
      >
        <div
          className={cn(
            "absolute inset-y-0 right-0 z-0 hidden w-1/2 bg-white dark:bg-black",
            showLoginReveal && "lg:block",
          )}
          aria-hidden
        />

        <div
          ref={ditherLayerRef}
          className={cn(
            "site-dither-layer absolute inset-0 z-[1] h-full w-full",
            showDither ? "visible" : "invisible",
          )}
        >
          <DitherBackdrop />
        </div>

        <div className="relative z-10">
          {children}
          {landingExitActive ? (
            <LandingExitOverlay registerLandingContent={registerLandingContent} />
          ) : null}
        </div>

        <div className="fixed right-4 bottom-4 z-20">
          <ThemeToggle />
        </div>
      </div>
    </SiteTransitionContext.Provider>
  );
}
