"use client";

import dynamic from "next/dynamic";

const PlannerApp = dynamic(() => import("./planner/PlannerApp"), {
  ssr: false,
  loading: () => (
    <div className="grid h-dvh w-full place-items-center bg-pine text-paper">
      <span className="text-sm uppercase tracking-[0.2em] opacity-70">
        cargando mapa…
      </span>
    </div>
  ),
});

export default function Home() {
  return <PlannerApp />;
}
