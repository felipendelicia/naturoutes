"use client";

import { useRef, useState, type ReactNode, type PointerEvent } from "react";

export type Snap = "peek" | "mid" | "full";

const PEEK_PX = 128; // visible height at the lowest snap
const FULL_VH = 0.9; // sheet height as a fraction of the viewport
const MID_VH = 0.46; // visible height at the middle snap

function vh(): number {
  return typeof window !== "undefined" ? window.innerHeight : 800;
}

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
  const drag = useRef<{ startY: number; startT: number; moved: boolean } | null>(
    null,
  );
  const [dragT, setDragT] = useState<number | null>(null);

  const translateFor = (s: Snap): number => {
    const h = vh() * FULL_VH;
    if (s === "full") return 0;
    if (s === "mid") return h - vh() * MID_VH;
    return h - PEEK_PX;
  };

  const translate = dragT ?? translateFor(snap);

  function onDown(e: PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { startY: e.clientY, startT: translateFor(snap), moved: false };
    setDragT(translateFor(snap));
  }
  function onMove(e: PointerEvent) {
    if (!drag.current) return;
    const dy = e.clientY - drag.current.startY;
    if (Math.abs(dy) > 6) drag.current.moved = true;
    setDragT(Math.max(0, Math.min(translateFor("peek"), drag.current.startT + dy)));
  }
  function onUp() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    // A tap (no real movement) toggles peek <-> mid.
    if (!d.moved) {
      setDragT(null);
      onSnapChange(snap === "peek" ? "mid" : "peek");
      return;
    }
    const cur = dragT ?? translateFor(snap);
    let best: Snap = snap;
    let bestD = Infinity;
    for (const s of ["full", "mid", "peek"] as Snap[]) {
      const dist = Math.abs(translateFor(s) - cur);
      if (dist < bestD) {
        bestD = dist;
        best = s;
      }
    }
    setDragT(null);
    onSnapChange(best);
  }

  return (
    <section
      className="panel absolute inset-x-0 bottom-0 z-[1000] flex flex-col rounded-t-3xl"
      style={{
        height: `${FULL_VH * 100}vh`,
        transform: `translateY(${translate}px)`,
        transition: dragT == null ? "transform .34s cubic-bezier(.22,1,.36,1)" : "none",
      }}
    >
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="shrink-0 cursor-grab touch-none px-4 pb-1 pt-2.5 active:cursor-grabbing"
      >
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-pine/20" />
        {header}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </section>
  );
}
