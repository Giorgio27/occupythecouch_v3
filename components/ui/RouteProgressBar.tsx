"use client";

import { useEffect, useRef, useState } from "react";
import Router from "next/router";

/**
 * Global route-change progress bar for Next.js Pages Router.
 *
 * Listens to `Router.events` and renders a thin animated bar at the very top
 * of the viewport. Zero external dependencies — pure CSS + React state.
 *
 * Mount once in `pages/_app.tsx`.
 */
export default function RouteProgressBar() {
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
  };

  const start = () => {
    clearTimers();
    setActive(true);
    setWidth(10);

    // Slowly advance toward 90% — never reaches 100% until done
    timerRef.current = setInterval(() => {
      setWidth((w) => {
        if (w >= 90) {
          clearInterval(timerRef.current!);
          return 90;
        }
        // Decelerate as it approaches 90
        return w + (90 - w) * 0.08;
      });
    }, 200);
  };

  const complete = () => {
    clearTimers();
    setWidth(100);
    // Hide bar after the fill animation finishes
    completeTimerRef.current = setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 400);
  };

  useEffect(() => {
    Router.events.on("routeChangeStart", start);
    Router.events.on("routeChangeComplete", complete);
    Router.events.on("routeChangeError", complete);

    return () => {
      Router.events.off("routeChangeStart", start);
      Router.events.off("routeChangeComplete", complete);
      Router.events.off("routeChangeError", complete);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!active && width === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: "3px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          background: "var(--cine-red-soft, #c73b3e)",
          boxShadow: "0 0 8px var(--cine-red-glow, rgba(165,42,45,0.5))",
          transition:
            width === 100 ? "width 0.3s ease-out" : "width 0.2s ease-in-out",
          borderRadius: "0 2px 2px 0",
        }}
      />
    </div>
  );
}
