import Link from "next/link";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { LogoLockup } from "@/components/site/logo-lockup";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/words", label: "Words" }
];

export function SiteHeader({
  floating = true,
  showMobileNav = true,
  showStudyCta = true,
  surface = "default"
}: {
  floating?: boolean;
  showMobileNav?: boolean;
  showStudyCta?: boolean;
  surface?: "default" | "study";
}) {
  const mobileLinkClass =
    surface === "study"
      ? "rounded-full border border-line/65 bg-paper/54 px-4 py-2 whitespace-nowrap transition-[transform,opacity,box-shadow] hover:border-clay/26 hover:bg-paper/70 hover:text-clay"
      : "rounded-full border border-line/70 bg-panel/78 px-4 py-2 whitespace-nowrap transition-[transform,opacity,box-shadow] hover:border-clay/30 hover:text-clay";
  const desktopNavClass =
    surface === "study"
      ? "hidden items-center gap-1 rounded-full border border-line/60 bg-paper/34 p-1 text-sm text-ink/70 md:flex"
      : "hidden items-center gap-1 rounded-full border border-line/60 bg-paper/40 p-1 text-sm text-ink/70 md:flex";
  const desktopLinkClass = "rounded-full px-4 py-2 transition-[transform,opacity,box-shadow] hover:bg-paper/72 hover:text-clay";

  return (
    <header className={floating ? "relative z-50 pt-4 md:fixed md:inset-x-0 md:top-4 md:pt-0" : "relative z-20 pt-4"}>
      <div className="shell">
        <div
          className={`rounded-[28px] px-3 py-3 backdrop-blur-2xl sm:px-5 ${
            surface === "study"
              ? "study-header-shell"
              : floating
              ? "floating-nav"
              : "border border-line/70 bg-panel/84 shadow-[0_18px_44px_rgba(24,18,14,0.08)]"
          }`}
        >
          <div className="md:hidden">
            <div className="flex items-center justify-between gap-3">
              <LogoLockup />
              <ThemeToggle />
            </div>
            {showMobileNav ? (
              <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 text-sm text-ink/65">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} className={mobileLinkClass}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            ) : null}
            {showStudyCta ? (
              <div className="mt-3">
                <Link href="/study" className="button-nav-bright w-full">
                  Start Study
                </Link>
              </div>
            ) : null}
          </div>

          <div className="hidden items-center justify-between gap-4 md:flex">
            <LogoLockup />
            <nav className={desktopNavClass}>
              {links.filter((link) => link.label !== "Home").map((link) => (
                <Link key={link.href} href={link.href} className={desktopLinkClass}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {showStudyCta ? (
                <Link href="/study" className="button-nav-bright">
                  Start Study
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
