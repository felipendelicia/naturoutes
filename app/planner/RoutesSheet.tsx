"use client";

import type { SavedRoute } from "@/lib/store/routeStore";

function km(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export default function RoutesSheet({
  open,
  routes,
  onClose,
  onLoad,
  onDelete,
}: {
  open: boolean;
  routes: SavedRoute[];
  onClose: () => void;
  onLoad: (r: SavedRoute) => void;
  onDelete: (id: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[1200] flex flex-col justify-end">
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-pine/40 backdrop-blur-[2px]"
      />
      <div className="animate-rise panel relative max-h-[70%] overflow-auto rounded-t-3xl px-4 pb-6 pt-3">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-pine/20" />
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-pine">
            Rutas guardadas
          </h2>
          <span className="font-mono text-xs text-moss">{routes.length}</span>
        </div>

        {routes.length === 0 ? (
          <p className="py-8 text-center text-sm text-moss">
            Todavía no guardaste ninguna ruta.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {routes.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-2 rounded-2xl bg-pine/5 p-1 pl-3"
              >
                <button
                  onClick={() => onLoad(r)}
                  className="flex min-w-0 flex-1 flex-col items-start py-2 text-left"
                >
                  <span className="w-full truncate text-sm font-semibold text-pine">
                    {r.name}
                  </span>
                  <span className="font-mono text-[11px] text-moss">
                    {km(r.distanceMeters)} ·{" "}
                    {r.profile === "bike" ? "bici" : "pie"} ·{" "}
                    {new Date(r.updatedAt).toLocaleDateString("es")}
                  </span>
                </button>
                <button
                  onClick={() => onDelete(r.id)}
                  aria-label={`Borrar ${r.name}`}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-moss transition hover:bg-blaze hover:text-paper"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M4 7h16M9 7V5h6v2M6 7l1 12h10l1-12"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
