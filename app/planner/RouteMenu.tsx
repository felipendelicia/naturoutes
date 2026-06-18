"use client";

import { useId, useState } from "react";

export default function RouteMenu({
  canExport,
  onSave,
  onOpenSaved,
  onExportGpx,
  onExportKml,
  onOpenGoogleMaps,
  onImportText,
}: {
  canExport: boolean;
  onSave: () => void;
  onOpenSaved: () => void;
  onExportGpx: () => void;
  onExportKml: () => void;
  onOpenGoogleMaps: () => void;
  onImportText: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const inputId = useId();

  function run(action: () => void) {
    action();
    setOpen(false);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) f.text().then(onImportText);
    e.target.value = "";
    setOpen(false);
  }

  const items: { label: string; onClick: () => void; disabled?: boolean }[] = [
    { label: "Guardar ruta", onClick: onSave, disabled: !canExport },
    { label: "Rutas guardadas", onClick: onOpenSaved },
    { label: "Exportar GPX", onClick: onExportGpx, disabled: !canExport },
    { label: "Exportar KML", onClick: onExportKml, disabled: !canExport },
    { label: "Abrir en Google Maps", onClick: onOpenGoogleMaps, disabled: !canExport },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Más acciones"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-full bg-pine/8 text-pine transition hover:bg-pine/15 active:scale-95"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="12" cy="19" r="1.7" />
        </svg>
      </button>

      {open && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[1090] cursor-default"
          />
          <ul className="panel absolute bottom-full right-0 z-[1100] mb-2 w-52 overflow-hidden rounded-2xl py-1">
            {items.map((it) => (
              <li key={it.label}>
                <button
                  onClick={() => !it.disabled && run(it.onClick)}
                  disabled={it.disabled}
                  className="block w-full px-4 py-2.5 text-left text-sm text-pine transition hover:bg-pine/8 disabled:opacity-30"
                >
                  {it.label}
                </button>
              </li>
            ))}
            <li>
              <label
                htmlFor={inputId}
                className="block w-full cursor-pointer px-4 py-2.5 text-left text-sm text-pine transition hover:bg-pine/8"
              >
                Importar GPX
              </label>
            </li>
          </ul>
        </>
      )}

      <input
        id={inputId}
        type="file"
        accept=".gpx,application/gpx+xml"
        className="hidden"
        onChange={onFile}
      />
    </div>
  );
}
