import type { ReactNode } from "react";

export const ACTIVE_LOGO_VARIANT = 7;

export const logoOptions = [
  { id: 1, name: "Stack Rise", note: "Ascending rounded bars." },
  { id: 2, name: "Arc Ladder", note: "Bars under a soft arch." },
  { id: 3, name: "Link Hook", note: "Linked recall stroke." },
  { id: 4, name: "Signal Stack", note: "Dots and columns." },
  { id: 5, name: "Offset Columns", note: "Tall-short-tall cadence." },
  { id: 6, name: "Bridge", note: "Two pillars joined by a bridge." },
  { id: 7, name: "Staircase", note: "Layered step progression." },
  { id: 8, name: "Bracket", note: "Open frame and central bar." },
  { id: 9, name: "Three Capsules", note: "Dense pill rhythm." },
  { id: 10, name: "Fold", note: "Folded ribbon silhouette." },
  { id: 11, name: "Ledger", note: "Book-like columns and underline." },
  { id: 12, name: "Beacon", note: "Single rise plus marker." },
  { id: 13, name: "Waveform", note: "Speech-like waveform." },
  { id: 14, name: "Twin Pillars", note: "Minimal paired columns." },
  { id: 15, name: "Angle", note: "Angular climb." },
  { id: 16, name: "Dial", note: "Arc plus central anchor." },
  { id: 17, name: "Pin", note: "Tight monogram-like pin." }
] as const;

function markForVariant(variant: number): ReactNode {
  switch (variant) {
    case 1:
      return (
        <>
          <rect x="14" y="32" width="8" height="18" rx="4" fill="rgb(255 245 233 / 0.9)" />
          <rect x="28" y="22" width="8" height="28" rx="4" fill="url(#languagehack-mark)" />
          <rect x="42" y="14" width="8" height="36" rx="4" fill="url(#languagehack-mark)" />
        </>
      );
    case 2:
      return (
        <>
          <path d="M16 46c4-18 12-27 24-27 5 0 9 1 12 3" fill="none" stroke="url(#languagehack-mark)" strokeWidth="7" strokeLinecap="round" />
          <rect x="19" y="36" width="7" height="14" rx="3.5" fill="rgb(255 245 233 / 0.9)" />
          <rect x="31" y="28" width="7" height="22" rx="3.5" fill="rgb(255 245 233 / 0.9)" />
          <rect x="43" y="20" width="7" height="30" rx="3.5" fill="url(#languagehack-mark)" />
        </>
      );
    case 3:
      return (
        <>
          <path d="M18 18v18c0 8 5 14 13 14h16" fill="none" stroke="url(#languagehack-mark)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M44 18v24" fill="none" stroke="rgb(255 245 233 / 0.92)" strokeWidth="7" strokeLinecap="round" />
        </>
      );
    case 4:
      return (
        <>
          <circle cx="18" cy="42" r="5" fill="rgb(255 245 233 / 0.92)" />
          <rect x="26" y="26" width="8" height="24" rx="4" fill="url(#languagehack-mark)" />
          <rect x="40" y="16" width="8" height="34" rx="4" fill="url(#languagehack-mark)" />
          <circle cx="48" cy="14" r="4" fill="rgb(248 196 88 / 0.95)" />
        </>
      );
    case 5:
      return (
        <>
          <rect x="15" y="24" width="9" height="26" rx="4.5" fill="rgb(255 245 233 / 0.92)" />
          <rect x="29" y="30" width="9" height="20" rx="4.5" fill="url(#languagehack-mark)" />
          <rect x="43" y="14" width="9" height="36" rx="4.5" fill="url(#languagehack-mark)" />
        </>
      );
    case 6:
      return (
        <>
          <rect x="17" y="20" width="8" height="30" rx="4" fill="rgb(255 245 233 / 0.92)" />
          <rect x="39" y="20" width="8" height="30" rx="4" fill="url(#languagehack-mark)" />
          <path d="M22 23c3-4 7-6 12-6s9 2 12 6" fill="none" stroke="url(#languagehack-mark)" strokeWidth="6.5" strokeLinecap="round" />
        </>
      );
    case 7:
      return (
        <>
          <rect x="14" y="34" width="8" height="16" rx="4" fill="rgb(255 245 233 / 0.9)" />
          <rect x="27" y="24" width="8" height="26" rx="4" fill="url(#languagehack-mark)" />
          <rect x="40" y="14" width="8" height="36" rx="4" fill="url(#languagehack-mark)" />
          <path d="M14 52h36" fill="none" stroke="rgb(255 245 233 / 0.22)" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case 8:
      return (
        <>
          <path d="M20 18H14v32h6" fill="none" stroke="rgb(255 245 233 / 0.92)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="28.5" y="22" width="8" height="28" rx="4" fill="url(#languagehack-mark)" />
          <path d="M44 18h6v32h-6" fill="none" stroke="url(#languagehack-mark)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 9:
      return (
        <>
          <rect x="14" y="30" width="10" height="20" rx="5" fill="rgb(255 245 233 / 0.92)" />
          <rect x="27" y="20" width="10" height="30" rx="5" fill="url(#languagehack-mark)" />
          <rect x="40" y="12" width="10" height="38" rx="5" fill="url(#languagehack-mark)" />
        </>
      );
    case 10:
      return (
        <>
          <path d="M18 46V18h15c7 0 12 5 12 12v16" fill="none" stroke="url(#languagehack-mark)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M31 18v28" fill="none" stroke="rgb(255 245 233 / 0.92)" strokeWidth="6.5" strokeLinecap="round" />
        </>
      );
    case 11:
      return (
        <>
          <rect x="16" y="18" width="8" height="28" rx="4" fill="rgb(255 245 233 / 0.92)" />
          <rect x="28" y="18" width="8" height="28" rx="4" fill="url(#languagehack-mark)" />
          <rect x="40" y="18" width="8" height="28" rx="4" fill="url(#languagehack-mark)" />
          <path d="M14 50h36" fill="none" stroke="rgb(255 245 233 / 0.24)" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 12:
      return (
        <>
          <rect x="18" y="26" width="9" height="24" rx="4.5" fill="rgb(255 245 233 / 0.92)" />
          <path d="M31 46V18h14" fill="none" stroke="url(#languagehack-mark)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="47" cy="18" r="4.5" fill="rgb(248 196 88 / 0.95)" />
        </>
      );
    case 13:
      return (
        <>
          <path d="M14 38c5 0 5-12 10-12s5 12 10 12 5-12 10-12 5 12 10 12" fill="none" stroke="url(#languagehack-mark)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="42" y="16" width="8" height="14" rx="4" fill="rgb(255 245 233 / 0.92)" />
        </>
      );
    case 14:
      return (
        <>
          <rect x="20" y="18" width="8" height="32" rx="4" fill="rgb(255 245 233 / 0.92)" />
          <rect x="36" y="12" width="8" height="38" rx="4" fill="url(#languagehack-mark)" />
        </>
      );
    case 15:
      return (
        <>
          <path d="M18 44 30 18" fill="none" stroke="rgb(255 245 233 / 0.92)" strokeWidth="7" strokeLinecap="round" />
          <path d="M30 18h16v32" fill="none" stroke="url(#languagehack-mark)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 16:
      return (
        <>
          <path d="M18 42a14 14 0 1 1 28 0" fill="none" stroke="url(#languagehack-mark)" strokeWidth="6.5" strokeLinecap="round" />
          <rect x="29" y="22" width="8" height="28" rx="4" fill="rgb(255 245 233 / 0.92)" />
        </>
      );
    case 17:
      return (
        <>
          <path d="M20 18v18c0 7 4 12 11 12h13" fill="none" stroke="url(#languagehack-mark)" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="43" cy="21" r="4.5" fill="rgb(255 245 233 / 0.92)" />
        </>
      );
    default:
      return null;
  }
}

export function BrandMark({
  variant = ACTIVE_LOGO_VARIANT,
  className = "h-12 w-12 sm:h-14 sm:w-14"
}: {
  variant?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative grid place-items-center overflow-hidden rounded-[18px] bg-night shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_44px_rgba(202,114,76,0.16)] ${className}`}
    >
      <div className="absolute inset-x-2 top-1.5 h-6 rounded-full bg-white/10 blur-xl" />
      <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
        <defs>
          <linearGradient id="languagehack-mark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(255 238 176)" />
            <stop offset="55%" stopColor="rgb(252 196 102)" />
            <stop offset="100%" stopColor="rgb(235 132 71)" />
          </linearGradient>
        </defs>
        {markForVariant(variant)}
      </svg>
    </div>
  );
}
