import Link from "next/link";
import { brand } from "@/lib/site/brand";
import { BrandWordmark } from "@/components/site/brand-wordmark";

export function LogoLockup({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center">
      <div className="brand-lockup min-w-0">
        <BrandWordmark className="text-[20px] text-ink sm:text-[28px]" />
        {brand.descriptor ? (
          <div className="brand-tagline text-[9px] uppercase text-ink/42 sm:text-[10px]">{brand.descriptor}</div>
        ) : null}
      </div>
    </Link>
  );
}
