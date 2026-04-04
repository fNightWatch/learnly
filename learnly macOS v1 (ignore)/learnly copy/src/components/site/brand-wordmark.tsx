import { brand } from "@/lib/site/brand";

export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <span aria-label={brand.name} className={`brand-wordmark ${className}`.trim()} style={{ fontFamily: "'Manrope', var(--font-display), var(--font-sans), sans-serif" }}>
      {brand.name}
    </span>
  );
}
