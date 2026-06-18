"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  type PointerEvent,
  type ReactNode,
} from "react";

export type Snap = "peek" | "mid" | "full";

const PEEK_PX = 150; // visible height at the lowest snap
const FULL_VH = 0.9; // sheet height as a fraction of the viewport
const MID_VH = 0.46; // visible height at the middle snap
const FLICK = 0.5; // px/ms velocity that triggers a flick to the next snap

const vhPx = () => (typeof window !== "undefined" ? window.innerHeight : 800);

type Drag = {
  startY: number;
  startT: number;
  moved: boolean;
  t: number;
  lastT: number;
  lastTime: number;
  vy: number;
};

export default function BottomSheet({
  snap,
  onSnapChange,
  header,
  children,
}: {
  snap: Snap;
  onSnapChange: (s: Snap) => void;
  header?: ReactNode;
  children: ReactNode;
}) {
  const sheetRef = useRef<HTMLElement>(null);
  const mounted = useRef(false);
  const drag = useRef<Drag | null>(null);

  const translateFor = useCallback((s: Snap): number => {
    const h = vhPx() * FULL_VH;
    if (s === "full") return 0;
    if (s === "mid") return h - vhPx() * MID_VH;
    return h - PEEK_PX;
  }, []);

  // Imperative transform — React never owns it, so dragging doesn't re-render.
  const apply = useCallback((t: number, animate: boolean) => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transition = animate
      ? "transform .42s cubic-bezier(.22,1,.36,1)"
      : "none";
    el.style.transform = `translateY(${t}px)`;
  }, []);

  useLayoutEffect(() => {
    apply(translateFor(snap), mounted.current);
    mounted.current = true;
  }, [snap, apply, translateFor]);

  function onDown(e: PointerEvent) {
    // Let interactive controls in the header work without starting a drag.
    if ((e.target as Element).closest("button, input, a, label")) return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const t = translateFor(snap);
    drag.current = {
      startY: e.clientY,
      startT: t,
      moved: false,
      t,
      lastT: t,
      lastTime: e.timeStamp,
      vy: 0,
    };
  }

  function onMove(e: PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    if (Math.abs(dy) > 5) d.moved = true;
    const t = Math.max(0, Math.min(translateFor("peek"), d.startT + dy));
    const dt = e.timeStamp - d.lastTime;
    if (dt > 0) d.vy = (t - d.lastT) / dt;
    d.lastT = t;
    d.lastTime = e.timeStamp;
    d.t = t;
    if (d.moved) apply(t, false);
  }

  function onUp() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;

    if (!d.moved) {
      onSnapChange(snap === "peek" ? "mid" : "peek");
      return;
    }

    const ordered: Snap[] = ["full", "mid", "peek"]; // ascending translate
    let ni = 0;
    let best = Infinity;
    ordered.forEach((s, i) => {
      const dd = Math.abs(translateFor(s) - d.t);
      if (dd < best) {
        best = dd;
        ni = i;
      }
    });
    if (d.vy < -FLICK) ni = Math.max(0, ni - 1); // flick up → open more
    else if (d.vy > FLICK) ni = Math.min(ordered.length - 1, ni + 1); // flick down → close

    const next = ordered[ni];
    apply(translateFor(next), true); // animate now for an immediate, springy feel
    if (next !== snap) onSnapChange(next);
  }

  return (
    <section
      ref={sheetRef}
      className="panel absolute inset-x-0 bottom-0 z-[1000] flex flex-col rounded-t-3xl"
      style={{ height: `${FULL_VH * 100}vh` }}
    >
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="shrink-0 cursor-grab touch-none pb-1 pt-3 active:cursor-grabbing"
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-pine/25" />
        {header && <div className="px-4 pb-1 pt-2.5">{header}</div>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </section>
  );
}
