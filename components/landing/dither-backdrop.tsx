"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const Dither = dynamic(() => import("@/components/backgrounds/dither"), {
  ssr: false,
});

export function DitherBackdrop() {
  const { resolvedTheme } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const waveColor: [number, number, number] =
    resolvedTheme === "light" ? [0.25, 0.25, 0.28] : [0.92, 0.92, 0.92];

  return (
    <div className="absolute inset-0 -z-10 h-full w-full">
      <Dither
        waveColor={waveColor}
        disableAnimation={reduceMotion}
        enableMouseInteraction={!reduceMotion}
        mouseRadius={0.3}
        colorNum={4}
        colorIntensity={4}
        waveAmplitude={0.22}
        waveFrequency={4.6}
        waveSpeed={0.05}
        pixelSize={2}
      />
    </div>
  );
}
