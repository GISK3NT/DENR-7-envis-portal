"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/users", label: "Accounts" },
  { href: "/admin/audit", label: "Audit log" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-medium transition ${
              active ? "bg-forest-900 text-sand-50" : "text-forest-700 hover:bg-forest-100/70 hover:text-forest-950"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
