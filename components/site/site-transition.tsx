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

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginCard } from "@/components/auth/login-card";
import { SignupCard } from "@/components/auth/signup-card";
import { LandingContent } from "@/components/landing/landing-content";
import { DitherBackdrop } from "@/components/landing/dither-backdrop";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

import "./site-dither.css";

gsap.registerPlugin(useGSAP);

export type SiteTransitionDirection = "login" | "signup";

type AuthRoute = "/login" | "/signup";

type MediaConditions = {
  isDesktop: boolean;
  isMobile: boolean;
  reduceMotion: boolean;
};

type PendingTimeline = {
  href: AuthRoute;
  direction: SiteTransitionDirection;
  kind: "landing" | "auth-cross";
  from?: SiteTransitionDirection;
};

export const APP_ENTER_FLAG = "app-enter";

type SiteTransitionContextValue = {
  runTransition: (href: AuthRoute, direction: SiteTransitionDirection) => void;
  runHomeTransition: () => void;
  runAppEnterTransition: () => void;
  isTransitioning: boolean;
  transitionDirection: SiteTransitionDirection | null;
  authCardSuppressed: boolean;
  registerLandingContent: (element: HTMLElement | null) => void;
  registerAuthCard: (element: HTMLElement | null) => void;
  registerAuthBackHome: (element: HTMLElement | null) => void;
};

const SiteTransitionContext = createContext<SiteTransitionContextValue | null>(null);

const AUTH_TRANSITION = {
  login: { xPercent: -50, panelSide: "right" as const },
  signup: { xPercent: 50, panelSide: "left" as const },
} satisfies Record<
  SiteTransitionDirection,
  { xPercent: number; panelSide: "left" | "right" }
>;

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

function animateCardExit(
  element: HTMLElement,
  reduceMotion: boolean,
  onComplete?: () => void,
) {
  if (reduceMotion) {
    gsap.set(element, { autoAlpha: 0, visibility: "hidden" });
    onComplete?.();
    return;
  }

  gsap.to(element, {
    autoAlpha: 0,
    y: 12,
    duration: 0.35,
    ease: "power2.in",
    onComplete,
  });
}

function authRouteDirection(pathname: string): SiteTransitionDirection | null {
  if (pathname === "/login") return "login";
  if (pathname === "/signup") return "signup";
  return null;
}

function getAuthCrossHistoryTransition(
  previousPath: string,
  currentPath: string,
): { from: SiteTransitionDirection; to: SiteTransitionDirection } | null {
  const from = authRouteDirection(previousPath);
  const to = authRouteDirection(currentPath);
  if (!from || !to || from === to) return null;
  return { from, to };
}

function AuthExitOverlay({
  direction,
  registerAuthExitCard,
}: {
  direction: SiteTransitionDirection;
  registerAuthExitCard: (element: HTMLElement | null) => void;
}) {
  const Card = direction === "login" ? LoginCard : SignupCard;
  const side = AUTH_TRANSITION[direction].panelSide === "right" ? "right" : "left";
  const exitRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    registerAuthExitCard(exitRef.current);
    return () => registerAuthExitCard(null);
  }, [registerAuthExitCard]);

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <AuthShell side={side} showBackToHome={false}>
        <div ref={exitRef} className="w-full max-w-md">
          <Card skipTransitionRegistration />
        </div>
      </AuthShell>
    </div>
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
  const revealPanelRef = useRef<HTMLDivElement>(null);
  const landingContentRef = useRef<HTMLElement | null>(null);
  const authCardRef = useRef<HTMLElement | null>(null);
  const authBackHomeRef = useRef<HTMLElement | null>(null);
  const authExitCardRef = useRef<HTMLElement | null>(null);
  const activeTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const isTransitioningRef = useRef(false);
  const pendingTimelineRef = useRef<PendingTimeline | null>(null);
  const pendingReverseRef = useRef(false);
  const pendingHomeLandingEnterRef = useRef(false);
  const homeClickHasExitTargetRef = useRef(false);
  const homeLandingEnterScheduledRef = useRef(false);
  const clickHomeTransitionRef = useRef(false);
  const pendingCardEnterRef = useRef(false);
  const prevPathnameRef = useRef(pathname);
  const mediaConditionsRef = useRef<MediaConditions>({
    isDesktop: false,
    isMobile: true,
    reduceMotion: false,
  });
  const runTransitionRef = useRef<
    (href: AuthRoute, direction: SiteTransitionDirection) => void
  >(() => {});
  const runHomeTransitionRef = useRef<() => void>(() => {});
  const runAppEnterTransitionRef = useRef<() => void>(() => {});
  const runAuthAppEnterTimelineRef = useRef<() => void>(() => {});
  const runAuthTimelineRef = useRef<(direction: SiteTransitionDirection) => void>(
    () => {},
  );
  const runAuthCrossTimelineRef = useRef<
    (
      from: SiteTransitionDirection,
      to: SiteTransitionDirection,
      options: { href?: AuthRoute; useExitOverlay: boolean },
    ) => void
  >(() => {});
  const tryStartAuthCrossHistoryTimelineRef = useRef<() => void>(() => {});

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] =
    useState<SiteTransitionDirection | null>(null);
  const [landingExitActive, setLandingExitActive] = useState(false);
  const [landingContentVersion, setLandingContentVersion] = useState(0);
  const [authCardSuppressed, setAuthCardSuppressed] = useState(false);
  const [authExitActive, setAuthExitActive] = useState(false);
  const [authCrossActive, setAuthCrossActive] = useState(false);
  const [authCrossHistoryExitActive, setAuthCrossHistoryExitActive] = useState(false);
  const [authCrossHistoryExitDirection, setAuthCrossHistoryExitDirection] =
    useState<SiteTransitionDirection | null>(null);
  const authCardSuppressedRef = useRef(false);
  const authExitActiveRef = useRef(false);
  const authCrossActiveRef = useRef(false);
  const authCrossHistoryExitActiveRef = useRef(false);
  const authCrossHistoryTimelineStartedRef = useRef(false);
  const pendingAuthCrossHistoryRef = useRef<{
    from: SiteTransitionDirection;
    to: SiteTransitionDirection;
  } | null>(null);

  const syncAuthCardSuppressed = useCallback((value: boolean) => {
    authCardSuppressedRef.current = value;
    setAuthCardSuppressed(value);
  }, []);

  const syncAuthExitActive = useCallback((value: boolean) => {
    authExitActiveRef.current = value;
    setAuthExitActive(value);
  }, []);

  const syncAuthCrossActive = useCallback((value: boolean) => {
    authCrossActiveRef.current = value;
    setAuthCrossActive(value);
  }, []);

  const syncAuthCrossHistoryExitActive = useCallback((value: boolean) => {
    authCrossHistoryExitActiveRef.current = value;
    setAuthCrossHistoryExitActive(value);
  }, []);

  const syncIsTransitioning = useCallback((value: boolean) => {
    isTransitioningRef.current = value;
    setIsTransitioning(value);
  }, []);

  const bootstrapAuthCrossHistory = useCallback(
    (transition: { from: SiteTransitionDirection; to: SiteTransitionDirection }) => {
      if (pendingAuthCrossHistoryRef.current) return;

      pendingAuthCrossHistoryRef.current = transition;
      syncIsTransitioning(true);
      setTransitionDirection(transition.to);
      syncAuthCrossActive(true);
      syncAuthCardSuppressed(true);
      syncAuthCrossHistoryExitActive(true);
      setAuthCrossHistoryExitDirection(transition.from);
    },
    [
      syncIsTransitioning,
      syncAuthCrossActive,
      syncAuthCardSuppressed,
      syncAuthCrossHistoryExitActive,
    ],
  );

  const skipHistoryCrossDetection =
    isTransitioningRef.current && authCrossActiveRef.current;

  const authCrossHistoryTransition = skipHistoryCrossDetection
    ? null
    : getAuthCrossHistoryTransition(prevPathnameRef.current, pathname);

  const historyCrossExitDirection =
    authCrossHistoryExitDirection ?? authCrossHistoryTransition?.from ?? null;

  const showHistoryCrossExitOverlay = historyCrossExitDirection !== null;

  const effectiveAuthCardSuppressed =
    authCardSuppressed || authCrossHistoryTransition !== null;

  const bootstrapAuthCrossHistoryRef = useRef(bootstrapAuthCrossHistory);
  bootstrapAuthCrossHistoryRef.current = bootstrapAuthCrossHistory;

  const clearPendingCardEnter = useCallback(() => {
    pendingCardEnterRef.current = false;
  }, []);

  const triggerCardEnter = useCallback((onComplete?: () => void) => {
    pendingCardEnterRef.current = true;
    syncAuthCardSuppressed(false);
    const card = authCardRef.current;
    if (!card) return;

    const { reduceMotion } = mediaConditionsRef.current;
    gsap.set(card, { autoAlpha: 0, y: 12, visibility: "visible" });
    animateCardEnter(card, reduceMotion, () => {
      finishCardEnter(clearPendingCardEnter, syncIsTransitioning);
      onComplete?.();
    });
  }, [clearPendingCardEnter, syncIsTransitioning, syncAuthCardSuppressed]);

  const registerAuthBackHome = useCallback((element: HTMLElement | null) => {
    authBackHomeRef.current = element;
    if (!element) return;

    if (!isTransitioningRef.current) {
      gsap.set(element, { autoAlpha: 1, y: 0, visibility: "visible" });
    }
  }, []);

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

      const historyCross = getAuthCrossHistoryTransition(
        prevPathnameRef.current,
        pathname,
      );
      if (
        historyCross &&
        !(isTransitioningRef.current && authCrossActiveRef.current)
      ) {
        bootstrapAuthCrossHistoryRef.current(historyCross);
        gsap.set(element, { autoAlpha: 0, visibility: "hidden" });
        return;
      }

      if (isTransitioningRef.current && authCardSuppressedRef.current) {
        gsap.set(element, { autoAlpha: 0, visibility: "hidden" });
        return;
      }

      if (authRouteDirection(pathname)) {
        if (isTransitioningRef.current || pendingCardEnterRef.current) {
          return;
        }
        gsap.set(element, { autoAlpha: 1, y: 0, visibility: "visible" });
      }
    },
    [pathname, syncIsTransitioning, clearPendingCardEnter],
  );

  const registerAuthExitCard = useCallback((element: HTMLElement | null) => {
    authExitCardRef.current = element;
    if (!element) return;

    gsap.set(element, { autoAlpha: 1, y: 0, visibility: "visible" });

    if (authExitActiveRef.current) {
      tryStartReverseTimelineRef.current();
    }

    if (authCrossHistoryExitActiveRef.current || pendingAuthCrossHistoryRef.current) {
      tryStartAuthCrossHistoryTimelineRef.current();
    }
  }, []);

  const runAuthReverseTimelineRef = useRef<() => void>(() => {});
  const tryStartReverseTimelineRef = useRef<() => void>(() => {});
  const runAuthHomeClickTimelineRef = useRef<() => void>(() => {});
  const tryStartHomeLandingEnterRef = useRef<() => void>(() => {});

  const registerLandingContent = useCallback(
    (element: HTMLElement | null) => {
      landingContentRef.current = element;
      if (!element) return;

      if (pendingReverseRef.current) {
        gsap.set(element, { autoAlpha: 0 });
        tryStartReverseTimelineRef.current();
      } else if (pendingHomeLandingEnterRef.current) {
        gsap.set(element, { autoAlpha: 0 });
        tryStartHomeLandingEnterRef.current();
      } else if (!isTransitioningRef.current) {
        gsap.set(element, { autoAlpha: 1 });
      }

      setLandingContentVersion((version) => version + 1);
    },
    [],
  );

  const runAuthReverseTimeline = useCallback(() => {
    activeTimelineRef.current?.kill();

    const { isDesktop, reduceMotion } = mediaConditionsRef.current;
    const landing = landingContentRef.current;
    const dither = ditherLayerRef.current;
    const card = authExitCardRef.current;

    const finishReverse = () => {
      activeTimelineRef.current = null;
      clickHomeTransitionRef.current = false;
      syncIsTransitioning(false);
      setTransitionDirection(null);
      setLandingExitActive(false);
      syncAuthExitActive(false);
    };

    if (reduceMotion) {
      if (card) gsap.set(card, { autoAlpha: 0, visibility: "hidden" });
      if (dither) gsap.set(dither, { xPercent: 0 });
      if (landing) gsap.set(landing, { autoAlpha: 1 });
      finishReverse();
      return;
    }

    if (!isDesktop) {
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: finishReverse,
      });

      activeTimelineRef.current = tl;

      if (card) {
        tl.to(card, { autoAlpha: 0, y: 12, duration: 0.35, ease: "power2.in" }, 0);
      }

      if (landing) {
        tl.fromTo(
          landing,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" },
          card ? "-=0.1" : 0,
        );
      } else if (!card) {
        finishReverse();
      }

      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: finishReverse,
    });

    activeTimelineRef.current = tl;

    tl.addLabel("start", 0);

    if (card) {
      tl.to(
        card,
        { autoAlpha: 0, y: 12, duration: 0.35, ease: "power2.in" },
        "start",
      );
    }

    if (dither) {
      tl.to(dither, { xPercent: 0, duration: 0.6 }, card ? "start+=0.15" : "start");
    }

    if (landing) {
      tl.fromTo(
        landing,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" },
        card ? "start+=0.35" : "-=0.25",
      );
    }
  }, [syncIsTransitioning, syncAuthExitActive]);

  runAuthReverseTimelineRef.current = runAuthReverseTimeline;

  const finishHomeClickTransition = useCallback(() => {
    activeTimelineRef.current = null;
    clickHomeTransitionRef.current = false;
    pendingHomeLandingEnterRef.current = false;
    homeLandingEnterScheduledRef.current = false;
    syncIsTransitioning(false);
    setTransitionDirection(null);
  }, [syncIsTransitioning]);

  const appendHomeLandingEnter = useCallback(
    (landing: HTMLElement) => {
      if (homeLandingEnterScheduledRef.current) return;

      const { isDesktop, reduceMotion } = mediaConditionsRef.current;
      const hasExitTarget = homeClickHasExitTargetRef.current;

      if (reduceMotion) {
        gsap.set(landing, { autoAlpha: 1 });
        finishHomeClickTransition();
        return;
      }

      pendingHomeLandingEnterRef.current = false;
      homeLandingEnterScheduledRef.current = true;

      const tl = activeTimelineRef.current;
      if (!tl) {
        gsap.fromTo(
          landing,
          { autoAlpha: 0, y: 12 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.35,
            ease: "power2.out",
            onComplete: finishHomeClickTransition,
          },
        );
        return;
      }

      if (!isDesktop) {
        tl.fromTo(
          landing,
          { autoAlpha: 0, y: 12 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.35,
            ease: "power2.out",
            onComplete: finishHomeClickTransition,
          },
          hasExitTarget ? "-=0.1" : 0,
        );
        return;
      }

      tl.fromTo(
        landing,
        { autoAlpha: 0, y: 12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.35,
          ease: "power2.out",
          onComplete: finishHomeClickTransition,
        },
        hasExitTarget ? "start+=0.35" : "-=0.25",
      );
    },
    [finishHomeClickTransition],
  );

  const tryStartHomeLandingEnter = useCallback(() => {
    if (!pendingHomeLandingEnterRef.current) return;
    if (!landingContentRef.current) return;

    gsap.set(landingContentRef.current, { autoAlpha: 0 });
    appendHomeLandingEnter(landingContentRef.current);
  }, [appendHomeLandingEnter]);

  tryStartHomeLandingEnterRef.current = tryStartHomeLandingEnter;

  const runAuthHomeClickTimeline = useCallback(() => {
    activeTimelineRef.current?.kill();

    const { isDesktop, reduceMotion } = mediaConditionsRef.current;
    const card = authCardRef.current;
    const footer = authBackHomeRef.current;
    const dither = ditherLayerRef.current;
    const hasExitTarget = Boolean(card || footer);
    homeClickHasExitTargetRef.current = hasExitTarget;

    pendingHomeLandingEnterRef.current = true;

    if (reduceMotion) {
      if (card) gsap.set(card, { autoAlpha: 0, visibility: "hidden" });
      if (footer) gsap.set(footer, { autoAlpha: 0, visibility: "hidden" });
      if (dither) gsap.set(dither, { xPercent: 0 });
      router.push("/");
      tryStartHomeLandingEnterRef.current();
      return;
    }

    if (!isDesktop) {
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
      });
      activeTimelineRef.current = tl;

      if (card) {
        tl.to(
          card,
          { autoAlpha: 0, y: 12, duration: 0.35, ease: "power2.in" },
          0,
        );
      }

      if (footer) {
        tl.to(
          footer,
          { autoAlpha: 0, y: 12, duration: 0.35, ease: "power2.in" },
          0,
        );
      }

      const afterExit = hasExitTarget ? 0.35 : 0;
      tl.add(() => router.push("/"), afterExit);
      if (landingContentRef.current) {
        appendHomeLandingEnter(landingContentRef.current);
      }
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
    });
    activeTimelineRef.current = tl;

    tl.addLabel("start", 0);

    if (card) {
      tl.to(
        card,
        { autoAlpha: 0, y: 12, duration: 0.35, ease: "power2.in" },
        "start",
      );
    }

    if (footer) {
      tl.to(
        footer,
        { autoAlpha: 0, y: 12, duration: 0.35, ease: "power2.in" },
        "start",
      );
    }

    if (dither) {
      tl.to(
        dither,
        { xPercent: 0, duration: 0.6 },
        hasExitTarget ? "start+=0.15" : "start",
      );
    }

    const pushAt = hasExitTarget ? "start+=0.35" : "start";
    tl.add(() => router.push("/"), pushAt);

    if (landingContentRef.current) {
      appendHomeLandingEnter(landingContentRef.current);
    }
  }, [router, appendHomeLandingEnter]);

  runAuthHomeClickTimelineRef.current = runAuthHomeClickTimeline;

  const runAuthAppEnterTimeline = useCallback(() => {
    activeTimelineRef.current?.kill();

    if (!authRouteDirection(pathname)) return;

    const { isDesktop, reduceMotion } = mediaConditionsRef.current;
    const card = authCardRef.current;
    const footer = authBackHomeRef.current;
    const dither = ditherLayerRef.current;
    const panel = revealPanelRef.current;

    const finishAndNavigate = () => {
      sessionStorage.setItem(APP_ENTER_FLAG, "1");
      router.push("/dashboard");
      router.refresh();
      activeTimelineRef.current = null;
      syncIsTransitioning(false);
      setTransitionDirection(null);
    };

    if (reduceMotion || (!card && !footer && !dither)) {
      finishAndNavigate();
      return;
    }

    const slideX = window.innerWidth * 0.55;
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: finishAndNavigate,
    });
    activeTimelineRef.current = tl;

    const position = isDesktop ? "start" : 0;
    if (isDesktop) tl.addLabel("start", 0);

    if (card) {
      tl.to(
        card,
        { x: slideX, autoAlpha: 0, duration: 0.45, ease: "power2.in" },
        position,
      );
    }

    if (footer) {
      tl.to(
        footer,
        { x: slideX, autoAlpha: 0, duration: 0.45, ease: "power2.in" },
        position,
      );
    }

    if (panel && isDesktop) {
      tl.to(panel, { autoAlpha: 0, duration: 0.35, ease: "power2.in" }, "start");
    }

    if (dither) {
      if (isDesktop) {
        tl.to(
          dither,
          {
            xPercent: 120,
            autoAlpha: 0,
            duration: 0.7,
            ease: "power2.inOut",
          },
          "start+=0.1",
        );
      } else {
        tl.to(dither, { autoAlpha: 0, duration: 0.5 }, 0.1);
      }
    }
  }, [pathname, router, syncIsTransitioning]);

  runAuthAppEnterTimelineRef.current = runAuthAppEnterTimeline;

  const tryStartReverseTimeline = useCallback(() => {
    if (!pendingReverseRef.current) return;
    if (!landingContentRef.current) return;
    if (authExitActiveRef.current && !authExitCardRef.current) return;

    pendingReverseRef.current = false;
    runAuthReverseTimelineRef.current();
  }, []);

  tryStartReverseTimelineRef.current = tryStartReverseTimeline;

  const runAuthCrossTimeline = useCallback(
    (
      from: SiteTransitionDirection,
      to: SiteTransitionDirection,
      options: { href?: AuthRoute; useExitOverlay: boolean },
    ) => {
      activeTimelineRef.current?.kill();

      const { isDesktop, reduceMotion } = mediaConditionsRef.current;
      const card = options.useExitOverlay
        ? authExitCardRef.current
        : authCardRef.current;
      const dither = ditherLayerRef.current;
      const panel = revealPanelRef.current;
      const toX = AUTH_TRANSITION[to].xPercent;
      const panelLeft = AUTH_TRANSITION[to].panelSide === "right" ? "50%" : "0%";

      const finishCross = () => {
        activeTimelineRef.current = null;
        authCrossHistoryTimelineStartedRef.current = false;
        syncAuthCrossActive(false);
        syncAuthCrossHistoryExitActive(false);
        setAuthCrossHistoryExitDirection(null);
        setTransitionDirection(null);
        pendingTimelineRef.current = null;
        pendingAuthCrossHistoryRef.current = null;
        if (panel) gsap.set(panel, { clearProps: "left" });
      };

      const pushRoute = () => {
        if (!options.href) return;
        syncAuthCardSuppressed(true);
        router.push(options.href);
      };

      if (reduceMotion) {
        if (card) gsap.set(card, { autoAlpha: 0, visibility: "hidden" });
        if (dither) gsap.set(dither, { xPercent: toX });
        if (panel) gsap.set(panel, { left: panelLeft });
        if (!options.useExitOverlay) pushRoute();
        triggerCardEnter(finishCross);
        return;
      }

      if (!isDesktop) {
        const tl = gsap.timeline();
        activeTimelineRef.current = tl;

        tl.addLabel("exit", 0);

        if (card) {
          tl.to(
            card,
            { autoAlpha: 0, y: 12, duration: 0.35, ease: "power2.in" },
            "exit",
          );
        }

        if (!options.useExitOverlay) {
          tl.add(pushRoute, card ? "exit+=0.35" : 0);
        }

        tl.add(() => triggerCardEnter(finishCross), card ? "exit+=0.4" : 0);
        return;
      }

      const tl = gsap.timeline();
      activeTimelineRef.current = tl;

      tl.addLabel("exit", 0);

      if (card) {
        tl.to(
          card,
          { autoAlpha: 0, y: 12, duration: 0.35, ease: "power2.in" },
          "exit",
        );
      }

      tl.addLabel("slide", card ? "exit+=0.35" : "exit");

      if (!options.useExitOverlay) {
        tl.add(pushRoute, "slide");
      }

      if (dither) {
        tl.to(
          dither,
          { xPercent: toX, duration: 0.6, ease: "power2.inOut" },
          "slide",
        );
      }

      if (panel) {
        gsap.set(panel, {
          left: AUTH_TRANSITION[from].panelSide === "right" ? "50%" : "0%",
        });
        tl.to(
          panel,
          { left: panelLeft, duration: 0.6, ease: "power2.inOut" },
          "slide",
        );
      }

      tl.add(() => triggerCardEnter(finishCross), "slide+=0.6");
    },
    [
      router,
      syncAuthCardSuppressed,
      syncAuthCrossActive,
      syncAuthCrossHistoryExitActive,
      triggerCardEnter,
    ],
  );

  runAuthCrossTimelineRef.current = runAuthCrossTimeline;

  const tryStartAuthCrossHistoryTimeline = useCallback(() => {
    const pending = pendingAuthCrossHistoryRef.current;
    if (!pending) return;
    if (authCrossHistoryExitActiveRef.current && !authExitCardRef.current) return;
    if (authCrossHistoryTimelineStartedRef.current) return;

    authCrossHistoryTimelineStartedRef.current = true;
    runAuthCrossTimelineRef.current(pending.from, pending.to, {
      useExitOverlay: true,
    });
  }, []);

  tryStartAuthCrossHistoryTimelineRef.current = tryStartAuthCrossHistoryTimeline;

  const runAuthTimeline = useCallback(
    (direction: SiteTransitionDirection) => {
      activeTimelineRef.current?.kill();

      const { xPercent } = AUTH_TRANSITION[direction];
      const { isDesktop, reduceMotion } = mediaConditionsRef.current;
      const landing = landingContentRef.current;
      const dither = ditherLayerRef.current;

      if (reduceMotion) {
        if (landing) gsap.set(landing, { autoAlpha: 0 });
        if (dither) gsap.set(dither, { xPercent: isDesktop ? xPercent : 0 });
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
        tl.to(dither, { xPercent, duration: 0.6 }, "route");
      }

      tl.add(triggerCardEnter, "route+=0.6");
    },
    [triggerCardEnter],
  );

  runAuthTimelineRef.current = runAuthTimeline;

  useLayoutEffect(() => {
    const previousPath = prevPathnameRef.current;
    const previousDirection = authRouteDirection(previousPath);
    const currentDirection = authRouteDirection(pathname);

    const pending = pendingTimelineRef.current;
    if (pending && pending.kind === "landing" && landingContentRef.current) {
      const { direction } = pending;
      pendingTimelineRef.current = null;
      runAuthTimelineRef.current(direction);
      prevPathnameRef.current = pathname;
      return;
    }

    if (
      authCrossHistoryTransition &&
      !pendingTimelineRef.current &&
      !pendingAuthCrossHistoryRef.current
    ) {
      bootstrapAuthCrossHistory(authCrossHistoryTransition);
      prevPathnameRef.current = pathname;
      return;
    }

    if (
      previousDirection &&
      currentDirection &&
      previousDirection !== currentDirection &&
      !pendingTimelineRef.current &&
      !(isTransitioningRef.current && authCrossActiveRef.current)
    ) {
      bootstrapAuthCrossHistory({ from: previousDirection, to: currentDirection });
      prevPathnameRef.current = pathname;
      return;
    }

    if (
      previousDirection &&
      pathname === "/" &&
      !pendingTimelineRef.current &&
      !landingExitActive
    ) {
      if (clickHomeTransitionRef.current) {
        if (landingContentRef.current) {
          gsap.set(landingContentRef.current, { autoAlpha: 0 });
        }
        tryStartHomeLandingEnterRef.current();
        prevPathnameRef.current = pathname;
        return;
      }

      pendingReverseRef.current = true;
      syncIsTransitioning(true);
      setTransitionDirection(previousDirection);
      syncAuthExitActive(true);

      if (landingContentRef.current) {
        gsap.set(landingContentRef.current, { autoAlpha: 0 });
      }

      tryStartReverseTimelineRef.current();
    }

    prevPathnameRef.current = pathname;
  }, [
    pathname,
    landingContentVersion,
    landingExitActive,
    syncIsTransitioning,
    syncAuthExitActive,
    syncAuthCardSuppressed,
    syncAuthCrossActive,
    syncAuthCrossHistoryExitActive,
    bootstrapAuthCrossHistory,
    authCrossHistoryTransition,
  ]);

  useLayoutEffect(() => {
    const direction = authRouteDirection(pathname);
    if (!direction || isTransitioningRef.current) return;

    const dither = ditherLayerRef.current;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (dither && isDesktop && !reduceMotion) {
      gsap.set(dither, { xPercent: AUTH_TRANSITION[direction].xPercent });
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

          const direction = authRouteDirection(pathname);
          if (
            direction &&
            !isTransitioningRef.current &&
            ditherLayerRef.current
          ) {
            const { isDesktop, reduceMotion } = mediaConditionsRef.current;
            if (isDesktop && !reduceMotion) {
              gsap.set(ditherLayerRef.current, {
                xPercent: AUTH_TRANSITION[direction].xPercent,
              });
            }
          }
        },
        shellRef,
      );

      runHomeTransitionRef.current = contextSafe!(() => {
        const direction = authRouteDirection(pathname);
        if (!direction || isTransitioningRef.current) {
          return;
        }

        clickHomeTransitionRef.current = true;
        syncIsTransitioning(true);
        setTransitionDirection(direction);
        runAuthHomeClickTimelineRef.current();
      });

      runAppEnterTransitionRef.current = contextSafe!(() => {
        const direction = authRouteDirection(pathname);
        if (!direction || isTransitioningRef.current) {
          return;
        }

        activeTimelineRef.current?.kill();
        syncIsTransitioning(true);
        setTransitionDirection(direction);
        runAuthAppEnterTimelineRef.current();
      });

      runTransitionRef.current = contextSafe!(
        (href: AuthRoute, direction: SiteTransitionDirection) => {
          if (isTransitioningRef.current) {
            return;
          }

          activeTimelineRef.current?.kill();

          const current = authRouteDirection(pathname);

          if (current && current !== direction) {
            syncIsTransitioning(true);
            setTransitionDirection(direction);
            syncAuthCrossActive(true);
            pendingTimelineRef.current = {
              href,
              direction,
              kind: "auth-cross",
              from: current,
            };
            runAuthCrossTimelineRef.current(current, direction, {
              href,
              useExitOverlay: false,
            });
            return;
          }

          if (current === direction) {
            return;
          }

          syncIsTransitioning(true);
          setTransitionDirection(direction);
          setLandingExitActive(true);
          syncAuthCardSuppressed(true);
          pendingTimelineRef.current = { href, direction, kind: "landing" };

          router.push(href);
        },
      );

      return () => {
        mm.revert();
        activeTimelineRef.current?.kill();
      };
    },
    {
      scope: shellRef,
      dependencies: [
        router,
        syncIsTransitioning,
        syncAuthCardSuppressed,
        syncAuthCrossActive,
        syncAuthCrossHistoryExitActive,
        pathname,
      ],
    },
  );

  const runTransition = useCallback(
    (href: AuthRoute, direction: SiteTransitionDirection) => {
      runTransitionRef.current(href, direction);
    },
    [],
  );

  const runHomeTransition = useCallback(() => {
    runHomeTransitionRef.current();
  }, []);

  const runAppEnterTransition = useCallback(() => {
    runAppEnterTransitionRef.current();
  }, []);

  const activeRevealDirection: SiteTransitionDirection | null =
    authRouteDirection(pathname) ??
    authCrossHistoryTransition?.to ??
    (isTransitioning ? transitionDirection : null);

  const showAuthReveal = activeRevealDirection !== null;
  const revealPanelSide = activeRevealDirection
    ? AUTH_TRANSITION[activeRevealDirection].panelSide
    : null;
  const panelPositionControlled =
    authCrossActive || authCrossHistoryTransition !== null;

  const showDither =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    showAuthReveal;

  const contextValue: SiteTransitionContextValue = {
    runTransition,
    runHomeTransition,
    runAppEnterTransition,
    isTransitioning,
    transitionDirection,
    authCardSuppressed: effectiveAuthCardSuppressed,
    registerLandingContent,
    registerAuthCard,
    registerAuthBackHome,
  };

  return (
    <SiteTransitionContext.Provider value={contextValue}>
      <div
        ref={shellRef}
        className="relative min-h-screen overflow-hidden bg-white dark:bg-black"
      >
        <div
          ref={revealPanelRef}
          className={cn(
            "absolute inset-y-0 z-0 hidden w-1/2 bg-white dark:bg-black",
            showAuthReveal && "lg:block",
            !panelPositionControlled && revealPanelSide === "right" && "right-0",
            !panelPositionControlled && revealPanelSide === "left" && "left-0",
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
          {showHistoryCrossExitOverlay && historyCrossExitDirection ? (
            <AuthExitOverlay
              direction={historyCrossExitDirection}
              registerAuthExitCard={registerAuthExitCard}
            />
          ) : null}
          {authExitActive && transitionDirection ? (
            <AuthExitOverlay
              direction={transitionDirection}
              registerAuthExitCard={registerAuthExitCard}
            />
          ) : null}
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
