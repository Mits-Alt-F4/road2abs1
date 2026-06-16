"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { label: "Today", href: "/demo/today", icon: "⚡" },
  { label: "Build", href: "/demo/build", icon: "🏗️" },
  { label: "Budget", href: "/demo/budget", icon: "💰" },
  { label: "Library", href: "/demo/products", icon: "📋" },
];

export function BottomNav() {
  const path = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[520px] pb-safe z-50"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="flex items-stretch border-t"
        style={{ borderColor: "var(--border)" }}
      >
        {NAV.map(({ label, href, icon }) => {
          const active =
            href === "/demo/today"
              ? path === "/demo/today" || path === "/demo" || path === "/demo/results" || path.startsWith("/demo/recipe") || path === "/demo/shopping-list"
              : path.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                active
                  ? "text-[var(--accent-lime)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <span className="text-lg leading-none">{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
