"use client";

import { useEffect, useId, useRef, useState } from "react";

export type DashboardLink = {
  href: string;
  label: string;
  description: string;
};

/**
 * Desktop-only grouped entry for the external public dashboards. Keeps the
 * main navigation from overflowing while still exposing the full dashboard
 * names ("EMB Datasets — Public Viewing", "AQMS Public Dashboard").
 */
export default function PublicDashboardsMenu({
  label,
  hint,
  items,
}: {
  label: string;
  hint: string;
  items: DashboardLink[];
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors ${
          open ? "bg-forest-100/70 text-forest-950" : "text-forest-700 hover:bg-forest-100/50 hover:text-forest-950"
        }`}
      >
        {label}
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className={`h-2.5 w-2.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-2 w-[320px] overflow-hidden rounded-[12px] border border-sand-300 bg-white shadow-[0_22px_50px_-24px_rgba(11,31,25,0.55)]"
        >
          <p className="border-b border-sand-200 bg-sand-50/70 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-600">
            {hint}
          </p>
          <ul className="p-1.5">
            {items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="group flex items-start gap-2.5 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-forest-100/60 focus-visible:bg-forest-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-400"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brass-500 transition-colors group-hover:bg-forest-700"
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold leading-snug text-forest-900">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-forest-600">
                      {item.description}
                    </span>
                  </span>
                  <svg
                    aria-hidden
                    viewBox="0 0 12 12"
                    className="ml-auto mt-1 h-3 w-3 shrink-0 text-forest-400 transition-colors group-hover:text-forest-700"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4.5 2.5h5v5" />
                    <path d="M9.5 2.5 3 9" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
