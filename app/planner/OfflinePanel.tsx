"use client";

import { useEffect, useRef, useState } from "react";
import { estimateTiles } from "@/lib/map/tiles";
import type { BaseLayer } from "@/lib/map/layers";
import type { BBox } from "@/lib/types";
import {
  downloadArea,
  clearOffline,
  offlineTileCount,
  MAX_TILES,
} from "./offlineTiles";

export default function OfflinePanel({
  open,
  onClose,
  bbox,
  baseZoom,
  baseLayer,
}: {
  open: boolean;
  onClose: () => void;
  bbox: BBox | null;
  baseZoom: number;
  baseLayer: BaseLayer;
}) {
  const [extra, setExtra] = useState(2);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [stored, setStored] = useState(0);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) offlineTileCount().then(setStored);
  }, [open]);

  if (!open) return null;

  const maxZoom = Math.min(baseZoom + extra, baseLayer.maxZoom);
  const count = bbox ? estimateTiles(bbox, Math.round(baseZoom), maxZoom) : 0;
  const tooMany = count > MAX_TILES;
  const downloading = progress != null;

  async function start() {
    if (!bbox || tooMany) return;
    const ctrl = new AbortController();
    abort.current = ctrl;
    setProgress({ done: 0, total: count });
    await downloadArea(
      baseLayer,
      bbox,
      Math.round(baseZoom),
      maxZoom,
      (done, total) => setProgress({ done, total }),
      ctrl.signal,
    );
    setProgress(null);
    setStored(await offlineTileCount());
  }

  return (
    <div className="absolute inset-0 z-[1200] flex flex-col justify-end">
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-pine/40 backdrop-blur-[2px]"
      />
      <div className="panel relative max-h-[80%] overflow-auto rounded-t-3xl px-5 pb-6 pt-3">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-pine/20" />
        <h2 className="mb-1 text-sm font-bold uppercase tracking-[0.16em] text-pine">
          Mapa offline · {baseLayer.label}
        </h2>
        <p className="mb-3 text-xs text-moss">
          Descarga el área visible para usarla sin señal.
        </p>

        <label className="mb-1 block text-xs font-medium text-pine-soft">
          Detalle extra: +{extra} {extra === 1 ? "nivel" : "niveles"} de zoom
        </label>
        <input
          type="range"
          min={0}
          max={3}
          value={extra}
          onChange={(e) => setExtra(Number(e.target.value))}
          disabled={downloading}
          className="w-full accent-[var(--blaze)]"
        />

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-moss">
            ~{count.toLocaleString("es")} tiles
            {tooMany && (
              <span className="text-blaze-deep"> · demasiado, achicá el área o el zoom</span>
            )}
          </span>
          <span className="font-mono text-moss">{stored} guardados</span>
        </div>

        {downloading && progress && (
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-pine/10">
              <div
                className="h-full bg-blaze transition-all"
                style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-center text-[11px] text-moss">
              {progress.done} / {progress.total}
            </p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {downloading ? (
            <button
              onClick={() => abort.current?.abort()}
              className="flex-1 rounded-xl border border-pine/15 py-2.5 text-sm font-semibold text-pine"
            >
              Cancelar
            </button>
          ) : (
            <button
              onClick={start}
              disabled={!bbox || tooMany}
              className="flex-1 rounded-xl bg-blaze py-2.5 text-sm font-semibold text-paper transition active:scale-95 disabled:opacity-40"
            >
              Descargar
            </button>
          )}
          <button
            onClick={async () => {
              await clearOffline();
              setStored(0);
            }}
            disabled={downloading || stored === 0}
            className="rounded-xl border border-pine/15 px-4 py-2.5 text-sm font-medium text-blaze-deep disabled:opacity-40"
          >
            Borrar
          </button>
        </div>
      </div>
    </div>
  );
}
