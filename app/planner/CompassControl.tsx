"use client";

import { useCompass } from "./useCompass";

export default function CompassControl() {
  const compass = useCompass();

  return (
    <div className="absolute bottom-60 left-3 z-[1000] flex flex-col items-center gap-1">
      <button
        onClick={compass.active ? compass.stop : compass.start}
        aria-label="Brújula"
        aria-pressed={compass.active}
        className={`panel grid h-12 w-12 place-items-center rounded-full transition active:scale-95 ${
          compass.active ? "text-blaze-deep" : "text-pine"
        }`}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          style={{
            transform:
              compass.heading != null
                ? `rotate(${-compass.heading}deg)`
                : undefined,
            transition: "transform 0.1s linear",
          }}
        >
          <circle cx="12" cy="12" r="9" stroke="var(--pine-soft)" strokeWidth="1.4" />
          <path d="M12 4l3 8-3-2-3 2 3-8z" fill="var(--blaze)" />
          <path d="M12 20l-3-8 3 2 3-2-3 8z" fill="var(--pine-soft)" />
        </svg>
      </button>
      {compass.active && compass.heading != null && (
        <span className="panel rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold text-pine">
          {Math.round(compass.heading)}°
        </span>
      )}
    </div>
  );
}
