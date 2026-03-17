"use client";

import { useRef, useState, useCallback, type ReactNode } from "react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  disabled?: boolean;
}

const THRESHOLD = 72; // px to pull before triggering
const MAX_PULL = 100; // px max visual stretch

export default function PullToRefresh({ onRefresh, children, disabled }: PullToRefreshProps) {
  const startYRef = useRef<number | null>(null);
  const [pullY, setPullY] = useState(0);          // 0–MAX_PULL visual distance
  const [phase, setPhase] = useState<"idle" | "pulling" | "ready" | "refreshing">("idle");
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    // Only activate when scrolled to the very top
    const el = containerRef.current;
    if (el && el.scrollTop > 2) return;
    startYRef.current = e.touches[0].clientY;
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startYRef.current === null || disabled) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) {
      startYRef.current = null;
      setPullY(0);
      setPhase("idle");
      return;
    }
    // Rubber-band: dampen pull as it extends
    const damped = Math.min(MAX_PULL, delta * (1 - delta / (MAX_PULL * 3)));
    setPullY(damped);
    setPhase(damped >= THRESHOLD * (1 - 1 / 3) ? "ready" : "pulling");
  }, [disabled]);

  const handleTouchEnd = useCallback(async () => {
    if (startYRef.current === null || disabled) return;
    startYRef.current = null;

    if (phase === "ready") {
      setPhase("refreshing");
      setPullY(44); // hold open at spinner height
      try {
        await onRefresh();
      } finally {
        // Short pause so the spinner is visible
        await new Promise((r) => setTimeout(r, 600));
        setPhase("idle");
        setPullY(0);
      }
    } else {
      setPhase("idle");
      setPullY(0);
    }
  }, [phase, onRefresh, disabled]);

  const indicatorSize = Math.min(pullY / MAX_PULL, 1); // 0–1
  const rotation = phase === "refreshing" ? undefined : pullY * 2.5; // deg

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="flex-1 overflow-y-auto"
      style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{
          height: phase === "refreshing" ? 44 : pullY,
          // Only animate snap-back, not the pull itself
          transitionDuration: phase === "idle" ? "300ms" : "0ms",
        }}
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition-opacity ${
            phase === "ready"
              ? "border-indigo-500 bg-indigo-500/20 text-indigo-400"
              : "border-gray-700 bg-gray-800 text-gray-500"
          }`}
          style={{ opacity: indicatorSize, transform: `scale(${0.6 + indicatorSize * 0.4})` }}
        >
          {phase === "refreshing" ? (
            <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 transition-transform"
              style={{ transform: `rotate(${rotation}deg)` }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
