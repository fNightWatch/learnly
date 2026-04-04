import Link from "next/link";

export function V2Logo({ href = "/v2" }: { href?: string }) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[16px] border border-[rgba(37,26,18,0.12)] bg-[rgba(255,252,247,0.9)] shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_14px_28px_rgba(74,54,27,0.08)]">
        <svg viewBox="0 0 64 64" className="relative h-8 w-8" aria-hidden="true">
          <defs>
            <linearGradient id="v2-lemma-tile" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFDF8" />
              <stop offset="100%" stopColor="#F0E6D9" />
            </linearGradient>
            <linearGradient id="v2-lemma-accent" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F6C670" />
              <stop offset="100%" stopColor="#EB9151" />
            </linearGradient>
          </defs>
          <rect x="6" y="6" width="52" height="52" rx="16" fill="url(#v2-lemma-tile)" />
          <path
            d="M21 17.5V46.5"
            fill="none"
            stroke="#1D1612"
            strokeLinecap="round"
            strokeWidth="4.75"
          />
          <path d="M29.5 22H44" fill="none" stroke="#1D1612" strokeLinecap="round" strokeWidth="4.75" />
          <path d="M29.5 32H44" fill="none" stroke="#1D1612" strokeLinecap="round" strokeWidth="4.75" />
          <path d="M29.5 42H40" fill="none" stroke="url(#v2-lemma-accent)" strokeLinecap="round" strokeWidth="4.75" />
        </svg>
      </div>
      <div className="min-w-0">
        <div className="truncate text-[1.45rem] font-semibold tracking-[-0.07em] text-[var(--v2-text)]">Lemma</div>
        <div className="truncate text-[10px] uppercase tracking-[0.28em] text-[var(--v2-muted)]">
          Ordered Spanish
        </div>
      </div>
    </Link>
  );
}
