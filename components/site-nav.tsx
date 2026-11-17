"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLink = {
  href: string;
  label: string;
  /** Opens in a new tab (external portal). */
  external?: boolean;
  /** Full name used as tooltip / accessible label for shortened nav text. */
  title?: string;
};

function ExternalMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      className={`h-[10px] w-[10px] shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 2.5h5v5" />
      <path d="M9.5 2.5 3 9" />
    </svg>
  );
}

export default function SiteNav({
  links,
  variant = "desktop",
}: {
  links: NavLink[];
  variant?: "desktop" | "mobile";
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  if (variant === "mobile") {
    return (
      <>
        {links.map((link) => {
          if (link.external) {
            return (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                title={link.title ?? link.label}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[7px] px-3 py-1.5 text-xs font-semibold text-forest-700 transition hover:bg-forest-100/70 hover:text-forest-950"
              >
                {link.label}
                <ExternalMark className="text-forest-500" />
              </a>
            );
          }

          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap rounded-[7px] px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-forest-900 text-sand-50"
                  : "text-forest-700 hover:bg-forest-100/70 hover:text-forest-950"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <>
      {links.map((link) => {
        if (link.external) {
          return (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              title={link.title ?? link.label}
              className="relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-[13.5px] font-medium text-forest-700 transition-colors hover:text-forest-950"
            >
              <span className="underline-grow">{link.label}</span>
              <ExternalMark className="text-forest-500" />
            </a>
          );
        }

        const active = isActive(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`relative whitespace-nowrap rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors ${
              active ? "text-forest-950" : "text-forest-700 hover:text-forest-950"
            }`}
          >
            <span className="underline-grow">{link.label}</span>
            <span
              aria-hidden
              className={`absolute -bottom-0.5 left-3 right-3 h-px origin-left bg-brass-500 transition-transform duration-300 ${
                active ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </Link>
        );
      })}
    </>
  );
}
