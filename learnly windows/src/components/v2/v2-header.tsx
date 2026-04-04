"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { V2Logo } from "@/components/v2/v2-logo";

const links = [
  { href: "/v2", label: "Home" },
  { href: "/v2/dashboard", label: "Dashboard" },
  { href: "/v2/words", label: "Words" },
  { href: "/v2/study", label: "Study" }
];

export function V2Header() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-5 z-50">
      <div className="v2-shell">
        <div className="v2-nav rounded-[28px] px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-4">
            <V2Logo />

            <nav className="hidden items-center gap-6 md:flex">
              {links.map((link) => {
                const active = link.href === "/v2" ? pathname === link.href : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`border-b px-1 pb-2 pt-1 text-sm font-medium tracking-[0.01em] transition-[transform,opacity,box-shadow] ${
                      active
                        ? "border-[rgba(37,26,18,0.22)] text-[var(--v2-text)]"
                        : "border-transparent text-[var(--v2-muted)] hover:border-[rgba(37,26,18,0.12)] hover:text-[var(--v2-text)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <Link href="/v2/study" className="v2-button-primary px-5 py-2.5 text-sm shadow-[0_16px_30px_rgba(238,143,66,0.22)]">
              Start Study
            </Link>
          </div>

          <nav className="mt-3 flex gap-4 overflow-x-auto pb-1 md:hidden">
            {links.map((link) => {
              const active = link.href === "/v2" ? pathname === link.href : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap border-b px-1 pb-2 pt-1 text-sm transition-[transform,opacity,box-shadow] ${
                    active
                      ? "border-[rgba(37,26,18,0.22)] text-[var(--v2-text)]"
                      : "border-transparent text-[var(--v2-muted)] hover:border-[rgba(37,26,18,0.12)] hover:text-[var(--v2-text)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
